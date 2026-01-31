/**
 * Schema cache - persists node type schemas as local JSON files
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { N8nNodeType } from './types.js';

const CACHE_DIR = 'schemas';

/**
 * Converts node type name to filename
 * @param nodeTypeName - e.g., "n8n-nodes-base.slack"
 * @returns Filename - e.g., "n8n-nodes-base.slack.json"
 */
function nodeTypeToFilename(nodeTypeName: string): string {
  return `${nodeTypeName}.json`;
}

/**
 * Converts filename to node type name
 * @param filename - e.g., "n8n-nodes-base.slack.json"
 * @returns Node type name - e.g., "n8n-nodes-base.slack"
 */
function filenameToNodeType(filename: string): string {
  return filename.replace(/\.json$/, '');
}

/**
 * Writes a node type schema to the cache
 * @param nodeType - The node type schema to cache
 */
export async function writeSchema(nodeType: N8nNodeType): Promise<void> {
  const filename = nodeTypeToFilename(nodeType.name);
  const filepath = join(CACHE_DIR, filename);

  await writeFile(filepath, JSON.stringify(nodeType, null, 2), 'utf-8');
}

/**
 * Reads a node type schema from the cache
 * @param nodeTypeName - The node type name
 * @returns The cached node type schema
 * @throws Error if schema not found in cache
 */
export async function readSchema(nodeTypeName: string): Promise<N8nNodeType> {
  const filename = nodeTypeToFilename(nodeTypeName);
  const filepath = join(CACHE_DIR, filename);

  try {
    const content = await readFile(filepath, 'utf-8');
    return JSON.parse(content) as N8nNodeType;
  } catch (error) {
    throw new Error(`Schema not found in cache: ${nodeTypeName}`);
  }
}

/**
 * Lists all cached schema filenames
 * @returns Array of cached node type names
 */
export async function listCachedSchemas(): Promise<string[]> {
  try {
    const files = await readdir(CACHE_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => filenameToNodeType(f));
  } catch (error) {
    return [];
  }
}

/**
 * Reads all cached schemas
 * @returns Array of all cached node type schemas
 */
export async function readAllSchemas(): Promise<N8nNodeType[]> {
  const nodeTypeNames = await listCachedSchemas();
  const schemas: N8nNodeType[] = [];

  for (const name of nodeTypeNames) {
    const schema = await readSchema(name);
    schemas.push(schema);
  }

  return schemas;
}
