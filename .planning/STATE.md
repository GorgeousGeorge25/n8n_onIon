# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Compiled workflows import and execute correctly in n8n on the first try — targeting 99% success rate

**Current focus:** v1.1 — Phase 5.4 (Generate Typed Node APIs)

## Current Position

Phase: 5.4 of 8 (Generate Typed Node APIs)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-01 — Completed 05.4-02-PLAN.md

Progress: v1.0 shipped (5 phases, 12 plans, 61 tests)
v1.1: [█████████░] 95% (10/8 plans)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 12
- Average duration: 2.5 minutes
- Total execution time: 0.50 hours

**v1.1 Velocity:**
- Plans completed: 13
- Average duration: 3.5 minutes
- Phase 5.2 total: 17 minutes (4 plans)
- Phase 5.3 total: 12 minutes (3 plans) — COMPLETE
- Phase 5.4 progress: 10 minutes (2 plans)

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
| 05.3-03 | it.skipIf() pattern for n8n availability | Prevents test failures when n8n offline, cleaner than early return |
| 05.3-03 | Unique webhook paths per test | Prevents conflicts between parallel test runs using Date.now() timestamp |
| 05.3-03 | Set v3.4 assignments format | mode: manual, assignments array with id/name/value/type structure replaces legacy values.string format |
| 05.4-01 | Separate catalog generation from factory modules | Catalog is for Claude discovery (<400KB JSON), factories are for typed usage |
| 05.4-01 | Category-based file splitting | Split by package/group (triggers, transform, input, output, langchain) keeps files under 500 lines |
| 05.4-01 | Types file size exception | Allow types.ts (18,417 lines) to exceed limit - it's interface definition, not implementation |
| 05.4-01 | Keep full operation details in catalog | 384KB catalog worth extra 184KB for complete node metadata discovery |
| 05.4-01 | Flat factory namespace | createTypedNodes() returns flat object (nodes.slack vs nodes.output.slack) for simpler usage |
| 05.4-02 | Thin wrapper re-export pattern for generated code | src/codegen/typed-api.ts delegates to generated/factories/index.ts for backward compatibility |
| 05.4-02 | TypedNodes explicit return type annotation | Fixes TypeScript serialization limit error for large return types |
| 05.4-02 | Accept 7158 factory count vs 797 nodes | Multiple access patterns per node (flat, Tool suffix, nested) provide flexibility |

### Pending Todos

1. ~~**Make SDK a deployable/installable package**~~ → Completed in Phase 5.1
2. **Replace 2s webhook sleep with polling** — Current `setTimeout(2000)` after activation is fragile (slow machines fail, fast machines waste time). Replace with poll loop: check webhook registration via `GET /api/v1/workflows/{id}` or retry webhook trigger with backoff. Low priority — works now, fix if flaky.
3. **Separate unit and integration test runs** — 85 tests, 12 hit live n8n. Add `vitest` workspace or tag-based filtering so CI runs unit tests only, local dev can opt into integration. Low priority — suite is still fast.
4. **Commit untracked files or gitignore** — `test-workflows/`, `docs/`, `SKILL.md`, `generated/nodes.ts` sitting uncommitted since v1.0. Creates git status noise. Decide: commit or `.gitignore`.

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

### Observations from Phase 5.3 Execution

1. **testWorkflow() provides complete testing feedback loop** — Single function call deploys, executes, asserts, and cleans up. Returns detailed pass/fail results with diagnostic information.
2. **2-second webhook registration delay is critical** — Without delay, webhooks return 404. n8n needs time to load workflow after activation.
3. **Nested field assertions via dot notation** — getNestedField() helper enables assertions like 'user.id' without complex traversal code.
4. **Test cleanup always runs** — try/finally pattern guarantees workflow deletion even on test failure, preventing n8n clutter.
5. **Detailed failure types enable diagnostics** — status, missing_node, output_mismatch, execution_error, timeout types help Claude understand what went wrong.
6. **it.skipIf() vs early return** — Early return in tests causes vitest to run assertions after return, leading to failures. it.skipIf() properly skips entire test.
7. **Set node schema evolution** — Set v3.4 format significantly different from v1.0: assignments.assignments array structure, explicit type field, UUID id per assignment.
8. **Test suite now 85 tests** — 80 existing + 5 new executor integration tests. All pass, executor tests skip gracefully when n8n unavailable.

### Observations from Phase 5.2 Execution

1. **compileWorkflow is now async** — any new code (test harness, utilities) calling compileWorkflow must await it. The deploy flow already handles this.
2. **Credential availability for test workflows** — at least one credential exists (Telegram). Test scenarios using only built-in nodes (Webhook, Set, IF, Merge) are safer for automated testing than those requiring external credentials.
3. **Test suite is 80 tests with 7 hitting live n8n** — Phase 5.3 will add more integration tests. Consider separating unit vs integration test runs if suite gets slow.
4. **Untracked files in working directory** — `test-workflows/`, `docs/`, `SKILL.md`, `generated/nodes.ts` are sitting uncommitted. Won't interfere but create noise in git status. Commit or gitignore before next phase.

### Observations from Phase 5.4-01 Execution

1. **Category-based splitting works well** — Transform category required 52 split files due to heavy resource/operation pattern usage. Automatic alphabetical splitting keeps all files manageable.
2. **Catalog is self-documenting** — 384KB JSON with full metadata (type, credentials, operations) enables Claude to discover any node without reading factory code.
3. **Type imports are extensive** — Some factory files import 100+ discriminated union types. TypeScript handles this efficiently.
4. **Factory code is remarkably compact** — Average 7 lines per resource/operation function. Systematic pattern reduces 797 nodes to <500 lines per file.
5. **Generated code compiles cleanly** — All 129 files compile without errors, integrate correctly with generated/nodes.ts types.
6. **Transform nodes dominate** — Required most splits (52 files). Reflects n8n's focus on data transformation operations.
7. **Langchain nodes are simpler** — Only 3 split files needed. Most use simple configuration vs resource/operation pattern.

### Observations from Phase 5.4-02 Execution

1. **Thin wrapper re-export pattern works perfectly** — src/codegen/typed-api.ts reduced from 181 lines to 13 lines by delegating to generated/factories/index.ts. Perfect backward compatibility.
2. **TypeScript serialization limits are real** — Large return types (7158 factory functions) exceed compiler's serialization limit. Explicit TypedNodes return type annotation required.
3. **Factory count != node count** — 797 unique n8n nodes generate 7158 factory functions due to multiple access patterns (flat, Tool suffix, nested resource.operation). This is correct, not a bug.
4. **Test walker validates structure** — Recursive object walker with deduplication validates all 7158 factory functions produce valid WorkflowNodes with name, type, parameters.
5. **Zero test regressions** — All existing typed-api tests pass without modification, proving perfect backward compatibility after re-export pattern.
6. **Generated files stay gitignored** — generated/factories/ directory gitignored as intended. Only source files (typed-api.ts, tests) committed.
7. **Test suite now 85 tests** — Added comprehensive factory validation, all pass. Full suite runs in <800ms.

## Session Continuity

Last session: 2026-02-01T13:31:49Z
Stopped at: Completed 05.4-02-PLAN.md (Wire Generated Factories to Public API)
Resume with: Phase 5.4 plan 03 (Update SKILL.md Documentation)
