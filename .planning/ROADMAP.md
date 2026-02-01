# Roadmap: n8n TypeScript Workflow SDK

## Milestones

- v1.0 MVP - Phases 1-5 (shipped 2026-01-31)
- v1.1 Full Automation - Phases 5.1-5.4 (shipped 2026-02-01)
- v2.0 Compiler Layer - Phases 1-3 (shipped 2026-02-01)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) - SHIPPED 2026-01-31</summary>

Phase 1: Project Foundation - TypeScript project with build, test, and CLI scaffolding
Phase 2: Schema Extraction - Pull and cache n8n node definitions via REST API
Phase 3: Type Generation - Transform schemas into discriminated union TypeScript interfaces
Phase 4: Builder and Compiler - Fluent API that compiles workflow code to valid n8n JSON
Phase 5: Integration Testing - Snapshot tests and n8n API import verification

5 phases, 12 plans, 61 tests, 5,047 LOC shipped.
Post-v1.0: All 797 node schemas extracted and typed (64,512 lines).

</details>

<details>
<summary>v1.1 Full Automation (Phases 5.1-5.4) - SHIPPED 2026-02-01</summary>

- [x] **Phase 5.1: Deployable Package** - Build and deploy workflows through tool calls (1 plan)
- [x] **Phase 5.2: Complex Workflow Builder** - typeVersion fix, credentials, merge indices, error paths, topology layout, validation (4 plans)
- [x] **Phase 5.3: Automated Workflow Testing** - Execute via API, test with sample data, poll results, feedback loop (3 plans)
- [x] **Phase 5.4: Generate Typed Node APIs** - Auto-generated factories for all 797 nodes, discovery catalog, SKILL.md (3 plans)

11 plans, 85 tests, full typed coverage.

</details>

### v2.0 Compiler Layer (SHIPPED 2026-02-01)

**Milestone Goal:** Pivot from standalone SDK to compiler layer that integrates with n8n-mcp ecosystem.

- [x] **Phase 1: Strip Redundant Components** - Delete generated/ (145K lines), codegen/, CLI extract/generate
- [x] **Phase 2: MCP Bridge** - Add schema sync and validation via n8n-mcp
- [x] **Phase 3: Lean Documentation** - Rewrite SKILL.md and planning docs for compiler-layer positioning

Net: -146K lines deleted, +200 lines added, ~700 lines rewritten.

## Progress

| Milestone | Status | Completed |
|-----------|--------|-----------|
| v1.0 MVP | Complete | 2026-01-31 |
| v1.1 Full Automation | Complete | 2026-02-01 |
| v2.0 Compiler Layer | Complete | 2026-02-01 |
