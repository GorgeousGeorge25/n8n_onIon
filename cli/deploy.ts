#!/usr/bin/env node
/**
 * CLI tool for deploying workflow .ts files to n8n.
 * Compiles the workflow and imports it via the n8n REST API in one step.
 *
 * Usage: n8n-sdk deploy <workflow.ts> [--activate]
 */

import 'dotenv/config';
import { resolve } from 'path';
import { deployWorkflow } from '../src/deployer/deploy.js';
import type { WorkflowBuilder } from '../src/builder/types.js';

async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  const activate = args.includes('--activate');
  const positionalArgs = args.filter((a) => !a.startsWith('--'));

  if (positionalArgs.length === 0) {
    console.error('Usage: n8n-sdk deploy <workflow.ts> [--activate]');
    console.error('');
    console.error('Options:');
    console.error('  --activate    Activate the workflow after import');
    console.error('');
    console.error('Environment:');
    console.error('  N8N_API_URL   n8n base URL (default: http://localhost:5678)');
    console.error('  N8N_API_KEY   n8n API key (required)');
    process.exit(1);
  }

  const inputPath = resolve(process.cwd(), positionalArgs[0]);

  try {
    // Dynamic import of workflow module
    const module = await import(inputPath);
    const builder = module.default as WorkflowBuilder;

    // Validate builder
    if (!builder || !builder.name) {
      throw new Error('Workflow module must export a WorkflowBuilder as default export');
    }

    // Deploy workflow
    const result = await deployWorkflow(builder, { activate });

    // Success summary
    const nodeCount = builder.getNodes().length;
    console.log(`Deployed workflow: ${result.name}`);
    console.log(`  Nodes: ${nodeCount}`);
    console.log(`  ID: ${result.id}`);
    console.log(`  URL: ${result.url}`);
    if (activate) {
      console.log(`  Status: active`);
    }
    console.log(`Deployed successfully.`);
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
