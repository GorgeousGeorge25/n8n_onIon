# Requirements: n8n TypeScript Workflow SDK

**Defined:** 2026-01-31
**Core Value:** Compiled workflows import and execute correctly in n8n on the first try — 99% success rate

## v1 Requirements

### Schema Extraction

- [x] **SCHEMA-01**: Extractor pulls node type definitions from n8n REST API (`/api/v1/node-types`)
- [x] **SCHEMA-02**: Extracted schemas cached as local JSON files for offline use
- [x] **SCHEMA-03**: TypeScript interfaces define the n8n schema format (properties, displayOptions, credentials)

### Type Generation

- [x] **TYGEN-01**: Generator transforms cached schemas into TypeScript interfaces
- [x] **TYGEN-02**: displayOptions.show conditionals produce discriminated unions (resource/operation branching)
- [x] **TYGEN-03**: `type: 'options'` fields generate string literal union types
- [x] **TYGEN-04**: ResourceLocator type supports mode/value pairs and string shorthand
- [x] **TYGEN-05**: Collection and FixedCollection parameter groups generate typed nested objects

### Workflow Builder

- [x] **BUILD-01**: `workflow(name)` creates a workflow context
- [x] **BUILD-02**: `wf.trigger()` adds a trigger node with typed parameters
- [x] **BUILD-03**: `wf.node()` adds an action node with typed parameters
- [x] **BUILD-04**: `wf.connect()` links nodes with type-checked references

### Expressions

- [x] **EXPR-01**: Node output references compile to `$node['Name'].json.field` syntax
- [x] **EXPR-02**: Template literals compile to n8n string concatenation expressions

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
| SCHEMA-01 | Phase 1 | Complete |
| SCHEMA-02 | Phase 1 | Complete |
| SCHEMA-03 | Phase 1 | Complete |
| TYGEN-01 | Phase 1 | Complete |
| TYGEN-02 | Phase 1 | Complete |
| TYGEN-03 | Phase 1 | Complete |
| TYGEN-04 | Phase 1 | Complete |
| TYGEN-05 | Phase 1 | Complete |
| BUILD-01 | Phase 2 | Complete |
| BUILD-02 | Phase 2 | Complete |
| BUILD-03 | Phase 2 | Complete |
| BUILD-04 | Phase 2 | Complete |
| EXPR-01 | Phase 2 | Complete |
| EXPR-02 | Phase 2 | Complete |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| CLI-01 | Phase 3 | Pending |
| CLI-02 | Phase 3 | Pending |
| CLI-03 | Phase 3 | Pending |
| CLI-04 | Phase 3 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| NODE-01 | Phase 4 | Pending |
| NODE-02 | Phase 4 | Pending |
| NODE-03 | Phase 4 | Pending |
| NODE-04 | Phase 4 | Pending |
| NODE-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after roadmap creation*
