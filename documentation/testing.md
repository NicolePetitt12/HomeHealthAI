# Testing & Quality

## Backend Tests

### Unit tests

```bash
cd apps/backend
npm run test
```

Runs Jest against all `*.spec.ts` files in `src/`. Each NestJS module should have a corresponding spec file in the same directory.

### Watch mode

```bash
cd apps/backend
npm run test:watch
```

Re-runs tests on file changes — useful during active development.

### Coverage report

```bash
cd apps/backend
npm run test:cov
```

Generates a coverage report in `apps/backend/coverage/`.

### Single test file

```bash
cd apps/backend
npx jest src/app.controller.spec.ts
```

### End-to-end tests

```bash
cd apps/backend
npm run test:e2e
```

Uses the `test/jest-e2e.json` Jest configuration and targets `test/**/*.e2e-spec.ts` files.

## Type Checking

### Backend

```bash
cd apps/backend
npx tsc --noEmit
```

### Shared package

```bash
cd packages/shared
npx tsc --noEmit
```

### Mobile

The mobile app does not emit files — type checking is the build step:

```bash
cd apps/mobile
npm run build   # runs tsc --noEmit
```

### All packages (via Turborepo)

```bash
npm run build   # from workspace root
```

Turborepo builds packages in the correct order (shared → backend/mobile).

## Linting

### All packages

```bash
npm run lint    # from workspace root
```

### Single package

```bash
cd apps/backend && npm run lint
cd apps/mobile && npm run lint
cd packages/shared && npm run lint
```

The backend linter runs with `--fix` by default.

## Formatting

### Check formatting (no writes)

```bash
npm run format:check
```

### Fix formatting

```bash
npm run format
```

Prettier rules (in `.prettierrc`):
- Single quotes
- Trailing commas
- Semicolons
- Print width: 100
- Tab width: 2
