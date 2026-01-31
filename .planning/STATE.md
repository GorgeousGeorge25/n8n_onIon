# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Compiled workflows import and execute correctly in n8n on the first try — targeting 99% success rate

**Current focus:** v1.1 — Phase 5.2 (Complex Workflow Builder)

## Current Position

Phase: 5.2 of 8 (Complex Workflow Builder — COMPLETE)
Plan: 4 of 4 in current phase
Status: Phase complete
Last activity: 2026-01-31 — Completed 05.2-04-PLAN.md

Progress: v1.0 shipped (5 phases, 12 plans, 61 tests)
v1.1: [██████████] 100% (8/8 plans) — Phase 5.2 COMPLETE

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 12
- Average duration: 2.5 minutes
- Total execution time: 0.50 hours

**v1.1 Velocity:**
- Plans completed: 8
- Average duration: 3.9 minutes
- Phase 5.2 total: 17 minutes (4 plans)

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

- ~~Phase 05.2-02: Research n8n credential API (`GET /api/v1/credentials`) before planning~~ → Completed - credential structure verified from live workflows
- ~~Phase 05.2-04: Snapshot tests will fail due to typeVersion change (expected, regeneration needed)~~ → Completed - all snapshots regenerated successfully
- Phase 5.3 prerequisite: Verify n8n execution API endpoints exist in running n8n version before planning
- Doc phases (6-8) success criteria are outdated — written for 5-node SDK, need update after 792-node SDK ships

## Session Continuity

Last session: 2026-01-31T21:28:41Z
Stopped at: Completed 05.2-04-PLAN.md (Phase 5.2 complete)
Resume with: Phase 5.3 (Automated Workflow Testing) or Phase 5.4 (Generate Typed Node APIs)
