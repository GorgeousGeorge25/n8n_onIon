# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Compiled workflows import and execute correctly in n8n on the first try

**Current position:** v2.0 shipped — compiler layer with MCP bridge

## Current Position

Milestone: v2.0 (Compiler Layer)
Status: Complete
Last activity: 2026-02-01 — v2.0 restructuring shipped

Progress:
- v1.0: 5 phases, 12 plans, 61 tests (shipped 2026-01-31)
- v1.1: 4 phases, 11 plans, 85 tests (shipped 2026-02-01)
- v2.0: 3 phases — strip, MCP bridge, docs (shipped 2026-02-01)

## What Changed in v2.0

1. **Deleted:** `generated/` (145K+ lines), `src/codegen/`, `cli/extract.ts`, `cli/generate.ts`
2. **Added:** `src/mcp/` (client, schema-sync, validate), `cli/sync.ts`
3. **Updated:** `src/index.ts`, `package.json` (v2.0.0), `SKILL.md`
4. **Core preserved:** builder, compiler, deployer, executor, expressions, schema cache

## Architecture (v2.0)

```
n8n-mcp (or direct API) → npm run sync → schemas/ (cache) → compiler → n8n JSON
                                                                ↓
workflow() → trigger/node/connect → compileWorkflow() → deployWorkflow()
                                                                ↓
                                                       testWorkflow()
```

## Test Suite

67 tests (62 passing, 5 skipped when n8n offline):
- Builder: 17 tests
- Compiler: 15 tests
- Snapshots: 9 tests
- Integration: 7 tests
- Expressions: 11 tests
- MCP: 3 tests
- Executor: 5 tests (skipped without live n8n)

## Accumulated Context

### Key Decisions (v2.0)

| Decision | Rationale |
|----------|-----------|
| Delete generated factories | Redundant with n8n-mcp node discovery |
| Keep schema cache | Compiler reads from cache — MCP just populates it |
| Keep extractor as fallback | Users without n8n-mcp can still use direct API |
| MCP optional at runtime | Compilation works offline with cached schemas |
| String-based node types | `wf.node('Slack', 'n8n-nodes-base.slack', params)` — discovered via n8n-mcp |

### Pending Todos

1. **Replace 2s webhook sleep with polling** — Low priority, works now.
2. **Separate unit and integration test runs** — Low priority, suite is fast.

## Session Continuity

Last session: 2026-02-01
Stopped at: v2.0 restructuring complete (all 3 phases shipped)
Resume with: New feature development or ecosystem integration
