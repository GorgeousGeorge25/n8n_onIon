/**
 * MCP client — lazy singleton for connecting to n8n-mcp server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let client: Client | null = null;
let transport: StdioClientTransport | null = null;

/**
 * Returns a connected MCP client, creating one if needed.
 * Spawns n8n-mcp server via stdio transport.
 *
 * Configure via env vars:
 * - N8N_MCP_COMMAND: command to run (default: "npx")
 * - N8N_MCP_ARGS: space-separated args (default: "n8n-mcp")
 */
export async function getMcpClient(): Promise<Client> {
  if (client) return client;

  const command = process.env.N8N_MCP_COMMAND || 'npx';
  const args = (process.env.N8N_MCP_ARGS || 'n8n-mcp').split(' ');

  transport = new StdioClientTransport({ command, args });

  client = new Client(
    { name: 'n8n-workflow-sdk', version: '2.0.0' },
  );

  await client.connect(transport);

  return client;
}

/**
 * Closes the MCP client and transport if open.
 */
export async function closeMcpClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
  if (transport) {
    await transport.close();
    transport = null;
  }
}

// Graceful shutdown
process.on('beforeExit', () => {
  closeMcpClient().catch(() => {});
});
