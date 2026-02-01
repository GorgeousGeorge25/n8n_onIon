#!/usr/bin/env node
/**
 * CLI entry point for type generation
 * Reads cached schemas and generates TypeScript type definitions, factory modules, and node catalog
 */

import { readAllSchemas } from '../src/schema/cache.js';
import { generateNodeTypes } from '../src/codegen/generator.js';
import { generateNodeCatalog, generateFactoryModules } from '../src/codegen/factory-generator.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../generated/nodes.ts');
const CATALOG_PATH = join(__dirname, '../generated/node-catalog.json');
const FACTORIES_DIR = join(__dirname, '../generated/factories');

async function main() {
  // Check for --catalog-only flag
  const catalogOnly = process.argv.includes('--catalog-only');

  console.log('Reading cached schemas...');
  const schemas = await readAllSchemas();

  if (schemas.length === 0) {
    console.warn('No cached schemas found. Run `npm run extract` first.');
    process.exit(1);
  }

  console.log(`Found ${schemas.length} cached schemas`);

  if (!catalogOnly) {
    console.log('Generating TypeScript types...');
    const typescriptCode = generateNodeTypes(schemas);

    console.log('Writing to generated/nodes.ts...');
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, typescriptCode, 'utf-8');
    console.log(`  ✓ ${OUTPUT_PATH}`);
  }

  console.log('Generating node catalog...');
  const catalog = generateNodeCatalog(schemas);

  console.log('Writing to generated/node-catalog.json...');
  mkdirSync(dirname(CATALOG_PATH), { recursive: true });
  writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');

  // Check catalog size
  const catalogSizeKB = Math.round(JSON.stringify(catalog).length / 1024);
  console.log(`  ✓ ${CATALOG_PATH} (${catalogSizeKB} KB, ${catalog.count} nodes)`);

  console.log('Generating factory modules...');
  const factoryModules = generateFactoryModules(schemas);

  console.log('Writing factory modules...');
  mkdirSync(FACTORIES_DIR, { recursive: true });

  let maxLines = 0;
  for (const [filename, sourceCode] of factoryModules.entries()) {
    const filepath = join(FACTORIES_DIR, filename);
    writeFileSync(filepath, sourceCode, 'utf-8');

    const lineCount = sourceCode.split('\n').length;
    maxLines = Math.max(maxLines, lineCount);
    console.log(`  ✓ ${filename} (${lineCount} lines)`);
  }

  console.log('');
  console.log('Generation complete!');
  console.log(`  Types: ${OUTPUT_PATH}`);
  console.log(`  Catalog: ${CATALOG_PATH} (${catalogSizeKB} KB)`);
  console.log(`  Factories: ${factoryModules.size} files (max ${maxLines} lines)`);
}

main().catch(error => {
  console.error('Error generating types:', error);
  process.exit(1);
});
