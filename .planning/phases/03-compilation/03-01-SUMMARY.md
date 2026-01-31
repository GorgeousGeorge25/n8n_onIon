---
phase: 03-compilation
plan: 01
subsystem: compiler
tags: [compiler, workflow, n8n, json, uuid, validation, layout]

# Dependency graph
requires:
  - phase: 02-sdk-core
    provides: WorkflowBuilder, WorkflowNode, WorkflowConnection types and builder API
provides:
  - compileWorkflow function transforming WorkflowBuilder to n8n JSON
  - UUID generation for unique node IDs
  - Grid layout calculator for non-overlapping positions
  - Connection validation ensuring referential integrity
  - N8nWorkflow, N8nNode, N8nConnection types for n8n JSON format
affects: [04-integration, testing, future compiler enhancements]

# Tech tracking
tech-stack:
  added: [crypto.randomUUID for UUID generation]
  patterns: [TDD with RED-GREEN phases, 3-row grid layout with 300x200 spacing, nested connection format for n8n]

key-files:
  created:
    - src/compiler/types.ts
    - src/compiler/layout.ts
    - src/compiler/validation.ts
    - src/compiler/compiler.ts
    - src/compiler/tests/compiler.test.ts
  modified:
    - src/index.ts

key-decisions:
  - "Used crypto.randomUUID for node ID generation (native Node.js, no dependencies)"
  - "3-row grid layout with 300x200px spacing for visual clarity"
  - "Validation runs before compilation, failing fast on invalid workflows"
  - "Connections transformed to n8n nested format: { [node]: { main: [[{node, type, index}]] } }"

patterns-established:
  - "TDD execution: RED (failing tests) → GREEN (implementation) → atomic commits"
  - "Grid layout: calculateGridPosition with column/row math for consistent spacing"
  - "Connection validation: build Set of node names, check all connection references"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 03 Plan 01: Compilation Core Summary

**WorkflowBuilder to n8n JSON compiler with UUID generation, grid layout, and connection validation**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-31T08:58:42Z
- **Completed:** 2026-01-31T09:00:58Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 6

## Accomplishments
- compileWorkflow() transforms WorkflowBuilder into structurally valid n8n workflow JSON
- Every node receives unique UUID and non-overlapping [x, y] grid position
- Connections converted to n8n's nested format with proper output branch indexing
- Validation rejects workflows with connections referencing non-existent nodes
- Expression strings pass through unchanged in compiled parameters

## Task Commits

Each task was committed atomically following TDD protocol:

1. **Task 1: Create compiler types and write failing tests** - `520974a` (test)
   - Created N8nNode, N8nConnection, N8nWorkflow types
   - Added 8 comprehensive test cases (structure, UUID, layout, connections, validation, expressions)
   - Tests fail as expected (RED phase) - implementation not yet created

2. **Task 2: Implement compiler modules to pass all tests** - `6d025ee` (feat)
   - Implemented calculateGridPosition: 3-row grid with 300x200 spacing
   - Implemented validateWorkflow: checks connection references
   - Implemented compileWorkflow: transforms builder to n8n format with UUIDs
   - Updated index.ts to export compiler API
   - All 8 compiler tests pass (GREEN phase), 42/42 total tests passing

_Note: TDD workflow - Task 1 RED phase (failing tests), Task 2 GREEN phase (passing implementation)_

## Files Created/Modified

**Created:**
- `src/compiler/types.ts` - N8n JSON output interfaces (N8nNode, N8nConnection, N8nWorkflow)
- `src/compiler/layout.ts` - Grid position calculator with 3-row layout algorithm
- `src/compiler/validation.ts` - Connection validation ensuring referential integrity
- `src/compiler/compiler.ts` - Main compilation function transforming builder to n8n JSON
- `src/compiler/tests/compiler.test.ts` - Comprehensive test suite (8 test cases)

**Modified:**
- `src/index.ts` - Added compiler exports (types, compileWorkflow, validateWorkflow, calculateGridPosition)

## Decisions Made

**UUID generation:**
- Used Node.js built-in `crypto.randomUUID()` instead of external library (uuid)
- Rationale: Zero dependencies, native support, standard UUID v4 format

**Grid layout algorithm:**
- 3-row grid with 300px horizontal, 200px vertical spacing
- Start position: [100, 100]
- Formula: column = floor(index/3), row = index%3
- Rationale: Matches n8n's visual editor spacing, prevents overlap

**Connection format:**
- Transform to n8n nested structure: `{ [sourceNode]: { main: [[{node, type, index}]] } }`
- Array indices represent output branches (0 = main, 1+ = IF false, etc.)
- Rationale: Matches n8n's internal format, supports multi-output nodes

**Validation timing:**
- Run validateWorkflow before compilation starts
- Fail fast with clear error messages
- Rationale: Prevents generating invalid JSON, easier to debug builder code

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward, all tests passed on first GREEN attempt.

## Next Phase Readiness

**Ready for Phase 04 (Integration):**
- Compiler produces structurally valid n8n JSON
- UUIDs ensure unique node identification
- Grid layout prevents visual overlap
- Connection validation ensures referential integrity
- Expression values preserved for runtime evaluation

**What's available:**
- `compileWorkflow(builder)` - main API entry point
- `validateWorkflow(nodes, connections)` - standalone validation
- `calculateGridPosition(index)` - layout utility
- Full TypeScript types for n8n JSON format

**Next steps:**
- Integration testing with actual n8n instance
- JSON export functionality
- Import verification in n8n UI
- End-to-end workflow execution tests

---
*Phase: 03-compilation*
*Completed: 2026-01-31*
