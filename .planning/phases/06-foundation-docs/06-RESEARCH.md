# Phase 6: Foundation Docs - Research

**Researched:** 2026-01-31
**Domain:** Documentation validation and consolidation
**Confidence:** HIGH

## Summary

The foundation docs already exist with substantial, high-quality content from v1.0 development. All three target files (SKILL.md, docs/README.md, docs/INSTALLATION.md) are present and comprehensive. Research focused on **what is accurate, what needs correction, and what gaps exist** to inform a targeted validation plan.

Key findings:
- **SKILL.md exists at project root** (613 lines) with complete API reference, 5 workflow patterns, expression system docs, and CLI commands
- **docs/SKILL.md is an exact duplicate** (verified via `diff` — zero differences) that needs removal
- **docs/README.md** (111 lines) has correct structure, navigation table, and quick start — but documentation table is complete (6 entries, not missing anything)
- **docs/INSTALLATION.md** (146 lines) has accurate setup steps, correct CLI commands, and valid troubleshooting section
- **Critical version mismatch found:** SKILL.md frontmatter says `version: 0.2.0` but package.json has `version: 0.1.0`
- **All documentation files already exist:** API.md, GUIDES.md, EXAMPLES.md, TROUBLESHOOTING.md, NODES.md are all present (2,692 total lines)

**Primary recommendation:** Focus on validation and accuracy fixes rather than content creation. Remove duplicate, fix version mismatch, verify all technical claims against codebase.

## Current State Analysis

### What Exists (HIGH confidence — verified via Read/Bash)

| File | Lines | Status | Issues Found |
|------|-------|--------|--------------|
| SKILL.md (root) | 613 | Complete | Version mismatch (0.2.0 vs 0.1.0) |
| docs/SKILL.md | 613 | Duplicate | Exact copy — needs deletion |
| docs/README.md | 111 | Complete | All links present, structure correct |
| docs/INSTALLATION.md | 146 | Complete | .env.example exists, commands valid |
| docs/API.md | 440 | Complete | Full API reference |
| docs/GUIDES.md | 469 | Complete | Step-by-step tutorials |
| docs/EXAMPLES.md | 414 | Complete | 6 complete workflow examples |
| docs/TROUBLESHOOTING.md | 239 | Complete | Common errors and solutions |
| docs/NODES.md | 260 | Complete | Node type documentation |

**Source:** Direct file reads, line counts via `wc -l`, `diff` comparison for duplicate detection.

### What's Accurate (HIGH confidence — verified against source)

**SKILL.md content accuracy:**
- ✅ All 5 user-facing API exports documented: `workflow`, `createTypedNodes`, `compileWorkflow`, `validateWorkflow`, `ref`, `expr`
- ✅ Internal exports NOT documented (correct): `calculateGridPosition`, `generateNodeType`, `analyzeDisplayOptions`, etc.
- ✅ Import paths use `'./src/index.js'` (correct for project-root workflows)
- ✅ All 5 patterns are complete with `export default wf` endings
- ✅ CLI commands match package.json scripts exactly
- ✅ 797 schemas verified (797 .json files in schemas/)
- ✅ 64,512 lines in generated/nodes.ts (matches claim)
- ✅ 5 typed nodes documented (webhook, httpRequest, if, set, slack)

**docs/README.md accuracy:**
- ✅ Documentation table has all 6 entries: Installation, API, Guides, Examples, Troubleshooting, Nodes
- ✅ No reference to docs/SKILL.md (correctly omitted)
- ✅ Quick Start uses `npm run build-workflow -- my-workflow.ts` (correct)
- ✅ Project structure tree matches actual directory layout
- ✅ Coverage stats accurate: 797 schemas, 64,512 lines, 5 typed nodes

**docs/INSTALLATION.md accuracy:**
- ✅ .env.example file exists (verified)
- ✅ Build command is `npm run build-workflow -- <file>` (correct)
- ✅ Expected output format matches actual CLI output
- ✅ Test count: 61 tests (verified via `npm run test`)
- ✅ npm Scripts Reference table complete and accurate
- ✅ All prerequisite checks valid

**Source:**
- Compared src/index.ts exports (lines 7-31) against SKILL.md API Reference section
- Ran `npm run test` → 61 passing tests confirmed
- Ran `npm run build-workflow -- test-workflows/01-webhook-slack.ts` → output format matches docs
- Verified .env.example exists and contains N8N_API_URL, N8N_EMAIL, N8N_PASSWORD
- Counted schemas: `ls -1 schemas/*.json | wc -l` → 797
- Checked generated file: `wc -l generated/nodes.ts` → 64,512

### What's Wrong (HIGH confidence — verified discrepancies)

**Version Mismatch:**
- SKILL.md frontmatter: `version: 0.2.0`
- package.json: `version: 0.1.0`
- **Impact:** Claude might report wrong version when using the skill
- **Fix:** Change SKILL.md line 4 to `version: 0.1.0`

**Duplicate File:**
- docs/SKILL.md is byte-for-byte identical to root SKILL.md
- **Impact:** Confusing to maintain, violates single-source-of-truth
- **Fix:** Delete docs/SKILL.md

**Import Path Inconsistency:**
- SKILL.md examples use `from './src/index.js'` (project root context)
- test-workflows/ use `from '../src/index.js'` (subdirectory context)
- **Impact:** Minor — examples are correct for their intended use (project root workflows)
- **Fix:** None needed, but could add clarifying comment

**Source:**
- `grep "version" SKILL.md package.json` comparison
- `diff SKILL.md docs/SKILL.md` returns no differences
- Manual examination of import paths in both locations

### What's Missing (MEDIUM confidence — absence of evidence)

**No gaps identified.** All requirements are met:
- ✅ SKILL-01: SKILL.md exists with all required sections
- ✅ DOCS-01: docs/README.md exists with overview, quick start, navigation
- ✅ DOCS-02: docs/INSTALLATION.md exists with prerequisites, setup, verification

**Unexpected completeness:**
The plan anticipated needing to create or significantly expand docs, but all documentation files referenced in the requirements already exist and are comprehensive. The phase is actually about **validation and polish**, not creation.

## Standard Stack

### Core Tools (verification)
| Tool | Purpose | Current Use |
|------|---------|-------------|
| `diff` | File comparison | Verify duplicate status |
| `grep` | Content search | Validate documentation claims |
| `wc -l` | Line counting | Verify metrics accuracy |
| `npm run` | CLI execution | Test all documented commands |

### Validation Approach
| Check | How to Verify | Source of Truth |
|-------|--------------|-----------------|
| API exports | Compare src/index.ts exports to SKILL.md API section | src/index.ts lines 7-31 |
| CLI commands | Run each command and compare output to docs | package.json scripts + actual execution |
| File counts | Count files in directories and compare to claims | `ls` + `wc` commands |
| Version numbers | Extract and compare version fields | package.json vs SKILL.md frontmatter |
| Import paths | Check example code against real workflow files | test-workflows/*.ts |

## Architecture Patterns

### Documentation Validation Pattern

**1. Exhaustive Claim Checking**
For each quantifiable claim in docs:
- Extract the claim (e.g., "797 schemas")
- Find the source of truth (e.g., `ls -1 schemas/*.json | wc -l`)
- Verify match or document discrepancy

**2. Export Coverage Verification**
```typescript
// src/index.ts exports ALL of these:
export * from './schema/types.js';
export { workflow } from './builder/workflow.js';
export { compileWorkflow } from './compiler/compiler.js';
export { createTypedNodes } from './codegen/typed-api.js';
// etc.

// SKILL.md should document ONLY user-facing exports
// Internals like calculateGridPosition should be absent
```

**3. CLI Command Validation**
For each command in docs:
```bash
# Extract command from docs
# Run it
# Compare actual output to documented output
npm run build-workflow -- test-workflows/01-webhook-slack.ts
# Expected: "✓ Compiled workflow: Webhook to Slack"
# Actual: [verify matches]
```

### Duplicate Detection Pattern

```bash
# For any suspected duplicate
diff file1 file2
# Zero differences = exact duplicate
# Nonzero exit code = files differ

# For duplicate removal
diff SKILL.md docs/SKILL.md  # Verify identical
rm docs/SKILL.md             # Delete duplicate
git rm docs/SKILL.md         # Or use git rm if tracked
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File comparison | Custom hash checker | `diff` command | Byte-accurate, handles all edge cases |
| Line counting | Read and count loop | `wc -l` | Handles encoding, newlines correctly |
| JSON validation | Custom parser | `jq` or direct parse | Edge cases (escape sequences, Unicode) |
| Version extraction | Regex parsing | `grep` + `cut` or `jq` | Handles all JSON/YAML formats |

## Common Pitfalls

### Pitfall 1: Assuming Docs Match Reality
**What goes wrong:** Documentation was written during development, then code changed, docs weren't updated.
**Why it happens:** Docs are separate from code — no compile-time enforcement.
**How to avoid:** Treat every claim as a hypothesis. Verify against source of truth.
**Warning signs:**
- Exact numbers (e.g., "61 tests") — these change frequently
- Version numbers — multiple sources (package.json, SKILL.md)
- CLI output format — easily outdated

### Pitfall 2: Missing Duplicate Files
**What goes wrong:** Same content exists in multiple locations, only one gets updated.
**Why it happens:** Developers copy files for convenience, forget to remove.
**How to avoid:** Use `find` + `diff` to detect byte-identical files.
**Warning signs:**
- Two files with same name in different directories
- Documentation references both locations

### Pitfall 3: Version Drift
**What goes wrong:** package.json says 0.1.0, SKILL.md says 0.2.0, users get confused.
**Why it happens:** Multiple version sources, no single source of truth.
**How to avoid:**
- package.json is canonical for npm packages
- SKILL.md frontmatter should match package.json
- Add verification step: `grep version package.json SKILL.md`
**Warning signs:** Any multi-file version claim

### Pitfall 4: Import Path Context Blindness
**What goes wrong:** Example uses `'./src/index.js'` but user runs from subdirectory, import fails.
**Why it happens:** Import paths are relative to file location, not project root.
**How to avoid:**
- Document the assumed working directory
- Show both patterns if needed
- Add comment: `// From project root`
**Warning signs:** Import errors in otherwise correct code

## Code Examples

### Verify Version Consistency

```bash
# Source: Verified 2026-01-31
echo "package.json version:"
grep '"version"' package.json | head -1

echo "SKILL.md version:"
grep '^version:' SKILL.md

# Expected: Both should match
# Actual finding: Mismatch (0.1.0 vs 0.2.0)
```

### Verify Duplicate Status

```bash
# Source: Verified 2026-01-31
diff SKILL.md docs/SKILL.md
echo $?  # 0 = identical, 1 = different

# Result: 0 (exact duplicate confirmed)
```

### Verify API Coverage

```bash
# Source: Verified 2026-01-31
# Extract user-facing exports
grep '^export.*from\|^export {' src/index.ts

# Expected in SKILL.md:
# - workflow, compileWorkflow, validateWorkflow
# - createTypedNodes, ref, expr

# NOT expected (internals):
# - calculateGridPosition, generateNodeType
# - analyzeDisplayOptions, buildDiscriminatedUnions
```

### Verify CLI Output Format

```bash
# Source: Verified 2026-01-31
npm run build-workflow -- test-workflows/01-webhook-slack.ts

# Actual output:
# ✓ Compiled workflow: Webhook to Slack
#   Nodes: 2
#   Connections: 1
#   Output: /Users/.../test-workflows/01-webhook-slack.json

# Matches INSTALLATION.md line 75-79
```

### Verify File Counts

```bash
# Source: Verified 2026-01-31
echo "Schema files:"
ls -1 schemas/*.json | wc -l  # Result: 797

echo "Generated file lines:"
wc -l generated/nodes.ts  # Result: 64512

echo "Test count:"
npm run test 2>&1 | grep "Tests.*passed"  # Result: 61 passed
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No skill file | SKILL.md frontmatter + Claude-specific docs | v1.1 planning | Claude can use SDK without human intervention |
| Scattered docs | Organized docs/ directory with navigation | v1.0 → v1.1 | Developers know where to find everything |
| Manual verification | Scripted command testing | This phase | Docs stay accurate over time |
| Single README | Separate INSTALLATION, API, GUIDES, etc. | v1.1 | Easier to find relevant information |

**Deprecated/outdated:**
- ❌ `npx ts-node build` — never existed, always been `npm run build-workflow`
- ✅ `npm run build-workflow` — correct command from v1.0 onwards

## Open Questions

1. **Should SKILL.md version track package.json automatically?**
   - What we know: Currently manual, led to mismatch
   - What's unclear: If there's a build step to sync them
   - Recommendation: Fix manually now, consider automation if it happens again

2. **Is the import path inconsistency intentional?**
   - What we know: SKILL.md uses `'./src/index.js'`, test-workflows use `'../src/index.js'`
   - What's unclear: If examples are meant to be run from project root only
   - Recommendation: Accept as-is (context-appropriate), possibly add clarifying comment

3. **Are there references to docs/SKILL.md elsewhere?**
   - What we know: `grep` found none in docs/
   - What's unclear: Could be references in code comments or other files
   - Recommendation: Safe to delete, but verify with `grep -r "docs/SKILL.md" .` first

## Sources

### Primary (HIGH confidence)

**Codebase verification:**
- `/Users/jurissleiners/MyPrograms/n8n_onIon/src/index.ts` — Canonical list of exports (lines 7-31)
- `/Users/jurissleiners/MyPrograms/n8n_onIon/package.json` — Canonical version (0.1.0) and script definitions
- `/Users/jurissleiners/MyPrograms/n8n_onIon/.env.example` — Verified existence and content
- `npm run test` execution → 61 passing tests confirmed
- `npm run build-workflow` execution → output format verified

**File system verification:**
- `ls -1 schemas/*.json | wc -l` → 797 schemas
- `wc -l generated/nodes.ts` → 64,512 lines
- `diff SKILL.md docs/SKILL.md` → exact duplicate
- `ls -1 docs/*.md` → all 8 doc files present

**Documentation files:**
- SKILL.md (613 lines) — Complete skill reference
- docs/README.md (111 lines) — Overview and navigation
- docs/INSTALLATION.md (146 lines) — Setup guide
- docs/API.md (440 lines) — Full API reference
- All other docs/ files verified present

### Secondary (MEDIUM confidence)

**Plan context:**
- `.planning/phases/06-foundation-docs/06-01-PLAN.md` — Existing plan shows expected validations
- `.planning/PROJECT.md` — Project context and v1.0 decisions

### Tertiary (LOW confidence)

None — all findings are directly verifiable against source code and file system.

## Metadata

**Confidence breakdown:**
- Current state: HIGH — All files read directly, counts verified, commands executed
- Accuracy checks: HIGH — Compared docs against actual source code, ran all commands
- Issue identification: HIGH — Version mismatch confirmed, duplicate verified, all claims tested
- Completeness: MEDIUM — Could exist references to docs/SKILL.md outside docs/ directory (not exhaustively checked)

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (stable content — docs change slowly once written)

**Key insight:** This phase is 90% validation, 10% correction. The content already exists and is comprehensive. Focus should be on accuracy verification and fixing the two known issues (version mismatch, duplicate file) rather than content creation.
