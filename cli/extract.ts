#!/usr/bin/env node
/**
 * CLI tool for extracting n8n node type schemas
 */

import 'dotenv/config';
import { extractNodeTypes, extractAllNodeTypes } from '../src/schema/extractor.js';
import { writeSchema } from '../src/schema/cache.js';

// Default v1 scope nodes
const DEFAULT_NODE_TYPES = [
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.slack',
  'n8n-nodes-base.if',
  'n8n-nodes-base.set',
];

async function main() {
  const args = process.argv.slice(2);

  try {
    let schemas;

    if (args.includes('--all')) {
      console.log('Extracting all node schemas from n8n...');
      schemas = await extractAllNodeTypes();
    } else {
      const nodeTypes = args.length > 0
        ? args.filter(arg => !arg.startsWith('--'))
        : DEFAULT_NODE_TYPES;

      console.log(`Extracting ${nodeTypes.length} node schemas...`);
      schemas = await extractNodeTypes(nodeTypes);
    }

    for (const schema of schemas) {
      await writeSchema(schema);
      console.log(`✓ ${schema.name}`);
    }

    console.log(`\nExtracted ${schemas.length} schemas to schemas/`);
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
