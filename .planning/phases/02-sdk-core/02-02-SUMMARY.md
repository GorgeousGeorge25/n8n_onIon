---
phase: 02-sdk-core
plan: 02
subsystem: builder
tags: [workflow-builder, fluent-api, typescript, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Expression types (Expression<T>) for parameter values
provides:
  - workflow() factory function creates workflow builder context
  - trigger() and node() methods add nodes with typed parameters
  - connect() method links nodes with validation and output index support
  - WorkflowBuilder, NodeRef, WorkflowNode, WorkflowConnection types
affects: [03-compiler, 04-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fluent builder pattern for workflow construction"
    - "NodeRef opaque references for connection validation"
    - "Defensive copying in getters to prevent mutation"

key-files:
  created:
    - src/builder/workflow.ts
    - src/builder/types.ts
    - src/builder/tests/workflow.test.ts
  modified:
    - src/index.ts

key-decisions:
  - "trigger() and node() have identical implementation (differentiation deferred to Phase 3 compiler)"
  - "connect() validates node existence immediately, not deferred"
  - "outputIndex defaults to 0 for main output, 1+ for branches (IF node)"

patterns-established:
  - "Pattern 1: NodeRef returned by trigger()/node() for type-safe connection"
  - "Pattern 2: Duplicate node name detection at add-time, not compile-time"
  - "Pattern 3: Defensive copies prevent external mutation of internal state"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 02-sdk-core Plan 02: Workflow Builder Summary

**Fluent workflow builder API with trigger(), node(), connect() methods and comprehensive TDD coverage (11 tests)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-31T08:30:52Z
- **Completed:** 2026-01-31T08:32:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- workflow(name) factory creates builder context with fluent API
- trigger() and node() add nodes with parameters, return NodeRef for connections
- connect() validates node references and supports output index for branching nodes
- Comprehensive TDD test suite with 11 passing tests covering all BUILD requirements
- TypeScript types exported from src/index.ts for public API

## Task Commits

Each task was committed atomically following TDD methodology:

1. **Task 1: Write failing tests for workflow builder** - `93a75bd` (test - RED phase)
2. **Task 2: Implement workflow builder to pass tests** - `1431f4d` (feat - GREEN phase)

_Note: TDD tasks follow RED-GREEN-REFACTOR cycle. No refactoring needed - implementation clean on first pass._

## Files Created/Modified

- `src/builder/workflow.ts` - workflow() factory with fluent API implementation
- `src/builder/types.ts` - TypeScript interfaces for WorkflowBuilder, NodeRef, WorkflowNode, WorkflowConnection
- `src/builder/tests/workflow.test.ts` - TDD test suite (11 tests covering BUILD-01 through BUILD-04)
- `src/index.ts` - Added builder exports to public API

## Decisions Made

**Design decisions:**

1. **trigger() and node() identical implementation:** Both use same addNode() helper internally. Differentiation will happen in Phase 3 compiler when converting to n8n JSON (triggers need position.x coordinate adjustments, etc.)

2. **Immediate validation in connect():** Node existence validated at connect() call time, not deferred. Provides faster feedback during workflow construction.

3. **outputIndex default 0:** Main output is index 0 (standard flow), 1+ for branches (e.g., IF node true=0, false=1).

4. **Defensive copying:** getNodes() and getConnections() return array copies to prevent external mutation of builder's internal state.

5. **Parameters as Record<string, unknown>:** Runtime typing is loose. TypeScript generics (from generated types) will add compile-time safety in Phase 3.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward, all tests passed on first run after GREEN phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 3 (Compiler):**
- Workflow builder creates in-memory representation of workflow structure
- NodeRef system enables validated connections
- getNodes() and getConnections() provide data for JSON compilation
- All BUILD requirements verified with passing tests

**Blockers/Concerns:** None

**Phase 3 dependencies:**
- Compiler will consume WorkflowNode[] and WorkflowConnection[] to generate n8n JSON
- Compiler will differentiate triggers from nodes (positioning, metadata)
- Type generation will provide generic type parameters for trigger()/node() methods

---
*Phase: 02-sdk-core*
*Completed: 2026-01-31*
