/**
 * Schema sync — fetches node schemas from n8n-mcp and writes to local cache
 */

import { getMcpClient } from './client.js';
import { writeSchema, readSchema, listCachedSchemas } from '../schema/cache.js';
import type { N8nNodeType } from '../schema/types.js';

/** Result of a sync operation */
export interface SyncResult {
  synced: number;
  updated: number;
  added: number;
  deprecated: string[];
  errors: string[];
  total: number;
}

/**
 * Transforms an n8n-mcp get_node response into N8nNodeType.
 * The MCP response includes the full node definition —
 * we extract the fields our schema type needs.
 */
export function transformMcpNodeResponse(mcpResponse: Record<string, unknown>): N8nNodeType {
  return {
    name: mcpResponse.name as string,
    displayName: mcpResponse.displayName as string,
    version: mcpResponse.version as number | number[],
    defaultVersion: mcpResponse.defaultVersion as number | undefined,
    description: mcpResponse.description as string,
    defaults: (mcpResponse.defaults as Record<string, unknown>) || {},
    properties: (mcpResponse.properties as N8nNodeType['properties']) || [],
    credentials: mcpResponse.credentials as N8nNodeType['credentials'],
    group: mcpResponse.group as string[],
  };
}

/**
 * Extracts structured data from MCP tool result content blocks.
 */
function extractToolResultData(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== 'object') return null;

  const r = result as { content?: Array<{ type: string; text?: string }> };
  if (!r.content || !Array.isArray(r.content)) return null;

  for (const block of r.content) {
    if (block.type === 'text' && block.text) {
      try {
        return JSON.parse(block.text);
      } catch {
        // Not JSON, skip
      }
    }
  }

  return null;
}

/**
 * Syncs a single node schema from n8n-mcp to local cache.
 * @returns true if schema was updated, false if unchanged
 */
export async function syncNodeSchema(nodeType: string): Promise<boolean> {
  const client = await getMcpClient();

  const result = await client.callTool({
    name: 'get_node',
    arguments: { nodeType },
  });

  const data = extractToolResultData(result);
  if (!data) {
    throw new Error(`No data returned from get_node for ${nodeType}`);
  }

  const schema = transformMcpNodeResponse(data);

  // Check if schema changed (compare version)
  let changed = true;
  try {
    const cached = await readSchema(nodeType);
    const cachedVersion = Array.isArray(cached.version) ? Math.max(...cached.version) : cached.version;
    const newVersion = Array.isArray(schema.version) ? Math.max(...schema.version) : schema.version;
    changed = cachedVersion !== newVersion;
  } catch {
    // Not in cache — it's new
  }

  await writeSchema(schema);
  return changed;
}

/**
 * Syncs all discoverable node schemas from n8n-mcp.
 * Calls search_nodes to discover all nodes, then syncs each.
 */
export async function syncAllSchemas(): Promise<SyncResult> {
  const client = await getMcpClient();

  // Discover all nodes via search_nodes with empty query
  const searchResult = await client.callTool({
    name: 'search_nodes',
    arguments: { query: '' },
  });

  const searchData = extractToolResultData(searchResult);
  if (!searchData || !Array.isArray(searchData.nodes)) {
    throw new Error('Failed to discover nodes via search_nodes');
  }

  const nodes = searchData.nodes as Array<{ name: string; type: string }>;
  const cachedBefore = new Set(await listCachedSchemas());

  const result: SyncResult = {
    synced: 0,
    updated: 0,
    added: 0,
    deprecated: [],
    errors: [],
    total: nodes.length,
  };

  for (const node of nodes) {
    const nodeType = node.type || node.name;
    try {
      const changed = await syncNodeSchema(nodeType);
      result.synced++;
      if (!cachedBefore.has(nodeType)) {
        result.added++;
      } else if (changed) {
        result.updated++;
      }
    } catch (error) {
      result.errors.push(`${nodeType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Detect deprecated: nodes in cache but not in discovery
  const discoveredTypes = new Set(nodes.map(n => n.type || n.name));
  for (const cached of cachedBefore) {
    if (!discoveredTypes.has(cached)) {
      result.deprecated.push(cached);
    }
  }

  return result;
}

/**
 * Checks for stale schemas without updating them.
 * Returns a report of what would change.
 */
export async function checkSchemaFreshness(): Promise<SyncResult> {
  const client = await getMcpClient();

  const searchResult = await client.callTool({
    name: 'search_nodes',
    arguments: { query: '' },
  });

  const searchData = extractToolResultData(searchResult);
  if (!searchData || !Array.isArray(searchData.nodes)) {
    throw new Error('Failed to discover nodes via search_nodes');
  }

  const nodes = searchData.nodes as Array<{ name: string; type: string }>;
  const cachedSchemas = new Set(await listCachedSchemas());

  const result: SyncResult = {
    synced: 0,
    updated: 0,
    added: 0,
    deprecated: [],
    errors: [],
    total: nodes.length,
  };

  for (const node of nodes) {
    const nodeType = node.type || node.name;
    if (!cachedSchemas.has(nodeType)) {
      result.added++;
    }
  }

  // Detect deprecated
  const discoveredTypes = new Set(nodes.map(n => n.type || n.name));
  for (const cached of cachedSchemas) {
    if (!discoveredTypes.has(cached)) {
      result.deprecated.push(cached);
    }
  }

  return result;
}
