# Build System

The `apps/connect` frontend is built with **Vite** via the `@nx/vite` Nx executor. All Vite configuration lives in `apps/connect/vite.config.ts`.

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run dev:frontend` | Start Vite dev server on port 5173 with HMR |
| `npx nx build connect` | Production build to `dist/apps/connect/` |
| `npm run build:check` | Build + verify bundle size |
| `npm run check:frontend` | Lint + typecheck + build |
| `npx nx run connect:storybook` | Storybook on port 4402 |

## Vite Configuration

**Source:** `apps/connect/vite.config.ts`

```ts
export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/connect',
  // ...
}));
```

The config is a function of `mode` (`"development"` | `"production"`) so that certain plugins and options are conditionally applied.

### Path Aliases

Defined under `resolve.alias`. See [Library Dependencies](./library-dependencies.md) for the full alias table. These aliases are resolved at build time by Vite and mirrored in `tsconfig.app.json` for TypeScript.

### Dev Server

```ts
server: {
  port: 5173,
  host: true,        // binds to 0.0.0.0 (accessible from LAN)
  strictPort: true,  // fails fast if port is occupied
  open: true,        // opens browser on start
  proxy: {
    '/api': {
      target: process.env.VITE_PROXY_URL || 'http://localhost:80',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

All `/api/*` requests are proxied to the Go backend. The default target is `http://localhost:80` (the production port inside Docker), overridable via `VITE_PROXY_URL` in `.env.development`.

### Preview Server

```ts
preview: {
  port: 5173,
  host: 'localhost',
},
```

`vite preview` serves the production build locally for final verification before Docker packaging.

## Plugins

Plugins are applied conditionally by mode:

```ts
plugins: [
  TanStackRouterVite({ routeFileIgnorePattern: '\\.stories\\.' }),  // always
  react(),                                                           // always
  mode !== 'production' && designTokensHMR(),                        // dev only
  mode !== 'production' && checker({ typescript: true }),            // dev only
].filter(Boolean),
```

### TanStackRouterVite

Auto-generates `src/routeTree.gen.ts` from the file system on every save. The `routeFileIgnorePattern` excludes `.stories.tsx` files so Storybook story files co-located with routes are not registered as routes.

### @vitejs/plugin-react

Standard React plugin: JSX transform, Fast Refresh (HMR for React components).

### designTokensHMR (custom plugin)

```ts
function designTokensHMR(): Plugin {
  return {
    name: 'design-tokens-hmr',
    configureServer(server) {
      const tokensPath = resolve(..., '../../libs/ui/tokens/src/tokens.json');
      server.watcher.add(tokensPath);
      server.watcher.on('change', async (path) => {
        if (path.includes('tokens.json')) {
          // 1. Run the token build script (Node.js)
          spawn('node', ['libs/ui/tokens/build.js'], ...);
          // 2. Invalidate the CSS module and trigger full-reload
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
```

When `libs/ui/tokens/src/tokens.json` changes, this plugin:
1. Rebuilds the design token CSS (`libs/ui/tokens/dist/variables.css`) and Tailwind config
2. Invalidates the CSS module in Vite's module graph
3. Triggers a full HMR reload so the new CSS custom properties take effect

This enables live design-token editing without restarting the dev server.

### vite-plugin-checker

Runs TypeScript type-checking in a background worker thread during development. Type errors appear as browser overlays and terminal output without blocking HMR. Disabled in production builds to avoid doubling compile time (CI runs `tsc` separately).

## Production Build

```ts
build: {
  outDir: '../../dist/apps/connect',
  emptyOutDir: true,
  target: 'es2020',
  minify: 'terser',
  sourcemap: mode !== 'production',   // source maps in dev/staging only
  reportCompressedSize: true,
  terserOptions: {
    compress: {
      drop_console: mode === 'production',   // strips console.log in prod
      drop_debugger: true,
    },
  },
},
```

- **Target:** ES2020. MikroTik's CHR-based management browser is Chromium-based; ES2020 is safe.
- **Minifier:** Terser (more aggressive than esbuild's default minification)
- **Console stripping:** `console.log` calls are removed in production builds
- **Sourcemaps:** Generated in development and staging, disabled in production to reduce output size
- **Output directory:** `dist/apps/connect/` — the Go backend embeds this directory at build time

## Manual Chunk Splitting

Rollup's `manualChunks` is configured to split vendor code into stable named chunks. This maximises browser cache hit rates: when app code changes, vendor chunks are unchanged and remain cached.

```ts
rollupOptions: {
  output: {
    manualChunks: {
      'vendor-react':     ['react', 'react-dom', 'scheduler'],
      'vendor-router':    ['@tanstack/react-router'],
      'vendor-graphql':   ['@apollo/client', 'graphql'],
      'vendor-state':     ['zustand', 'xstate', '@xstate/react'],
      'vendor-animation': ['framer-motion'],
      'vendor-ui': [
        '@radix-ui/react-dialog',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-switch',
        '@radix-ui/react-select',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-popover',
      ],
      'vendor-table':  ['@tanstack/react-table', '@tanstack/react-virtual'],
      'vendor-forms':  ['react-hook-form', '@hookform/resolvers', 'zod'],
      'vendor-i18n':   ['i18next', 'react-i18next', 'i18next-http-backend', 'i18next-browser-languagedetector'],
    },
  },
},
```

### Chunk Strategy

| Chunk | Libraries | Reason |
|-------|-----------|--------|
| `vendor-react` | react, react-dom, scheduler | Essential, loads first, never changes |
| `vendor-router` | @tanstack/react-router | Needed immediately for navigation |
| `vendor-graphql` | @apollo/client, graphql | Needed for all data fetching |
| `vendor-state` | zustand, xstate | UI and workflow state |
| `vendor-animation` | framer-motion | Large library, isolated for caching |
| `vendor-ui` | Radix UI components | Stable primitives |
| `vendor-table` | react-table, react-virtual | Only needed on data-heavy pages |
| `vendor-forms` | react-hook-form, zod | Only needed on form pages |
| `vendor-i18n` | i18next stack | Loaded async after initial paint |

Heavy tab components (Firewall, Logs, DHCP, DNS, VPN, PluginStore, Network) are further split by TanStack Router's lazy loading. See [Routing — Lazy Loading Strategy](./routing.md#lazy-loading-strategy).

## Bundle Size Budget

The project targets `<3MB gzipped` for the frontend bundle. This constraint is enforced by the Docker image size limit of `<10MB` (which embeds the frontend).

`reportCompressedSize: true` in the Vite build config outputs gzipped sizes to the terminal after every build. The CI pipeline runs `npm run build:check` to catch regressions.

## TypeScript Configuration

**Source:** `apps/connect/tsconfig.json`, `apps/connect/tsconfig.app.json`

```json
// tsconfig.json — project references only
{
  "extends": "../../tsconfig.base.json",
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.spec.json" },
    { "path": "./tsconfig.storybook.json" }
  ]
}
```

```json
// tsconfig.app.json — source files
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["dom"],
    "types": ["node", "@nx/react/typings/cssmodule.d.ts", "vite/client"],
    "baseUrl": ".",
    "paths": { /* all @nasnet/* aliases */ }
  },
  "include": ["src/**/*.{js,jsx,ts,tsx}"]
}
```

The project uses TypeScript **project references**: separate `tsconfig.*.json` files for `app`, `spec` (tests), and `storybook` code. This allows the type-checker to only re-check affected files.

### Running Type Checks

```bash
# Check all four tsconfigs in parallel
npx nx run connect:typecheck

# Or directly:
tsc --noEmit --project apps/connect/tsconfig.app.json
tsc --noEmit --project apps/connect/tsconfig.spec.json
tsc --noEmit --project apps/connect/tsconfig.storybook.json
tsc --noEmit --project apps/connect/.storybook/tsconfig.json
```

## Tailwind CSS Configuration

**Source:** `apps/connect/tailwind.config.js`

```js
const tokenConfig = require('../../libs/ui/tokens/dist/tailwind.config.js');

module.exports = {
  darkMode: 'class',
  content: [
    join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    join(__dirname, '../../libs/**/*.{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: { extend: { /* merged token config */ } },
};
```

**Key points:**
- `darkMode: 'class'` — dark mode is activated by adding `.dark` to `<html>` (managed by `ThemeProvider`)
- Content scanning covers both `apps/connect/src` and all `libs/**` directories so utility classes in library components are included in the purge
- `.stories` and `.spec` files are excluded from content scanning to avoid Tailwind processing test/story-only classes
- Token values are imported from the pre-compiled `libs/ui/tokens/dist/tailwind.config.js` (output of the design token pipeline)
- The `createGlobPatternsForDependencies(__dirname)` call adds Nx-managed dependency paths automatically

### Design Token Integration

Design tokens flow through Tailwind as CSS custom properties:

```
libs/ui/tokens/src/tokens.json   (source of truth)
         │
         ▼ (npm run codegen or designTokensHMR plugin)
libs/ui/tokens/dist/variables.css     (CSS custom properties)
libs/ui/tokens/dist/tailwind.config.js (Tailwind color/spacing values)
         │
         ▼ (imported in tailwind.config.js)
Tailwind utility classes → compiled CSS
```

Semantic token usage in components:

```tsx
// Good — semantic tokens
<Button className="bg-primary text-primary-foreground">Connect</Button>

// Bad — primitive colors (bypasses the token system)
<Button className="bg-amber-500 text-white">Connect</Button>
```

See `Docs/design/DESIGN_TOKENS.md` for the complete token reference.

## Storybook

Storybook for `apps/connect` runs on port **4402**. The config lives in `apps/connect/.storybook/`.

```bash
npx nx run connect:storybook        # dev server on port 4402
npx nx run connect:build-storybook  # static build to dist/storybook/connect/
npx nx run connect:typecheck:storybook  # typecheck storybook files only
```

Story files (`*.stories.tsx`) are co-located with route and component files. The TanStack Router Vite plugin excludes them from the route tree via `routeFileIgnorePattern: '\\.stories\\.'`.

## Environment Variables

Create `apps/connect/.env.development` for local overrides:

```env
VITE_API_URL=http://localhost:8080
VITE_PROXY_URL=http://localhost:80
```

`VITE_PROXY_URL` controls where the dev server proxies `/api/*` requests. Prefix all app-visible environment variables with `VITE_` so Vite includes them in the client bundle.

## Related Documents

- [Architecture Overview](./overview.md)
- [Library Dependencies](./library-dependencies.md)
- [Routing — Lazy Loading Strategy](./routing.md#lazy-loading-strategy)
- [Getting Started — Development Setup](../getting-started/environment-setup.md)
