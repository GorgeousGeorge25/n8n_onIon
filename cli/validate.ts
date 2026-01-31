#!/usr/bin/env node
/**
 * CLI tool for validating workflow .ts files
 */

import { resolve } from 'path';
import { validateWorkflow } from '../src/compiler/validation.js';
import type { WorkflowBuilder } from '../src/builder/types.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: n8n-sdk validate <workflow.ts>');
    process.exit(1);
  }

  const inputPath = resolve(process.cwd(), args[0]);

  try {
    // Dynamic import of workflow module
    const module = await import(inputPath);
    const builder = module.default as WorkflowBuilder;

    // Validate builder
    if (!builder || !builder.name) {
      throw new Error('Workflow module must export a WorkflowBuilder as default export');
    }

    // Extract workflow structure
    const nodes = builder.getNodes();
    const connections = builder.getConnections();

    // Validate workflow
    validateWorkflow(nodes, connections);

    // Success summary
    const nodeCount = nodes.length;
    const connectionCount = connections.length;

    console.log(`✓ Workflow valid: ${builder.name}`);
    console.log(`  Nodes: ${nodeCount}`);
    console.log(`  Connections: ${connectionCount}`);
    console.log(`  All node references resolved`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Validation failed: ${error.message}`);
    } else {
      console.error(`Validation failed: ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
