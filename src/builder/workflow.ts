/**
 * Workflow builder implementation
 */

import type { WorkflowBuilder, WorkflowNode, WorkflowConnection, NodeRef } from './types.js';

/**
 * Create a new workflow builder.
 *
 * @param name - Workflow name
 * @returns WorkflowBuilder instance with fluent API
 *
 * @example
 * ```typescript
 * const wf = workflow('My Workflow');
 * const webhook = wf.trigger('Webhook', 'n8n-nodes-base.webhook', {
 *   httpMethod: 'POST'
 * });
 * const slack = wf.node('Send Slack', 'n8n-nodes-base.slack', {
 *   resource: 'message',
 *   text: 'Hello'
 * });
 * wf.connect(webhook, slack);
 * ```
 */
export function workflow(name: string): WorkflowBuilder {
  const nodes: WorkflowNode[] = [];
  const connections: WorkflowConnection[] = [];
  const nodeNames = new Set<string>();

  /**
   * Internal helper to add a node with duplicate detection.
   */
  function addNode(name: string, type: string, parameters: Record<string, unknown>): NodeRef {
    if (nodeNames.has(name)) {
      throw new Error(`Node name "${name}" is duplicate. Each node must have a unique name within the workflow.`);
    }
    nodeNames.add(name);
    nodes.push({ name, type, parameters });
    return { name };
  }

  return {
    name,

    trigger(name: string, type: string, parameters: Record<string, unknown>): NodeRef {
      return addNode(name, type, parameters);
    },

    node(name: string, type: string, parameters: Record<string, unknown>): NodeRef {
      return addNode(name, type, parameters);
    },

    connect(from: NodeRef, to: NodeRef, outputIndex: number = 0, inputIndex: number = 0): void {
      // Validate both nodes exist
      if (!nodeNames.has(from.name)) {
        throw new Error(`Unknown node: "${from.name}". Cannot connect from a node that doesn't exist in the workflow.`);
      }
      if (!nodeNames.has(to.name)) {
        throw new Error(`Unknown node: "${to.name}". Cannot connect to a node that doesn't exist in the workflow.`);
      }
      connections.push({ from: from.name, to: to.name, outputIndex, inputIndex });
    },

    connectError(from: NodeRef, to: NodeRef): void {
      // Validate both nodes exist
      if (!nodeNames.has(from.name)) {
        throw new Error(`Unknown node: "${from.name}". Cannot connect from a node that doesn't exist in the workflow.`);
      }
      if (!nodeNames.has(to.name)) {
        throw new Error(`Unknown node: "${to.name}". Cannot connect to a node that doesn't exist in the workflow.`);
      }
      connections.push({ from: from.name, to: to.name, outputIndex: 0, inputIndex: 0, connectionType: 'error' });
    },

    getNodes(): WorkflowNode[] {
      return [...nodes]; // Return copy to prevent mutation
    },

    getConnections(): WorkflowConnection[] {
      return [...connections]; // Return copy to prevent mutation
    }
  };
}
