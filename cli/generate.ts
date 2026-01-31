#!/usr/bin/env node
/**
 * CLI entry point for type generation
 * Reads cached schemas and generates TypeScript type definitions
 */

import { readAllSchemas } from '../src/schema/cache.js';
import { generateNodeTypes } from '../src/codegen/generator.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../generated/nodes.ts');

async function main() {
  console.log('Reading cached schemas...');
  const schemas = await readAllSchemas();

  if (schemas.length === 0) {
    console.warn('No cached schemas found. Run `npm run extract` first.');
    process.exit(1);
  }

  console.log(`Found ${schemas.length} cached schemas`);

  console.log('Generating TypeScript types...');
  const typescriptCode = generateNodeTypes(schemas);

  console.log('Writing to generated/nodes.ts...');
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, typescriptCode, 'utf-8');

  console.log('Type generation complete!');
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch(error => {
  console.error('Error generating types:', error);
  process.exit(1);
});
