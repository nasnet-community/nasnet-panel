---
sidebar_position: 4
title: Key Commands
---

# Key Commands

All commands are run from the **monorepo root** (`NasNet/`) unless noted otherwise.

---

## Development

### Start Dev Servers

```bash
# Frontend only — Vite dev server at http://localhost:5173
npm run dev:frontend

# Backend only — Go backend with air hot reload at http://localhost:8080
npm run dev:backend

# Both frontend and backend in parallel (recommended for full-stack dev)
npm run dev:all

# Frontend with verbose output (useful for debugging Vite plugin issues)
npm run dev:verbose
```

### Watch Tokens

```bash
# Watch design tokens and rebuild CSS variables on change
npm run tokens:watch

# Build tokens once (required on first run)
npm run tokens:build
```

---

## Building

### Frontend

```bash
# Build the connect app to dist/apps/connect/
npm run build:frontend
# equivalent to:
npx nx build connect

# Build and check that bundle size stays under 3MB gzipped
npm run build:check

# Build with bundle analysis (opens visual treemap)
npm run build:analyze

# Build all projects in the monorepo
npm run build:all
```

### Backend (Go)

```bash
# Build the Go backend (embeds the built frontend)
npx nx build backend
```

> The Go binary embeds the frontend dist via `go:embed`. You must build the frontend first before
> building the backend for production.

### Nx-Specific Builds

```bash
# Build only projects affected by recent changes
npx nx affected -t build

# Build a specific library
npx nx build ui-patterns
npx nx build api-client
```

---

## Code Quality

### Linting

```bash
# Lint all frontend projects + CSS
npm run lint

# Lint all projects (including those not normally checked)
npm run lint:all

# Auto-fix linting issues
npm run lint:fix

# Lint only CSS/SCSS files
npm run lint:css

# Fix CSS linting issues
npm run lint:css:fix
```

### Type Checking

```bash
# Run TypeScript type checker across all projects
npm run typecheck

# Type check all projects (including those not normally checked)
npm run typecheck:all
```

### Combined Checks

```bash
# Run typecheck + lint sequentially (recommended before committing)
npm run check

# Run typecheck + lint on all projects
npm run check:all

# Frontend-specific: lint + typecheck + build connect app
npm run check:frontend

# Backend-specific: Go lint + vet + build check
npm run check:backend

# Full CI suite: lint, test, build, typecheck
npm run ci
```

### Formatting

```bash
# Format all files with Prettier
npm run format

# Check formatting without modifying files (used in CI)
npm run format:check
```

---

## Testing

### Frontend Tests (Vitest)

```bash
# Run all tests (3 parallel workers)
npm run test

# Watch mode — re-run on file changes (useful during TDD)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Open Vitest UI (interactive test browser)
npm run test:ui

# Run only tests affected by recent changes
npm run test:affected

# Run tests for a specific project
npx nx test connect
npx nx test ui-primitives
npx nx test ui-patterns
```

### Backend Tests (Go)

```bash
# Run all Go tests with verbose output
npm run test:go

# Run Go tests with coverage and generate HTML report
npm run test:go:coverage

# Run Go tests for a specific package
cd apps/backend && go test -v -tags=dev ./internal/auth/...
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests (Chromium, Firefox, WebKit)
npm run e2e
# equivalent to:
npx nx e2e connect-e2e

# Run E2E tests with Playwright UI (interactive mode)
npm run e2e:ui
```

---

## GraphQL Code Generation

Run these whenever you modify `.graphql` schema files or `libs/data/ent/schema/`:

```bash
# Full codegen: TypeScript types + hooks + Go resolvers
npm run codegen

# TypeScript only: types, Apollo hooks, Zod schemas
npm run codegen:ts

# Go only: ent ORM + gqlgen resolvers + wire
npm run codegen:go

# ent ORM only (Go database layer)
npm run codegen:ent

# gqlgen only (Go GraphQL resolver stubs)
npm run codegen:gqlgen

# Wire only (Go dependency injection)
npx nx run backend:wire
# equivalent to:
npm run codegen:wire

# Verify generated code is in sync with schema (used in CI)
npm run codegen:check
```

> **Important:** Always run `npm run codegen` after editing any `.graphql` file. The TypeScript
> generated types in `libs/api-client/generated/` and the Go resolver stubs in `apps/backend/graph/`
> must stay in sync with the schema.

---

## Storybook

### Running Storybook

```bash
# Run Storybook for the Primitives library (port 4400)
npx nx run ui-primitives:storybook

# Run Storybook for the Patterns library (port 4401)
npx nx run ui-patterns:storybook

# Run Storybook for the connect app
npx nx run connect:storybook
```

### Building Storybook

```bash
# Build all Storybooks (for deployment/review)
npm run check:storybook
# equivalent to:
npx nx run-many -t build-storybook

# Health check for Storybook configuration
npx storybook doctor
```

> **Version:** Storybook 10.2.7 (ESM-only)

---

## Docker

```bash
# Build the Docker image locally (multi-arch: amd64, arm64, arm/v7)
npm run docker:local

# Export as a tarball for loading into RouterOS
npm run docker:export

# Build and export in one step
npm run docker:build-export

# Check the compressed image size (target: <10MB)
npm run docker:check-size
```

---

## Internationalization (i18n)

```bash
# Extract translatable strings from source files
npm run i18n:extract

# Extract and fail if new strings are found (used in CI)
npm run i18n:check

# Extract + copy locale JSON files to public/locales/ (full sync)
npm run i18n:sync
```

Extracted strings come from:

- `apps/connect/src/**/*.{ts,tsx}`
- `libs/ui/patterns/src/**/*.{ts,tsx}`

Output goes to `libs/core/i18n/src/locales/{en,fa}/`.

---

## Nx Workspace Commands

```bash
# Visualize the project dependency graph in browser
npx nx graph

# Show configuration for a specific project
npx nx show project connect
npx nx show project ui-patterns

# Run a target on all projects in parallel
npx nx run-many -t lint test build

# Run a target on all affected projects (since last commit)
npx nx affected -t test

# Generate a new component using the custom generator
npm run g:component

# Generate a new library
npm run g:library

# Generate a new GraphQL resolver
npm run g:resolver

# Run security vulnerability check on Go dependencies
npm run vulncheck
```

---

## Documentation

```bash
# Start the docs dev server (if configured)
npm run docs:dev

# Build the documentation site
npm run docs:build
```

---

## Quick Reference Table

| Task                     | Command                            |
| ------------------------ | ---------------------------------- |
| Start frontend dev       | `npm run dev:frontend`             |
| Start everything         | `npm run dev:all`                  |
| Build frontend           | `npm run build:frontend`           |
| Run all tests            | `npm run test`                     |
| Check before commit      | `npm run check`                    |
| Full CI check            | `npm run ci`                       |
| Regenerate GraphQL types | `npm run codegen`                  |
| Check bundle size        | `npm run build:check`              |
| Build Docker image       | `npm run docker:local`             |
| Run E2E tests            | `npm run e2e`                      |
| View component library   | `npx nx run ui-patterns:storybook` |

---

## See Also

- [Environment Setup](./environment-setup.md) — Prerequisites and first-time setup
- [Project Structure](./project-structure.md) — Directory layout and import aliases
- [Architecture Overview](../architecture/overview.md) — How the app is organized
- [Code Generation](../data-fetching/codegen.md) — Deep dive into GraphQL codegen
