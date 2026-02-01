# Roadmap: n8n TypeScript Workflow SDK

## Milestones

- v1.0 MVP - Phases 1-5 (shipped 2026-01-31)
- v1.1 Full Automation + Documentation - Phases 5.1-8 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) - SHIPPED 2026-01-31</summary>

Phase 1: Project Foundation - TypeScript project with build, test, and CLI scaffolding
Phase 2: Schema Extraction - Pull and cache n8n node definitions via REST API
Phase 3: Type Generation - Transform schemas into discriminated union TypeScript interfaces
Phase 4: Builder and Compiler - Fluent API that compiles workflow code to valid n8n JSON
Phase 5: Integration Testing - Snapshot tests and n8n API import verification

5 phases, 12 plans, 61 tests, 5,047 LOC shipped.
Post-v1.0: All 797 node schemas extracted and typed (64,512 lines).

</details>

### v1.1 Documentation (In Progress)

**Milestone Goal:** Full typed coverage of all 792 nodes, complex workflow support (credentials, merges, error paths), and comprehensive documentation.

- [x] **Phase 5.1: Deployable Package** - Build and deploy workflows through tool calls, no manual steps (COMPLETE)
- [x] **Phase 5.2: Complex Workflow Builder** - typeVersion fix, credential support, merge input indices, error-handling paths, validation (COMPLETE)
- [ ] **Phase 5.3: Automated Workflow Testing** - Execute deployed workflows, verify with test data, self-diagnose and fix failures
- [ ] **Phase 5.4: Generate Typed Node APIs** - Split typed-api.ts, auto-generate factories for all 792 nodes, discovery catalog, SKILL.md update
- [ ] **Phase 6: Foundation Docs** - Human-facing docs (README, installation guide); rescope after 5.2-5.4 ship
- [ ] **Phase 7: API and Tutorials** - Full API reference and step-by-step guides; rescope after 5.2-5.4 ship
- [ ] **Phase 8: Examples and Reference** - Complete examples, troubleshooting, and node reference; rescope after 5.2-5.4 ship

## Phase Details

### Phase 5.1: Deployable Package (INSERTED)
**Goal**: User describes a workflow, Claude builds and deploys it to n8n through tool calls — no manual steps, no CLI commands, full automation
**Depends on**: Phase 5 (v1.0 shipped)
**Requirements**: TBD (to be defined during planning)
**Success Criteria** (what must be TRUE):
  1. A workflow can be built and deployed to n8n entirely through tool calls — no manual `npm run` or file copy steps
  2. User describes what they want, Claude generates the workflow code, compiles it, and deploys it to n8n in one flow
  3. The deployed workflow is functional in n8n on the first try
**Plans**: 1 plan

Plans:
- [x] 05.1-01-PLAN.md — Deploy command: compile + import to n8n in one step

### Phase 5.2: Complex Workflow Builder
**Goal**: The builder and compiler support the patterns needed for real-world complex workflows — correct typeVersions, credentials, fan-in merges, and error handling
**Depends on**: Phase 5.1 (Deployable Package)
**Requirements**: TBD (to be defined during planning)
**Prerequisites** (research before planning):
  - **Credential API research**: Call `GET /api/v1/credentials` on live n8n to understand response shape, how credentials map to node types, and whether credential IDs are stable across restarts. Design the credential attachment API based on actual data, not assumptions.
**Known risks**:
  - Changing typeVersion will break existing snapshot tests (compiled JSON changes). Plan to regenerate snapshots as part of the typeVersion work, not as a surprise.
  - The 5 hand-written typed factories in `typed-api.ts` may need rework — e.g., Slack factory auto-injects `resource`/`operation` in a pattern that might not survive the compiler changes. Test existing factories against each compiler change.
**Success Criteria** (what must be TRUE):
  1. **typeVersion from schemas**: Compiler reads typeVersion from node schemas instead of hardcoding `1` — fixes silent correctness bug for IF v2, Set v3, etc.
  2. **Credentials**: Nodes can reference existing n8n credentials by name/ID; compiled JSON includes the `credentials` field; deployed workflows arrive with credentials pre-attached
  3. **Merge input index**: `connect(from, to, outputIndex, inputIndex)` supports specifying target input index; compiler emits correct `index` values; Merge node pattern works (2+ sources into different inputs)
  4. **Error-handling paths**: `connect()` supports an `onError` connection type; compiler emits error connections separately from main connections; error handler nodes receive failed items
  5. **Topology-aware layout**: Nodes are positioned based on graph structure (trigger left, branches fan out, merges converge) instead of naive grid
  6. **Richer validation**: Validates at least: trigger exists, no orphan nodes, output index valid for node type, referenced credentials exist (warning), expression `ref()` targets exist in workflow
  7. All new patterns have snapshot tests and integration tests against live n8n
  8. Existing 5 typed node tests still pass (no regressions)
**Plans**: 4 plans

Plans:
- [x] 05.2-01-PLAN.md — typeVersion from schemas, inputIndex, error connections (wave 1)
- [x] 05.2-02-PLAN.md — Credential API research + credential support (wave 2)
- [x] 05.2-03-PLAN.md — Topology layout + comprehensive validation (wave 3)
- [x] 05.2-04-PLAN.md — Snapshot regeneration, new tests, integration tests, regression checks (wave 4)

### Phase 5.3: Automated Workflow Testing
**Goal**: Claude can deploy a workflow, execute it with test data, read the results, and fix failures — a complete build-deploy-test-fix loop
**Depends on**: Phase 5.2 (correct builder needed before execution testing makes sense)
**Requirements**: TBD (to be defined during planning)
**Prerequisites** (research before planning):
  - **n8n execution API verification**: Confirm these endpoints exist and work in the running n8n version: `POST /api/v1/executions` (or equivalent manual trigger), `GET /api/v1/executions/{id}` (status + output), `POST /webhook-test/{path}` (test webhook). If any are missing or behave differently, adjust scope before planning.
**Success Criteria** (what must be TRUE):
  1. **Execution API**: SDK can trigger workflow execution via n8n API — both manual trigger and webhook trigger (`POST /webhook-test/{path}` with payload)
  2. **Result polling**: SDK can poll execution status (running/success/error) and retrieve output data and error messages
  3. **Test scenarios**: A workflow can define test cases — input payloads paired with expected outcomes (node execution order, output shape, specific values)
  4. **Assertion framework**: `testWorkflow(builder, scenarios)` deploys, executes each scenario, and reports pass/fail with detailed diffs on failure
  5. **Feedback loop**: On test failure, the execution error and actual output are returned in a format Claude can read, diagnose, and use to fix the workflow code
  6. **Cleanup**: Test workflows are automatically deleted after testing (no leftover workflows in n8n)
  7. At least 3 different workflow patterns are tested end-to-end: linear (webhook → transform → output), branching (IF with both paths verified), and error handling
**Plans**: 3 plans

Plans:
- [ ] 05.3-01-PLAN.md — Research n8n execution API + build executor module (types, execute, poll, cleanup)
- [ ] 05.3-02-PLAN.md — Test harness (testWorkflow) + assertion framework with scenario-based testing
- [ ] 05.3-03-PLAN.md — End-to-end integration tests for 3 workflow patterns + SDK exports

### Phase 5.4: Generate Typed Node APIs
**Goal**: Every n8n node has a typed factory function that Claude can discover and use without reading massive generated files
**Depends on**: Phase 5.3 (execution testing available to verify generated factories)
**Requirements**: TBD (to be defined during planning)
**Success Criteria** (what must be TRUE):
  1. `typed-api.ts` is split into per-node (or per-category) modules — no single file > 500 lines
  2. A code generator reads schemas and auto-generates factory functions for all 792 nodes (no more hand-writing)
  3. A compact discovery catalog (`generated/node-catalog.json` or similar) lists every node with: name, type string, category, available resources/operations, and required params — small enough for Claude to read in one shot
  4. `createTypedNodes()` returns factories for all 792 nodes, organized by category (e.g., `nodes.communication.slack.message.post()`)
  5. All generated factories compile without errors and produce valid n8n JSON
  6. SKILL.md is updated with accurate capabilities, catalog reference, and credential usage — not deferred to Phase 6
**Plans**: 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 5.4 to break down)

### Phase 6: Foundation Docs
**Goal**: A new user (human or Claude) can understand what the SDK does and get it running
**Depends on**: Phase 5.4 (SKILL.md already updated in 5.4; these are the remaining human-facing docs)
**Requirements**: SKILL-01, DOCS-01, DOCS-02
**NOTE**: Success criteria below were written when the SDK had 5 typed nodes and no credentials. **Rescope after Phases 5.2-5.4 ship** — the SDK surface area will be dramatically larger (792 typed nodes, credentials, merge patterns, execution testing). The quick start example, installation steps, and scope of docs/README.md will all need to reflect the new capabilities.
**Success Criteria** (what must be TRUE):
  1. Claude can read SKILL.md and generate a valid workflow without any other context
  2. A developer reading docs/README.md understands the SDK purpose, sees a quick start example, and knows where to find every other doc
  3. A developer following docs/INSTALLATION.md can go from zero to a working `npm run build-workflow -- <file>` that produces valid n8n JSON
**Plans**: 1 plan

Plans:
- [ ] 06-01-PLAN.md — Validate, consolidate, and polish SKILL.md, docs/README.md, docs/INSTALLATION.md; remove duplicate docs/SKILL.md

### Phase 7: API and Tutorials
**Goal**: A developer can look up any SDK function and follow guided tutorials for common workflow patterns
**Depends on**: Phase 6 (README links to these docs)
**Requirements**: DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08
**NOTE**: **Rescope after Phases 5.2-5.4 ship.** The public API will have new functions (credential attachment, execution testing, connect with inputIndex). Guide topics should include credential setup, merge patterns, and the test-fix loop — not just the original 5 patterns. The function list in criterion 1 is outdated.
**Success Criteria** (what must be TRUE):
  1. docs/API.md documents every public function (workflow, createTypedNodes, trigger, node, connect, ref, expr, compileWorkflow, validateWorkflow, **plus new functions from 5.2-5.4**) with description, typed parameters, return value, and example
  2. A developer can follow Guide 1 (Webhook to Slack) from empty file to n8n import without consulting any other resource
  3. Guides 2-5 each demonstrate a distinct pattern (IF branching, Set transforms, HTTP requests, AI nodes) with compilable code
  4. All code examples in API.md and GUIDES.md compile without errors when copy-pasted
**Plans**: TBD

Plans:
- [ ] 07-01: API reference
- [ ] 07-02: Tutorial guides

### Phase 8: Examples and Reference
**Goal**: A developer has copy-paste recipes for real workflows and can self-diagnose problems
**Depends on**: Phase 7 (examples build on API and guide knowledge)
**Requirements**: DOCS-09, DOCS-10, DOCS-11
**NOTE**: **Rescope after Phases 5.2-5.4 ship.** Examples should demonstrate credentials, merge patterns, error handling, and the test loop — not just simple linear workflows. 6 examples may be too few given 792 typed nodes. Troubleshooting must cover new failure modes (credential mismatches, execution errors, typeVersion issues).
**Success Criteria** (what must be TRUE):
  1. docs/EXAMPLES.md contains 6 complete workflows with use case description, full TypeScript code, compile/deploy instructions, and expected behavior
  2. docs/TROUBLESHOOTING.md covers every common failure mode (TypeScript errors, compilation errors, n8n import failures, expression syntax, credentials, connections) with symptoms and fixes
  3. docs/NODES.md explains how to browse available nodes, read generated interfaces, distinguish required vs optional parameters, use ResourceLocator, and find operation-specific parameters
  4. All 6 example workflows in EXAMPLES.md compile to valid n8n JSON without modification
**Plans**: TBD

Plans:
- [ ] 08-01: Examples collection
- [ ] 08-02: Troubleshooting and node reference

## Progress

**Execution Order:** Phase 5.1 -> 5.2 -> 5.3 -> 5.4 -> 6 -> 7 -> 8

Rationale: Correctness-first ordering. Fix the builder (5.2) so it produces correct output, then add execution testing (5.3) to verify workflows actually work, then generate 792 typed factories (5.4) knowing they can be verified. SKILL.md updated in 5.4 before docs phases. Doc phases (6-8) to be rescoped after 5.2-5.4 ship.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 5.1 Deployable Package | v1.1 | 1/1 | Complete | 2026-01-31 |
| 5.2 Complex Workflow Builder | v1.1 | 4/4 | Complete | 2026-01-31 |
| 5.3 Automated Workflow Testing | v1.1 | 0/3 | Planned | - |
| 5.4 Generate Typed Node APIs | v1.1 | 0/0 | Not started | - |
| 6. Foundation Docs | v1.1 | 0/1 | Not started | - |
| 7. API and Tutorials | v1.1 | 0/2 | Not started | - |
| 8. Examples and Reference | v1.1 | 0/2 | Not started | - |
