/**
 * Factory code generator - produces per-category TypeScript factory modules
 * Reads all 797 cached schemas and generates:
 * 1. Node catalog JSON for discovery
 * 2. Per-category factory modules with typed node creation functions
 */

import type { N8nNodeType } from '../schema/types.js';
import { analyzeDisplayOptions } from './conditional.js';

// ---------------------------------------------------------------------------
// Catalog Types
// ---------------------------------------------------------------------------

export interface CatalogEntry {
  name: string;
  type: string;
  group: string[];
  credentials: string[];
  operations: Record<string, string[]> | null;  // null for simple nodes
  simple: boolean;
}

export interface NodeCatalog {
  generated: string;  // ISO timestamp
  count: number;
  nodes: CatalogEntry[];
}

// ---------------------------------------------------------------------------
// Name Extraction (reused from generator.ts logic)
// ---------------------------------------------------------------------------

/**
 * Extracts clean node name from full n8n node type name
 * e.g., "n8n-nodes-base.slack" -> "Slack"
 */
export function extractNodeName(fullName: string): string {
  const parts = fullName.split('.');
  const name = parts[parts.length - 1];
  const baseName = name.charAt(0).toUpperCase() + name.slice(1);

  // For non-base packages, prefix with package name to avoid collisions
  // e.g., "@n8n/n8n-nodes-langchain.openAi" -> "LangchainOpenAi"
  const pkg = parts.slice(0, -1).join('.');
  if (pkg && pkg !== 'n8n-nodes-base') {
    const pkgParts = pkg.replace(/^@\w+\//, '').replace(/^n8n-nodes-/, '');
    const prefix = pkgParts.charAt(0).toUpperCase() + pkgParts.slice(1);
    return prefix + baseName;
  }

  return baseName;
}

/**
 * Converts PascalCase to camelCase for factory function names
 * e.g., "Slack" -> "slack", "HttpRequest" -> "httpRequest"
 */
function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Catalog Generation
// ---------------------------------------------------------------------------

/**
 * Generates a compact node catalog for discovery
 */
export function generateNodeCatalog(schemas: N8nNodeType[]): NodeCatalog {
  const entries: CatalogEntry[] = [];

  for (const schema of schemas) {
    const tree = analyzeDisplayOptions(schema.properties);
    const hasResourceOp = tree.branches.size > 0;

    const operations: Record<string, string[]> | null = hasResourceOp ? {} : null;

    if (hasResourceOp) {
      for (const [resource, ops] of tree.branches.entries()) {
        operations![resource] = [...ops.keys()];
      }
    }

    entries.push({
      name: schema.displayName,
      type: schema.name,
      group: schema.group || [],
      credentials: (schema.credentials || []).map(c => c.name),
      operations,
      simple: !hasResourceOp,
    });
  }

  return {
    generated: new Date().toISOString(),
    count: entries.length,
    nodes: entries,
  };
}

// ---------------------------------------------------------------------------
// Factory Module Generation
// ---------------------------------------------------------------------------

interface NodeInfo {
  schema: N8nNodeType;
  nodeName: string;      // PascalCase e.g., "Slack"
  factoryName: string;   // camelCase e.g., "slack"
  hasResourceOp: boolean;
  tree: ReturnType<typeof analyzeDisplayOptions>;
}

/**
 * Groups nodes by category for splitting into separate files
 */
function categorizeNodes(schemas: N8nNodeType[]): Map<string, NodeInfo[]> {
  const categories = new Map<string, NodeInfo[]>();

  for (const schema of schemas) {
    const nodeName = extractNodeName(schema.name);
    const factoryName = toCamelCase(nodeName);
    const tree = analyzeDisplayOptions(schema.properties);
    const hasResourceOp = tree.branches.size > 0;

    const info: NodeInfo = {
      schema,
      nodeName,
      factoryName,
      hasResourceOp,
      tree,
    };

    // Determine category
    let category: string;

    if (schema.name.startsWith('@n8n/n8n-nodes-langchain')) {
      category = 'langchain';
    } else if (schema.name.startsWith('n8n-nodes-base')) {
      const groups = schema.group || [];
      if (groups.includes('trigger')) {
        category = 'triggers';
      } else if (groups.includes('transform')) {
        category = 'transform';
      } else if (groups.includes('input')) {
        category = 'input';
      } else if (groups.includes('output')) {
        category = 'output';
      } else {
        category = 'other';
      }
    } else {
      // Other packages
      category = 'other';
    }

    const existing = categories.get(category) || [];
    existing.push(info);
    categories.set(category, existing);
  }

  return categories;
}

/**
 * Estimates line count for a factory function
 */
function estimateLines(info: NodeInfo): number {
  if (!info.hasResourceOp) {
    // Simple factory: ~5 lines
    return 5;
  } else {
    // Resource/operation factory: ~7 lines per operation
    let count = 0;
    for (const [, ops] of info.tree.branches.entries()) {
      count += ops.size;
    }
    return count * 7;
  }
}

/**
 * Splits a category into multiple files if it would exceed 500 lines
 */
function splitCategory(category: string, nodes: NodeInfo[]): Map<string, NodeInfo[]> {
  const result = new Map<string, NodeInfo[]>();

  // Estimate total lines
  const totalLines = nodes.reduce((sum, n) => sum + estimateLines(n), 0);
  const headerLines = 20; // Imports and file header

  if (totalLines + headerLines <= 500) {
    // Fits in single file
    result.set(`${category}.ts`, nodes);
    return result;
  }

  // Need to split - sort alphabetically and split into chunks
  const sorted = [...nodes].sort((a, b) => a.factoryName.localeCompare(b.factoryName));
  let currentChunk: NodeInfo[] = [];
  let currentLines = headerLines;
  let chunkIndex = 1; // Start from 1

  for (const node of sorted) {
    const nodeLines = estimateLines(node);
    if (currentLines + nodeLines > 500 && currentChunk.length > 0) {
      // Save current chunk and start new one
      result.set(`${category}-${chunkIndex}.ts`, currentChunk);
      currentChunk = [node];
      currentLines = headerLines + nodeLines;
      chunkIndex++;
    } else {
      currentChunk.push(node);
      currentLines += nodeLines;
    }
  }

  // Save last chunk
  if (currentChunk.length > 0) {
    result.set(`${category}-${chunkIndex}.ts`, currentChunk);
  }

  return result;
}

/**
 * Generates factory code for a simple node (no resource/operation)
 */
function generateSimpleFactory(info: NodeInfo): string {
  const lines: string[] = [];

  lines.push(`export function create${info.nodeName}(name: string, params: Partial<${info.nodeName}Node>): WorkflowNode {`);
  lines.push(`  return { name, type: '${info.schema.name}', parameters: params as Record<string, unknown> };`);
  lines.push(`}`);

  return lines.join('\n');
}

/**
 * Generates factory code for a resource/operation node
 */
function generateResourceOpFactory(info: NodeInfo): string {
  const lines: string[] = [];

  lines.push(`export const ${info.factoryName} = {`);

  const resources = [...info.tree.branches.keys()];
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const operations = info.tree.branches.get(resource)!;

    lines.push(`  ${quoteIfNeeded(resource)}: {`);

    const ops = [...operations.keys()];
    for (let j = 0; j < ops.length; j++) {
      const op = ops[j];
      const typeName = pascalCase(`${info.nodeName} ${resource} ${op}`);
      const funcName = toCamelCase(pascalCase(op));

      lines.push(`    ${quoteIfNeeded(funcName)}: (name: string, params: Partial<Omit<${typeName}, 'resource' | 'operation'>>): WorkflowNode => ({`);
      lines.push(`      name, type: '${info.schema.name}',`);
      lines.push(`      parameters: { ...params as Record<string, unknown>, resource: '${resource}', operation: '${op}' }`);
      lines.push(`    })${j < ops.length - 1 ? ',' : ''}`);
    }

    lines.push(`  }${i < resources.length - 1 ? ',' : ''}`);
  }

  lines.push(`};`);

  return lines.join('\n');
}

/**
 * Generates a factory file for a set of nodes
 */
function generateFactoryFile(filename: string, nodes: NodeInfo[]): string {
  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(` * Auto-generated factory module: ${filename}`);
  lines.push(' * DO NOT EDIT MANUALLY - Generated by npm run generate');
  lines.push(' */');
  lines.push('');

  // Collect type imports
  const typeImports = new Set<string>();
  for (const node of nodes) {
    if (node.hasResourceOp) {
      // Import all resource/operation types
      for (const [resource, ops] of node.tree.branches.entries()) {
        for (const op of ops.keys()) {
          typeImports.add(pascalCase(`${node.nodeName} ${resource} ${op}`));
        }
      }
    } else {
      // Import simple node type
      typeImports.add(`${node.nodeName}Node`);
    }
  }

  // Import statement
  lines.push(`import type { WorkflowNode } from '../../src/builder/types.js';`);
  lines.push(`import type {`);
  const sortedTypes = [...typeImports].sort();
  for (let i = 0; i < sortedTypes.length; i++) {
    lines.push(`  ${sortedTypes[i]}${i < sortedTypes.length - 1 ? ',' : ''}`);
  }
  lines.push(`} from '../../generated/nodes.js';`);
  lines.push('');

  // Generate factories
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.hasResourceOp) {
      lines.push(generateResourceOpFactory(node));
    } else {
      lines.push(generateSimpleFactory(node));
    }
    if (i < nodes.length - 1) {
      lines.push('');
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates the index file that re-exports all factories
 */
function generateIndexFile(allFiles: Map<string, NodeInfo[]>): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Auto-generated factory index');
  lines.push(' * Re-exports all node factories and provides createTypedNodes() function');
  lines.push(' * DO NOT EDIT MANUALLY - Generated by npm run generate');
  lines.push(' */');
  lines.push('');

  // Collect all imports by file
  const importsByFile = new Map<string, { simple: string[], resourceOp: string[] }>();

  for (const [filename, nodes] of allFiles.entries()) {
    const simple: string[] = [];
    const resourceOp: string[] = [];

    for (const node of nodes) {
      if (node.hasResourceOp) {
        resourceOp.push(node.factoryName);
      } else {
        simple.push(`create${node.nodeName}`);
      }
    }

    importsByFile.set(filename, { simple, resourceOp });
  }

  // Generate import statements
  for (const [filename, imports] of importsByFile.entries()) {
    const all = [...imports.simple, ...imports.resourceOp].sort();
    if (all.length > 0) {
      lines.push(`import { ${all.join(', ')} } from './${filename.replace('.ts', '.js')}';`);
    }
  }

  lines.push('');

  // Re-export all factories
  lines.push('// Re-export all factory functions');
  const allExports: string[] = [];
  for (const imports of importsByFile.values()) {
    allExports.push(...imports.simple, ...imports.resourceOp);
  }
  lines.push(`export { ${allExports.sort().join(', ')} };`);
  lines.push('');

  // Import TypedNodes from types file
  lines.push(`export type { TypedNodes } from './types.js';`);
  lines.push('');

  // Generate createTypedNodes function
  lines.push('/**');
  lines.push(' * Creates a typed nodes API factory instance');
  lines.push(' */');
  lines.push('export function createTypedNodes() {');
  lines.push('  return {');

  // Collect all nodes for the return statement
  const allNodes: NodeInfo[] = [];
  for (const nodes of allFiles.values()) {
    allNodes.push(...nodes);
  }
  allNodes.sort((a, b) => a.factoryName.localeCompare(b.factoryName));

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    if (node.hasResourceOp) {
      lines.push(`    ${node.factoryName},`);
    } else {
      lines.push(`    ${node.factoryName}: create${node.nodeName},`);
    }
  }

  lines.push('  } as const;');
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Generates the types file with TypedNodes interface
 */
function generateTypesFile(allFiles: Map<string, NodeInfo[]>): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Auto-generated TypedNodes interface');
  lines.push(' * DO NOT EDIT MANUALLY - Generated by npm run generate');
  lines.push(' */');
  lines.push('');

  lines.push(`import type { WorkflowNode } from '../../src/builder/types.js';`);

  // Collect all type imports needed
  const typeImports = new Set<string>();
  const allNodes: NodeInfo[] = [];

  for (const nodes of allFiles.values()) {
    for (const node of nodes) {
      allNodes.push(node);
      if (node.hasResourceOp) {
        for (const [resource, ops] of node.tree.branches.entries()) {
          for (const op of ops.keys()) {
            typeImports.add(pascalCase(`${node.nodeName} ${resource} ${op}`));
          }
        }
      } else {
        typeImports.add(`${node.nodeName}Node`);
      }
    }
  }

  lines.push(`import type {`);
  const sortedTypes = [...typeImports].sort();
  for (let i = 0; i < sortedTypes.length; i++) {
    lines.push(`  ${sortedTypes[i]}${i < sortedTypes.length - 1 ? ',' : ''}`);
  }
  lines.push(`} from '../../generated/nodes.js';`);
  lines.push('');

  // Generate TypedNodes interface
  lines.push('/**');
  lines.push(' * Typed nodes API interface - provides compile-time checked node creation');
  lines.push(' * All 797 n8n nodes available with full type safety');
  lines.push(' */');
  lines.push('export interface TypedNodes {');

  allNodes.sort((a, b) => a.factoryName.localeCompare(b.factoryName));

  for (const node of allNodes) {
    if (node.hasResourceOp) {
      // Nested resource/operation structure
      lines.push(`  ${node.factoryName}: {`);

      const resources = [...node.tree.branches.keys()];
      for (const resource of resources) {
        const operations = node.tree.branches.get(resource)!;
        lines.push(`    ${quoteIfNeeded(resource)}: {`);

        const ops = [...operations.keys()];
        for (const op of ops) {
          const typeName = pascalCase(`${node.nodeName} ${resource} ${op}`);
          const funcName = toCamelCase(pascalCase(op));
          lines.push(`      ${quoteIfNeeded(funcName)}: (name: string, params: Partial<Omit<${typeName}, 'resource' | 'operation'>>) => WorkflowNode;`);
        }

        lines.push(`    };`);
      }

      lines.push(`  };`);
    } else {
      // Simple factory
      lines.push(`  ${node.factoryName}: (name: string, params: Partial<${node.nodeName}Node>) => WorkflowNode;`);
    }
  }

  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Generates all factory modules
 * Returns a Map of filename -> TypeScript source code
 */
export function generateFactoryModules(schemas: N8nNodeType[]): Map<string, string> {
  const result = new Map<string, string>();

  // Categorize nodes
  const categories = categorizeNodes(schemas);

  // Split categories that are too large
  const allFiles = new Map<string, NodeInfo[]>();
  for (const [category, nodes] of categories.entries()) {
    const split = splitCategory(category, nodes);
    for (const [filename, fileNodes] of split.entries()) {
      allFiles.set(filename, fileNodes);
    }
  }

  // Generate each factory file
  for (const [filename, nodes] of allFiles.entries()) {
    const code = generateFactoryFile(filename, nodes);
    result.set(filename, code);
  }

  // Generate types file (TypedNodes interface)
  const typesCode = generateTypesFile(allFiles);
  result.set('types.ts', typesCode);

  // Generate index file (re-exports and createTypedNodes function)
  const indexCode = generateIndexFile(allFiles);
  result.set('index.ts', indexCode);

  return result;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

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
 * Checks if a property name is a valid JS identifier
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Quotes a property name if needed
 */
function quoteIfNeeded(name: string): string {
  return isValidIdentifier(name) ? name : `'${name.replace(/'/g, "\\'")}'`;
}
