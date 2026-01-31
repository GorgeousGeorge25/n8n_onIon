/**
 * Schema registry for typeVersion lookup
 *
 * Loads all cached schemas once and provides fast typeVersion lookup
 * for compiler to use correct versions instead of hardcoded 1.
 */

import { readAllSchemas } from '../schema/cache.js';
import type { N8nNodeType } from '../schema/types.js';

/**
 * Module-level cache - loaded once, reused across compilations
 */
let cachedRegistry: Map<string, number> | null = null;

/**
 * Load all schema files and build typeVersion lookup map.
 *
 * Extracts defaultVersion (or max of version array if defaultVersion absent)
 * for each node type. Caches result in module-level variable.
 *
 * @returns Map from node type name to typeVersion number
 */
export async function loadSchemaRegistry(): Promise<Map<string, number>> {
  // Return cached registry if already loaded
  if (cachedRegistry !== null) {
    return cachedRegistry;
  }

  const schemas = await readAllSchemas();
  const registry = new Map<string, number>();

  for (const schema of schemas) {
    const typeVersion = getDefaultVersion(schema);
    registry.set(schema.name, typeVersion);
  }

  // Cache for future calls
  cachedRegistry = registry;
  return registry;
}

/**
 * Extract defaultVersion from schema, falling back to max version if absent.
 *
 * @param schema - Node type schema
 * @returns The default version number to use
 */
function getDefaultVersion(schema: N8nNodeType): number {
  // Use defaultVersion if present
  if (schema.defaultVersion !== undefined) {
    return schema.defaultVersion;
  }

  // Fall back to max of version array
  const versions = Array.isArray(schema.version) ? schema.version : [schema.version];
  return Math.max(...versions);
}

/**
 * Get typeVersion for a node type.
 *
 * Returns cached typeVersion, falling back to 1 if not found.
 * Throws if registry not loaded (caller must await loadSchemaRegistry() first).
 *
 * @param nodeType - n8n node type name (e.g., "n8n-nodes-base.slack")
 * @returns typeVersion number
 * @throws Error if registry not loaded
 */
export function getTypeVersion(nodeType: string): number {
  if (cachedRegistry === null) {
    throw new Error(
      'Schema registry not loaded. Call await loadSchemaRegistry() before using getTypeVersion()'
    );
  }

  // Return cached version, or fall back to 1 if not found
  return cachedRegistry.get(nodeType) ?? 1;
}
