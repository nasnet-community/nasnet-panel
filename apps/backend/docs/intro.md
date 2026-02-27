---
sidebar_position: 1
title: Introduction
---

# Backend (Go)

The **Backend** is a Go service that serves as the core of NasNet. It manages router connections, provides a GraphQL API, and handles service orchestration.

## Tech Stack

- **Go** with hexagonal architecture (ports and adapters)
- **gqlgen** for GraphQL server
- **ent** ORM for database management
- **Watermill** for event-driven messaging

## Key Concepts

- **Router management** — SSH, Telnet, REST, and RouterOS API protocol adapters
- **Service orchestration** — Lifecycle management for downloadable features (Tor, Xray, sing-box, etc.)
- **Event bus** — Domain events for decoupled service communication
- **Provisioning** — Network configuration with rollback support

## Getting Started

```bash
# Start the backend dev server (with hot reload)
npm run dev:backend

# Run Go tests
npx nx run backend:test

# Build the backend
npx nx build backend
```

## Project Structure

```
apps/backend/
├── cmd/nnc/              # Application entry points
├── graph/                # GraphQL schema, resolvers, and generated code
├── internal/             # Core domain logic (hexagonal architecture)
│   ├── auth/             # Authentication and authorization
│   ├── orchestrator/     # Service lifecycle management
│   ├── provisioning/     # Network provisioning engine
│   ├── router/           # Router protocol adapters
│   └── vif/              # Virtual Interface Factory
└── Dockerfile            # Multi-stage Docker build (<10MB)
```
