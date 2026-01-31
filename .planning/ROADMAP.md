# Roadmap: n8n TypeScript Workflow SDK

## Overview

This roadmap transforms n8n workflow JSON authoring from error-prone manual editing to type-safe TypeScript code. Starting with schema extraction from a local n8n instance, we generate TypeScript types that enforce n8n's conditional property rules, build a fluent API for workflow construction, compile to valid n8n JSON, and validate correctness with 5 representative nodes. The architecture targets 99% import success by making invalid workflows unrepresentable in the type system.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Schema extraction and type generation
- [ ] **Phase 2: SDK Core** - Workflow builder and expression system
- [ ] **Phase 3: Compilation** - Compiler and CLI tooling
- [ ] **Phase 4: Validation** - Testing and node coverage

## Phase Details

### Phase 1: Foundation
**Goal**: TypeScript types accurately model n8n node schemas with conditional property dependencies

**Depends on**: Nothing (first phase)

**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, TYGEN-01, TYGEN-02, TYGEN-03, TYGEN-04, TYGEN-05

**Success Criteria** (what must be TRUE):
  1. Schema extractor pulls all node type definitions from local n8n instance via REST API
  2. Extracted schemas persist as local JSON files for offline development
  3. Generated TypeScript interfaces enforce displayOptions conditionals (Slack message.post vs channel.create have distinct required properties)
  4. ResourceLocator types accept both mode/value pairs and string shorthand
  5. Collection and FixedCollection parameter groups compile to typed nested objects

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, schema types, extractor, and cache
- [x] 01-02-PLAN.md — Type generator with discriminated unions (TDD)
- [x] 01-03-PLAN.md — Fix schema extraction API (gap closure)

### Phase 2: SDK Core
**Goal**: Developers write workflow code using type-safe builder API with expression references

**Depends on**: Phase 1 (needs generated types)

**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, EXPR-01, EXPR-02

**Success Criteria** (what must be TRUE):
  1. Workflow context created via `workflow(name)` call
  2. Trigger nodes added with `wf.trigger()` accepting typed parameters based on generated types
  3. Action nodes added with `wf.node()` accepting typed parameters based on generated types
  4. Node connections created via `wf.connect()` with compile-time validation of node name references
  5. Node output references compile to correct `$node['Name'].json.field` syntax
  6. Template literals compile to n8n string concatenation expressions

**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 3: Compilation
**Goal**: TypeScript workflow code compiles to structurally valid, importable n8n JSON

**Depends on**: Phase 2 (needs builder API)

**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, CLI-01, CLI-02, CLI-03, CLI-04

**Success Criteria** (what must be TRUE):
  1. Compiler produces n8n JSON with correct structure (typeVersion, connections, UUIDs, positions)
  2. UUIDs auto-generated for all node IDs and webhook IDs without collision
  3. Nodes auto-positioned in grid layout without overlap
  4. Connection validation rejects references to non-existent nodes or incompatible outputs
  5. CLI `extract` command pulls schemas from n8n instance
  6. CLI `generate` command creates TypeScript types from cached schemas
  7. CLI `build` command compiles workflow .ts files to n8n JSON
  8. CLI `validate` command checks workflow structure without full compilation

**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 4: Validation
**Goal**: Compiled workflows import and execute correctly in n8n on first try for all 5 target nodes

**Depends on**: Phase 3 (needs compiler and CLI)

**Requirements**: TEST-01, TEST-02, NODE-01, NODE-02, NODE-03, NODE-04, NODE-05

**Success Criteria** (what must be TRUE):
  1. Snapshot tests compare compiled output against known-good n8n JSON for all 5 nodes
  2. Integration tests successfully import compiled workflows into n8n via API without errors
  3. Webhook trigger node compiles with correct typeVersion, parameters, and webhook configuration
  4. HTTP Request node compiles with all HTTP methods, authentication options, and parameter types
  5. Slack node compiles with resource/operation branching (message.post, channel.create, etc.)
  6. IF node compiles with conditional logic and routing configuration
  7. Set node compiles with field assignment operations and value transformations

**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | ✓ Complete | 2026-01-31 |
| 2. SDK Core | 0/TBD | Not started | - |
| 3. Compilation | 0/TBD | Not started | - |
| 4. Validation | 0/TBD | Not started | - |
