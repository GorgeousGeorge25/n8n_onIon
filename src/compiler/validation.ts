/**
 * Workflow validation functions
 */

import type { WorkflowNode, WorkflowConnection } from '../builder/types.js';
import type { ValidationIssue, ValidationResult } from './types.js';

// Known multi-output node types and their output counts
const MULTI_OUTPUT_TYPES: Record<string, number> = {
  'n8n-nodes-base.if': 2,
  'n8n-nodes-base.switch': 99, // Variable outputs, allow any
};

/**
 * Validate workflow structure comprehensively.
 * Collects all errors and warnings before returning.
 *
 * Checks:
 * 1. Trigger exists (at least one trigger/webhook node)
 * 2. No orphan nodes (all non-trigger nodes have incoming connections)
 * 3. Connection references valid (from/to point to existing nodes)
 * 4. Output index valid for node type
 * 5. Credentials exist warning (reminder only)
 * 6. Expression ref targets exist ($node['X'] references valid nodes)
 *
 * @param nodes - Workflow nodes
 * @param connections - Workflow connections
 * @returns ValidationResult with errors and warnings
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Build set of valid node names for quick lookups
  const nodeNames = new Set(nodes.map(n => n.name));

  // Build incoming/outgoing connection maps
  const incomingConnections = new Map<string, WorkflowConnection[]>();
  const outgoingConnections = new Map<string, WorkflowConnection[]>();

  for (const node of nodes) {
    incomingConnections.set(node.name, []);
    outgoingConnections.set(node.name, []);
  }

  for (const conn of connections) {
    incomingConnections.get(conn.to)?.push(conn);
    outgoingConnections.get(conn.from)?.push(conn);
  }

  // Check 1: Trigger exists
  const hasTrigger = nodes.some(node =>
    node.type.toLowerCase().includes('trigger') ||
    node.type.toLowerCase().includes('webhook')
  );

  if (!hasTrigger && nodes.length > 0) {
    errors.push({
      type: 'error',
      code: 'NO_TRIGGER',
      message: 'Workflow must have at least one trigger or webhook node'
    });
  }

  // Check 2: No orphan nodes
  for (const node of nodes) {
    const isTrigger = node.type.toLowerCase().includes('trigger') ||
                      node.type.toLowerCase().includes('webhook');
    const hasIncoming = (incomingConnections.get(node.name)?.length ?? 0) > 0;
    const hasOutgoing = (outgoingConnections.get(node.name)?.length ?? 0) > 0;

    if (isTrigger && !hasOutgoing && nodes.length > 1) {
      errors.push({
        type: 'error',
        code: 'ORPHAN_NODE',
        message: `Trigger node "${node.name}" has no outgoing connections`,
        node: node.name
      });
    } else if (!isTrigger && !hasIncoming) {
      errors.push({
        type: 'error',
        code: 'ORPHAN_NODE',
        message: `Node "${node.name}" has no incoming connections`,
        node: node.name
      });
    }
  }

  // Check 3: Connection references valid
  for (const conn of connections) {
    if (!nodeNames.has(conn.from)) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Connection references unknown source: "${conn.from}"`,
        node: conn.from
      });
    }
    if (!nodeNames.has(conn.to)) {
      errors.push({
        type: 'error',
        code: 'INVALID_CONNECTION',
        message: `Connection references unknown target: "${conn.to}"`,
        node: conn.to
      });
    }
  }

  // Check 4: Output index valid for node type
  for (const conn of connections) {
    if (conn.outputIndex > 0) {
      // Find the source node
      const sourceNode = nodes.find(n => n.name === conn.from);
      if (sourceNode) {
        const maxOutputs = MULTI_OUTPUT_TYPES[sourceNode.type];
        if (maxOutputs !== undefined && conn.outputIndex >= maxOutputs) {
          errors.push({
            type: 'error',
            code: 'INVALID_OUTPUT_INDEX',
            message: `Node "${conn.from}" (type ${sourceNode.type}) does not support output index ${conn.outputIndex} (max: ${maxOutputs - 1})`,
            node: conn.from
          });
        }
        // If type not in known list, allow any outputIndex (don't block unknown types)
      }
    }
  }

  // Check 5: Credentials exist warning
  for (const node of nodes) {
    if (node.credentials && Object.keys(node.credentials).length > 0) {
      const credTypes = Object.keys(node.credentials).join(', ');
      warnings.push({
        type: 'warning',
        code: 'MISSING_CREDENTIALS',
        message: `Node "${node.name}" references credentials (${credTypes}). Ensure these credential IDs exist in target n8n instance`,
        node: node.name
      });
    }
  }

  // Check 6: Expression ref targets exist
  // Regex matches $node["Name"] or $node['Name'] in JSON-stringified parameters
  // In JSON, quotes are escaped as \", so we match \\?" to handle both escaped and unescaped
  const expressionRefRegex = /\$node\[\\?"?([^\]\\""'']+)\\?"?\]/g;

  for (const node of nodes) {
    // Scan all parameter values for expression refs
    const paramString = JSON.stringify(node.parameters);
    let match;

    while ((match = expressionRefRegex.exec(paramString)) !== null) {
      const referencedNode = match[1];
      if (!nodeNames.has(referencedNode)) {
        errors.push({
          type: 'error',
          code: 'INVALID_REF',
          message: `Node "${node.name}" references non-existent node "${referencedNode}" in expression`,
          node: node.name
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
