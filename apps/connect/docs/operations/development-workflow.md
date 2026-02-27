# Development Workflow

Day-to-day guide for developing the `apps/connect` frontend. Covers environment startup, HMR
behaviour, debugging, common development tasks, and the PR process.

See also:

- [Key Commands](../getting-started/key-commands.md) — full command reference
- [Build System](../architecture/build-system.md) — Vite configuration details

---

## Starting the Development Environment

### Frontend Only

```bash
npm run dev:frontend
# Vite dev server starts at http://localhost:5173
# Browser opens automatically (open: true in vite.config.ts)
```

The Vite dev server binds to `0.0.0.0` (`host: true`), so it is reachable from other devices on the
same LAN — useful for testing on a phone.

### Backend Only

```bash
npm run dev:backend
# Go backend with air hot reload at http://localhost:8080
```

### Both Together (Recommended)

```bash
npm run dev:all
# Runs connect + backend in parallel with verbose output
```

The frontend dev server proxies all `/api/*` requests to the Go backend (default:
`http://localhost:80`, override with `VITE_PROXY_URL` in `.env.development`):

```env
# apps/connect/.env.development
VITE_API_URL=http://localhost:8080
VITE_PROXY_URL=http://localhost:8080
```

### Verbose Mode

```bash
npm run dev:verbose
# Prints all Vite plugin activity — useful when debugging token HMR or router codegen
```

---

## HMR (Hot Module Replacement)

Vite's HMR is configured via `@vitejs/plugin-react` (Fast Refresh). The following behaviours apply:

### React Component Changes

Standard React Fast Refresh: component state is preserved across edits when the component signature
does not change. If you add or remove hooks, the module is fully reloaded and local state is reset.

### Design Token Changes

The project includes a custom `designTokensHMR` Vite plugin (defined in
`apps/connect/vite.config.ts`). When `libs/ui/tokens/src/tokens.json` is modified:

1. The plugin detects the change and runs `node libs/ui/tokens/build.js`
2. The rebuilt `libs/ui/tokens/dist/variables.css` is invalidated in Vite's module graph
3. A `full-reload` is sent to the browser

This means editing design tokens does **not** preserve component state — expect a full page reload.
Run `npm run tokens:build` once on first setup if CSS variables are missing.

### GraphQL Schema Changes

Changes to `.graphql` files do **not** trigger automatic HMR. You must run codegen manually:

```bash
npm run codegen:ts   # TypeScript types, hooks, Zod schemas
```

After codegen, Vite detects changes to the generated files under `libs/api-client/generated/` and
triggers HMR for any modules that import them.

### TanStack Router Route Tree

The `TanStackRouterVite` plugin watches `src/routes/` for new or removed route files. When you add a
route file, the plugin automatically regenerates `src/routeTree.gen.ts` and Vite picks up the
change. No manual step is needed.

### Known HMR Caveats

| Scenario                           | Behaviour                              |
| ---------------------------------- | -------------------------------------- |
| Adding/removing a React hook       | Full module reload, state reset        |
| Editing CSS custom properties      | Full page reload (token rebuild cycle) |
| Modifying `vite.config.ts` itself  | Manual server restart required         |
| Changing XState machine definition | Full module reload                     |
| Editing `.graphql` files           | Manual `npm run codegen:ts` required   |

---

## Browser DevTools Setup

### Apollo DevTools

Install the
[Apollo Client Devtools](https://www.apollographql.com/docs/react/development-testing/developer-tooling/#apollo-client-devtools)
browser extension.

Once installed, the **Apollo** tab appears in Chrome DevTools. Use it to:

- Inspect the Apollo cache
- Run GraphQL queries directly against the connected router
- Watch active query/subscription states
- Examine query variables and responses

Apollo DevTools is available in development builds only. The cache is configured with
`InMemoryCache` and type policies defined in `libs/api-client/core/src/`.

### React DevTools

Install the [React Developer Tools](https://react.dev/learn/react-developer-tools) browser
extension.

Useful tasks:

- Inspect component trees and props
- Profile render performance with the Profiler tab
- Check Zustand store state via `useStore` hooks (visible in component props)

### TanStack Router Devtools

TanStack Router Devtools are embedded directly in the app during development. A floating button
appears in the bottom-right corner (rendered by `<TanStackRouterDevtools position="bottom-right" />`
in `src/routes/__root.tsx`). It is automatically excluded from production builds via the
`import.meta.env.DEV` guard.

Use it to:

- Inspect the current route tree
- View route params and search params
- Navigate to any route
- Inspect loader data

### XState Inspector

For debugging XState machines, the project has `@statelyai/inspect` in devDependencies. To enable,
import and call `createBrowserInspector()` from `@statelyai/inspect` at the top of the machine file
during development.

---

## Debugging Techniques

### TypeScript Errors in the Browser

`vite-plugin-checker` runs TypeScript type-checking in a background worker during development. Type
errors appear as:

- An overlay in the browser (`overlay.initialIsOpen: false` — minimised by default, click the
  warning icon to expand)
- Terminal output with file path and line number

Fix the type error in your editor; the overlay clears automatically on save.

### Network Request Inspection

All GraphQL requests go to `/api/graphql`. In the browser's Network tab:

- Filter by `XHR` or `Fetch`
- Look for `graphql` requests to inspect queries, mutations, and responses
- WebSocket subscriptions appear under the `WS` filter

### Console Logging

`console.log` is stripped in production builds (Terser `drop_console: true`). During development,
use the browser console freely. For structured debugging, prefer React DevTools over console
logging.

### Source Maps

Source maps are generated in development and staging mode (`sourcemap: mode !== 'production'`).
TypeScript and TSX source files are visible in the Sources tab. Breakpoints set on TypeScript source
lines work as expected.

---

## Common Development Scenarios

### Adding a New Page / Route

TanStack Router uses file-based routing. All route files live under `apps/connect/src/routes/`.

**Steps:**

1. Create the route file following the naming convention:

   ```
   src/routes/router/$id/my-feature.tsx
   ```

2. Define and export the route:

   ```tsx
   import { createFileRoute } from '@tanstack/react-router';
   import { MyFeaturePage } from '@/app/pages/my-feature/MyFeaturePage';

   export const Route = createFileRoute('/router/$id/my-feature')({
     component: MyFeaturePage,
   });
   ```

3. The `TanStackRouterVite` plugin regenerates `src/routeTree.gen.ts` automatically on save.

4. Add a navigation link in `AppSidebar.tsx` or the relevant tab navigation component.

**For heavy tabs** (those with large tables or complex forms), use lazy loading with a skeleton
fallback:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';
import { LazyMyFeatureTab } from '@/app/routes/router-panel/tabs/lazy';

function MyFeatureSkeleton() {
  return (
    <div
      className="animate-fade-in-up space-y-4 p-4"
      aria-busy="true"
    >
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export const Route = createFileRoute('/router/$id/my-feature')({
  component: () => (
    <LazyBoundary fallback={<MyFeatureSkeleton />}>
      <LazyMyFeatureTab />
    </LazyBoundary>
  ),
});
```

Register the lazy component in `src/app/routes/router-panel/tabs/lazy.ts`:

```ts
export const [LazyMyFeatureTab, preloadMyFeatureTab] = createLazyWithPreload(() =>
  import('./MyFeatureTab').then((m) => ({ default: m.MyFeatureTab }))
);
```

### Adding a New GraphQL Query / Mutation

1. **Add to the GraphQL schema** in `schema/`:

   ```graphql
   # schema/my-domain/my-feature.graphql
   type Query {
     myFeature(routerId: ID!): MyFeatureResult!
   }
   ```

2. **Run TypeScript codegen:**

   ```bash
   npm run codegen:ts
   ```

   This generates typed hooks in `libs/api-client/generated/`.

3. **Create a domain hook** in `libs/api-client/queries/src/`:

   ```ts
   // libs/api-client/queries/src/my-domain/useMyFeature.ts
   import { useQuery } from '@apollo/client';
   import { GetMyFeatureDocument } from '@nasnet/api-client/generated';

   export function useMyFeature(routerId: string) {
     return useQuery(GetMyFeatureDocument, {
       variables: { routerId },
       context: { headers: { 'X-Router-Id': routerId } },
     });
   }
   ```

4. **Export from the queries index** and use in your component.

5. **If the schema also has a backend resolver**, run the full codegen:

   ```bash
   npm run codegen
   ```

   After modifying `.graphql` files, always remind yourself to run codegen — the TypeScript types
   and Go resolver stubs must stay in sync.

### Adding a New UI Component

Follow the three-layer architecture:

- **Primitive** (`libs/ui/primitives/`) — only for new shadcn/Radix wrapper components with zero
  business logic
- **Pattern** (`libs/ui/patterns/`) — composite, reusable, platform-aware components
- **Domain** (`libs/features/*/components/`) — feature-specific, not shared

For a new **pattern** component:

1. Create the headless hook:

   ```ts
   // libs/ui/patterns/src/my-component/useMyComponent.ts
   export function useMyComponent(props: MyComponentProps) {
     // business logic, state, handlers
   }
   ```

2. Create platform presenters:

   ```tsx
   // libs/ui/patterns/src/my-component/MyComponent.mobile.tsx
   export function MyComponentMobile(props: MyComponentProps) { ... }

   // libs/ui/patterns/src/my-component/MyComponent.desktop.tsx
   export function MyComponentDesktop(props: MyComponentProps) { ... }
   ```

3. Create the platform-switching wrapper:

   ```tsx
   // libs/ui/patterns/src/my-component/MyComponent.tsx
   import { usePlatform } from '@nasnet/ui/layouts';

   export function MyComponent(props: MyComponentProps) {
     const platform = usePlatform();
     return platform === 'mobile' ?
         <MyComponentMobile {...props} />
       : <MyComponentDesktop {...props} />;
   }
   ```

4. Export from `libs/ui/patterns/src/index.ts`.

5. Write a Storybook story (see [Storybook Guide](./storybook.md)).

### Modifying the GraphQL Schema and Running Codegen

Schema files are the single source of truth for the API contract. They live in `schema/` at the
monorepo root.

**Full codegen workflow:**

```bash
# 1. Edit schema files in schema/
# 2. Run full codegen (TypeScript + Go)
npm run codegen

# Or run selectively:
npm run codegen:ts    # TypeScript only
npm run codegen:go    # Go (ent ORM + gqlgen + wire)

# 3. Verify generated code is in sync (also run in CI)
npm run codegen:check
```

The codegen produces:

- `libs/api-client/generated/` — TypeScript types, Apollo hooks, Zod schemas
- `apps/backend/graph/generated.go` — Go GraphQL executor
- `apps/backend/graph/model/models_gen.go` — Go model types
- `apps/backend/generated/ent/` — ent ORM code

Never manually edit files in these generated directories. Any hand edits are overwritten on the next
codegen run.

---

## PR Workflow and Code Review

### Before Submitting a PR

Run the full check suite from the monorepo root:

```bash
# Recommended pre-PR check
npm run check          # typecheck + lint sequentially
npm run test           # all frontend tests
npm run build:check    # build + verify bundle size <3MB gzipped
```

For backend changes:

```bash
npm run check:backend  # Go lint + vet + build
npm run test:go        # Go tests
```

For the complete CI suite (mirrors the GitHub Actions pipeline):

```bash
npm run ci             # lint, test, build, typecheck
```

### Commit Message Convention

The project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(firewall): add port-knocking rule editor
fix(dhcp): handle empty lease table gracefully
docs(api-client): clarify codegen workflow
chore(deps): update tanstack-router to 1.157
```

Commitlint enforces this via `@commitlint/cli` and `@commitlint/config-conventional` in the Husky
pre-commit hook.

### Code Review Checklist

When reviewing frontend PRs, verify:

- [ ] New components follow the three-layer architecture
- [ ] Pattern components implement both Mobile and Desktop presenters
- [ ] WCAG AAA contrast maintained (use `@storybook/addon-a11y` to check)
- [ ] 44px minimum touch targets on interactive elements
- [ ] Semantic tokens used (not primitive Tailwind colors)
- [ ] TypeScript passes with zero errors (`npm run typecheck`)
- [ ] Tests cover new business logic
- [ ] Bundle size not regressed (`npm run build:check`)
- [ ] If `.graphql` files changed, codegen was re-run and committed

### Nx Affected (Speed Up CI)

When working on a feature branch, run only affected checks:

```bash
npx nx affected -t build   # Build only what changed
npx nx affected -t test    # Test only what changed
npx nx affected -t lint    # Lint only what changed
```

Nx computes affected projects based on the git diff against the base branch.
