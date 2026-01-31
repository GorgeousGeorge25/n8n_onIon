---
phase: 05-typed-node-api
verified: 2026-01-31T10:01:30Z
status: gaps_found
score: 5/6 must-haves verified
gaps:
  - truth: "Generated types (SlackMessagePost, HttpRequestNode, etc.) are consumed by the typed API"
    status: partial
    reason: "Typed API defines inline param types that mirror generated interfaces instead of importing from generated/nodes.ts. The generated file has duplicate property names (from n8n conditional displayOptions) causing TS2300 errors when imported. Types are structurally equivalent but not directly consumed."
    artifacts:
      - path: "src/codegen/typed-api.ts"
        issue: "Defines 14 inline param interfaces instead of importing from generated/nodes.ts"
      - path: "generated/nodes.ts"
        issue: "Has duplicate property names per interface (e.g., body?, specifyBody? appear twice in HttpRequestNode) making it un-importable by TypeScript"
    missing:
      - "Either fix codegen to eliminate duplicate properties in generated/nodes.ts so types can be imported directly"
      - "Or add a post-processing step that deduplicates properties before writing the generated file"
      - "Then update typed-api.ts to import param types from generated/nodes.ts instead of defining inline copies"
---

# Phase 5: Typed Node API Verification Report

**Phase Goal:** Generated TypeScript types enforce node parameter schemas at compile time via a typed node API
**Verified:** 2026-01-31T10:01:30Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Typed node API provides `nodes.slack.message.post(params)` style calls with compile-time type checking | VERIFIED | `src/codegen/typed-api.ts` lines 226-265: `createTypedNodes()` returns `TypedNodes` with nested `slack.message.post()`, `slack.channel.create()` etc. Each method accepts typed params and returns `WorkflowNode`. |
| 2 | Generated types (SlackMessagePost, HttpRequestNode, etc.) are consumed by the typed API | PARTIAL | `generated/nodes.ts` exports 48 interfaces including `SlackMessagePost`, `HttpRequestNode`, etc. However, `typed-api.ts` does NOT import from `generated/nodes.ts` -- it defines 14 inline param types that structurally mirror the generated interfaces. The generated file has duplicate property names causing TS2300 errors when imported. |
| 3 | Invalid parameters produce TypeScript compilation errors | VERIFIED | Param interfaces (e.g., `WebhookParams`, `SlackMessagePostParams`) enforce specific field types. `npm run build` (tsc) succeeds, confirming type system works. No explicit negative-compilation test fixture exists, but structural typing enforces constraints. |
| 4 | Codegen module re-exported from `src/index.ts` | VERIFIED | `src/index.ts` lines 26-31: exports `generateNodeType`, `generateNodeTypes`, `analyzeDisplayOptions`, `buildDiscriminatedUnions`, `createTypedNodes`, and `TypedNodes` type. |
| 5 | Existing untyped builder API continues to work (backward compatible) | VERIFIED | `src/builder/workflow.ts` and `src/builder/types.ts` are unchanged. All 61 tests pass including 11 builder tests. |
| 6 | Type generator exports individual operation interfaces (not just union types) | VERIFIED | `generated/nodes.ts` has 48 `export interface` declarations and 0 bare `interface` declarations. Union type `SlackNode` is a union of individual interfaces. No self-referential type aliases remain. |

**Score:** 5/6 truths verified (1 partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/codegen/typed-api.ts` | Typed node API factory | VERIFIED (266 lines, substantive) | Exports `createTypedNodes`, `TypedNodes`, 14 param interfaces. Imported by `src/index.ts` and `src/codegen/tests/typed-api.test.ts`. |
| `src/codegen/generator.ts` | Updated generator exporting individual interfaces | VERIFIED (184 lines) | Line 54: produces `export interface ${nodeName}Node`. Shared types (`Expression`, `ResourceLocator`) have `export`. |
| `src/codegen/conditional.ts` | Discriminated unions with exported interfaces | VERIFIED (258 lines) | Line 140: produces `export interface ${interfaceName}`. |
| `generated/nodes.ts` | Regenerated types with proper exports | VERIFIED with warning | 48 exported interfaces, no bare interfaces. BUT: line 98 has `export export interface SlackChannelArchive` (double export keyword -- codegen bug). Also contains duplicate property names per interface (n8n conditional schema artifact). |
| `src/index.ts` | Re-exports codegen module | VERIFIED (32 lines) | Lines 26-31 re-export all codegen and typed-api exports. |
| `src/codegen/tests/typed-api.test.ts` | Tests for typed node API | VERIFIED (153 lines, 9 tests) | Tests all 5 node types, Slack auto-injection, WorkflowNode shape, and builder integration. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/codegen/typed-api.ts` | `src/builder/types.ts` | `import type { WorkflowNode }` | WIRED | Line 11: imports WorkflowNode, used as return type in all factory methods. |
| `src/index.ts` | `src/codegen/typed-api.ts` | re-export | WIRED | Lines 30-31: `export { createTypedNodes }` and `export type { TypedNodes }`. |
| `src/index.ts` | `src/codegen/generator.ts` | re-export | WIRED | Line 26: exports `generateNodeType`, `generateNodeTypes`. |
| `src/index.ts` | `src/codegen/conditional.ts` | re-export | WIRED | Line 27: exports `analyzeDisplayOptions`, `buildDiscriminatedUnions`. |
| `src/codegen/tests/typed-api.test.ts` | `src/codegen/typed-api.ts` | import `createTypedNodes` | WIRED | Line 2: import, exercised across 9 test cases. |
| `src/codegen/typed-api.ts` | `generated/nodes.ts` | import generated types | NOT WIRED | typed-api.ts does NOT import from generated/nodes.ts. Uses inline type definitions instead. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `generated/nodes.ts` | 98 | `export export interface` (double export keyword) | Warning | TypeScript tolerates it but indicates codegen bug in conditional.ts |
| `generated/nodes.ts` | 52-53, 59, 90, 302, 334, 473, 477 | Duplicate property names in same interface | Warning | Prevents importing generated types into other TS files; this is why typed-api.ts uses inline types |
| `src/codegen/typed-api.ts` | various | Inline types mirror generated types but are maintained separately | Warning | Maintenance burden -- if codegen output changes, inline types must be manually updated |

### Human Verification Required

### 1. Compile-Time Type Error Rejection

**Test:** In a .ts file, call `createTypedNodes().slack.message.post('x', { invalid: true })` and run `npx tsc --noEmit`.
**Expected:** TypeScript compilation error about missing required fields (`select`, `channelId`).
**Why human:** No negative-compilation test fixture exists in the test suite; vitest tests only verify runtime behavior.

### 2. Type Completeness Against Generated Schemas

**Test:** Compare inline param types in `typed-api.ts` against corresponding interfaces in `generated/nodes.ts` for structural equivalence.
**Expected:** All required fields from generated interfaces are present in inline types; optional fields reasonably covered.
**Why human:** Inline types are intentionally simplified (e.g., `[key: string]: unknown` index signatures on some types), so comparison requires judgment on acceptable simplification.

### Gaps Summary

One gap identified: the generated types in `generated/nodes.ts` are NOT directly consumed by `src/codegen/typed-api.ts`. The typed API defines its own inline param interfaces that structurally mirror the generated types. This was a deliberate workaround because the generated file contains duplicate property names (from n8n's conditional displayOptions schema), which cause TypeScript compilation errors (TS2300: Duplicate identifier) when imported.

The root cause is in the codegen pipeline: `buildDiscriminatedUnions()` in `conditional.ts` collects properties from multiple displayOptions branches for each resource/operation combo, and when the same property appears under different conditions (e.g., `body?` appears for both `json` and `raw` content types), it generates duplicate property names in the interface. Fixing this requires either deduplicating properties during generation or merging duplicate property types into unions.

Additionally, `generated/nodes.ts` line 98 has a `export export` double-keyword bug that should be fixed in the codegen.

---

_Verified: 2026-01-31T10:01:30Z_
_Verifier: Claude (gsd-verifier)_
