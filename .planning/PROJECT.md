# n8n TypeScript Workflow SDK

## What This Is

A TypeScript SDK that lets Claude (and eventually human developers) write typed code that compiles to valid n8n workflow JSON. Instead of hand-crafting error-prone JSON with string references and conditional properties, you write `nodes.slack.message.post({ text: expr.template\`Hello ${webhook.out.body.name}\` })` and get correct, importable n8n workflow JSON out.

## Core Value

Compiled workflows import and execute correctly in n8n on the first try — targeting 99% success rate by making invalid workflows unrepresentable in the type system.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Schema extractor pulls node definitions from local n8n instance via REST API
- [ ] Schema cache stores extracted node definitions as local JSON
- [ ] Type generator transforms n8n schemas into TypeScript interfaces with conditional property dependencies
- [ ] Expression builder provides type-safe node output references that compile to n8n expression syntax
- [ ] Workflow builder API: `workflow()`, `wf.trigger()`, `wf.node()`, `wf.connect()`
- [ ] Compiler produces structurally valid n8n JSON (correct typeVersion, connections, UUIDs, positions)
- [ ] displayOptions conditional dependencies reflected in generated types (discriminated unions for resource/operation branching)
- [ ] ResourceLocator type handles mode/value pairs and shorthand
- [ ] CLI commands: `extract`, `generate`, `build`, `validate`
- [ ] v1 node coverage: Webhook, HTTP Request, Slack, IF, Set
- [ ] Snapshot tests compare compiled output against known-good n8n JSON
- [ ] Integration tests import compiled workflows into n8n via API

### Out of Scope

- Full node coverage beyond 5 initial nodes — future milestone after architecture is proven
- Human developer DX polish (docs, detailed error messages, README) — Claude-first, DX later
- npm publishing — local project first, packaging in future milestone
- Credential management — SDK references credential types but doesn't store/manage secrets
- Workflow execution monitoring — SDK compiles, doesn't run
- GUI or visual workflow builder — this is code-to-JSON only

## Context

- n8n instance running locally at http://localhost:5678 (Docker, version 2.33.1) with API key access
- n8n-mcp tools available for development exploration (`get_node(nodeType, detail='full')` returns full property schemas)
- n8n node schemas use `displayOptions.show` for conditional property visibility — this is the core type generation challenge
- Properties are operation-dependent: Slack `message.post` vs `channel.create` have entirely different required fields
- Expression syntax (`={{ $node['Name'].json.field }}`) is the #1 source of runtime errors in hand-crafted JSON
- `typeVersion` varies by node and affects available properties
- Connections use string node name references — typos cause silent failures
- Primary consumer is Claude generating workflow code — API should minimize ambiguity and maximize pattern clarity

## Constraints

- **Runtime**: Node.js 18+, ESM modules
- **Data source**: Schema extraction via n8n REST API (`/api/v1/node-types`) and MCP tools for development
- **Type strategy**: Discriminated unions for resource/operation branching at the type level, best approach for conditional dependencies determined during implementation
- **Testing**: Both snapshot tests (fast iteration) and n8n API import tests (confidence)
- **Node scope**: 5 nodes for v1 (Webhook, HTTP Request, Slack, IF, Set), expand after architecture proven

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Discriminated unions for type branching | Best fit chosen during implementation for displayOptions conditionals — strongest compile-time guarantees | — Pending |
| REST API + MCP hybrid for schema access | MCP for dev exploration, REST API in the CLI tool — keeps SDK standalone | — Pending |
| 5-node v1 scope | Prove the architecture before scaling to full coverage | — Pending |
| Claude-first API design | Optimize for AI code generation patterns — clear, unambiguous, minimal variation | — Pending |
| Local project, package later | Skip npm overhead until the SDK works correctly | — Pending |

---
*Last updated: 2026-01-31 after initialization*
