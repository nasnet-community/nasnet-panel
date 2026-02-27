---
sidebar_position: 2
title: Environment Setup
---

# Environment Setup

This guide walks you through getting the `apps/connect` frontend running locally.

---

## Prerequisites

### Required

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x LTS | Required for npm workspaces and build scripts |
| npm | 10.x | Included with Node 20 |
| Go | 1.22+ | Required to run the backend (`apps/backend`) |

### Optional but Recommended

| Tool | Purpose |
|------|---------|
| Docker Desktop | Build and test the production Docker image |
| `air` (Go) | Hot reload for the Go backend during development |
| VS Code | Recommended editor with extensions below |

### Recommended VS Code Extensions

- **ESLint** — Real-time linting feedback
- **Prettier** — Auto-formatting on save
- **Tailwind CSS IntelliSense** — Autocomplete for Tailwind classes and design tokens
- **GraphQL: Language Feature Support** — Schema-aware GraphQL editing
- **vscode-go** — Go language support (for backend work)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd NasNet
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages across all workspaces (npm workspaces handles `apps/*`, `libs/*`, `tools/*`).

### 3. Create Environment File

Create `apps/connect/.env.development`:

```env
VITE_API_URL=http://localhost:8080
VITE_PROXY_URL=http://localhost:80
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:8080` | Backend API base URL |
| `VITE_PROXY_URL` | `http://localhost:80` | URL the Vite dev proxy forwards `/api/*` requests to |

### 4. Build Design Tokens (First Time)

Design tokens must be compiled from source before the dev server starts:

```bash
npm run tokens:build
```

This compiles `libs/ui/tokens/src/tokens.json` into `libs/ui/tokens/dist/variables.css`.

> During development the Vite dev server watches `tokens.json` and rebuilds automatically via the `designTokensHMR` plugin defined in `apps/connect/vite.config.ts`.

---

## Starting the Dev Server

### Frontend Only (Most Common)

```bash
npm run dev:frontend
```

Opens the Vite dev server at **http://localhost:5173**.

The dev server:
- Serves the React app with HMR (hot module replacement)
- Proxies `/api/*` requests to `VITE_PROXY_URL` (default: `http://localhost:80`)
- Watches and rebuilds design tokens on change
- Runs the TypeScript type checker in overlay mode (errors appear in browser)

### Frontend + Backend Together

```bash
npm run dev:all
```

Starts both the Vite dev server and the Go backend (with `air` hot reload) in parallel.

### Backend Only

```bash
npm run dev:backend
```

Starts the Go backend at port 8080. Required if you need live API calls during frontend development.

---

## Dev Server Configuration

The Vite dev server is configured in `apps/connect/vite.config.ts`:

```typescript
server: {
  port: 5173,        // Frontend port
  host: true,        // Bind to all interfaces (useful in containers)
  strictPort: true,  // Fail if port is taken
  open: true,        // Auto-open browser on start
  proxy: {
    '/api': {
      target: process.env.VITE_PROXY_URL || 'http://localhost:80',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

All requests to `/api/*` are forwarded to the backend. This means you can develop against a real MikroTik router or a local CHR (Cloud Hosted Router) simulator.

---

## Development Tools

### XState Inspector

In development mode, the app automatically launches the **XState Visual Inspector** in a separate browser tab/window. This gives you a visual state machine diagram for all active XState machines.

This is initialized in `apps/connect/src/main.tsx`:

```typescript
if (import.meta.env.DEV) {
  import('@statelyai/inspect').then(({ createBrowserInspector }) => {
    createBrowserInspector({ autoStart: true });
  });
}
```

### TanStack Router Devtools

When running in development mode, TanStack Router Devtools appear in the bottom-right corner of the page (injected in `apps/connect/src/routes/__root.tsx`). These show the current route tree, active params, and navigation history.

### Mock Service Worker (MSW)

The project includes MSW handlers for mocking API responses during development and testing:

- `apps/connect/src/mocks/handlers/graphql.ts` — GraphQL operation mocks
- `apps/connect/src/mocks/handlers/rest.ts` — REST endpoint mocks
- `apps/connect/src/mocks/browser.ts` — Browser MSW worker setup
- `apps/connect/src/mocks/server.ts` — Node MSW server setup (for tests)

---

## Recommended Browser Extensions

| Extension | Browser | Purpose |
|-----------|---------|---------|
| Apollo Client DevTools | Chrome/Firefox | Inspect Apollo cache, queries, mutations |
| React Developer Tools | Chrome/Firefox | Component tree inspection |

---

## Troubleshooting

### Port 5173 Already in Use

The dev server uses `strictPort: true`, so it will exit rather than use a different port. Kill the process using port 5173:

```bash
# macOS/Linux
lsof -i :5173 | grep LISTEN
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### TypeScript Errors in Browser Overlay

The dev server runs the TypeScript type checker as a Vite plugin. Errors appear as an overlay. Fix the TypeScript error and the overlay disappears automatically.

### Design Token Variables Missing

If CSS custom properties like `--color-primary` are missing, rebuild the tokens:

```bash
npm run tokens:build
```

### GraphQL Codegen Out of Date

If TypeScript reports type errors in generated files, regenerate:

```bash
npm run codegen
```

---

## Next Steps

- [Project Structure](./project-structure.md) — Understand the directory layout
- [Key Commands](./key-commands.md) — Full command reference
- [Architecture Overview](../architecture/overview.md) — How the app is structured
