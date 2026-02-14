# Service Templates - Testing Guide

This document provides comprehensive testing scenarios, GraphQL queries, test fixtures, and utilities for the Service Templates feature (NAS-8.9).

## Table of Contents

1. [Integration Test Scenarios](#integration-test-scenarios)
2. [GraphQL Test Queries](#graphql-test-queries)
3. [Test Fixtures](#test-fixtures)
4. [Backend Test Utilities](#backend-test-utilities)
5. [Setup and Teardown](#setup-and-teardown)

---

## Integration Test Scenarios

### Scenario 1: Install Built-in Template (Tor Exit Node)

**Objective:** Verify that a built-in single-service template can be installed successfully with variable substitution.

**Prerequisites:**
- Router is connected and available
- No existing Tor instance with the same name
- Database is initialized

**Test Steps:**
1. Query available templates: `listServiceTemplates(routerId: "router-1")`
2. Verify "Tor Exit Node" template exists in the response
3. Subscribe to installation progress: `templateInstallProgress(routerId: "router-1")`
4. Execute mutation: `installServiceTemplate` with variables:
   ```json
   {
     "templateId": "tor-exit-node",
     "routerId": "router-1",
     "variables": {
       "EXIT_NODE_NAME": "tor-exit-us-1",
       "BANDWIDTH_LIMIT": "100"
     }
   }
   ```
5. Monitor subscription for progress events:
   - `TEMPLATE_INSTALL_STARTED`
   - `SERVICE_INSTALLING` (for tor service)
   - `SERVICE_INSTALLED` (for tor service)
   - `TEMPLATE_INSTALL_COMPLETED`

**Expected Outcomes:**
- ✅ Template installs successfully
- ✅ Instance created with ID returned in `instanceIds` array
- ✅ Service name is "tor-exit-us-1" (variable substituted)
- ✅ Config contains bandwidth limit of 100MB
- ✅ All subscription events received in correct order
- ✅ Service instance is running and healthy

**Edge Cases to Test:**
- Missing required variable → Validation error before installation
- Invalid variable value (negative bandwidth) → Validation error
- Router unavailable → Installation fails with rollback
- Duplicate instance name → Validation error

---

### Scenario 2: Install Multi-Service Template with Dependencies

**Objective:** Verify dependency ordering during installation of a template with multiple services.

**Prerequisites:**
- Router is connected
- No existing instances with conflicting names
- Sufficient resources available

**Test Steps:**
1. Use the "Censorship-Resistant Stack" built-in template (or create a custom multi-service template)
2. Execute dry-run first: `installServiceTemplate` with `dryRun: true`
3. Verify dry-run returns success without creating instances
4. Execute actual installation with variables
5. Monitor installation progress via subscription

**Expected Outcomes:**
- ✅ Dry-run succeeds and returns validation results
- ✅ Services are installed in dependency order (e.g., bridge before client)
- ✅ All services reference each other correctly
- ✅ `serviceMapping` in response maps template service names to instance IDs
- ✅ All instances are healthy after installation

**Dependency Order Test:**
- Given services A, B, C where B depends on A, and C depends on B
- Installation order should be: A → B → C
- Verify via subscription events timestamps

---

### Scenario 3: Export Running Instance as Custom Template

**Objective:** Convert a running service instance into a reusable template.

**Prerequisites:**
- At least one running service instance (e.g., Tor)
- Instance has custom configuration

**Test Steps:**
1. Create and start a Tor instance with custom config:
   - ExitPolicy custom rules
   - Bandwidth limits
   - Custom ports
2. Execute mutation: `exportAsTemplate`
   ```graphql
   mutation {
     exportAsTemplate(
       routerId: "router-1"
       instanceId: "instance-123"
       templateName: "My Custom Tor Setup"
       templateDescription: "Tor with custom exit policy"
     ) {
       id
       name
       description
       category
       scope
       services {
         serviceType
         name
         configOverrides
         portMappings {
           internal
           external
         }
       }
       configVariables {
         name
         description
         type
         defaultValue
       }
     }
   }
   ```
3. Verify returned template structure
4. Query `listServiceTemplates` to confirm new template exists
5. Install the exported template to verify it works

**Expected Outcomes:**
- ✅ Template created with correct metadata
- ✅ Config variables extracted from instance config (e.g., `{{EXIT_POLICY}}`)
- ✅ Port mappings preserved
- ✅ Resource limits captured in `estimatedResources`
- ✅ Template is immediately available for installation
- ✅ Installing exported template creates identical instance

**Variable Extraction Test:**
- Original instance config: `"bandwidth_limit": "500MB"`
- Exported template should have:
  - ConfigVariable: `BANDWIDTH_LIMIT` with default value "500"
  - Service config: `"bandwidth_limit": "{{BANDWIDTH_LIMIT}}MB"`

---

### Scenario 4: Import Custom Template from JSON

**Objective:** Import a user-created template from a JSON file.

**Prerequisites:**
- Valid template JSON file (see [Test Fixtures](#test-fixtures))
- Router is connected

**Test Steps:**
1. Prepare custom template JSON (see `testdata/valid_custom_template.json`)
2. Execute mutation: `importServiceTemplate`
   ```graphql
   mutation {
     importServiceTemplate(
       routerId: "router-1"
       templateJson: "{ ... }"  # JSON string
       overwrite: false
     ) {
       id
       name
       category
       services {
         serviceType
         name
       }
     }
   }
   ```
3. Verify template validation passes
4. Query `listServiceTemplates` to confirm import
5. Install imported template

**Expected Outcomes:**
- ✅ Template imported successfully
- ✅ Validation checks pass (no circular dependencies, valid variable refs)
- ✅ Template appears in list
- ✅ Template can be installed
- ✅ Overwrite protection works (importing same ID twice fails unless `overwrite: true`)

**Validation Error Cases:**
- Circular dependency → Import fails with validation error
- Invalid variable reference → Import fails
- Unknown service type → Import fails
- Invalid category/scope → Import fails

---

### Scenario 5: Dependency Ordering and Cycle Detection

**Objective:** Verify topological sort handles complex dependency graphs and rejects cycles.

**Prerequisites:**
- Custom templates with various dependency patterns

**Test Cases:**

**Case 5a: Linear Dependencies**
```
A → B → C → D
```
Expected order: A, B, C, D

**Case 5b: Diamond Dependencies**
```
    A
   / \
  B   C
   \ /
    D
```
Expected order: A, then B and C (parallel), then D

**Case 5c: Circular Dependency (should fail)**
```
A → B → C → A
```
Expected: Import/validation fails with "circular dependency detected"

**Test Steps:**
1. Create template JSONs for each case (see `testdata/dependency_*.json`)
2. Import templates
3. For valid cases: verify installation order via subscription events
4. For circular case: verify validation error during import

**Expected Outcomes:**
- ✅ Linear dependencies install in correct order
- ✅ Diamond dependencies install A first, then B/C in parallel, then D
- ✅ Circular dependency rejected during template validation
- ✅ Error message indicates which services form the cycle

---

### Scenario 6: Rollback on Installation Failure

**Objective:** Verify automatic rollback when installation fails mid-process.

**Prerequisites:**
- Multi-service template
- Ability to simulate failure (e.g., insufficient resources, network error)

**Test Steps:**
1. Install a 3-service template where the 2nd service will fail:
   - Service A: succeeds
   - Service B: fails (simulate by using invalid config or resource exhaustion)
   - Service C: should not be attempted
2. Monitor subscription events
3. Verify rollback occurs

**Expected Outcomes:**
- ✅ Service A installs successfully
- ✅ Service B fails during installation
- ✅ Rollback initiated automatically
- ✅ Service A is stopped and deleted
- ✅ `TEMPLATE_INSTALL_FAILED` event emitted with error details
- ✅ No instances remain after rollback
- ✅ Service C installation never attempted

**Rollback Verification:**
- Query `listServiceInstances` → empty or unchanged from before
- Check instance manager → no orphaned processes
- Check database → no orphaned service instance records

---

### Scenario 7: WebSocket Subscription Events

**Objective:** Verify all installation events are emitted correctly via GraphQL subscription.

**Prerequisites:**
- WebSocket connection established
- Template ready to install

**Test Steps:**
1. Subscribe to `templateInstallProgress(routerId: "router-1")`
2. Install any template
3. Collect all events

**Expected Event Sequence:**
```javascript
// Event 1: Installation started
{
  "type": "STARTED",
  "templateId": "tor-exit-node",
  "routerId": "router-1",
  "timestamp": "2026-02-13T10:00:00Z"
}

// Event 2: Service installing (per service)
{
  "type": "SERVICE_INSTALLING",
  "serviceName": "tor-exit-us-1",
  "serviceType": "tor",
  "progress": 0.33,  // 1 of 3 services
  "message": "Installing tor-exit-us-1..."
}

// Event 3: Service installed
{
  "type": "SERVICE_INSTALLED",
  "serviceName": "tor-exit-us-1",
  "instanceId": "instance-abc-123",
  "progress": 0.66
}

// Event 4: Installation completed
{
  "type": "COMPLETED",
  "instanceIds": ["instance-abc-123"],
  "serviceMapping": {
    "tor-service": "instance-abc-123"
  },
  "duration": 12.5  // seconds
}
```

**Expected Outcomes:**
- ✅ All events received in correct order
- ✅ Progress percentage increases monotonically
- ✅ Event filtering works (only events for specified routerId)
- ✅ Timestamps are sequential
- ✅ WebSocket connection remains stable throughout installation

**Error Event Test:**
- Simulate failure during installation
- Verify `FAILED` event with error details

---

## GraphQL Test Queries

### Query: List Service Templates

```graphql
query ListTemplates($routerId: ID!) {
  listServiceTemplates(routerId: $routerId) {
    id
    name
    description
    category
    scope
    version
    author
    tags
    services {
      serviceType
      name
      configOverrides
      dependsOn
      memoryLimitMB
      cpuShares
      requiresBridge
      vlanId
      portMappings {
        internal
        external
        protocol
      }
    }
    configVariables {
      name
      description
      type
      required
      defaultValue
      minValue
      maxValue
      enumValues
    }
    suggestedRouting {
      devicePattern
      serviceIndex
      routerChainIds
    }
    estimatedResources {
      memoryMB
      cpuShares
      diskMB
      networkBandwidthMbps
    }
    prerequisites
    documentation
    examples
  }
}
```

**Variables:**
```json
{
  "routerId": "router-1"
}
```

---

### Mutation: Install Service Template (with Dry-Run)

```graphql
mutation InstallTemplate(
  $templateId: ID!
  $routerId: ID!
  $variables: Map!
  $dryRun: Boolean
) {
  installServiceTemplate(
    input: {
      templateId: $templateId
      routerId: $routerId
      variables: $variables
      dryRun: $dryRun
    }
  ) {
    success
    instanceIds
    serviceMapping
    errors {
      field
      message
    }
    validationWarnings
  }
}
```

**Variables (Tor Exit Node):**
```json
{
  "templateId": "tor-exit-node",
  "routerId": "router-1",
  "variables": {
    "EXIT_NODE_NAME": "tor-exit-us-1",
    "BANDWIDTH_LIMIT": "100",
    "EXIT_POLICY": "accept *:80,accept *:443,reject *:*"
  },
  "dryRun": false
}
```

**Variables (Multi-Service Stack):**
```json
{
  "templateId": "censorship-resistant-stack",
  "routerId": "router-1",
  "variables": {
    "BRIDGE_NAME": "bridge-1",
    "BRIDGE_PORT": "9001",
    "CLIENT_NAME": "client-1",
    "CLIENT_SOCKS_PORT": "9050"
  },
  "dryRun": false
}
```

---

### Mutation: Export as Template

```graphql
mutation ExportTemplate(
  $routerId: ID!
  $instanceId: ID!
  $templateName: String!
  $templateDescription: String!
) {
  exportAsTemplate(
    routerId: $routerId
    instanceId: $instanceId
    templateName: $templateName
    templateDescription: $templateDescription
  ) {
    id
    name
    description
    category
    scope
    services {
      serviceType
      name
      configOverrides
      portMappings {
        internal
        external
      }
    }
    configVariables {
      name
      type
      defaultValue
    }
    estimatedResources {
      memoryMB
      cpuShares
    }
  }
}
```

**Variables:**
```json
{
  "routerId": "router-1",
  "instanceId": "instance-tor-123",
  "templateName": "My Custom Tor Setup",
  "templateDescription": "Tor exit node with custom policy and bandwidth limits"
}
```

---

### Mutation: Import Service Template

```graphql
mutation ImportTemplate(
  $routerId: ID!
  $templateJson: String!
  $overwrite: Boolean
) {
  importServiceTemplate(
    routerId: $routerId
    templateJson: $templateJson
    overwrite: $overwrite
  ) {
    id
    name
    category
    scope
    services {
      serviceType
      name
    }
    configVariables {
      name
      required
    }
  }
}
```

**Variables:**
```json
{
  "routerId": "router-1",
  "templateJson": "{ \"id\": \"custom-vpn-setup\", \"name\": \"Custom VPN\", ... }",
  "overwrite": false
}
```

---

### Mutation: Delete Service Template

```graphql
mutation DeleteTemplate($routerId: ID!, $templateId: ID!) {
  deleteServiceTemplate(routerId: $routerId, templateId: $templateId) {
    success
    message
  }
}
```

**Variables:**
```json
{
  "routerId": "router-1",
  "templateId": "custom-vpn-setup"
}
```

---

### Subscription: Template Install Progress

```graphql
subscription InstallProgress($routerId: ID!) {
  templateInstallProgress(routerId: $routerId) {
    type  # STARTED, SERVICE_INSTALLING, SERVICE_INSTALLED, COMPLETED, FAILED
    templateId
    routerId
    serviceName
    serviceType
    instanceId
    progress  # 0.0 to 1.0
    message
    error
    timestamp
  }
}
```

**Variables:**
```json
{
  "routerId": "router-1"
}
```

**Example WebSocket Test (using wscat or similar):**
```bash
# Connect
wscat -c ws://localhost:8080/graphql -s graphql-ws

# Send subscription
{"type":"start","id":"1","payload":{"query":"subscription { templateInstallProgress(routerId: \"router-1\") { type serviceName progress message } }"}}

# In another terminal, trigger installation
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { installServiceTemplate(...) }"}'

# Observe events in wscat terminal
```

---

## Test Fixtures

### Directory Structure

```
apps/backend/internal/templates/testdata/
├── valid_templates/
│   ├── tor_exit_node.json
│   ├── multi_service_stack.json
│   └── custom_vpn.json
├── invalid_templates/
│   ├── circular_dependency.json
│   ├── missing_required_field.json
│   ├── invalid_variable_reference.json
│   └── unknown_service_type.json
├── dependency_tests/
│   ├── linear_dependencies.json
│   ├── diamond_dependencies.json
│   └── circular_dependencies.json
└── variable_tests/
    ├── all_variable_types.json
    └── default_values.json
```

### Fixture 1: Valid Custom Template (Tor Exit Node)

**File:** `testdata/valid_templates/tor_exit_node.json`

```json
{
  "id": "custom-tor-exit",
  "name": "Custom Tor Exit Node",
  "description": "Tor exit node with configurable bandwidth and exit policy",
  "category": "privacy",
  "scope": "single",
  "version": "1.0.0",
  "author": "NasNet Team",
  "tags": ["tor", "privacy", "exit-node"],
  "services": [
    {
      "serviceType": "tor",
      "name": "{{EXIT_NODE_NAME}}",
      "configOverrides": {
        "exitPolicy": "{{EXIT_POLICY}}",
        "bandwidthRate": "{{BANDWIDTH_LIMIT}}MB",
        "contactInfo": "{{CONTACT_EMAIL}}"
      },
      "memoryLimitMB": 256,
      "cpuShares": 512,
      "requiresBridge": false,
      "portMappings": [
        {
          "internal": 9001,
          "external": 9001,
          "protocol": "tcp"
        },
        {
          "internal": 9030,
          "external": 9030,
          "protocol": "tcp"
        }
      ]
    }
  ],
  "configVariables": [
    {
      "name": "EXIT_NODE_NAME",
      "description": "Name for the exit node instance",
      "type": "string",
      "required": true,
      "defaultValue": "tor-exit-node"
    },
    {
      "name": "BANDWIDTH_LIMIT",
      "description": "Maximum bandwidth in MB/s",
      "type": "number",
      "required": true,
      "defaultValue": 100,
      "minValue": 1,
      "maxValue": 1000
    },
    {
      "name": "EXIT_POLICY",
      "description": "Tor exit policy rules",
      "type": "string",
      "required": false,
      "defaultValue": "accept *:80,accept *:443,reject *:*"
    },
    {
      "name": "CONTACT_EMAIL",
      "description": "Contact email for node operator",
      "type": "string",
      "required": false,
      "defaultValue": "operator@example.com"
    }
  ],
  "estimatedResources": {
    "memoryMB": 256,
    "cpuShares": 512,
    "diskMB": 50,
    "networkBandwidthMbps": 100
  },
  "prerequisites": [
    "Router must allow outbound connections on ports 9001 and 9030",
    "Minimum 256MB RAM available"
  ],
  "documentation": "This template creates a Tor exit node with customizable bandwidth limits and exit policy. Ensure you understand the legal implications of running an exit node in your jurisdiction.",
  "examples": [
    "Fast exit node: BANDWIDTH_LIMIT=500, EXIT_POLICY=accept *:*",
    "Web-only exit: BANDWIDTH_LIMIT=100, EXIT_POLICY=accept *:80,accept *:443,reject *:*"
  ]
}
```

---

### Fixture 2: Multi-Service Template with Dependencies

**File:** `testdata/valid_templates/multi_service_stack.json`

```json
{
  "id": "censorship-resistant-stack",
  "name": "Censorship-Resistant Stack",
  "description": "Combined Tor bridge and Psiphon for multi-layer censorship circumvention",
  "category": "anti-censorship",
  "scope": "multiple",
  "version": "1.0.0",
  "author": "NasNet Team",
  "tags": ["tor", "psiphon", "censorship", "privacy"],
  "services": [
    {
      "serviceType": "tor",
      "name": "{{BRIDGE_NAME}}",
      "configOverrides": {
        "bridgeRelay": true,
        "extORPort": "auto",
        "serverTransportPlugin": "obfs4 exec /usr/bin/obfs4proxy"
      },
      "memoryLimitMB": 128,
      "cpuShares": 256,
      "requiresBridge": false,
      "portMappings": [
        {
          "internal": 9001,
          "external": 0,
          "protocol": "tcp"
        }
      ]
    },
    {
      "serviceType": "psiphon",
      "name": "{{CLIENT_NAME}}",
      "configOverrides": {
        "upstreamProxy": "socks5://{{BRIDGE_NAME}}:9050"
      },
      "dependsOn": ["{{BRIDGE_NAME}}"],
      "memoryLimitMB": 128,
      "cpuShares": 256,
      "requiresBridge": false,
      "portMappings": [
        {
          "internal": 8080,
          "external": 8080,
          "protocol": "tcp"
        }
      ]
    }
  ],
  "configVariables": [
    {
      "name": "BRIDGE_NAME",
      "description": "Name for Tor bridge instance",
      "type": "string",
      "required": true,
      "defaultValue": "tor-bridge-1"
    },
    {
      "name": "CLIENT_NAME",
      "description": "Name for Psiphon client instance",
      "type": "string",
      "required": true,
      "defaultValue": "psiphon-client-1"
    }
  ],
  "suggestedRouting": [
    {
      "devicePattern": ".*",
      "serviceIndex": 0,
      "routerChainIds": []
    }
  ],
  "estimatedResources": {
    "memoryMB": 256,
    "cpuShares": 512,
    "diskMB": 100,
    "networkBandwidthMbps": 50
  },
  "prerequisites": [
    "Minimum 256MB RAM available",
    "Outbound internet access required"
  ],
  "documentation": "This template creates a two-tier censorship circumvention stack. The Tor bridge provides initial obfuscation, and Psiphon adds an additional layer of protection.",
  "examples": []
}
```

---

### Fixture 3: Invalid Template (Circular Dependency)

**File:** `testdata/invalid_templates/circular_dependency.json`

```json
{
  "id": "circular-test",
  "name": "Circular Dependency Test",
  "description": "This template should fail validation due to circular dependencies",
  "category": "networking",
  "scope": "multiple",
  "version": "1.0.0",
  "author": "Test",
  "tags": ["test"],
  "services": [
    {
      "serviceType": "xray-core",
      "name": "service-a",
      "dependsOn": ["service-c"],
      "configOverrides": {}
    },
    {
      "serviceType": "xray-core",
      "name": "service-b",
      "dependsOn": ["service-a"],
      "configOverrides": {}
    },
    {
      "serviceType": "xray-core",
      "name": "service-c",
      "dependsOn": ["service-b"],
      "configOverrides": {}
    }
  ],
  "configVariables": []
}
```

**Expected Error:**
```
Dependency validation failed: circular dependency detected: service-a -> service-c -> service-b -> service-a
```

---

### Fixture 4: Invalid Template (Missing Required Variable)

**File:** `testdata/invalid_templates/invalid_variable_reference.json`

```json
{
  "id": "invalid-var-ref",
  "name": "Invalid Variable Reference",
  "description": "References undefined variable",
  "category": "networking",
  "scope": "single",
  "version": "1.0.0",
  "author": "Test",
  "tags": ["test"],
  "services": [
    {
      "serviceType": "tor",
      "name": "{{UNDEFINED_VARIABLE}}",
      "configOverrides": {
        "bandwidthRate": "{{ALSO_UNDEFINED}}MB"
      }
    }
  ],
  "configVariables": [
    {
      "name": "DEFINED_VARIABLE",
      "type": "string",
      "required": true
    }
  ]
}
```

**Expected Error:**
```
Variable reference validation failed: variable UNDEFINED_VARIABLE is referenced but not defined
Variable reference validation failed: variable ALSO_UNDEFINED is referenced but not defined
```

---

### Fixture 5: Dependency Test (Diamond Pattern)

**File:** `testdata/dependency_tests/diamond_dependencies.json`

```json
{
  "id": "diamond-deps",
  "name": "Diamond Dependency Pattern",
  "description": "Tests parallel dependency resolution",
  "category": "networking",
  "scope": "multiple",
  "version": "1.0.0",
  "author": "Test",
  "tags": ["test"],
  "services": [
    {
      "serviceType": "tor",
      "name": "service-a",
      "configOverrides": {}
    },
    {
      "serviceType": "xray-core",
      "name": "service-b",
      "dependsOn": ["service-a"],
      "configOverrides": {}
    },
    {
      "serviceType": "sing-box",
      "name": "service-c",
      "dependsOn": ["service-a"],
      "configOverrides": {}
    },
    {
      "serviceType": "psiphon",
      "name": "service-d",
      "dependsOn": ["service-b", "service-c"],
      "configOverrides": {}
    }
  ],
  "configVariables": []
}
```

**Expected Installation Order:**
1. service-a
2. service-b and service-c (can be parallel)
3. service-d

---

### Fixture 6: All Variable Types

**File:** `testdata/variable_tests/all_variable_types.json`

```json
{
  "id": "all-var-types",
  "name": "All Variable Types Test",
  "description": "Tests all supported variable types",
  "category": "networking",
  "scope": "single",
  "version": "1.0.0",
  "author": "Test",
  "tags": ["test"],
  "services": [
    {
      "serviceType": "tor",
      "name": "{{STRING_VAR}}",
      "configOverrides": {
        "bandwidth": "{{NUMBER_VAR}}",
        "enabled": "{{BOOLEAN_VAR}}",
        "mode": "{{ENUM_VAR}}"
      }
    }
  ],
  "configVariables": [
    {
      "name": "STRING_VAR",
      "description": "String variable",
      "type": "string",
      "required": true,
      "defaultValue": "test-service"
    },
    {
      "name": "NUMBER_VAR",
      "description": "Number variable with range",
      "type": "number",
      "required": true,
      "defaultValue": 100,
      "minValue": 1,
      "maxValue": 1000
    },
    {
      "name": "BOOLEAN_VAR",
      "description": "Boolean variable",
      "type": "boolean",
      "required": false,
      "defaultValue": true
    },
    {
      "name": "ENUM_VAR",
      "description": "Enum variable",
      "type": "enum",
      "required": true,
      "defaultValue": "fast",
      "enumValues": ["fast", "balanced", "slow"]
    }
  ]
}
```

---

## Backend Test Utilities

### Test Database Setup

```go
// File: apps/backend/internal/templates/test_helpers.go

package templates_test

import (
	"context"
	"testing"

	"backend/ent"
	"backend/ent/enttest"
	_ "github.com/mattn/go-sqlite3"
)

// SetupTestDB creates an in-memory SQLite database for testing
func SetupTestDB(t *testing.T) *ent.Client {
	opts := []enttest.Option{
		enttest.WithOptions(ent.Log(t.Log)),
	}
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1", opts...)

	// Run migrations
	if err := client.Schema.Create(context.Background()); err != nil {
		t.Fatalf("failed to create schema: %v", err)
	}

	return client
}

// TeardownTestDB closes the test database
func TeardownTestDB(t *testing.T, client *ent.Client) {
	if err := client.Close(); err != nil {
		t.Errorf("failed to close test database: %v", err)
	}
}
```

---

### Mock Event Bus

```go
// File: apps/backend/internal/templates/test_helpers.go

package templates_test

import (
	"context"
	"sync"

	"backend/internal/events"
)

// MockEventBus captures emitted events for testing
type MockEventBus struct {
	events []interface{}
	mu     sync.RWMutex
}

func NewMockEventBus() *MockEventBus {
	return &MockEventBus{
		events: make([]interface{}, 0),
	}
}

func (m *MockEventBus) Publish(ctx context.Context, event interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, event)
	return nil
}

func (m *MockEventBus) Subscribe(handler func(context.Context, interface{}) error) error {
	// Mock implementation - not needed for most tests
	return nil
}

func (m *MockEventBus) GetEvents() []interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return append([]interface{}{}, m.events...)
}

func (m *MockEventBus) GetEventsByType(eventType string) []interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	filtered := make([]interface{}, 0)
	for _, evt := range m.events {
		// Type assertion based on event type
		// Example: if evt, ok := evt.(*templates.TemplateInstallStartedEvent); ok { ... }
		filtered = append(filtered, evt)
	}
	return filtered
}

func (m *MockEventBus) Clear() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = make([]interface{}, 0)
}
```

---

### Test Template Builder

```go
// File: apps/backend/internal/templates/test_helpers.go

package templates_test

import (
	"backend/internal/templates"
)

// TemplateBuilder provides a fluent API for creating test templates
type TemplateBuilder struct {
	template *templates.ServiceTemplate
}

func NewTemplateBuilder(id, name string) *TemplateBuilder {
	return &TemplateBuilder{
		template: &templates.ServiceTemplate{
			ID:          id,
			Name:        name,
			Category:    templates.CategoryNetworking,
			Scope:       templates.ScopeSingle,
			Version:     "1.0.0",
			Author:      "Test",
			Services:    make([]templates.ServiceSpec, 0),
			ConfigVariables: make([]templates.TemplateVariable, 0),
		},
	}
}

func (b *TemplateBuilder) WithCategory(category templates.TemplateCategory) *TemplateBuilder {
	b.template.Category = category
	return b
}

func (b *TemplateBuilder) WithScope(scope templates.TemplateScope) *TemplateBuilder {
	b.template.Scope = scope
	return b
}

func (b *TemplateBuilder) WithService(serviceType, name string, dependsOn ...string) *TemplateBuilder {
	service := templates.ServiceSpec{
		ServiceType: serviceType,
		Name:        name,
		DependsOn:   dependsOn,
		ConfigOverrides: make(map[string]interface{}),
	}
	b.template.Services = append(b.template.Services, service)
	return b
}

func (b *TemplateBuilder) WithVariable(name, varType string, required bool, defaultValue interface{}) *TemplateBuilder {
	variable := templates.TemplateVariable{
		Name:         name,
		Type:         templates.TemplateVariableType(varType),
		Required:     required,
		DefaultValue: defaultValue,
	}
	b.template.ConfigVariables = append(b.template.ConfigVariables, variable)
	return b
}

func (b *TemplateBuilder) Build() *templates.ServiceTemplate {
	return b.template
}

// Example usage in tests:
// template := NewTemplateBuilder("test-1", "Test Template").
//     WithCategory(templates.CategoryPrivacy).
//     WithScope(templates.ScopeSingle).
//     WithService("tor", "{{SERVICE_NAME}}").
//     WithVariable("SERVICE_NAME", "string", true, "tor-1").
//     Build()
```

---

### Installation Test Helper

```go
// File: apps/backend/internal/templates/test_helpers.go

package templates_test

import (
	"context"
	"testing"
	"time"

	"backend/internal/templates"
)

// WaitForInstallation waits for installation to complete or timeout
func WaitForInstallation(
	t *testing.T,
	eventBus *MockEventBus,
	timeout time.Duration,
) (*templates.TemplateInstallCompletedEvent, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			events := eventBus.GetEvents()
			for _, evt := range events {
				if completed, ok := evt.(*templates.TemplateInstallCompletedEvent); ok {
					return completed, nil
				}
				if failed, ok := evt.(*templates.TemplateInstallFailedEvent); ok {
					t.Fatalf("installation failed: %s", failed.Error)
				}
			}
		}
	}
}

// AssertEventSequence verifies events were emitted in the expected order
func AssertEventSequence(t *testing.T, eventBus *MockEventBus, expectedTypes []string) {
	events := eventBus.GetEvents()

	if len(events) < len(expectedTypes) {
		t.Fatalf("expected at least %d events, got %d", len(expectedTypes), len(events))
	}

	for i, expectedType := range expectedTypes {
		// Type assertion logic here
		// This is a simplified example - implement based on actual event types
		t.Logf("Event %d: %T", i, events[i])
	}
}
```

---

## Setup and Teardown

### Test Environment Setup

**Prerequisites:**
1. Go 1.21+ installed
2. Docker (for integration tests)
3. SQLite (for unit tests)
4. Backend dependencies installed: `go mod download`

**Environment Variables:**
```bash
# Test database
export TEST_DB_DRIVER=sqlite3
export TEST_DB_SOURCE=file:test?mode=memory

# Test router (for integration tests)
export TEST_ROUTER_HOST=192.168.88.1
export TEST_ROUTER_USER=admin
export TEST_ROUTER_PASS=test123

# Feature flags
export ENABLE_TEMPLATE_INSTALLATION=true
```

---

### Running Tests

**Unit Tests (no external dependencies):**
```bash
cd apps/backend
go test ./internal/templates -v -tags=dev
```

**Integration Tests (requires test router or mock):**
```bash
cd apps/backend
go test ./internal/templates -v -tags=integration
```

**Specific Test Scenarios:**
```bash
# Test installation with dependencies
go test -v -run TestInstallTemplate_WithDependencies

# Test rollback on failure
go test -v -run TestInstallTemplate_RollbackOnFailure

# Test variable substitution
go test -v -run TestVariableResolution
```

---

### GraphQL Playground Testing

**Start the backend:**
```bash
cd apps/backend
go run -tags=dev main.dev.go
```

**Open GraphQL Playground:**
- Navigate to: http://localhost:8080/graphql
- Set headers:
  ```json
  {
    "X-Router-Id": "router-1"
  }
  ```

**Test Subscription (requires WebSocket):**
1. In left pane, paste subscription query
2. Click "Play" button
3. In another terminal or Playground tab, trigger installation mutation
4. Watch events appear in subscription pane

---

### Cleanup After Tests

**Database Cleanup:**
```bash
# Remove test database files
rm -f apps/backend/test.db*
```

**Docker Cleanup (if using containerized tests):**
```bash
# Stop and remove test containers
docker stop test-router || true
docker rm test-router || true
```

**Event Bus Cleanup:**
```go
// In test teardown
func TestMain(m *testing.M) {
	// Run tests
	code := m.Run()

	// Cleanup
	// Close event bus connections
	// Stop background workers

	os.Exit(code)
}
```

---

## Additional Testing Considerations

### Performance Testing

**Load Test Template Installation:**
```bash
# Install 10 templates concurrently
for i in {1..10}; do
  curl -X POST http://localhost:8080/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { installServiceTemplate(...) }"}' &
done
wait
```

**Memory Profiling:**
```bash
go test -memprofile=mem.out ./internal/templates
go tool pprof mem.out
```

---

### Edge Cases Checklist

- [ ] Install template with 0 config variables (use all defaults)
- [ ] Install template with maximum service count (e.g., 10 services)
- [ ] Export template from stopped instance
- [ ] Import template with Unicode characters in name/description
- [ ] Install template while another installation is in progress
- [ ] Delete template that is currently being installed
- [ ] Variable with very large value (test limits)
- [ ] Port collision detection
- [ ] VLAN exhaustion during installation
- [ ] Router disconnection during installation

---

## Troubleshooting

**Common Issues:**

1. **Template validation fails with "circular dependency" but none exists:**
   - Check for typos in `dependsOn` service names
   - Verify service names match exactly (case-sensitive)

2. **Installation hangs indefinitely:**
   - Check event bus is running
   - Verify instance manager is initialized
   - Check logs for dependency resolution issues

3. **Variable substitution not working:**
   - Verify variable names use `{{VARIABLE_NAME}}` format
   - Check variable is defined in `configVariables`
   - Ensure variable value is provided in installation request

4. **WebSocket subscription not receiving events:**
   - Verify WebSocket connection established
   - Check router ID filter matches
   - Ensure event bus is publishing events

---

## Future Test Enhancements

**Phase 2 Testing (post-MVP):**
- [ ] Property-based testing with rapid
- [ ] Fuzz testing for template parsing
- [ ] Chaos engineering (random failures during installation)
- [ ] Long-running stability tests (24h+ installations)
- [ ] Multi-router installation tests
- [ ] Template versioning and migration tests
- [ ] Backup/restore of templates

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-13
**Maintained By:** Backend Specialist
**Related:** NAS-8.9 Service Templates Implementation
