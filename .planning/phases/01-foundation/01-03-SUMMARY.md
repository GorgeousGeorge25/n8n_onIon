---
phase: 01-foundation
plan: 03
subsystem: api
tags: [n8n, rest-api, session-auth, schema-extraction, gap-closure]

# Dependency graph
requires:
  - phase: 01-01
    provides: Schema extraction and caching infrastructure
  - phase: 01-02
    provides: Type generation from schemas
provides:
  - Working schema extraction using n8n's internal /types/nodes.json API
  - Session-based authentication with cookie management
  - Verified end-to-end pipeline (extract -> cache -> generate -> compile)
affects:
  - Phase 02 (SDK Core): Can now confidently extract schemas for all nodes
  - Future schema updates: Established correct API endpoints

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Session-based authentication via POST /rest/login
    - GET /types/nodes.json for bulk schema fetching
    - Client-side filtering from full node catalog

key-files:
  created: []
  modified:
    - src/schema/extractor.ts

decisions:
  - title: "Use /types/nodes.json instead of /rest/node-types"
    context: "POST /rest/node-types was returning empty data arrays"
    choice: "GET /types/nodes.json which returns all nodes, filter client-side"
    rationale: "This is the actual endpoint n8n's frontend uses. Returns complete node catalog."
    impact: "Schema extraction now works successfully with real n8n instance"
  - title: "Fetch all nodes once instead of per-node requests"
    context: "Original implementation called API separately for each node type"
    choice: "Single GET request for all nodes, filter in memory"
    rationale: "Faster, simpler, matches how /types/nodes.json is designed"
    impact: "Reduced API calls from 5 to 1 for v1 scope extraction"

# Metrics
duration: 3 minutes
completed: 2026-01-31
---

# Phase 01 Plan 03: Fix Schema Extraction API Summary

**One-liner:** Fixed schema extraction to use n8n's actual /types/nodes.json endpoint with session authentication, enabling successful extraction of all 5 v1 scope nodes

## Performance

- **Duration:** ~3 minutes
- **Started:** 2026-01-31T07:45:39Z
- **Completed:** 2026-01-31T07:48:40Z (estimated)
- **Tasks:** 2 (1 implemented by prior agent, 1 completed in this session)
- **Files modified:** 1

## Accomplishments

- Discovered correct n8n API endpoint: `/types/nodes.json` (not `/rest/node-types`)
- Successfully extracted all 5 v1 scope node schemas from live n8n instance
- Verified complete end-to-end pipeline: extract → cache → generate → compile
- Optimized from 5 sequential API calls to 1 bulk fetch with client-side filtering

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement session-based authentication**
   - `40bee4b` (feat) - Implement session-based authentication for n8n API
   - `12ed0ae` (fix) - Use correct field name emailOrLdapLoginId for n8n login
   - _(Completed by previous agent)_

2. **Task 2: Test schema extraction and fix API endpoint**
   - `d01c98e` (fix) - Use /types/nodes.json endpoint for schema extraction

**Plan metadata:** _(Will be committed after this summary)_

## What Was Built

### API Endpoint Discovery

Investigation revealed that n8n's REST API structure differs from initial assumptions:
- `/rest/node-types` (POST) returns `{"data": []}` even with valid session cookie
- `/types/nodes.json` (GET) returns array of all node type schemas
- This is the same endpoint n8n's frontend uses for node catalog

### Extractor Updates

Modified `src/schema/extractor.ts`:

1. **extractNodeType()** - Changed from:
   - POST `/rest/node-types` with `{nodeTypes: [name]}` body
   - To: GET `/types/nodes.json` and filter client-side by node name

2. **extractNodeTypes()** - Optimized to:
   - Single GET request fetching all nodes
   - In-memory filtering for requested node types
   - Early exit once all requested nodes found
   - Error if any requested nodes missing

3. **Authentication** - Kept session-based auth:
   - POST `/rest/login` with `{emailOrLdapLoginId, password}`
   - Extract `n8n-auth` cookie from response
   - Use cookie in subsequent requests

### Verified Pipeline

Complete end-to-end flow confirmed working:

```bash
# Step 1: Extract schemas from n8n
npm run extract
# → Writes 5 JSON files to schemas/

# Step 2: Generate TypeScript types
npm run generate
# → Creates generated/nodes.ts from schemas

# Step 3: Verify compilation
npx tsc --noEmit
# → Zero TypeScript errors
```

All 5 v1 scope nodes extracted successfully:
- n8n-nodes-base.webhook
- n8n-nodes-base.httpRequest
- n8n-nodes-base.slack
- n8n-nodes-base.if
- n8n-nodes-base.set

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong API endpoint in schema extraction**

- **Found during:** Task 2 - Testing extraction with real credentials
- **Issue:** POST `/rest/node-types` with `{nodeTypes: ["n8n-nodes-base.webhook"]}` was returning `{"data": []}` even with valid session cookie. Manual curl testing revealed this endpoint returns empty arrays regardless of request format.
- **Root cause:** Incorrect assumption about n8n's internal API structure. The `/rest/node-types` endpoint exists but doesn't behave as expected.
- **Discovery:** Used curl to test n8n's API endpoints systematically. Found `/types/nodes.json` returns full node catalog (same endpoint frontend uses).
- **Fix:**
  - Changed `extractNodeType()` to GET `/types/nodes.json` and filter response
  - Changed `extractNodeTypes()` to fetch all nodes once, filter in memory
  - Removed POST request body logic
  - Added client-side filtering by node name
- **Files modified:** `src/schema/extractor.ts`
- **Verification:**
  - `npx tsx cli/extract.ts` completed successfully
  - All 5 schemas written to `schemas/` directory
  - Schemas contain `displayOptions` (verified with grep)
  - Type generation and compilation work end-to-end
- **Committed in:** `d01c98e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary bug fix to enable core functionality. Discovered actual n8n API behavior through empirical testing. No scope creep - still extracting same 5 nodes as planned.

## Issues Encountered

**API endpoint mismatch**
- Initial plan assumed `/rest/node-types` would work based on n8n documentation patterns
- Reality: n8n's internal API uses different endpoints than documented REST API
- Resolution: Manual API exploration with curl to find working endpoint
- Lesson: n8n's internal API (what frontend uses) differs from public REST API

## User Setup Required

**Prerequisites met:**
- User configured `.env` with valid N8N_EMAIL and N8N_PASSWORD credentials
- n8n instance running at http://localhost:5678
- Authentication tested and working

**No additional setup needed.**

## Next Phase Readiness

**Phase 01 Foundation complete and verified:**
- Schema extraction working with real n8n instance
- Type generation producing valid TypeScript
- Complete pipeline tested end-to-end
- All 5 v1 scope nodes successfully extracted

**Ready for Phase 02 (SDK Core):**
- Can extract schemas for any n8n node type
- Type generation proven to work with real schemas
- Foundation solid for building workflow construction DSL

**No blockers or concerns.**

## Key Technical Learnings

1. **n8n API structure:** Internal API (`/types/nodes.json`) differs from REST API (`/api/v1/*`) and undocumented internal endpoints (`/rest/*`)

2. **Bulk fetch optimization:** Fetching all nodes at once (single request) is more efficient than per-node requests, especially since `/types/nodes.json` doesn't support filtering

3. **Session authentication:** n8n uses standard cookie-based sessions via POST `/rest/login`, not custom auth headers

4. **Real schema validation:** Testing against live n8n instance revealed actual API behavior vs assumptions

## Files Modified

- `src/schema/extractor.ts` - Fixed API endpoint from `/rest/node-types` to `/types/nodes.json`, optimized batch fetching

## Commits

| Hash    | Type | Description                                                    |
|---------|------|----------------------------------------------------------------|
| 40bee4b | feat | Implement session-based authentication for n8n API             |
| 12ed0ae | fix  | Use correct field name emailOrLdapLoginId for n8n login        |
| d01c98e | fix  | Use /types/nodes.json endpoint for schema extraction           |

---

**Status:** Complete. Phase 01 Foundation verified and ready for Phase 02.
