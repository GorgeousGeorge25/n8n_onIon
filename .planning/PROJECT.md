# n8n TypeScript Workflow SDK

## What This Is

A TypeScript SDK that compiles type-safe workflow code to valid n8n JSON. Provides schema extraction from n8n instances, discriminated union type generation for node parameters, a fluent builder API with expression references, and a compiler that produces importable n8n workflows. Includes a typed node API (`nodes.slack.message.post(params)`) for compile-time parameter checking.

## Core Value

Compiled workflows import and execute correctly in n8n on the first try — targeting 99% success rate by making invalid workflows unrepresentable in the type system.

## Requirements

### Validated

- Schema extractor pulls node definitions from local n8n instance via REST API — v1.0
- Schema cache stores extracted node definitions as local JSON — v1.0
- Type generator transforms n8n schemas into TypeScript interfaces with conditional property dependencies — v1.0
- Expression builder provides type-safe node output references that compile to n8n expression syntax — v1.0
- Workflow builder API: `workflow()`, `wf.trigger()`, `wf.node()`, `wf.connect()` — v1.0
- Compiler produces structurally valid n8n JSON (correct typeVersion, connections, UUIDs, positions) — v1.0
- displayOptions conditional dependencies reflected in generated types (discriminated unions for resource/operation branching) — v1.0
- ResourceLocator type handles mode/value pairs and shorthand — v1.0
- CLI commands: `extract`, `generate`, `build`, `validate` — v1.0
- v1 node coverage: Webhook, HTTP Request, Slack, IF, Set — v1.0
- Snapshot tests compare compiled output against known-good n8n JSON — v1.0
- Integration tests import compiled workflows into n8n via API — v1.0

### Active

(None yet — define for next milestone)

### Out of Scope

- Credential management — SDK references credential types but doesn't store/manage secrets
- Workflow execution monitoring — SDK compiles, doesn't run
- GUI or visual workflow builder — this is code-to-JSON only

## Context

- n8n instance running locally at http://localhost:5678 (Docker, version 2.33.1) with API key access
- Shipped v1.0 with 5,047 LOC TypeScript, 61 tests, 5 target nodes
- Architecture proven: schema extraction -> type generation -> builder -> compiler -> valid n8n JSON
- Typed node API provides `nodes.slack.message.post(params)` with compile-time checking
- n8n node schemas use `displayOptions.show` for conditional property visibility — solved with discriminated unions
- Primary consumer is Claude generating workflow code — API minimizes ambiguity and maximizes pattern clarity

## Constraints

- **Runtime**: Node.js 18+, ESM modules
- **Data source**: Schema extraction via n8n REST API (`/types/nodes.json` with session auth) and MCP tools for development
- **Type strategy**: Discriminated unions for resource/operation branching at the type level
- **Testing**: Both snapshot tests (fast iteration) and n8n API import tests (confidence)
- **Node scope**: 5 nodes shipped in v1 (Webhook, HTTP Request, Slack, IF, Set)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Discriminated unions for type branching | Best fit for displayOptions conditionals — strongest compile-time guarantees | Good — SlackMessagePost vs SlackChannelCreate enforced at compile time |
| REST API + MCP hybrid for schema access | MCP for dev exploration, REST API in the CLI tool — keeps SDK standalone | Good — CLI works independently |
| 5-node v1 scope | Prove the architecture before scaling to full coverage | Good — architecture proven, ready to scale |
| Claude-first API design | Optimize for AI code generation patterns — clear, unambiguous, minimal variation | Good — fluent API works well for codegen |
| Local project, package later | Skip npm overhead until the SDK works correctly | Good — shipped without packaging friction |
| Proxy-based ref() chaining | Natural ref('X').out.field syntax without codegen | Good — zero dependencies, intuitive |
| crypto.randomUUID for IDs | Native Node.js, zero dependencies | Good — v4 UUIDs, no collisions |
| Partial<> for param types | n8n displayOptions makes required markers unreliable | Good — avoids false type errors |
| /types/nodes.json endpoint | Bulk fetch all nodes, filter client-side | Good — single API call, efficient |
| API key auth for integration tests | n8n public API v1 requires X-N8N-API-KEY header | Good — works with Docker n8n |

---
*Last updated: 2026-01-31 after v1.0 milestone*
