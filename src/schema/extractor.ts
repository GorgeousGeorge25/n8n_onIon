/**
 * Schema extractor - fetches node type schemas from n8n REST API
 */

import { N8nNodeType } from './types.js';

/**
 * Fetches a single node type schema from the n8n REST API
 * @param nodeType - Full node type name (e.g., "n8n-nodes-base.slack")
 * @returns The node type schema
 * @throws Error if authentication fails, node type not found, or network error
 */
export async function extractNodeType(nodeType: string): Promise<N8nNodeType> {
  const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678';
  const apiKey = process.env.N8N_API_KEY;

  if (!apiKey) {
    throw new Error('N8N_API_KEY environment variable is required');
  }

  const url = `${apiUrl}/api/v1/node-types/${nodeType}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication failed: Invalid N8N_API_KEY');
    }

    if (response.status === 404) {
      throw new Error(`Node type not found: ${nodeType}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as N8nNodeType;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch node type ${nodeType}: ${String(error)}`);
  }
}

/**
 * Fetches multiple node type schemas from the n8n REST API
 * @param nodeTypes - Array of node type names
 * @returns Array of node type schemas
 */
export async function extractNodeTypes(nodeTypes: string[]): Promise<N8nNodeType[]> {
  const schemas: N8nNodeType[] = [];

  for (const nodeType of nodeTypes) {
    const schema = await extractNodeType(nodeType);
    schemas.push(schema);
  }

  return schemas;
}

/**
 * Lists all available node types from the n8n instance
 * @returns Array of node type names
 */
export async function listAvailableNodeTypes(): Promise<string[]> {
  const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678';
  const apiKey = process.env.N8N_API_KEY;

  if (!apiKey) {
    throw new Error('N8N_API_KEY environment variable is required');
  }

  const url = `${apiUrl}/api/v1/node-types`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication failed: Invalid N8N_API_KEY');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as Array<{ name: string }>;
    return data.map((node) => node.name);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to list node types: ${String(error)}`);
  }
}
