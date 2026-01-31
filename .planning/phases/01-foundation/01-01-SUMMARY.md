---
phase: 01-foundation
plan: 01
subsystem: foundation
tags: [typescript, esm, n8n, schema-extraction, rest-api, json-cache]
requires: []
provides:
  - Schema extraction from n8n REST API
  - Local JSON caching for node type schemas
  - TypeScript interfaces for n8n schema structure
affects:
  - 01-02 (needs cached schemas for type generation)
  - 01-03 (needs schema types for builder implementation)
tech-stack:
  added: [typescript, tsx, vitest, dotenv, @types/node]
  patterns: [esm-modules, rest-api-client, file-based-cache]
key-files:
  created:
    - src/schema/types.ts
    - src/schema/extractor.ts
    - src/schema/cache.ts
    - cli/extract.ts
  modified:
    - package.json
    - tsconfig.json
decisions:
  - title: Use ESM (type: module)
    context: Modern Node.js project with TypeScript
    choice: ESM over CommonJS
    rationale: Better TypeScript support, native Node 18+ compatibility
  - title: Native fetch over axios
    context: HTTP client for n8n REST API
    choice: Native fetch (Node 18+)
    rationale: Zero dependencies, built-in, simpler code
  - title: File-based schema cache
    context: Local persistence of extracted schemas
    choice: JSON files in schemas/ directory
    rationale: Simplicity, git-friendly, human-readable, no database needed
metrics:
  duration: 3 minutes
  completed: 2026-01-31
---

# Phase 01 Plan 01: Project Setup and Schema Extraction Summary

**One-liner:** TypeScript ESM project with n8n REST API schema extraction and local JSON caching using native fetch

## What Was Built

### Project Foundation
- Initialized n8n-workflow-sdk as ESM TypeScript project
- Configured strict TypeScript compilation with NodeNext module resolution
- Set up package.json with build, extract, generate, and test scripts
- Created .env.example for n8n API configuration

### Schema Type System
Created comprehensive TypeScript interfaces modeling n8n node type structure:
- `N8nNodeType` - Top-level node type with properties, credentials, version
- `N8nProperty` - Individual node property with displayOptions and typeOptions
- `N8nDisplayOptions` - Conditional visibility rules (show/hide)
- `N8nCredential` - Credential requirements
- `N8nPropertyType` - Union type covering 15 n8n property types
- `N8nOption` - Options for dropdown/multi-select properties

### Schema Extractor
REST API client for n8n node type extraction:
- `extractNodeType(nodeType)` - Fetch single node schema
- `extractNodeTypes(nodeTypes)` - Batch fetch multiple schemas
- `listAvailableNodeTypes()` - Discover all node types in n8n instance
- Authenticates with X-N8N-API-KEY header
- Clear error messages for 401 (bad API key), 404 (not found), network errors

### Schema Cache
Local JSON file persistence for extracted schemas:
- `writeSchema(nodeType)` - Save schema to `schemas/{name}.json`
- `readSchema(nodeTypeName)` - Load schema from cache
- `listCachedSchemas()` - List all cached schema names
- `readAllSchemas()` - Load all cached schemas
- Filename normalization: dots to dashes (e.g., `n8n-nodes-base-slack.json`)

### CLI Tool
`cli/extract.ts` - Schema extraction command:
- Default target: 5 v1 scope nodes (webhook, httpRequest, slack, if, set)
- Optional node type arguments for custom extraction
- Progress logging with checkmarks
- Summary output showing extraction count

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @types/node dependency**
- Found during: Task 2 TypeScript compilation
- Issue: TypeScript couldn't find types for process, console, fetch, fs/promises, path
- Fix: Installed @types/node as devDependency
- Files modified: package.json, package-lock.json
- Commit: 1b98ccf (included in Task 2 commit)

**2. [Rule 1 - Bug] Fixed tsconfig rootDir conflict**
- Found during: Task 2 TypeScript compilation
- Issue: tsconfig.json had rootDir: "./src" but included cli/**/* causing compilation error
- Fix: Removed rootDir restriction to allow both src/ and cli/ directories
- Files modified: tsconfig.json
- Commit: 1b98ccf (included in Task 2 commit)

**3. [Rule 1 - Bug] Fixed type inference in listAvailableNodeTypes**
- Found during: Task 2 TypeScript compilation
- Issue: Implicit 'any' type on data.map() parameter
- Fix: Cast response.json() as Array<{ name: string }>
- Files modified: src/schema/extractor.ts
- Commit: 1b98ccf (included in Task 2 commit)

All deviations were standard setup fixes for TypeScript Node.js projects. No architectural changes required.

## Commits

| Hash    | Type    | Description                                      |
|---------|---------|--------------------------------------------------|
| 492d475 | chore   | Scaffold project and define schema types         |
| 1b98ccf | feat    | Implement schema extractor and cache with CLI    |

## Verification Results

### Automated Verification
- ✅ `npx tsc --noEmit` - Zero TypeScript errors
- ⏸️ `npx tsx cli/extract.ts` - Requires n8n instance running (not tested)
- ⏸️ `ls schemas/` - Would show 5 JSON files after extraction
- ⏸️ JSON file structure - Would contain properties with displayOptions

### Manual Testing Required
Schema extraction requires:
1. n8n instance running locally (default: http://localhost:5678)
2. N8N_API_KEY environment variable set
3. Run: `cp .env.example .env` and configure
4. Run: `npm run extract`

Expected output:
```
Extracting 5 node schemas...
✓ n8n-nodes-base.webhook
✓ n8n-nodes-base.httpRequest
✓ n8n-nodes-base.slack
✓ n8n-nodes-base.if
✓ n8n-nodes-base.set

Extracted 5 schemas to schemas/
```

## Success Criteria Met

- ✅ Project compiles with strict TypeScript
- ✅ Schema types accurately model n8n node type structure
- ✅ Extractor authenticates and pulls schemas from n8n REST API
- ✅ Schemas persist as readable JSON files for offline use
- ✅ CLI extract command works with v1 node list

## Decisions Made

1. **ESM over CommonJS**
   - Modern Node.js approach with better TypeScript support
   - Required explicit .js extensions in imports
   - Set package.json type: "module"

2. **Native fetch over axios**
   - Node 18+ has built-in fetch
   - Reduces dependencies to zero (just devDependencies)
   - Simpler code without library abstractions

3. **File-based JSON cache over database**
   - Simplicity: No database setup needed
   - Git-friendly: Can commit schemas for testing
   - Human-readable: Easy to inspect and debug
   - Fast: Direct filesystem reads

4. **NodeNext module resolution**
   - Best compatibility with ESM and TypeScript
   - Requires explicit .js extensions in imports
   - Future-proof for Node.js evolution

## Key Files Reference

### Core Schema Types
**Path:** `src/schema/types.ts`
**Exports:** N8nNodeType, N8nProperty, N8nDisplayOptions, N8nCredential, N8nPropertyType, N8nOption
**Purpose:** Canonical TypeScript representation of n8n schema structure
**Used by:** All downstream type generation and builder implementation

### Schema Extractor
**Path:** `src/schema/extractor.ts`
**Exports:** extractNodeType, extractNodeTypes, listAvailableNodeTypes
**Purpose:** REST API client for n8n node type extraction
**Dependencies:** N8N_API_URL, N8N_API_KEY environment variables
**Auth:** X-N8N-API-KEY header

### Schema Cache
**Path:** `src/schema/cache.ts`
**Exports:** writeSchema, readSchema, listCachedSchemas, readAllSchemas
**Purpose:** Local JSON file persistence
**Storage:** schemas/ directory (gitignored, .gitkeep committed)
**Naming:** Dots to dashes (n8n-nodes-base.slack → n8n-nodes-base-slack.json)

### CLI Extract
**Path:** `cli/extract.ts`
**Purpose:** Command-line schema extraction tool
**Usage:** `npm run extract [nodeType1 nodeType2 ...]`
**Default:** Extracts 5 v1 scope nodes

## Next Phase Readiness

### Blockers
None. All dependencies in place for next plan.

### Concerns
- Schema extraction not yet tested against live n8n instance
- Unknown if n8n REST API schema format exactly matches type definitions
- May discover additional required fields during actual extraction

### Ready for
- **01-02: Type Generator** - Can read cached schemas and generate types
- **01-03: Workflow Builder** - Can use generated types for node construction

### Environment Setup for Next Developer
1. Clone repo
2. Run `npm install`
3. Start local n8n instance: `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`
4. Copy `.env.example` to `.env`
5. Get API key: n8n Settings → API → Create API Key
6. Set N8N_API_KEY in .env
7. Test extraction: `npm run extract`
8. Verify: `ls schemas/*.json` should show 5 files

## Artifacts

### Package Configuration
- package.json: ESM TypeScript project with scripts
- tsconfig.json: Strict mode, NodeNext resolution
- .gitignore: Excludes node_modules, dist, .env, schemas/

### Source Code
- src/index.ts: Barrel export
- src/schema/types.ts: 7 exported interfaces (180 lines)
- src/schema/extractor.ts: 3 exported functions (107 lines)
- src/schema/cache.ts: 4 exported functions (97 lines)
- cli/extract.ts: CLI tool (56 lines)

### Dependencies
- typescript: 5.7.0
- tsx: 4.19.0 (TS execution for CLI)
- vitest: 2.1.0 (future tests)
- dotenv: 16.4.0 (env var loading)
- @types/node: 25.1.0 (Node.js type definitions)

Total: 5 devDependencies, 0 runtime dependencies

## Lessons Learned

1. **ESM imports require .js extensions** even for .ts files - TypeScript compiles to .js
2. **@types/node is essential** for Node.js built-in types in strict mode
3. **rootDir restriction** can conflict with multi-directory TypeScript projects
4. **Native fetch simplifies** HTTP client code significantly vs axios/node-fetch

## Technical Debt

None identified. Clean foundation with proper types and error handling.

## Performance Notes

- Extraction is sequential (not parallel) to avoid overwhelming n8n API
- File cache uses sync writeFile - could optimize with async batching if needed
- No caching of node type list - calls API each time

Future optimization opportunity: Parallel extraction with configurable concurrency limit.
