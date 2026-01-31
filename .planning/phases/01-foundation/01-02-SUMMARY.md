---
phase: 01-foundation
plan: 02
subsystem: codegen
status: complete
tags: [typescript, codegen, discriminated-unions, type-safety]

# Dependency graph
requires:
  - 01-01: Schema extraction and caching infrastructure
provides:
  - Schema-to-TypeScript transformation engine
  - Discriminated union generation from displayOptions
  - Type-safe node interfaces with literal types
affects:
  - 01-03: Will use these generated types for workflow construction

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discriminated unions for type branching
    - Conditional type analysis from displayOptions
    - Expression wrapper types for dynamic values

# File tracking
key-files:
  created:
    - src/codegen/generator.ts
    - src/codegen/conditional.ts
    - src/codegen/tests/generator.test.ts
    - cli/generate.ts
    - generated/nodes.ts
  modified:
    - src/schema/cache.ts

# Decisions
decisions:
  - title: "Keep dots in cache filenames"
    rationale: "Simpler conversion logic, more readable filenames"
    alternatives: "Replace dots with dashes (original implementation)"
    impact: "Bug fix - enables generate command to read cached schemas"

# Metrics
duration: 4 minutes
completed: 2026-01-31
---

# Phase 01 Plan 02: Schema-to-TypeScript Type Generator Summary

**One-liner:** Discriminated union type generator that transforms n8n displayOptions conditionals into compile-time type-safe TypeScript interfaces with literal types, ResourceLocator support, and Expression wrappers

## What Was Built

Implemented the core type generation engine that converts cached n8n node schemas into TypeScript type definitions:

1. **Conditional analysis engine** (`src/codegen/conditional.ts`):
   - Parses displayOptions.show patterns to identify resource+operation discriminated unions
   - Builds conditional tree mapping resource values -> operation values -> properties
   - Generates separate TypeScript interfaces per resource+operation combination

2. **Type generator** (`src/codegen/generator.ts`):
   - Transforms n8n property types to TypeScript types
   - Maps `options` to string literal unions (e.g., `'text' | 'block'` not `string`)
   - Supports ResourceLocator as `ResourceLocator | string` union
   - Generates typed objects for collection/fixedCollection fields
   - Wraps expression-capable fields with `Expression<T>` union type
   - Handles required vs optional fields

3. **CLI generate command** (`cli/generate.ts`):
   - Reads all cached schemas
   - Generates TypeScript source code
   - Writes to `generated/nodes.ts`

4. **Comprehensive TDD test suite** (12 tests covering all features):
   - Full node generation with discriminated unions
   - displayOptions conditional analysis
   - String literal unions from options
   - ResourceLocator support
   - Collection/FixedCollection typing
   - Expression wrapper behavior
   - Required field handling

## Example Output

From Slack schema, generates:

```typescript
interface SlackMessagePost {
  resource: 'message';
  operation: 'post';
  authentication?: 'accessToken' | 'oAuth2';
  channel?: ResourceLocator | string;
  text?: string | Expression<string>;
  options?: { username?: string; iconEmoji?: string };
}

interface SlackChannelCreate {
  resource: 'channel';
  operation: 'create';
  authentication?: 'accessToken' | 'oAuth2';
  channelName: string | Expression<string>; // required field (no ?)
}

export type SlackNode = SlackMessagePost | SlackMessageReply | SlackChannelCreate | SlackChannelArchive;
```

## TDD Cycle

**RED Phase:**
- Created failing test suite with 12 test cases
- Tests failed because generator modules didn't exist
- Commit: `test(01-02): add failing tests for type generator`

**GREEN Phase:**
- Implemented `src/codegen/conditional.ts` with displayOptions analysis
- Implemented `src/codegen/generator.ts` with type mapping
- All 12 tests passed
- Commit: `feat(01-02): implement schema-to-TypeScript type generator`

**Additional Implementation:**
- Created CLI generate script
- Commit: `feat(01-02): add CLI generate script`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed filename conversion in cache.ts**

- **Found during:** Testing CLI generate command
- **Issue:** The `nodeTypeToFilename` function was designed to replace dots with dashes (e.g., "n8n-nodes-base.slack" -> "n8n-nodes-base-slack.json"), but the actual implementation in 01-01 stored files with dots preserved ("n8n-nodes-base.slack.json"). This mismatch caused `readAllSchemas()` to fail.
- **Fix:** Simplified both conversion functions to preserve dots in filenames
- **Files modified:** `src/schema/cache.ts`
- **Commit:** `fix(01-02): correct filename conversion in cache.ts`

This was the only deviation - plan was otherwise executed exactly as written.

## Verification Results

All verification criteria passed:

1. ✓ `npx vitest run` - All 12 generator tests pass
2. ✓ `npx tsx cli/generate.ts` - Generates `generated/nodes.ts` from cached schemas
3. ✓ `npx tsc --noEmit` - Generated types compile without errors
4. ✓ Generated Slack types have separate interfaces per resource+operation combo
5. ✓ Generated types include string literal unions for options fields
6. ✓ ResourceLocator fields accept both object and string forms

## Key Technical Achievements

1. **Discriminated unions from runtime conditionals:** Successfully transformed n8n's runtime displayOptions system into compile-time type discrimination. This is the core intellectual challenge of Phase 1.

2. **Type precision:** Generated types are maximally specific - `'text' | 'block'` instead of `string`, preventing invalid values at compile time.

3. **ResourceLocator dual form:** Supports both explicit `{mode, value}` object and convenient string shorthand, matching n8n's actual API.

4. **Expression type safety:** Expression-capable fields accept both literal values and Expression wrappers, with type parameter preserving the base type.

5. **Collection typing:** Nested collection structures generate proper TypeScript object types with typed fields, not `Record<string, unknown>`.

## Test Coverage

- 12 tests covering all major features
- TYGEN-01: Full node generation
- TYGEN-02: Discriminated unions from displayOptions
- TYGEN-03: String literal unions from options
- TYGEN-04: ResourceLocator support
- TYGEN-05: Collection/FixedCollection typing
- Expression wrapping behavior
- Required vs optional field handling
- Multiple node generation

## Next Phase Readiness

**Ready for Phase 01-03 (Workflow Construction DSL):**
- Type generator fully functional
- Can generate types from any cached n8n schema
- Generated types will be imported by workflow DSL
- Expression and ResourceLocator types defined and ready to use

**No blockers.**

The workflow construction DSL can now import generated types and provide type-safe workflow building with IDE autocomplete and compile-time validation.

## Decisions Made

1. **Filename format in cache:** Keep dots in filenames (n8n-nodes-base.slack.json) rather than converting to dashes. Simpler logic, more readable.

2. **Expression type design:** Use `T | Expression<T>` union rather than making Expression a wrapper. Allows both literal values and expressions naturally.

3. **ResourceLocator shorthand:** Support `ResourceLocator | string` union to allow convenient string values while preserving full object form when needed.

## Files Created/Modified

**Created:**
- `src/codegen/generator.ts` - 140 lines - Schema-to-TypeScript transformation
- `src/codegen/conditional.ts` - 250 lines - displayOptions analysis and union generation
- `src/codegen/tests/generator.test.ts` - 467 lines - Comprehensive TDD test suite
- `cli/generate.ts` - 42 lines - CLI entry point
- `generated/nodes.ts` - 60 lines - Auto-generated Slack node types

**Modified:**
- `src/schema/cache.ts` - Fixed filename conversion logic (bug fix)

Total: ~959 lines added, ~12 lines modified

## Performance

- Type generation: <100ms for single node
- All tests: ~2ms execution time
- Total plan duration: 4 minutes (including TDD cycle and bug fix)

## Commits

1. `6fbba02` - test(01-02): add failing tests for type generator
2. `9f3a99f` - feat(01-02): implement schema-to-TypeScript type generator
3. `9f8f4b6` - feat(01-02): add CLI generate script
4. `5282b23` - fix(01-02): correct filename conversion in cache.ts

---

**Status:** Complete and verified. Ready for workflow construction DSL (01-03).
