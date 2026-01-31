---
status: diagnosed
phase: 01-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-01-31T02:15:00Z
updated: 2026-01-31T02:28:00Z
---

## Current Test

[testing complete]

## Tests

### 1. TypeScript Compilation
expected: Run `npx tsc --noEmit` in the project root. Should complete with zero errors — no output means success.
result: pass

### 2. Schema Extraction from n8n
expected: With your local n8n running and .env configured (N8N_API_URL, N8N_API_KEY), run `npm run extract`. Should print progress for 5 nodes (webhook, httpRequest, slack, if, set) with checkmarks, then "Extracted 5 schemas to schemas/". After running, `ls schemas/` should show 5 JSON files.
result: issue
reported: "n8n public REST API does not expose /api/v1/node-types endpoint. Returns 404 for node type fetch. The endpoint doesn't exist in n8n's public API — node type schemas are only accessible through n8n's internal API which requires cookie-based session authentication, not API key auth."
severity: blocker

### 3. Type Generation from Cached Schemas
expected: After extraction, run `npm run generate`. Should read the 5 cached schemas and write `generated/nodes.ts`. The generated file should contain TypeScript interfaces like `SlackMessagePost`, `SlackChannelCreate`, etc. with discriminated union type `SlackNode`.
result: pass

### 4. Test Suite Passes
expected: Run `npm test` (or `npx vitest run`). All 12 generator tests should pass. Output shows test names and green checkmarks.
result: pass

### 5. Generated Types Compile
expected: After generating types, run `npx tsc --noEmit` again. The generated `nodes.ts` file should compile without errors alongside the source code.
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Running `npm run extract` pulls node schemas from local n8n and saves them as JSON"
  status: failed
  reason: "n8n public REST API does not expose /api/v1/node-types endpoint. Returns 404. Node type schemas require internal API with cookie-based session auth, not API key auth."
  severity: blocker
  test: 2
  root_cause: "Extractor uses GET /api/v1/node-types/{nodeType} which doesn't exist in n8n's public REST API. Node type schemas are served via POST /rest/node-types (internal API) which requires cookie-based session auth obtained through email/password login, not API key auth. The n8n public API (authenticated via X-N8N-API-KEY) only exposes workflows, executions, credentials, and audit endpoints — not node type definitions."
  artifacts:
    - path: "src/schema/extractor.ts"
      issue: "Uses non-existent /api/v1/node-types endpoint with API key auth"
  missing:
    - "Switch to n8n internal API: POST /rest/node-types with cookie-based session auth"
    - "Or: extract schemas from n8n source code / npm packages directly"
    - "Or: use n8n's MCP server if available for node type introspection"
  debug_session: ""
