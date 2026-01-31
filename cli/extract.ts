#!/usr/bin/env node
/**
 * CLI tool for extracting n8n node type schemas
 */

import 'dotenv/config';
import { extractNodeTypes } from '../src/schema/extractor.js';
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

  let nodeTypes: string[];

  if (args.includes('--all')) {
    console.error('--all flag not yet implemented. Using default node list.');
    nodeTypes = DEFAULT_NODE_TYPES;
  } else if (args.length > 0) {
    // Use provided node type names
    nodeTypes = args.filter(arg => !arg.startsWith('--'));
  } else {
    // Use default list
    nodeTypes = DEFAULT_NODE_TYPES;
  }

  console.log(`Extracting ${nodeTypes.length} node schemas...`);

  try {
    const schemas = await extractNodeTypes(nodeTypes);

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
