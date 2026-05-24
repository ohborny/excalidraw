# AGENTS.md

## Cursor Cloud specific instructions

### Workspace layout

This workspace has two repositories:
- `/agent/repos/excalidraw` — Excalidraw monorepo (Yarn workspaces, Vite, React 19, TypeScript)
- `/agent/repos/example-101` — Static Space Invaders game (vanilla HTML/CSS/JS, no dependencies)

### Excalidraw

**Dev server:** `yarn start` from the repo root starts Vite on port 3001. The `vite-plugin-checker` plugin runs ESLint and TypeScript checking in-process — the "[ESLint] Found 0 error" and "[TypeScript] Found 0 errors" lines in the console are normal success messages, not failures (the `ERROR` label is misleading).

**Key commands** (see `CLAUDE.md` and `package.json` `scripts` for the full list):
- `yarn test:typecheck` — TypeScript type checking
- `yarn test:code` — ESLint (max 0 warnings)
- `yarn test:update` — Run all tests (Vitest, single run, updates snapshots)
- `yarn fix` — Auto-fix formatting (Prettier) and lint (ESLint)
- `yarn start` — Dev server on port 3001

**Testing notes:**
- All 103 test files (1387 tests) run in jsdom via Vitest — no browser needed.
- Some tests emit `Error JSON parsing firebase config` to stderr; this is expected in the test environment and does not indicate failure.
- The `husky` pre-commit hook is commented out (lint-staged line is commented in `.husky/pre-commit`), so there is no automatic pre-commit gate.

**Optional services** (not required for core editor development):
- Collaboration WebSocket server (`excalidraw-room`) on port 3002
- AI backend on port 3016
- Excalidraw+ on port 3000

### example-101

Static site — serve with `python3 -m http.server 8080` from the repo root. No build step or dependencies.
