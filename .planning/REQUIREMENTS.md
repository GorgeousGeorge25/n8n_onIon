# Requirements: n8n TypeScript Workflow SDK

**Defined:** 2026-01-31
**Core Value:** Compiled workflows import and execute correctly in n8n on the first try — targeting 99% success rate

## v1.1 Requirements

Requirements for documentation milestone. Each maps to roadmap phases.

### Claude Skill File

- [ ] **SKILL-01**: SKILL.md at project root with frontmatter, full API reference, expression system docs, 5 workflow patterns, CLI commands, compiled output format, error handling, and Claude-specific tips

### User Documentation: Overview

- [ ] **DOCS-01**: docs/README.md with SDK description, problem statement, quick start guide, and navigation links to all other docs

### User Documentation: Installation

- [ ] **DOCS-02**: docs/INSTALLATION.md with prerequisites (Node.js 18+, n8n instance), npm install, .env setup (N8N_API_URL, N8N_EMAIL, N8N_PASSWORD), schema extraction, type generation, and verification steps

### User Documentation: API Reference

- [ ] **DOCS-03**: docs/API.md documenting every public function with description, typed parameters, return value, and example usage (workflow, createTypedNodes, trigger, node, connect, ref, expr, compileWorkflow, validateWorkflow)

### User Documentation: Tutorials

- [ ] **DOCS-04**: docs/GUIDES.md Guide 1 — Your First Workflow: Webhook to Slack notification, complete walkthrough from empty file to n8n import
- [ ] **DOCS-05**: docs/GUIDES.md Guide 2 — Conditional Logic: IF node branching with true/false output paths
- [ ] **DOCS-06**: docs/GUIDES.md Guide 3 — Data Transformation: Set node field manipulation with expression system
- [ ] **DOCS-07**: docs/GUIDES.md Guide 4 — API Integration: HTTP Request node with headers, auth, and body configuration
- [ ] **DOCS-08**: docs/GUIDES.md Guide 5 — AI Workflows: OpenAI/Anthropic nodes for processing AI responses

### User Documentation: Examples

- [ ] **DOCS-09**: docs/EXAMPLES.md with 6 complete, copy-paste workflow examples including use case, full TypeScript code, compile/deploy instructions, and expected behavior

### User Documentation: Troubleshooting

- [ ] **DOCS-10**: docs/TROUBLESHOOTING.md covering TypeScript errors, compilation errors, n8n import failures, expression syntax issues, credential problems, and connection errors

### User Documentation: Nodes

- [ ] **DOCS-11**: docs/NODES.md explaining how to browse available nodes, understand generated interfaces, required vs optional parameters, ResourceLocator pattern, and operation-specific parameters

## v2 Requirements

Deferred to future release.

- **V2-01**: Builder/compiler support for all 797 node types
- **V2-02**: Built-in expression functions (Math, Date, etc.)
- **V2-03**: npm package publishing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video tutorials | Text docs sufficient for v1.1 |
| Interactive API playground | Over-engineering for current audience |
| Auto-generated API docs from JSDoc | Manual docs provide better narrative flow |
| Changelog/release notes | No releases yet — local project |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SKILL-01 | Phase 6 | Pending |
| DOCS-01 | Phase 6 | Pending |
| DOCS-02 | Phase 6 | Pending |
| DOCS-03 | Phase 7 | Pending |
| DOCS-04 | Phase 7 | Pending |
| DOCS-05 | Phase 7 | Pending |
| DOCS-06 | Phase 7 | Pending |
| DOCS-07 | Phase 7 | Pending |
| DOCS-08 | Phase 7 | Pending |
| DOCS-09 | Phase 8 | Pending |
| DOCS-10 | Phase 8 | Pending |
| DOCS-11 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
