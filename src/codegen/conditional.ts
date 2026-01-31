/**
 * Analyzes displayOptions conditionals and builds discriminated union type structures
 */

import type { N8nProperty } from '../schema/types.js';

export interface ConditionalTree {
  // Map of resource value -> operation value -> properties for that combo
  branches: Map<string, Map<string, N8nProperty[]>>;
  // Properties without displayOptions (common to all branches)
  commonProperties: N8nProperty[];
  // The resource and operation properties themselves
  resourceProperty?: N8nProperty;
  operationProperties: N8nProperty[]; // Can be multiple if different per resource
}

/**
 * Analyzes displayOptions to identify discriminated union structure
 */
export function analyzeDisplayOptions(properties: N8nProperty[]): ConditionalTree {
  const tree: ConditionalTree = {
    branches: new Map(),
    commonProperties: [],
    operationProperties: []
  };

  // Find resource property (top-level discriminant)
  const resourceProp = properties.find(p => p.name === 'resource' && p.type === 'options');
  if (!resourceProp) {
    // No resource/operation pattern - all properties are common
    tree.commonProperties = properties;
    return tree;
  }

  tree.resourceProperty = resourceProp;

  // Get resource values
  const resourceValues = (resourceProp.options as Array<{ value: string | number }>)?.map(o => String(o.value)) || [];

  // Find operation properties (can be different per resource)
  const operationProps = properties.filter(p =>
    p.name === 'operation' && p.type === 'options'
  );
  tree.operationProperties = operationProps;

  // Build branches for each resource+operation combo
  for (const resourceValue of resourceValues) {
    const resourceBranches = new Map<string, N8nProperty[]>();

    // Find operation property for this resource
    const opProp = operationProps.find(op => {
      const show = op.displayOptions?.show;
      if (!show) return true; // No displayOptions means applies to all
      const resourceShow = show['resource'];
      return resourceShow && resourceShow.includes(resourceValue);
    });

    if (!opProp) continue;

    // Get operation values for this resource
    const operationValues = (opProp.options as Array<{ value: string | number }>)?.map(o => String(o.value)) || [];

    for (const operationValue of operationValues) {
      // Collect properties that should appear in this resource+operation combo
      const branchProperties = properties.filter(prop => {
        // Skip resource and operation themselves
        if (prop.name === 'resource' || prop.name === 'operation') return false;

        const show = prop.displayOptions?.show;
        if (!show) return false; // Will be added to common

        // Check if this property's displayOptions match this resource+operation
        const resourceShow = show['resource'];
        const operationShow = show['operation'];

        const resourceMatch = !resourceShow || resourceShow.includes(resourceValue);
        const operationMatch = !operationShow || operationShow.includes(operationValue);

        return resourceMatch && operationMatch;
      });

      resourceBranches.set(operationValue, branchProperties);
    }

    tree.branches.set(resourceValue, resourceBranches);
  }

  // Identify common properties (no displayOptions, or displayOptions without resource/operation)
  tree.commonProperties = properties.filter(prop => {
    if (prop.name === 'resource' || prop.name === 'operation') return false;

    const show = prop.displayOptions?.show;
    if (!show) return true;

    // If has displayOptions but not resource/operation based, consider common
    const hasResourceOrOp = show['resource'] || show['operation'];
    return !hasResourceOrOp;
  });

  return tree;
}

/**
 * Deduplicates an array of properties by name.
 * When the same property name appears multiple times (due to displayOptions conditions),
 * the types are merged into a union. The property is optional if ANY occurrence is optional.
 */
export function deduplicateProperties(properties: N8nProperty[]): N8nProperty[] {
  const seen = new Map<string, N8nProperty[]>();

  for (const prop of properties) {
    const existing = seen.get(prop.name);
    if (existing) {
      existing.push(prop);
    } else {
      seen.set(prop.name, [prop]);
    }
  }

  const result: N8nProperty[] = [];
  for (const [, props] of seen) {
    if (props.length === 1) {
      result.push(props[0]);
    } else {
      // Merge: use first as base, mark optional if any is optional
      const merged = { ...props[0] };
      merged.required = props.every(p => p.required);
      result.push(merged);
    }
  }

  return result;
}

/**
 * Deduplicates generated field strings by property name.
 * When the same property name appears with different types, merges into a union type.
 */
function deduplicateFields(fields: string[]): string[] {
  const seen = new Map<string, { quotedName: string; optional: boolean; types: Set<string>; order: number }>();
  let order = 0;

  for (const field of fields) {
    // Parse field: "  name?: type;" or "  'quoted-name'?: type;"
    const match = field.match(/^  ('(?:[^'\\]|\\.)*'|\w+)(\??):\s*(.+);$/);
    if (!match) {
      // Can't parse (e.g., discriminant literal), keep as-is via special key
      seen.set(`__raw_${order}`, { quotedName: '', optional: false, types: new Set([field]), order: order++ });
      continue;
    }

    const [, rawName, optMarker, typeStr] = match;
    const isOptional = optMarker === '?';

    const existing = seen.get(rawName);
    if (existing) {
      existing.types.add(typeStr);
      if (isOptional) existing.optional = true;
    } else {
      seen.set(rawName, { quotedName: rawName, optional: isOptional, types: new Set([typeStr]), order: order++ });
    }
  }

  const entries = [...seen.entries()].sort((a, b) => a[1].order - b[1].order);
  const result: string[] = [];

  for (const [key, entry] of entries) {
    if (key.startsWith('__raw_')) {
      result.push([...entry.types][0]);
      continue;
    }
    const opt = entry.optional ? '?' : '';
    const mergedType = [...entry.types].join(' | ');
    result.push(`  ${entry.quotedName}${opt}: ${mergedType};`);
  }

  return result;
}

/**
 * Generates TypeScript discriminated union interfaces from conditional tree
 */
export function buildDiscriminatedUnions(
  nodeName: string,
  tree: ConditionalTree
): string {
  const interfaces: string[] = [];
  const unionMembers: string[] = [];

  if (tree.branches.size === 0) {
    // Simple node without resource/operation pattern
    return '';
  }

  // Generate interface for each resource+operation combo
  for (const [resource, operations] of tree.branches.entries()) {
    for (const [operation, properties] of operations.entries()) {
      const interfaceName = pascalCase(`${nodeName} ${resource} ${operation}`);
      unionMembers.push(interfaceName);

      const fields: string[] = [];

      // Add discriminant fields
      fields.push(`  resource: '${resource}';`);
      fields.push(`  operation: '${operation}';`);

      // Add common properties (deduplicated)
      const dedupedCommon = deduplicateProperties(tree.commonProperties);
      for (const prop of dedupedCommon) {
        fields.push(generatePropertyType(prop));
      }

      // Add branch-specific properties (deduplicated, excluding already-added common ones)
      const commonNames = new Set(dedupedCommon.map(p => p.name));
      const branchOnly = properties.filter(p => !commonNames.has(p.name));
      const dedupedBranch = deduplicateProperties(branchOnly);
      for (const prop of dedupedBranch) {
        fields.push(generatePropertyType(prop));
      }

      // Deduplicate the final field strings (handles cases where common and branch
      // generate the same property name with different types)
      const dedupedFields = deduplicateFields(fields);

      interfaces.push(`export interface ${interfaceName} {\n${dedupedFields.join('\n')}\n}`);
    }
  }

  return interfaces.join('\n\n') + '\n\nexport type ' + nodeName + 'Node = ' + unionMembers.join(' | ') + ';';
}

/**
 * Generates TypeScript type for a single property
 */
function generatePropertyType(prop: N8nProperty): string {
  const optional = prop.required ? '' : '?';
  const tsType = mapPropertyType(prop);
  return `  ${quotePropertyName(prop.name)}${optional}: ${tsType};`;
}

/**
 * Builds a deduplicated inline object type string from sub-properties.
 * Merges duplicate property names into union types.
 */
function buildInlineObjectType(subProps: N8nProperty[]): string {
  const rawFields = subProps.map(sp => {
    const optional = sp.required ? '' : '?';
    return `${quotePropertyName(sp.name)}${optional}: ${mapPropertyType(sp)}`;
  });
  const dedupedFields = deduplicateSubFields(rawFields);
  return `{ ${dedupedFields.join('; ')} }`;
}

/**
 * Deduplicates inline object field strings by property name.
 * Input: ["name?: string", "name?: number", "other: boolean"]
 * Output: ["name?: string | number", "other: boolean"]
 */
function deduplicateSubFields(fields: string[]): string[] {
  const seen = new Map<string, { quotedName: string; optional: boolean; types: Set<string>; order: number }>();
  let order = 0;

  for (const field of fields) {
    // Match both plain identifiers and quoted property names
    const match = field.match(/^('(?:[^'\\]|\\.)*'|\w+)(\??):\s*(.+)$/);
    if (!match) {
      seen.set(`__raw_${order}`, { quotedName: '', optional: false, types: new Set([field]), order: order++ });
      continue;
    }
    const [, rawName, optMarker, typeStr] = match;
    const isOptional = optMarker === '?';
    const existing = seen.get(rawName);
    if (existing) {
      existing.types.add(typeStr);
      if (isOptional) existing.optional = true;
    } else {
      seen.set(rawName, { quotedName: rawName, optional: isOptional, types: new Set([typeStr]), order: order++ });
    }
  }

  const entries = [...seen.entries()].sort((a, b) => a[1].order - b[1].order);
  const result: string[] = [];
  for (const [key, entry] of entries) {
    if (key.startsWith('__raw_')) {
      result.push([...entry.types][0]);
      continue;
    }
    const opt = entry.optional ? '?' : '';
    const mergedType = [...entry.types].join(' | ');
    result.push(`${entry.quotedName}${opt}: ${mergedType}`);
  }
  return result;
}

/**
 * Maps n8n property type to TypeScript type
 */
function mapPropertyType(prop: N8nProperty): string {
  let baseType: string;

  switch (prop.type) {
    case 'string':
      baseType = 'string';
      break;
    case 'number':
      baseType = 'number';
      break;
    case 'boolean':
      baseType = 'boolean';
      break;
    case 'json':
      baseType = 'unknown';
      break;
    case 'options':
      // Generate literal union from options
      if (prop.options && Array.isArray(prop.options)) {
        const values = (prop.options as Array<{ value: string | number | boolean }>)
          .map(o => typeof o.value === 'string' ? `'${escapeStringLiteral(o.value)}'` : o.value)
          .join(' | ');
        baseType = values || 'string';
      } else {
        baseType = 'string';
      }
      break;
    case 'multiOptions':
      // Array of literal union
      if (prop.options && Array.isArray(prop.options)) {
        const values = (prop.options as Array<{ value: string | number | boolean }>)
          .map(o => typeof o.value === 'string' ? `'${escapeStringLiteral(o.value)}'` : o.value)
          .join(' | ');
        baseType = `Array<${values || 'string'}>`;
      } else {
        baseType = 'string[]';
      }
      break;
    case 'resourceLocator':
      baseType = 'ResourceLocator | string';
      break;
    case 'collection':
      // Generate nested object type with deduplication
      if (prop.options && Array.isArray(prop.options)) {
        baseType = buildInlineObjectType(prop.options as N8nProperty[]);
      } else {
        baseType = 'Record<string, unknown>';
      }
      break;
    case 'fixedCollection':
      // Generate nested object type with group names (deduplicated)
      if (prop.options && Array.isArray(prop.options)) {
        const groups = prop.options as N8nProperty[];
        const dedupedGroups = deduplicateSubFields(groups.map(group => {
          const optional = group.required ? '' : '?';
          let groupType = 'unknown';

          if (group.values && Array.isArray(group.values)) {
            groupType = buildInlineObjectType(group.values);
          }

          return `${quotePropertyName(group.name)}${optional}: ${groupType}`;
        }));
        baseType = `{ ${dedupedGroups.join('; ')} }`;
      } else {
        baseType = 'Record<string, unknown>';
      }
      break;
    default:
      baseType = 'unknown';
  }

  // Wrap with Expression<T> if field supports expressions
  if (!prop.noDataExpression && (prop.type === 'string' || prop.type === 'number' || prop.type === 'boolean')) {
    return `${baseType} | Expression<${baseType}>`;
  }

  return baseType;
}

/**
 * Converts string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Checks if a property name is a valid JS identifier (doesn't need quoting)
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Quotes a property name if it contains special characters
 */
function quotePropertyName(name: string): string {
  return isValidIdentifier(name) ? name : `'${name.replace(/'/g, "\\'")}'`;
}

/**
 * Escapes a string value for use in a TypeScript string literal
 */
function escapeStringLiteral(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
