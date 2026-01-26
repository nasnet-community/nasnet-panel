# Development Environment

## Prerequisites

- **Node.js 20+**
- **Go 1.22+**
- **Docker Desktop** (or equivalent)
- **Git**
- **MikroTik CHR** (Optional, for integration testing)

## Setup Commands

```bash
# Clone and install
git clone https://github.com/nasnet/nasnet.git
cd nasnet
npm install

# Generate Code (GraphQL Types, Hooks, ORM)
npm run generate        # Runs graphql-codegen and ent generate

# Development (Concurrent)
npm run dev             # Starts Frontend (5173) and Backend (8080)

# Backend Only
cd backend && go run ./cmd/server

# Testing
npm run test            # Vitest (Unit)
npm run test:e2e        # Playwright (E2E)
npm run storybook       # Component docs

# Build
npm run build           # Production build (Frontend + Backend)
docker build -t nasnet:dev .

# Deploy to Router (SSH)
docker save nasnet:dev | ssh router "docker load"
```

## GraphQL Workflow

1.  **Modify Schema:** Edit `backend/graph/schema/*.graphql`
2.  **Generate Backend:** Run `go generate ./...` in `backend/`
3.  **Implement Resolver:** Update `backend/graph/resolvers/*.go`
4.  **Create Query:** Create/Edit `libs/api-client/operations/src/**/*.graphql`
5.  **Generate Frontend:** Run `npm run generate`
6.  **Use Hook:** Import generated hook (e.g., `useGetRouterStatusQuery`) in React component

---
