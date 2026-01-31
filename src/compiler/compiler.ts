/**
 * Workflow compiler - transforms WorkflowBuilder to n8n JSON
 */

import { randomUUID } from 'crypto';
import type { WorkflowBuilder } from '../builder/types.js';
import type { N8nWorkflow, N8nNode, N8nConnection } from './types.js';
import { calculateGridPosition } from './layout.js';
import { validateWorkflow } from './validation.js';

/**
 * Compile a WorkflowBuilder into n8n workflow JSON format.
 *
 * @param builder - The workflow builder instance
 * @returns n8n workflow JSON structure
 */
export function compileWorkflow(builder: WorkflowBuilder): N8nWorkflow {
  // Extract nodes and connections from builder
  const nodes = builder.getNodes();
  const connections = builder.getConnections();

  // Validate workflow structure
  validateWorkflow(nodes, connections);

  // Transform nodes to n8n format with UUIDs and positions
  const n8nNodes: N8nNode[] = nodes.map((node, index) => ({
    id: randomUUID(),
    name: node.name,
    type: node.type,
    typeVersion: 1,
    position: calculateGridPosition(index),
    parameters: node.parameters
  }));

  // Build connections object in n8n's nested format
  const n8nConnections: Record<string, { main: Array<Array<N8nConnection>> }> = {};

  for (const conn of connections) {
    // Initialize source node entry if doesn't exist
    if (!n8nConnections[conn.from]) {
      n8nConnections[conn.from] = { main: [] };
    }

    // Ensure main array is long enough for the outputIndex
    while (n8nConnections[conn.from].main.length <= conn.outputIndex) {
      n8nConnections[conn.from].main.push([]);
    }

    // Add connection to appropriate output branch
    n8nConnections[conn.from].main[conn.outputIndex].push({
      node: conn.to,
      type: 'main',
      index: 0
    });
  }

  // Return complete n8n workflow
  return {
    name: builder.name,
    nodes: n8nNodes,
    connections: n8nConnections,
    active: false,
    settings: {}
  };
}
