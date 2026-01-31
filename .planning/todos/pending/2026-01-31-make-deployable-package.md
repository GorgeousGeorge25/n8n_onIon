---
created: 2026-01-31T18:53
title: Make SDK a deployable/installable package
area: tooling
files:
  - package.json
  - src/index.ts
  - tsconfig.json
---

## Problem

SDK currently only works as a local project — can't be installed as a dependency in other projects or tested in real-world scenarios outside the repo. User wants to validate the SDK with real-life workflows before investing in documentation (Phases 6-8 deprioritized).

Need to package the SDK so it can be:
- Installed via npm (local path or registry)
- Imported in external projects (`import { workflow } from 'n8n-onion'`)
- Used end-to-end: schema extraction → type generation → workflow compilation → n8n import

## Solution

Key tasks likely include:
- Configure package.json for publishing (main, types, exports, bin, files)
- Set up TypeScript build output (dist/ directory)
- Ensure CLI commands work when installed as dependency
- Test local install via `npm link` or `npm install ../n8n_onIon`
- Validate with a real workflow project outside the repo
- Consider: npm publish to registry vs local-only for now

TBD — needs proper planning as a phase.
