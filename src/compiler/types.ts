/**
 * n8n workflow JSON output types
 */

/**
 * n8n connection format.
 * Represents a single connection from one node to another.
 */
export interface N8nConnection {
  node: string; // Target node ID
  type: string; // Connection type ('main')
  index: number; // Input index on target node (usually 0)
}

/**
 * n8n node format.
 * Represents a single node in the compiled workflow.
 */
export interface N8nNode {
  id: string; // UUID
  name: string; // Node display name
  type: string; // n8n node type (e.g., 'n8n-nodes-base.slack')
  typeVersion: number; // Node type version (usually 1)
  position: [number, number]; // [x, y] canvas position
  parameters: Record<string, unknown>; // Node configuration
  credentials?: Record<string, { id: string; name: string }>; // Credentials by type
}

/**
 * n8n workflow JSON format.
 * This is the complete structure that n8n imports.
 */
export interface N8nWorkflow {
  name: string; // Workflow name
  nodes: N8nNode[]; // All nodes in the workflow
  connections: Record<string, {
    main?: Array<Array<N8nConnection>>;
    error?: Array<Array<N8nConnection>>;
  }>; // Nested connection format with main and error types
  active: boolean; // Whether workflow is active
  settings: Record<string, unknown>; // Workflow settings
}
