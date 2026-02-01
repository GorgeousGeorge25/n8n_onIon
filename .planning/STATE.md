# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Compiled workflows import and execute correctly in n8n on the first try — targeting 99% success rate

**Current focus:** v1.1 — Phase 5.3 (Automated Workflow Testing)

## Current Position

Phase: 5.3 of 8 (Automated Workflow Testing — IN PROGRESS)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-01 — Completed 05.3-02-PLAN.md

Progress: v1.0 shipped (5 phases, 12 plans, 61 tests)
v1.1: [████████░░] 80% (7/8 plans)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 12
- Average duration: 2.5 minutes
- Total execution time: 0.50 hours

**v1.1 Velocity:**
- Plans completed: 10
- Average duration: 3.8 minutes
- Phase 5.2 total: 17 minutes (4 plans)
- Phase 5.3 total: 8 minutes (2 plans so far)

## Accumulated Context

### Decisions

All v1.0 decisions logged in PROJECT.md Key Decisions table with outcomes.

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 5.1 | Reuse integration test API pattern for deployer | Proven pattern, strips active field, uses X-N8N-API-KEY header |
| 5.1 | Env var fallback chain for deploy config | Flexibility: programmatic options > env vars > defaults |
| 5.1 | Separate POST + PATCH for activation | n8n API requires separate call to activate after create |
| 05.2-01 | Fall back to typeVersion 1 if schema not found | Graceful degradation prevents compilation failures if schema cache incomplete |
| 05.2-01 | Cache schema registry on module load | Performance optimization: expensive JSON parsing happens once per process lifetime |
| 05.2-01 | Make compiler async | Breaking change necessary to load schema registry; minimal impact as deployer already async |
| 05.2-02 | Research live n8n API before implementing credentials | Verified actual credential structure from running instance rather than assumptions |
| 05.2-02 | Credentials optional (4th parameter) | Backward compatibility - existing code unchanged, new code can add credentials |
| 05.2-02 | Compiler passes credentials through unmodified | No transformation needed - direct flow from WorkflowNode to N8nNode |
| 05.2-03 | BFS-based topology layout | Triggers at left, downstream flows right, branches fan vertically - visual clarity for complex workflows |
| 05.2-03 | Validation returns ValidationResult not throw | Collect-all pattern reports all errors/warnings at once instead of failing on first issue |
| 05.2-03 | Credentials generate warnings not errors | Credential IDs are external - deployment handles missing credentials, compilation can't verify |
| 05.2-03 | Expression ref validation via JSON.stringify | Simple regex on stringified params extracts $node["Name"] references without tree traversal |
| 05.2-04 | Regenerate snapshots completely instead of selective updates | Deleted entire snapshot file before regeneration - ensures clean state and no stale entries |
| 05.2-04 | Test credentials with validation warnings, not actual credentials | Credentials are external - can't reliably test without n8n setup |
| 05.2-04 | Verify backward compatibility with unchanged typed-api tests | Zero regressions = Phase 5.2 changes are additive, not breaking |
| 05.3-01 | Webhook-based execution instead of Manual Trigger | n8n public API v1 does not support Manual Trigger execution - webhooks are only viable option |
| 05.3-01 | Use ?includeData=true for full execution results | Default GET /api/v1/executions/{id} omits node output data |
| 05.3-01 | extractNodeData() helper for test assertions | Flatten complex nested n8n execution data to simple {nodeName, data[]} format |
| 05.3-02 | 2-second delay after activation for webhook registration | n8n needs time to load and register webhooks after activation to avoid 404 errors |
| 05.3-02 | Extract webhook path from builder or accept explicit option | Flexibility for different test scenarios - auto-extraction for standard workflows, explicit for advanced cases |
| 05.3-02 | Deep comparison using JSON.stringify for object assertions | Simple, reliable comparison for complex objects without deep-equality library dependency |
| 05.3-02 | Always cleanup workflow even on test failure | Prevents n8n instance clutter with test workflows using try/finally pattern |
| 05.3-02 | Return detailed failures with type/message/expected/actual | Enables Claude to diagnose and fix failures with actual output data for debugging |

### Pending Todos

1. ~~**Make SDK a deployable/installable package**~~ → Completed in Phase 5.1

### Roadmap Evolution

- Phase 5.1 inserted after Phase 5: Deployable Package — COMPLETED
- Phase 5.2: Complex Workflow Builder — typeVersion fix, credentials, merge input indices, error-handling paths, topology-aware layout, richer validation
- Phase 5.3: Automated Workflow Testing — execute via API, test with sample data, poll results, feedback loop for self-diagnosis and fix
- Phase 5.4: Generate Typed Node APIs — split typed-api.ts, auto-generate factories for all 792 nodes, discovery catalog, SKILL.md update
- Phases renumbered to match execution order (was 5.3→5.4→5.2, now 5.2→5.3→5.4). Rationale: correctness-first — fix builder, add testing, then generate at scale.
- Doc phases (6-8) marked for rescoping after 5.2-5.4 ship

### Blockers/Concerns

- ~~Phase 05.2-02: Research n8n credential API~~ → Completed
- ~~Phase 05.2-04: Snapshot regeneration~~ → Completed
- ~~Phase 5.3 prerequisite: Verify n8n execution API endpoints~~ → Completed in 05.3-01
- ~~Phase 5.3-02: Webhook registration may require delay after activation (1-2s) for reliable execution~~ → Addressed in 05.3-02 (2s delay implemented)
- Doc phases (6-8) success criteria are outdated — written for 5-node SDK, need update after 792-node SDK ships

### Observations from Phase 5.3-02 Execution

1. **testWorkflow() provides complete testing feedback loop** — Single function call deploys, executes, asserts, and cleans up. Returns detailed pass/fail results with diagnostic information.
2. **2-second webhook registration delay is critical** — Without delay, webhooks return 404. n8n needs time to load workflow after activation.
3. **Nested field assertions via dot notation** — getNestedField() helper enables assertions like 'user.id' without complex traversal code.
4. **Test cleanup always runs** — try/finally pattern guarantees workflow deletion even on test failure, preventing n8n clutter.
5. **Detailed failure types enable diagnostics** — status, missing_node, output_mismatch, execution_error, timeout types help Claude understand what went wrong.

### Observations from Phase 5.3-01 Execution

1. **n8n public API v1 does NOT support Manual Trigger execution** — Verified via research. POST /api/v1/workflows/{id}/execute returns 405. POST /api/v1/executions returns 405. Only webhook-based execution works via public API.
2. **GET /api/v1/executions/{id}?includeData=true** — Verified working. Returns full execution data with per-node outputs. Without parameter, response omits node data.
3. **Webhook registration requires activation** — Webhooks must be activated AND registered (n8n loads workflow). May need 1-2s delay after activation before triggering.
4. **Test workflows must use Webhook triggers** — Manual Trigger not viable for automated testing via public API. All test scenarios should use Webhook nodes.
5. **extractNodeData() simplifies assertions** — Helper flattens complex n8n execution structure to {nodeName, data[]} format for easier test assertions.

### Observations from Phase 5.2 Execution

1. **compileWorkflow is now async** — any new code (test harness, utilities) calling compileWorkflow must await it. The deploy flow already handles this.
2. **Credential availability for test workflows** — at least one credential exists (Telegram). Test scenarios using only built-in nodes (Webhook, Set, IF, Merge) are safer for automated testing than those requiring external credentials.
3. **Test suite is 80 tests with 7 hitting live n8n** — Phase 5.3 will add more integration tests. Consider separating unit vs integration test runs if suite gets slow.
4. **Untracked files in working directory** — `test-workflows/`, `docs/`, `SKILL.md`, `generated/nodes.ts` are sitting uncommitted. Won't interfere but create noise in git status. Commit or gitignore before next phase.

## Session Continuity

Last session: 2026-02-01T02:39:07Z
Stopped at: Completed 05.3-02-PLAN.md (Test Harness)
Resume with: Phase 5.3-03 (Feedback Loop)
