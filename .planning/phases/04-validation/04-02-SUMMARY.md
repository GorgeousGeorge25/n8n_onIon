# Phase 4 Plan 2: Integration Tests — n8n Workflow Import Summary

---
phase: 04-validation
plan: 02
subsystem: testing
tags: [vitest, integration, n8n-api, webhook, http-request, slack, if, set]
dependency-graph:
  requires: [04-01, 03-01, 03-02]
  provides: [integration-tests-n8n-import, end-to-end-validation]
  affects: []
tech-stack:
  added: []
  patterns: [api-key-auth, graceful-skip, test-cleanup]
key-files:
  created:
    - src/compiler/tests/integration.test.ts
  modified:
    - .env
decisions:
  - Use n8n public API v1 with API key instead of session-based auth for import/delete
  - Strip read-only 'active' field from compiled JSON before API submission
metrics:
  duration: 5 min
  completed: 2026-01-31
---

Integration tests importing compiled SDK workflows into running n8n instance via public API v1 with API key auth, validating all 5 target nodes import without errors.

## What Was Done

### Task 1: Create integration tests that import compiled workflows into n8n
Created `src/compiler/tests/integration.test.ts` with 5 integration tests:

1. **Webhook (NODE-01):** Compiles webhook workflow, imports via POST /api/v1/workflows, verifies 200 status and ID returned.
2. **HTTP Request (NODE-02):** Compiles HTTP Request workflow with GET method, imports successfully.
3. **Slack (NODE-03):** Compiles Slack workflow with expression reference, imports successfully.
4. **IF (NODE-04):** Compiles IF workflow with two output branches (true/false), imports successfully.
5. **Set (NODE-05):** Compiles Set workflow with field assignments and expressions, imports successfully.

**API approach:** Uses `X-N8N-API-KEY` header with n8n public API v1. The `active` field is stripped from compiled output since it is read-only in the public API.

**Graceful skip:** If `N8N_API_KEY` is not set or n8n is unreachable, all tests return early with a console warning instead of failing.

**Cleanup:** `afterAll` deletes all created workflows via `DELETE /api/v1/workflows/:id`.

### Task 2: Run full test suite and verify complete phase success
Full suite: 52 tests pass across 6 test files, 0 failures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] n8n public API requires API key, not session auth**
- **Found during:** Task 1
- **Issue:** Plan specified session-based auth (POST /rest/login + cookie), but `/api/v1/workflows` endpoint requires `X-N8N-API-KEY` header and rejects session cookies with 401.
- **Fix:** Switched to API key authentication. Created API key via n8n REST API with workflow scopes. Added `N8N_API_KEY` to `.env`.
- **Files modified:** src/compiler/tests/integration.test.ts, .env

**2. [Rule 1 - Bug] n8n public API rejects 'active' field as read-only**
- **Found during:** Task 1
- **Issue:** Compiled workflow JSON includes `active: false`, but n8n public API v1 returns 400 with "request/body/active is read-only".
- **Fix:** Strip `active` field from compiled JSON before API submission using destructuring.
- **Files modified:** src/compiler/tests/integration.test.ts

**3. [Rule 1 - Bug] n8n v2.2.4 archive-before-delete requirement**
- **Found during:** Task 1
- **Issue:** Internal REST API (`/rest/workflows/:id` DELETE) returns 400 "Workflow must be archived before it can be deleted" — new in n8n v2.2.4.
- **Fix:** Used public API v1 for deletion instead, which supports direct DELETE without archiving.
- **Files modified:** src/compiler/tests/integration.test.ts

## Decisions Made

| Decision | Context | Rationale |
|----------|---------|-----------|
| API key auth over session auth | n8n public API v1 requires it | Session cookies only work with internal /rest/ endpoints; /api/v1/ requires X-N8N-API-KEY |
| Strip 'active' before import | Public API marks it read-only | Destructure to omit; n8n sets active=false by default |

## Commit Log

| Hash | Message |
|------|---------|
| 8adc0a4 | test(04-02): add integration tests importing compiled workflows into n8n |

## Test Results

```
 5 passed (5) - integration.test.ts
52 passed (52) - full suite (6 test files)
 0 failures
 0 leftover workflows (cleanup verified)
```

## Phase 4 Completion

All Phase 4 requirements satisfied:
- **TEST-01:** Snapshot tests for all 5 nodes (04-01)
- **TEST-02:** Integration tests importing into n8n (04-02)
- **NODE-01 through NODE-05:** All 5 target nodes validated end-to-end

## Project Completion

Phase 4 is the final phase. The n8n Workflow SDK is complete:
- Phase 1 (Foundation): Schema extraction, type system, caching
- Phase 2 (SDK Core): Builder API, expressions, connections
- Phase 3 (Compilation): Compiler, CLI tools, validation
- Phase 4 (Validation): Snapshot tests, integration tests against live n8n
