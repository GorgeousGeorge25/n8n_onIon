---
phase: 05-typed-node-api
plan: 01
subsystem: codegen
tags: [typescript, codegen, typed-api, discriminated-unions, factory-pattern]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Schema types, codegen generator and conditional modules"
  - phase: 02-sdk-core
    provides: "WorkflowNode type from builder/types.ts"
provides:
  - "Typed node API factory (createTypedNodes) for compile-time checked node creation"
  - "Exported individual interfaces from generated/nodes.ts"
  - "Codegen modules re-exported from src/index.ts"
affects: [future-node-expansion, sdk-consumer-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Factory pattern for typed node creation with auto-injected discriminants"
    - "Inline param types mirroring generated interfaces to avoid compilation issues"

key-files:
  created:
    - src/codegen/typed-api.ts
  modified:
    - src/codegen/generator.ts
    - src/codegen/conditional.ts
    - src/index.ts
    - generated/nodes.ts
    - src/codegen/tests/generator.test.ts

key-decisions:
  - "Inline param types instead of importing from generated/nodes.ts (avoids TS duplicate property errors)"
  - "OmitDiscriminants utility type strips resource/operation from Slack params"

patterns-established:
  - "Typed API factory: createTypedNodes() returns nested object with resource.operation methods"
  - "Slack nested pattern: nodes.slack.message.post() auto-injects resource and operation"

# Metrics
duration: 4min
completed: 2026-01-31
---

# Phase 5 Plan 1: Typed Node API Summary

**Typed node API factory with nodes.slack.message.post() pattern, exported codegen interfaces, and compile-time parameter checking for all 5 v1 nodes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-31T09:52:25Z
- **Completed:** 2026-01-31T09:56:11Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- All 48 interfaces in generated/nodes.ts individually exported with `export interface`
- Self-referential type aliases (`export type XNode = XNode`) eliminated
- Typed node API factory provides compile-time checking for all 5 v1 nodes
- Slack uses nested resource.operation.method pattern with auto-injected discriminants
- Codegen modules re-exported from src/index.ts barrel

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix codegen to export individual interfaces and re-export from index** - `7757833` (feat)
2. **Task 2: Create typed node API factory** - `3f9ef4a` (feat)

## Files Created/Modified
- `src/codegen/typed-api.ts` - Typed node API factory with createTypedNodes() and param type definitions
- `src/codegen/generator.ts` - Updated to produce `export interface` for simple nodes, export shared types
- `src/codegen/conditional.ts` - Updated to produce `export interface` for discriminated union members
- `generated/nodes.ts` - Regenerated with all 48 interfaces exported, self-referential types removed
- `src/index.ts` - Re-exports codegen modules and typed-api factory
- `src/codegen/tests/generator.test.ts` - Updated assertions for new export format

## Decisions Made
- **Inline param types over generated imports:** The generated/nodes.ts has intentional duplicate properties (from n8n conditional displayOptions) that cause TS compilation errors when imported. Defined clean param types inline in typed-api.ts that mirror the generated shapes.
- **Index signature for flexible nodes:** HttpRequestParams and SetParams use `[key: string]: unknown` to allow extra properties since these nodes have many conditional fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion mismatch after export changes**
- **Found during:** Task 1 (after modifying generator output format)
- **Issue:** Test expected `export type SlackNode` and `export type HttpNode` but simple nodes now produce `export interface`
- **Fix:** Updated test assertions to expect `export interface SlackNode` and `export interface HttpNode`
- **Files modified:** src/codegen/tests/generator.test.ts
- **Verification:** All 52 tests pass
- **Committed in:** 7757833 (Task 1 commit)

**2. [Rule 3 - Blocking] Generated file TS compilation errors from duplicate properties**
- **Found during:** Task 2 (importing from generated/nodes.ts)
- **Issue:** generated/nodes.ts has duplicate property names per interface (n8n conditional schema), causing TS2300 errors when pulled into compilation via imports
- **Fix:** Defined param types inline in typed-api.ts instead of importing from generated file
- **Files modified:** src/codegen/typed-api.ts
- **Verification:** npm run build succeeds, all 52 tests pass
- **Committed in:** 3f9ef4a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- generated/nodes.ts was in .gitignore, requiring `git add -f` to commit it

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Typed API ready for consumer use
- Future expansion: add more Slack resources (file, reaction, star, user, userGroup) to TypedNodes
- Consider auto-generating typed-api.ts from generator output once duplicate property issue in codegen is resolved

---
*Phase: 05-typed-node-api*
*Completed: 2026-01-31*
