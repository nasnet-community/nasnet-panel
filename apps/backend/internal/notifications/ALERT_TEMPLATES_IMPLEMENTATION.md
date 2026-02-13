# Alert Templates Implementation - Task #1 Complete

## Overview

This document summarizes the completion of Task #1: Backend Foundation for the Alert Templates system (NAS-18.12).

## What Was Implemented

### 1. Type Definitions (`alert_template_types.go`)

**AlertTemplate Type:**
- Complete template structure with ID, name, description, event type, channel, subject/body templates
- Template variables with type, label, required flag, default values
- Metadata support for channel-specific configuration
- Built-in and default template flags

**ChannelType Enum:**
- Email, Telegram, Pushover, Webhook, In-App

**PreviewResult Type:**
- Rendered subject and body after variable substitution
- Validation information (missing variables, warnings)

**Common Event Types:**
- **26 event types** organized by category:
  - Router events (4): offline, online, reboot, config_error
  - Interface events (4): down, up, high_traffic, errors
  - System events (4): cpu_high, memory_high, disk_full, temperature_high
  - Connection events (6): VPN, WAN, DHCP events
  - Security events (4): firewall, SSH, port scan
  - Service events (5): service status, backup events
- Centralized `CommonEventTypes()` function - ALL event types MUST come from this list

### 2. JSON Templates (`templates/alerts/*.json`)

Created 6 built-in templates demonstrating different event types and channels:

1. **router-offline-email.json** - Detailed email notification for router offline
2. **router-offline-inapp.json** - Brief in-app notification for router offline
3. **interface-down-email.json** - Detailed email for interface down events
4. **cpu-high-inapp.json** - Performance warning for high CPU usage
5. **vpn-disconnected-telegram.json** - Mobile-friendly Telegram notification with Markdown
6. **backup-completed-webhook.json** - JSON webhook payload for integrations

Each template includes:
- Event type (from common event types list)
- Channel type
- Subject and body templates with Go template syntax (`{{.Variable}}`)
- Variable definitions with type, required flag, descriptions
- Metadata for channel-specific configuration
- Tags for categorization

### 3. Template Service (`alert_template_service.go`)

Following the firewall template service pattern exactly:

**Initialization:**
- `NewAlertTemplateService()` - Creates service with embedded template loading
- `loadBuiltInTemplates()` - Loads templates from `//go:embed templates/alerts/*.json`
- Event type validation against common event types

**Template Browsing:**
- `GetTemplates(ctx, eventType, channel)` - List templates with optional filters
- `GetTemplateByID(ctx, id)` - Retrieve specific template
- `GetTemplatesByEventType(ctx, eventType)` - Filter by event type
- `GetTemplatesByChannel(ctx, channel)` - Filter by channel
- `SearchTemplates(ctx, query)` - Search by name, description, tags

**Preview & Rendering:**
- `PreviewTemplate(ctx, templateID, variables)` - Render with variable substitution
- `validateVariables()` - Check required variables
- `renderTemplate()` - Go text/template rendering
- Returns validation info with missing variables and warnings

**Apply Template (NO LOGIC DUPLICATION):**
- `ApplyTemplate(ctx, templateID, variables, ruleConfig)` - Create alert rule from template
- **Delegates to `AlertService.CreateRule()`** - no duplication of alert creation logic
- Prepares input from template + user config, then calls existing service

**Custom Templates:**
- `SaveTemplate(ctx, template)` - Save custom template to database
- `DeleteTemplate(ctx, templateID)` - Delete custom templates (built-in protected)
- Validates event types and channels

**Utilities:**
- `GetCommonEventTypes()` - Returns authoritative event type list
- `isValidEventType()` - Validates against common event types

### 4. Ent Schema

The `alert_template.go` schema already exists with:
- ULID primary key
- Event type and channel fields
- Subject and body template fields
- System default flag (prevents deletion)
- Unique constraint per (event_type, channel)
- Proper indexes for lookups

**Schema Fix:**
- Fixed `alert_digest_entry.go` schema - made `alert_id` field optional to match optional edge

**Ent Generation:**
- Successfully generated ent code with `go generate ./ent`
- Created: `alerttemplate.go`, `alerttemplate_create.go`, `alerttemplate_delete.go`, `alerttemplate_query.go`, `alerttemplate_update.go`

### 5. Tests (`alert_template_service_test.go`)

Comprehensive test coverage:
- `TestAlertTemplateService_LoadBuiltInTemplates` - Verifies 6 templates load correctly
- `TestAlertTemplateService_GetTemplateByID` - Tests retrieval and error handling
- `TestAlertTemplateService_GetTemplatesByEventType` - Filters by event type
- `TestAlertTemplateService_PreviewTemplate` - Variable substitution and rendering
- `TestAlertTemplateService_PreviewTemplate_MissingVariables` - Validation logic
- `TestCommonEventTypes` - Verifies event type list completeness

## Key Design Decisions

### 1. Event Type Centralization
**All event types MUST come from `CommonEventTypes()`**
- Prevents typos and inconsistencies
- Single source of truth for event bus, alert engine, and templates
- Service validates event types on template creation

### 2. No Logic Duplication
**`ApplyTemplate()` calls `AlertService.CreateRule()`**
- Follows the instruction explicitly
- Template service prepares input, alert service creates rule
- Maintains single responsibility and DRY principle

### 3. Embedded Templates with //go:embed
**Follows firewall pattern exactly:**
```go
//go:embed templates/alerts/*.json
var templatesFS embed.FS
```
- Templates embedded at compile time
- No external file dependencies at runtime
- Path is relative to source file: `templates/alerts/*.json`

### 4. Go text/template for Rendering
- Standard library `text/template` package
- Syntax: `{{.VariableName}}`
- Safe and battle-tested

### 5. Built-in + Custom Template Support
- Built-in templates loaded from embedded JSON
- Custom templates stored in database
- Built-in templates cannot be deleted (protection)
- Unique constraint: one template per (event_type, channel)

## File Structure

```
apps/backend/internal/notifications/
├── alert_template_types.go              # Type definitions (160 lines)
├── alert_template_service.go            # Service implementation (440 lines)
├── alert_template_service_test.go       # Comprehensive tests (280 lines)
└── templates/alerts/
    ├── router-offline-email.json        # Built-in template 1
    ├── router-offline-inapp.json        # Built-in template 2
    ├── interface-down-email.json        # Built-in template 3
    ├── cpu-high-inapp.json              # Built-in template 4
    ├── vpn-disconnected-telegram.json   # Built-in template 5
    └── backup-completed-webhook.json    # Built-in template 6
```

**All files under 500 lines** ✅

## Integration Points

### With AlertService
- `ApplyTemplate()` calls `AlertService.CreateRule()`
- Requires `AlertService` reference in config
- No duplicate logic

### With Event Bus
- Event types aligned with event bus constants
- Templates use same event type strings as events

### With Notification Channels
- Channel types: email, telegram, pushover, webhook, inapp
- Channel-specific metadata support (e.g., Telegram parse mode)

### With Ent
- AlertTemplate entity in database
- CRUD operations via ent client
- Built-in templates in memory, custom in DB

## Next Steps (Task #2)

Task #1 is complete. Task #2 will implement:
1. GraphQL schema for alert templates
2. GraphQL resolvers (queries, mutations)
3. Go codegen integration
4. Resolver tests

## Verification

✅ Types defined (`alert_template_types.go`)
✅ JSON templates created (6 files)
✅ Service implemented (`alert_template_service.go`)
✅ Ent schema exists and generated
✅ Tests written (`alert_template_service_test.go`)
✅ Follows firewall template pattern
✅ Uses //go:embed correctly
✅ Event types from common list
✅ No logic duplication (calls AlertService.CreateRule)
✅ All files under 500 lines
✅ Code formatted with `go fmt`

**Task #1 Status: COMPLETE** ✅
