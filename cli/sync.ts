/**
 * CLI: Sync node schemas from n8n-mcp or direct n8n API
 *
 * Usage:
 *   npm run sync              # Sync via n8n-mcp (preferred)
 *   npm run sync -- --all     # Sync all discoverable nodes
 *   npm run sync -- --direct  # Fall back to direct n8n API extraction
 *   npm run sync -- --check   # Dry run — report stale schemas without updating
 */

import 'dotenv/config';
import { listCachedSchemas } from '../src/schema/cache.js';

const args = process.argv.slice(2);
const useAll = args.includes('--all');
const useDirect = args.includes('--direct');
const checkOnly = args.includes('--check');

async function syncViaMcp() {
  const { syncAllSchemas, syncNodeSchema, checkSchemaFreshness } = await import('../src/mcp/schema-sync.js');
  const { closeMcpClient } = await import('../src/mcp/client.js');

  try {
    if (checkOnly) {
      console.log('Checking schema freshness via n8n-mcp...\n');
      const result = await checkSchemaFreshness();
      console.log(`Discovered: ${result.total} nodes`);
      console.log(`New (not cached): ${result.added}`);
      if (result.deprecated.length > 0) {
        console.log(`Deprecated (cached but not discovered): ${result.deprecated.length}`);
        for (const d of result.deprecated) console.log(`  - ${d}`);
      }
      return;
    }

    // Check if cache is empty — auto --all on first run
    const cached = await listCachedSchemas();
    const shouldSyncAll = useAll || cached.length === 0;

    if (cached.length === 0) {
      console.log('Empty schema cache detected — syncing all nodes...\n');
    }

    if (shouldSyncAll) {
      console.log('Syncing all node schemas via n8n-mcp...\n');
      const result = await syncAllSchemas();
      console.log(`Synced: ${result.synced}/${result.total} nodes`);
      console.log(`  New: ${result.added}`);
      console.log(`  Updated: ${result.updated}`);
      console.log(`  Unchanged: ${result.synced - result.added - result.updated}`);
      if (result.deprecated.length > 0) {
        console.log(`  Deprecated: ${result.deprecated.length}`);
        for (const d of result.deprecated) console.log(`    - ${d}`);
      }
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        for (const e of result.errors) console.log(`    - ${e}`);
      }
    } else {
      // Sync specific nodes passed as positional args
      const nodeTypes = args.filter(a => !a.startsWith('--'));
      if (nodeTypes.length === 0) {
        console.log('Usage: npm run sync -- [nodeType...] [--all] [--check] [--direct]');
        console.log('  No node types specified. Use --all to sync all nodes.');
        process.exit(1);
      }
      for (const nodeType of nodeTypes) {
        const changed = await syncNodeSchema(nodeType);
        console.log(`${nodeType}: ${changed ? 'updated' : 'unchanged'}`);
      }
    }
  } finally {
    await closeMcpClient();
  }
}

async function syncDirect() {
  const { extractAllNodeTypes, extractNodeType } = await import('../src/schema/extractor.js');
  const { writeSchema } = await import('../src/schema/cache.js');

  if (checkOnly) {
    console.log('--check is not supported with --direct (no version comparison available)');
    process.exit(1);
  }

  if (useAll) {
    console.log('Extracting all node schemas directly from n8n API...\n');
    const schemas = await extractAllNodeTypes();
    for (const schema of schemas) {
      await writeSchema(schema);
    }
    console.log(`Synced: ${schemas.length} node schemas`);
  } else {
    const nodeTypes = args.filter(a => !a.startsWith('--'));
    if (nodeTypes.length === 0) {
      console.log('Usage: npm run sync -- --direct [nodeType...] [--all]');
      process.exit(1);
    }
    for (const nodeType of nodeTypes) {
      const schema = await extractNodeType(nodeType);
      await writeSchema(schema);
      console.log(`${nodeType}: synced`);
    }
  }
}

(useDirect ? syncDirect() : syncViaMcp()).catch(error => {
  console.error('Sync failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
