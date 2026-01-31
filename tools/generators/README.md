# NasNet Code Generators

Custom Nx generators for scaffolding code following NasNet project conventions.

## Available Generators

### Component Generator

Generate React components following NasNet conventions with TypeScript, shadcn/ui patterns, tests, and barrel exports.

```bash
# Basic usage
nx g @nasnet/tools:component MyComponent --project=connect

# With custom directory
nx g @nasnet/tools:component MyComponent --project=connect --directory=components/shared

# With CVA variants
nx g @nasnet/tools:component Button --project=ui-primitives --withVariants

# Preview without writing files
nx g @nasnet/tools:component MyComponent --project=connect --dry-run
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `name` | Component name (PascalCase) | Required |
| `project` | Target project | Required |
| `directory` | Directory within src | `components` |
| `withVariants` | Include CVA variants setup | `false` |
| `withForwardRef` | Use forwardRef pattern | `true` |
| `dryRun` | Preview without writing | `false` |

**Generated files:**
```
src/{directory}/{component-name}/
├── {ComponentName}.tsx       # Component with TypeScript + shadcn patterns
├── {ComponentName}.test.tsx  # Vitest tests with React Testing Library
└── index.ts                  # Barrel export
```

### Library Generator

Generate new libraries following ADR-003 conventions with proper scope tags and Nx configuration.

```bash
# Create a feature library
nx g @nasnet/tools:library auth --directory=libs/features

# Create a core utility library
nx g @nasnet/tools:library network-utils --directory=libs/core

# Create a UI library
nx g @nasnet/tools:library buttons --directory=libs/ui

# Preview without writing files
nx g @nasnet/tools:library my-lib --directory=libs/features --dry-run
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `name` | Library name (kebab-case) | Required |
| `directory` | Directory (libs/core, libs/ui, libs/features, etc.) | Required |
| `scope` | Scope tag override | Auto from directory |
| `description` | Library description | Generated |
| `dryRun` | Preview without writing | `false` |

**Generated files:**
```
{directory}/{name}/
├── project.json       # Nx project configuration
├── tsconfig.json      # TypeScript configuration
├── tsconfig.lib.json  # Library TS config
├── README.md          # Documentation
├── package.json       # Package manifest
└── src/
    └── index.ts       # Entry point
```

**Scope Tags (ADR-003):**
- `libs/core/*` → `scope:core`
- `libs/ui/*` → `scope:ui`
- `libs/features/*` → `scope:features`
- `libs/api-client/*` → `scope:api-client`
- `libs/state/*` → `scope:state`

### Resolver Generator

Generate Go GraphQL resolvers following gqlgen patterns for the backend backend.

```bash
# Basic resolver
nx g @nasnet/tools:resolver Interface

# With custom module
nx g @nasnet/tools:resolver DHCPLease --module=network

# Query-only resolver
nx g @nasnet/tools:resolver Route --withQuery --withMutation=false

# Mutation-only resolver
nx g @nasnet/tools:resolver Backup --withQuery=false --withMutation

# Preview without writing files
nx g @nasnet/tools:resolver Custom --dry-run
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `name` | Resolver name (PascalCase) | Required |
| `module` | Module/domain for the resolver | `graph` |
| `withQuery` | Include list/get operations | `true` |
| `withMutation` | Include CRUD operations | `true` |
| `dryRun` | Preview without writing | `false` |

**Generated files:**
```
apps/backend/{module}/
├── {name}_resolvers.go       # Resolver implementation
└── {name}_resolvers_test.go  # Tests with testify
```

## Quick Commands

For convenience, npm scripts are available:

```bash
npm run g:component MyComponent -- --project=connect
npm run g:library my-lib -- --directory=libs/features
npm run g:resolver Interface
```

## Development

### Running Tests

```bash
# Run all generator tests
nx test tools

# Run specific generator tests
npx vitest run tools/generators/component/generator.spec.ts
```

### Adding New Generators

1. Create a new directory under `tools/generators/{name}/`
2. Add `schema.json` with generator options
3. Add `generator.ts` with implementation
4. Add template files in `files/` subdirectory
5. Register in `generators.json`
6. Add tests in `generator.spec.ts`

## Architecture

Generators use `@nx/devkit` for:
- Tree manipulation (virtual filesystem)
- File generation from templates
- Project configuration reading/writing
- Formatting output files

Template files use EJS syntax with `__variable__` placeholders in filenames.
