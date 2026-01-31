---
phase: 02-sdk-core
plan: 01
subsystem: sdk
tags: [expressions, proxy, template-literals, typescript, n8n]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: TypeScript project structure, ESM setup, Expression<T> type definition
provides:
  - ref() function for type-safe node output references
  - expr() tagged template literal for expression compilation
  - Proxy-based property chaining for nested field access
  - __expression interface for Expression<T> compatibility
affects: [02-02-workflow-builder, workflow-construction, node-parameters]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Proxy-based API for fluent node reference syntax
    - Tagged template literals for expression DSL
    - __expression property for Expression<T> compatibility

key-files:
  created:
    - src/expressions/reference.ts
    - src/expressions/template.ts
    - src/expressions/tests/expressions.test.ts
  modified:
    - src/index.ts

key-decisions:
  - "Use JavaScript Proxy for property chaining to build expression paths"
  - "__expression property returns raw expression, toString() returns wrapped ={{ ... }}"
  - "Template literal coercion handled via direct __expression access, not Symbol.toPrimitive"

patterns-established:
  - "Expression objects: __expression for raw, toString() for wrapped syntax"
  - "TDD workflow: RED (failing tests) → GREEN (implementation) → commit atomically"
  - "Proxy get trap handles both special properties (__expression, toString) and path building"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 02 Plan 01: Expression System Summary

**Proxy-based ref() and tagged template expr() compile TypeScript to n8n expression syntax, eliminating runtime string errors**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-01-31T08:30:18Z
- **Completed:** 2026-01-31T08:33:42Z
- **Tasks:** 2 (TDD: RED + GREEN phases)
- **Files modified:** 4

## Accomplishments

- ref('NodeName').out.field produces $node['NodeName'].json.field syntax
- expr\`text ${ref}\` compiles to ={{ 'text ' + expression }} concatenation
- Nested property access chains compile correctly via Proxy
- Expression objects compatible with Expression<T> type via __expression property
- 11 comprehensive tests covering all edge cases (basic refs, nested access, templates, plain strings)

## Task Commits

Each task was committed atomically following TDD workflow:

1. **Task 1: Write failing tests** - `ccc6c5d` (test)
   - RED phase: 11 tests fail because implementation doesn't exist
2. **Task 2: Implement expression system** - `7bc6b66` (feat)
   - GREEN phase: All 11 tests pass, zero TypeScript errors

## Files Created/Modified

- `src/expressions/reference.ts` - Proxy-based node output reference builder with property chaining
- `src/expressions/template.ts` - Tagged template literal function for expression compilation
- `src/expressions/tests/expressions.test.ts` - Comprehensive test suite (11 test cases)
- `src/index.ts` - Added expression system exports (ref and expr functions)

## Decisions Made

**1. Proxy-based property chaining**
- Rationale: Enables natural TypeScript syntax (ref('X').out.field.nested) without pre-generating code
- Implementation: Each property access returns new Proxy extending path array
- Trade-off: Runtime proxy overhead negligible, developer experience significantly better

**2. Dual expression formats via __expression and toString()**
- Rationale: __expression provides raw expression for Expression<T> compatibility, toString() for direct usage
- Pattern: __expression = "$node['X'].json.field", toString() = "={{ ... }}"
- Usage: Template literal needs raw expression, direct usage needs wrapped syntax

**3. Direct __expression access in template.ts**
- Rationale: 'in' operator doesn't work with Proxy (has trap not implemented), direct property access uses get trap
- Fix: Changed from `'__expression' in value` to direct `value.__expression !== undefined` check
- Result: Template literal interpolation correctly detects and extracts expression objects

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed premature builder imports**
- **Found during:** Task 2 (updating index.ts exports)
- **Issue:** index.ts contained imports for builder/types.js and builder/workflow.js which don't exist yet (added by linter/future plan)
- **Fix:** Removed lines 15-17 from index.ts (builder exports)
- **Files modified:** src/index.ts
- **Verification:** npx tsc --noEmit returns zero errors
- **Committed in:** 7bc6b66 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix to unblock TypeScript compilation. No scope creep.

## Issues Encountered

**Proxy property detection issue:**
- Problem: Template literal coercion needed to detect __expression property, but `'__expression' in value` returned false
- Root cause: Proxy requires `has` trap for `in` operator, only `get` trap was implemented
- Solution: Changed template.ts to directly access `value.__expression` instead of using `in` operator
- Result: get trap handles access correctly, all tests pass

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Expression system complete and fully tested
- ref() and expr() exported from src/index.ts
- Ready for workflow builder (Plan 02-02) to consume these helpers
- Expression objects compatible with Expression<T> type from foundation phase
- No blockers for next plan

---
*Phase: 02-sdk-core*
*Plan: 01*
*Completed: 2026-01-31*
