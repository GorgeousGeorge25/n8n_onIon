/**
 * Workflow validation functions
 */

import type { WorkflowNode, WorkflowConnection } from '../builder/types.js';

/**
 * Validate workflow structure.
 * Throws if connections reference non-existent nodes.
 *
 * @param nodes - Workflow nodes
 * @param connections - Workflow connections
 * @throws Error if validation fails
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): void {
  // Build set of valid node names
  const nodeNames = new Set(nodes.map(n => n.name));

  // Validate each connection
  for (const conn of connections) {
    if (!nodeNames.has(conn.from)) {
      throw new Error(`Connection references unknown source: "${conn.from}"`);
    }
    if (!nodeNames.has(conn.to)) {
      throw new Error(`Connection references unknown target: "${conn.to}"`);
    }
  }
}
