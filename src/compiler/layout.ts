/**
 * Node layout calculators for workflow visualization
 */

import type { WorkflowNode, WorkflowConnection } from '../builder/types.js';

// Layout constants
const SPACING_X = 300;
const SPACING_Y = 150;
const START_X = 250;
const START_Y = 300;

/**
 * Calculate grid position for a node based on its index.
 * Positions nodes in a 3-row grid pattern.
 *
 * @deprecated Use calculateTopologyPositions for better visual layout
 * @param index - Node index (0-based)
 * @returns [x, y] position tuple
 */
export function calculateGridPosition(index: number): [number, number] {
  const column = Math.floor(index / 3);
  const row = index % 3;

  const x = 100 + column * 300;
  const y = 100 + row * 200;

  return [x, y];
}

/**
 * Calculate topology-aware positions for workflow nodes.
 * Uses BFS to assign depth-based column positions, with triggers at the left.
 *
 * Algorithm:
 * 1. Build adjacency list from connections
 * 2. Identify root nodes (triggers - nodes with no incoming connections)
 * 3. BFS from roots to assign each node a depth (column)
 * 4. Handle merge nodes: depth = max(all input depths) + 1
 * 5. Position nodes within each depth level vertically
 * 6. Orphan nodes go in final column to the right
 *
 * @param nodes - Workflow nodes
 * @param connections - Workflow connections
 * @returns Map from node name to [x, y] position
 */
export function calculateTopologyPositions(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): Map<string, [number, number]> {
  const positions = new Map<string, [number, number]>();

  if (nodes.length === 0) {
    return positions;
  }

  // Build adjacency lists (outgoing and incoming)
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const node of nodes) {
    outgoing.set(node.name, []);
    incoming.set(node.name, []);
  }

  for (const conn of connections) {
    outgoing.get(conn.from)?.push(conn.to);
    incoming.get(conn.to)?.push(conn.from);
  }

  // Identify root nodes (triggers - no incoming connections)
  const roots: string[] = [];
  for (const node of nodes) {
    if (incoming.get(node.name)?.length === 0) {
      roots.push(node.name);
    }
  }

  // BFS to assign depths
  const depths = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ name: string; depth: number }> = [];

  // Start from all roots at depth 0
  for (const root of roots) {
    queue.push({ name: root, depth: 0 });
    depths.set(root, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Skip if already visited (prevents cycles)
    if (visited.has(current.name)) {
      continue;
    }
    visited.add(current.name);

    const children = outgoing.get(current.name) ?? [];

    for (const child of children) {
      // For merge nodes, depth should be max of all inputs + 1
      const existingDepth = depths.get(child) ?? -1;
      const newDepth = current.depth + 1;

      if (newDepth > existingDepth) {
        depths.set(child, newDepth);
      }

      // Only queue if not visited (but we might update depth multiple times)
      if (!visited.has(child)) {
        queue.push({ name: child, depth: newDepth });
      }
    }
  }

  // Identify orphan nodes (not reached by BFS)
  const orphans: string[] = [];
  for (const node of nodes) {
    if (!depths.has(node.name)) {
      orphans.push(node.name);
    }
  }

  // Find max depth for orphan placement
  const maxDepth = Math.max(...Array.from(depths.values()), 0);
  const orphanDepth = maxDepth + 1;

  for (const orphan of orphans) {
    depths.set(orphan, orphanDepth);
  }

  // Group nodes by depth
  const depthGroups = new Map<number, string[]>();
  for (const [name, depth] of depths) {
    if (!depthGroups.has(depth)) {
      depthGroups.set(depth, []);
    }
    depthGroups.get(depth)!.push(name);
  }

  // Assign positions: each depth is a column, nodes within depth spread vertically
  for (const [depth, nodeNames] of depthGroups) {
    const x = START_X + depth * SPACING_X;
    const nodeCount = nodeNames.length;

    // Center nodes vertically within their column
    nodeNames.forEach((name, index) => {
      const y = START_Y + index * SPACING_Y;
      positions.set(name, [x, y]);
    });
  }

  return positions;
}
