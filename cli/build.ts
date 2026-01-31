#!/usr/bin/env node
/**
 * CLI tool for building workflow .ts files to n8n JSON
 */

import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { compileWorkflow } from '../src/compiler/compiler.js';
import type { WorkflowBuilder } from '../src/builder/types.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: n8n-sdk build <workflow.ts> [output.json]');
    process.exit(1);
  }

  const inputPath = resolve(process.cwd(), args[0]);
  const outputPath = args[1]
    ? resolve(process.cwd(), args[1])
    : inputPath.replace(/\.ts$/, '.json');

  try {
    // Dynamic import of workflow module
    const module = await import(inputPath);
    const builder = module.default as WorkflowBuilder;

    // Validate builder
    if (!builder || !builder.name) {
      throw new Error('Workflow module must export a WorkflowBuilder as default export');
    }

    // Compile workflow
    const json = await compileWorkflow(builder);

    // Write JSON output
    writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');

    // Success summary
    const nodeCount = json.nodes.length;
    const connectionCount = Object.values(json.connections).reduce(
      (sum, conn) => sum + ((conn.main?.flat().length ?? 0) + (conn.error?.flat().length ?? 0)),
      0
    );

    console.log(`✓ Compiled workflow: ${builder.name}`);
    console.log(`  Nodes: ${nodeCount}`);
    console.log(`  Connections: ${connectionCount}`);
    console.log(`  Output: ${outputPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
