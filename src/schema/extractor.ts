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

  const url = `${apiUrl}/rest/node-types`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
      body: JSON.stringify({ nodeTypes: [nodeType] }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed: Session expired or invalid credentials');
    }

    if (response.status === 404) {
      throw new Error(`Node type not found: ${nodeType}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Response is an array of node schemas - extract the first element
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No schema returned for node type: ${nodeType}`);
    }

    return data[0] as N8nNodeType;
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
  // Authenticate once and reuse session for all requests
  const sessionCookie = await authenticateSession();

  const schemas: N8nNodeType[] = [];

  for (const nodeType of nodeTypes) {
    const schema = await extractNodeType(nodeType, sessionCookie);
    schemas.push(schema);
  }

  return schemas;
}

/**
 * Lists all available node types from the n8n instance
 * @returns Array of node type names
 */
export async function listAvailableNodeTypes(): Promise<string[]> {
  // For v1 scope, return hardcoded list of supported nodes
  // This is simpler and more reliable than querying the API
  return [
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.slack',
    'n8n-nodes-base.if',
    'n8n-nodes-base.set',
  ];
}
