/**
 * Workflow builder types
 */

/**
 * Reference to a node within a workflow.
 * Returned by trigger() and node() methods for use in connect().
 */
export interface NodeRef {
  name: string; // Node name (unique within workflow)
}

/**
 * Internal representation of a workflow node.
 */
export interface WorkflowNode {
  name: string; // Display name / identifier
  type: string; // n8n node type (e.g., 'n8n-nodes-base.slack')
  parameters: Record<string, unknown>; // Node configuration
}

/**
 * Connection between two nodes in a workflow.
 */
export interface WorkflowConnection {
  from: string; // Source node name
  to: string; // Target node name
  outputIndex: number; // Output index (0 for main, 1+ for branches like IF false)
}

/**
 * Workflow builder interface.
 * Provides fluent API for constructing workflows.
 */
export interface WorkflowBuilder {
  /** Workflow name */
  name: string;

  /**
   * Add a trigger node to the workflow.
   * @param name - Unique node name
   * @param type - n8n node type (e.g., 'n8n-nodes-base.webhook')
   * @param parameters - Node configuration
   * @returns NodeRef for use in connect()
   */
  trigger(name: string, type: string, parameters: Record<string, unknown>): NodeRef;

  /**
   * Add an action node to the workflow.
   * @param name - Unique node name
   * @param type - n8n node type (e.g., 'n8n-nodes-base.slack')
   * @param parameters - Node configuration
   * @returns NodeRef for use in connect()
   */
  node(name: string, type: string, parameters: Record<string, unknown>): NodeRef;

  /**
   * Connect two nodes.
   * @param from - Source node reference
   * @param to - Target node reference
   * @param outputIndex - Output index (default 0, use 1+ for branching nodes like IF)
   */
  connect(from: NodeRef, to: NodeRef, outputIndex?: number): void;

  /**
   * Get all nodes in the workflow.
   * @returns Copy of nodes array
   */
  getNodes(): WorkflowNode[];

  /**
   * Get all connections in the workflow.
   * @returns Copy of connections array
   */
  getConnections(): WorkflowConnection[];
}
