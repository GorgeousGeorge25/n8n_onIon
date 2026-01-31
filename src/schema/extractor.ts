/**
 * Schema extractor - fetches node type schemas from n8n REST API
 */

import { N8nNodeType } from './types.js';

/**
 * Authenticates with n8n and returns a session cookie
 * @returns Session cookie string to use in subsequent requests
 * @throws Error if authentication fails or credentials are invalid
 */
async function authenticateSession(): Promise<string> {
  const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678';
  const email = process.env.N8N_EMAIL;
  const password = process.env.N8N_PASSWORD;

  if (!email || !password) {
    throw new Error('N8N_EMAIL and N8N_PASSWORD environment variables are required');
  }

  const url = `${apiUrl}/rest/login`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrLdapLoginId: email, password }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed: Invalid email or password');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Extract session cookie from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('No session cookie received from n8n');
    }

    // Parse the cookie string (format: "n8n-auth=value; Path=/; HttpOnly")
    // We need to extract just the cookie name=value part for the Cookie header
    const cookieMatch = setCookie.match(/^([^;]+)/);
    if (!cookieMatch) {
      throw new Error('Failed to parse session cookie');
    }

    return cookieMatch[1];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to authenticate: ${String(error)}`);
  }
}

/**
 * Fetches a single node type schema from the n8n REST API
 * @param nodeType - Full node type name (e.g., "n8n-nodes-base.slack")
 * @param sessionCookie - Optional session cookie (if not provided, will authenticate)
 * @returns The node type schema
 * @throws Error if authentication fails, node type not found, or network error
 */
export async function extractNodeType(
  nodeType: string,
  sessionCookie?: string
): Promise<N8nNodeType> {
  const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678';

  // Authenticate if no session cookie provided
  const cookie = sessionCookie || await authenticateSession();

  // Use /types/nodes.json endpoint which returns all node types
  const url = `${apiUrl}/types/nodes.json`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication failed: Session expired or invalid credentials');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const allNodes = await response.json();

    if (!Array.isArray(allNodes)) {
      throw new Error(`Unexpected response format: expected array, got ${typeof allNodes}`);
    }

    // Filter to find the requested node type
    // Note: Some nodes may have multiple versions, we take the first match
    const matchingNodes = allNodes.filter((node: N8nNodeType) => node.name === nodeType);

    if (matchingNodes.length === 0) {
      throw new Error(`Node type not found: ${nodeType}`);
    }

    return matchingNodes[0] as N8nNodeType;
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
  const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678';

  // Authenticate once
  const sessionCookie = await authenticateSession();

  // Fetch all nodes at once
  const url = `${apiUrl}/types/nodes.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  if (response.status === 401) {
    throw new Error('Authentication failed: Session expired or invalid credentials');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const allNodes = await response.json();

  if (!Array.isArray(allNodes)) {
    throw new Error(`Unexpected response format: expected array, got ${typeof allNodes}`);
  }

  // Filter to get requested node types
  const schemas: N8nNodeType[] = [];
  const nodeTypeSet = new Set(nodeTypes);

  for (const node of allNodes) {
    if (nodeTypeSet.has(node.name)) {
      schemas.push(node as N8nNodeType);
      // Remove from set once found (to avoid duplicates if node has multiple versions)
      nodeTypeSet.delete(node.name);

      // Break early if we've found all requested nodes
      if (nodeTypeSet.size === 0) break;
    }
  }

  // Check if any requested nodes were not found
  if (nodeTypeSet.size > 0) {
    const missing = Array.from(nodeTypeSet).join(', ');
    throw new Error(`Node types not found: ${missing}`);
  }

  return schemas;
}

/**
 * Fetches all node type schemas from the n8n REST API
 * @returns Array of all node type schemas
 */
export async function extractAllNodeTypes(): Promise<N8nNodeType[]> {
  const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678';
  const sessionCookie = await authenticateSession();

  const url = `${apiUrl}/types/nodes.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  if (response.status === 401) {
    throw new Error('Authentication failed: Session expired or invalid credentials');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const allNodes = await response.json();

  if (!Array.isArray(allNodes)) {
    throw new Error(`Unexpected response format: expected array, got ${typeof allNodes}`);
  }

  // Deduplicate by name, keeping the first occurrence of each node type
  const seen = new Set<string>();
  const schemas: N8nNodeType[] = [];

  for (const node of allNodes) {
    if (node.name && !seen.has(node.name)) {
      seen.add(node.name);
      schemas.push(node as N8nNodeType);
    }
  }

  return schemas;
}
