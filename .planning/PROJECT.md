# n8n TypeScript Workflow SDK

## What This Is

A compiler layer that transforms TypeScript workflow definitions into valid n8n JSON. Provides a fluent builder API, async compilation with schema-aware typeVersions, deployment to n8n via REST API, and an integrated test harness. Schema cache populated via n8n-mcp integration or direct API extraction.

## Core Value

Compiled workflows import and execute correctly in n8n on the first try — the SDK handles typeVersions, UUIDs, topology-aware layout, and connection format automatically.

## Requirements

### Validated

- Schema extractor pulls node definitions from local n8n instance via REST API — v1.0
- Schema cache stores extracted node definitions as local JSON — v1.0
- Expression builder provides type-safe node output references that compile to n8n expression syntax — v1.0
- Workflow builder API: `workflow()`, `wf.trigger()`, `wf.node()`, `wf.connect()` — v1.0
- Compiler produces structurally valid n8n JSON (correct typeVersion, connections, UUIDs, positions) — v1.0
- CLI commands: `build`, `validate`, `deploy`, `sync` — v1.0/v2.0
- Snapshot tests compare compiled output against known-good n8n JSON — v1.0
- Integration tests import compiled workflows into n8n via API — v1.0
- Full schema extraction: 797 node schemas cached — v1.0
- Deployment and activation via n8n REST API — v1.1
- Credential support (4th parameter) — v1.1
- Merge input indices and error handling paths — v1.1
- Topology-aware BFS layout — v1.1
- Automated workflow testing (deploy, execute, assert, cleanup) — v1.1
- MCP bridge for schema sync and validation — v2.0

### Complete

All v1.0, v1.1, and v2.0 requirements shipped.

## Current Milestone: v2.0 Compiler Layer

**Goal:** Pivot from standalone SDK with generated factories to compiler layer that integrates with n8n-mcp ecosystem.

**What changed in v2.0:**
- Removed `generated/` directory (145K+ lines of factories, types, catalog)
- Removed `src/codegen/` (generator, conditional, factory-generator, typed-api)
- Removed `cli/extract.ts` and `cli/generate.ts` (replaced by `cli/sync.ts`)
- Added `src/mcp/` module (MCP bridge for schema sync and validation)
- Users discover nodes via n8n-mcp `search_nodes`/`get_node`, not generated factories

### Out of Scope

- Credential management — SDK references credentials by ID, doesn't store secrets
- Node knowledge base — use n8n-mcp for node discovery and parameters
- Generated type-safe factories — removed in v2.0 (redundant with n8n-mcp)

## Context

- n8n instance running locally at http://localhost:5678 (Docker) with API key access
- Architecture: schema cache → compiler → valid n8n JSON
- MCP bridge (optional): n8n-mcp → schema sync → local cache → compiler
- Primary consumer is Claude generating workflow code
- 797 node schemas in cache, compiler reads typeVersion from these

## Constraints

- **Runtime**: Node.js 18+, ESM modules
- **Schema source**: MCP sync (preferred) or direct n8n API extraction (fallback)
- **Testing**: Snapshot tests + n8n API integration tests
- **MCP optional**: Compilation works offline with cached schemas

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Claude-first API design | Optimize for AI code generation patterns | Good |
| Proxy-based ref() chaining | Natural syntax without codegen | Good |
| Async compileWorkflow | Required for schema registry loading | Good |
| Schema cache as compiler input | Offline compilation, MCP only for populating cache | Good |
| Remove generated factories (v2.0) | Redundant with n8n-mcp node discovery | Good — -146K lines |
| MCP bridge for sync (v2.0) | Preferred over direct API for schema freshness | Good |
| Keep extractor as fallback (v2.0) | Users without n8n-mcp can still populate cache | Good |

---
*Last updated: 2026-02-01 — v2.0 restructuring complete*
