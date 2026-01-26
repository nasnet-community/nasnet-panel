# Project Initialization

## Starter Template

**Command:**
```bash
npx nx generate @nx/react:application connect --bundler=vite --style=tailwind --routing
npx shadcn@latest init
```

**Provides:**
- Nx monorepo with React application
- Vite bundler (optimized for small bundles)
- Tailwind CSS integration
- React Router for navigation
- shadcn/ui component foundation

## Post-Initialization Setup

```bash
# Install core dependencies
npm install @tanstack/react-query zustand xstate @xstate/react
npm install axios socket.io-client
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion date-fns
npm install lucide-react

# Install dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D @storybook/react-vite chromatic
```

---
