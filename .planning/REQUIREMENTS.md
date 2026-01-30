# Requirements: n8n TypeScript Workflow SDK

**Defined:** 2026-01-31
**Core Value:** Compiled workflows import and execute correctly in n8n on the first try — 99% success rate

## v1 Requirements

### Schema Extraction

- [ ] **SCHEMA-01**: Extractor pulls node type definitions from n8n REST API (`/api/v1/node-types`)
- [ ] **SCHEMA-02**: Extracted schemas cached as local JSON files for offline use
- [ ] **SCHEMA-03**: TypeScript interfaces define the n8n schema format (properties, displayOptions, credentials)

### Type Generation

- [ ] **TYGEN-01**: Generator transforms cached schemas into TypeScript interfaces
- [ ] **TYGEN-02**: displayOptions.show conditionals produce discriminated unions (resource/operation branching)
- [ ] **TYGEN-03**: `type: 'options'` fields generate string literal union types
- [ ] **TYGEN-04**: ResourceLocator type supports mode/value pairs and string shorthand
- [ ] **TYGEN-05**: Collection and FixedCollection parameter groups generate typed nested objects

### Workflow Builder

- [ ] **BUILD-01**: `workflow(name)` creates a workflow context
- [ ] **BUILD-02**: `wf.trigger()` adds a trigger node with typed parameters
- [ ] **BUILD-03**: `wf.node()` adds an action node with typed parameters
- [ ] **BUILD-04**: `wf.connect()` links nodes with type-checked references

### Expressions

- [ ] **EXPR-01**: Node output references compile to `$node['Name'].json.field` syntax
- [ ] **EXPR-02**: Template literals compile to n8n string concatenation expressions

### Compiler

- [ ] **COMP-01**: Compiler produces structurally valid n8n workflow JSON
- [ ] **COMP-02**: Auto-generates UUIDs for node IDs and webhook IDs
- [ ] **COMP-03**: Auto-positions nodes in grid layout without overlap
- [ ] **COMP-04**: Validates connections reference existing nodes with compatible outputs

### CLI

- [ ] **CLI-01**: `n8n-sdk extract` pulls schemas from n8n instance
- [ ] **CLI-02**: `n8n-sdk generate` creates TypeScript types from cached schemas
- [ ] **CLI-03**: `n8n-sdk build` compiles workflow .ts file to n8n JSON
- [ ] **CLI-04**: `n8n-sdk validate` checks workflow without compiling

### Testing

- [ ] **TEST-01**: Snapshot tests compare compiled output against known-good n8n JSON
- [ ] **TEST-02**: Integration tests import compiled workflows into n8n via API

### Node Coverage

- [ ] **NODE-01**: Webhook trigger node fully typed and compilable
- [ ] **NODE-02**: HTTP Request node fully typed and compilable
- [ ] **NODE-03**: Slack node fully typed and compilable
- [ ] **NODE-04**: IF node fully typed and compilable
- [ ] **NODE-05**: Set node fully typed and compilable

## v2 Requirements

### Expanded Node Coverage

- **NODE-V2-01**: Full coverage of all n8n built-in nodes
- **NODE-V2-02**: Community node support

### Expressions

- **EXPR-V2-01**: Built-in functions (expr.now(), expr.json(), etc.)
- **EXPR-V2-02**: Arithmetic and logic operators for computed expressions

### Schema

- **SCHEMA-V2-01**: Incremental extraction (only re-fetch changed nodes)

### Developer Experience

- **DX-V2-01**: Detailed error messages for invalid configurations
- **DX-V2-02**: Documentation and README
- **DX-V2-03**: npm package publishing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Credential management | SDK references credential types but doesn't store/manage secrets |
| Workflow execution monitoring | SDK compiles, doesn't run |
| GUI or visual builder | Code-to-JSON only |
| n8n community node schemas | Focus on built-in nodes for v1 |
| Human DX polish | Claude-first; DX improvements in v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | — | Pending |
| SCHEMA-02 | — | Pending |
| SCHEMA-03 | — | Pending |
| TYGEN-01 | — | Pending |
| TYGEN-02 | — | Pending |
| TYGEN-03 | — | Pending |
| TYGEN-04 | — | Pending |
| TYGEN-05 | — | Pending |
| BUILD-01 | — | Pending |
| BUILD-02 | — | Pending |
| BUILD-03 | — | Pending |
| BUILD-04 | — | Pending |
| EXPR-01 | — | Pending |
| EXPR-02 | — | Pending |
| COMP-01 | — | Pending |
| COMP-02 | — | Pending |
| COMP-03 | — | Pending |
| COMP-04 | — | Pending |
| CLI-01 | — | Pending |
| CLI-02 | — | Pending |
| CLI-03 | — | Pending |
| CLI-04 | — | Pending |
| TEST-01 | — | Pending |
| TEST-02 | — | Pending |
| NODE-01 | — | Pending |
| NODE-02 | — | Pending |
| NODE-03 | — | Pending |
| NODE-04 | — | Pending |
| NODE-05 | — | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
