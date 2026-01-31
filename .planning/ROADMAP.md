# Roadmap: n8n TypeScript Workflow SDK

## Milestones

- v1.0 MVP - Phases 1-5 (shipped 2026-01-31)
- v1.1 Documentation - Phases 6-8 (in progress)

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

**Milestone Goal:** Comprehensive documentation so the SDK is usable by both Claude (SKILL.md) and human developers (docs/) without reading source code.

- [x] **Phase 5.1: Deployable Package** - Build and deploy workflows through tool calls, no manual steps (COMPLETE)
- [ ] **Phase 6: Foundation Docs** - Skill file, overview, and installation guide
- [ ] **Phase 7: API and Tutorials** - Full API reference and 5 step-by-step guides
- [ ] **Phase 8: Examples and Reference** - Complete examples, troubleshooting, and node reference

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

### Phase 6: Foundation Docs
**Goal**: A new user (human or Claude) can understand what the SDK does and get it running
**Depends on**: v1.0 shipped
**Requirements**: SKILL-01, DOCS-01, DOCS-02
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
**Success Criteria** (what must be TRUE):
  1. docs/API.md documents every public function (workflow, createTypedNodes, trigger, node, connect, ref, expr, compileWorkflow, validateWorkflow) with description, typed parameters, return value, and example
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

**Execution Order:** Phase 5.1 -> Phase 6 -> Phase 7 -> Phase 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 5.1 Deployable Package | v1.1 | 1/1 | Complete | 2026-01-31 |
| 6. Foundation Docs | v1.1 | 0/1 | Not started | - |
| 7. API and Tutorials | v1.1 | 0/2 | Not started | - |
| 8. Examples and Reference | v1.1 | 0/2 | Not started | - |
