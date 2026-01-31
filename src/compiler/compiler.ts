/**
 * Workflow compiler - transforms WorkflowBuilder to n8n JSON
 */

import { randomUUID } from 'crypto';
import type { WorkflowBuilder } from '../builder/types.js';
import type { N8nWorkflow, N8nNode, N8nConnection } from './types.js';
import { calculateTopologyPositions } from './layout.js';
import { validateWorkflow } from './validation.js';
import { loadSchemaRegistry, getTypeVersion } from './schema-registry.js';

/**
 * Compile a WorkflowBuilder into n8n workflow JSON format.
 *
 * @param builder - The workflow builder instance
 * @returns n8n workflow JSON structure
 */
export async function compileWorkflow(builder: WorkflowBuilder): Promise<N8nWorkflow> {
  // Load schema registry to get correct typeVersions
  await loadSchemaRegistry();

  // Extract nodes and connections from builder
  const nodes = builder.getNodes();
  const connections = builder.getConnections();

  // Validate workflow structure
  const validation = validateWorkflow(nodes, connections);
  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => `[${e.code}] ${e.message}`).join('\n');
    throw new Error(`Workflow validation failed:\n${errorMessages}`);
  }
  // Warnings are logged but don't block compilation
  if (validation.warnings.length > 0) {
    console.warn('Workflow warnings:', validation.warnings.map(w => `[${w.code}] ${w.message}`).join(', '));
  }

  // Calculate topology-aware positions for all nodes
  const positions = calculateTopologyPositions(nodes, connections);

  // Track nodes with error connections for onError parameter
  const nodesWithErrorOutput = new Set<string>();
  for (const conn of connections) {
    if (conn.connectionType === 'error') {
      nodesWithErrorOutput.add(conn.from);
    }
  }

  // Transform nodes to n8n format with UUIDs and positions
  const n8nNodes: N8nNode[] = nodes.map((node) => {
    // Get correct typeVersion from schema registry
    const typeVersion = getTypeVersion(node.type);

    // Add onError parameter if node has error connections
    const parameters = nodesWithErrorOutput.has(node.name)
      ? { ...node.parameters, onError: 'continueErrorOutput' }
      : node.parameters;

    // Get position from topology map, fallback to default if not found
    const position = positions.get(node.name) ?? [250, 300];

    const n8nNode: N8nNode = {
      id: randomUUID(),
      name: node.name,
      type: node.type,
      typeVersion,
      position,
      parameters
    };

    // Add credentials if present
    if (node.credentials) {
      n8nNode.credentials = node.credentials;
    }

    return n8nNode;
  });

  // Build connections object in n8n's nested format
  const n8nConnections: Record<string, {
    main?: Array<Array<N8nConnection>>;
    error?: Array<Array<N8nConnection>>;
  }> = {};

  for (const conn of connections) {
    const connectionType = conn.connectionType ?? 'main';

    // Initialize source node entry if doesn't exist
    if (!n8nConnections[conn.from]) {
      n8nConnections[conn.from] = {};
    }

    // Initialize connection type array if doesn't exist
    if (!n8nConnections[conn.from][connectionType]) {
      n8nConnections[conn.from][connectionType] = [];
    }

    // Ensure array is long enough for the outputIndex
    const outputArray = n8nConnections[conn.from][connectionType]!;
    while (outputArray.length <= conn.outputIndex) {
      outputArray.push([]);
    }

    // Add connection to appropriate output branch
    outputArray[conn.outputIndex].push({
      node: conn.to,
      type: connectionType,
      index: conn.inputIndex ?? 0
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
