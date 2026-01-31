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

      // Add common properties
      for (const prop of tree.commonProperties) {
        fields.push(generatePropertyType(prop));
      }

      // Add branch-specific properties
      for (const prop of properties) {
        fields.push(generatePropertyType(prop));
      }

      interfaces.push(`export interface ${interfaceName} {\n${fields.join('\n')}\n}`);
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
  return `  ${prop.name}${optional}: ${tsType};`;
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
          .map(o => typeof o.value === 'string' ? `'${o.value}'` : o.value)
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
          .map(o => typeof o.value === 'string' ? `'${o.value}'` : o.value)
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
      // Generate nested object type
      if (prop.options && Array.isArray(prop.options)) {
        const subProps = prop.options as N8nProperty[];
        const fields = subProps.map(sp => {
          const optional = sp.required ? '' : '?';
          return `${sp.name}${optional}: ${mapPropertyType(sp)}`;
        }).join('; ');
        baseType = `{ ${fields} }`;
      } else {
        baseType = 'Record<string, unknown>';
      }
      break;
    case 'fixedCollection':
      // Generate nested object type with group names
      if (prop.options && Array.isArray(prop.options)) {
        const groups = prop.options as N8nProperty[];
        const groupFields = groups.map(group => {
          const optional = group.required ? '' : '?';
          let groupType = 'unknown';

          if (group.values && Array.isArray(group.values)) {
            const subProps = group.values;
            const fields = subProps.map(sp => {
              const spOptional = sp.required ? '' : '?';
              return `${sp.name}${spOptional}: ${mapPropertyType(sp)}`;
            }).join('; ');
            groupType = `{ ${fields} }`;
          }

          return `${group.name}${optional}: ${groupType}`;
        }).join('; ');
        baseType = `{ ${groupFields} }`;
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
