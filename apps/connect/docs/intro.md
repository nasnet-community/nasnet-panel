---
sidebar_position: 1
title: Introduction
---

# Frontend (Connect)

The **Connect** app is the main React frontend for NasNet. It provides an adaptive, responsive UI
for managing MikroTik routers across mobile, tablet, and desktop platforms.

## Tech Stack

- **React 18** with TypeScript
- **TanStack Router** for file-based routing
- **Apollo Client** for GraphQL data fetching and caching
- **Tailwind CSS 4** with 200+ design tokens
- **Vite 7** for fast development builds

## Key Concepts

- **Adaptive UI** — Every component implements platform-specific presenters (Mobile/Tablet/Desktop)
- **Three-layer components** — Primitives, Patterns, and Domain layers
- **State management** — Apollo Client for server state, Zustand for UI, XState for complex flows
- **Form handling** — React Hook Form + Zod schema validation

## Getting Started

```bash
# Start the frontend dev server
npm run dev:frontend

# Build for production
npm run build:frontend

# Run tests
npx nx test connect
```

## Project Structure

```
apps/connect/
├── src/
│   ├── app/           # Pages, routes, and app-level components
│   ├── components/    # App-specific shared components
│   ├── routes/        # TanStack Router file-based routes
│   └── styles.css     # Global styles and Tailwind entry
├── public/            # Static assets
└── vite.config.ts     # Vite configuration with path aliases
```
