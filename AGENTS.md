# AGENTS.md

## Cursor Cloud specific instructions

Excalidraw is a Yarn 1.x workspaces monorepo. See `CLAUDE.md` for project structure and `package.json` `"scripts"` for all available commands.

### Running the app

- `yarn start` launches the Vite dev server for `excalidraw-app` on **port 3001**.
- The app works standalone for drawing/editing. Collaboration (port 3002) and AI (port 3016) are optional external services — the app gracefully degrades without them.
- The `vite-plugin-checker` runs ESLint and TypeScript in parallel during dev; its `ERROR` banners showing "Found 0 errors" are normal (they indicate the checker ran, not that errors occurred).

### Testing

- `yarn test:update` — run all vitest tests (with snapshot updates); no external services needed.
- `yarn test:typecheck` — TypeScript type checking via `tsc`.
- `yarn test:code` — ESLint (must produce 0 warnings).
- `yarn fix` — auto-fix formatting (prettier) and lint issues.

### Gotchas

- The browserslist "caniuse-lite is X months old" warning is cosmetic and does not affect functionality.
- Firebase config warnings (`Error JSON parsing firebase config`) in test stderr are expected in dev/test — the OSS dev Firebase project config is baked into `.env.development`.
- The husky pre-commit hook is commented out (`# yarn lint-staged`), so no pre-commit checks run automatically.
