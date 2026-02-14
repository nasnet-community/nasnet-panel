# ent Schema Organization

This document provides a comprehensive map of all 34 ent entity schemas organized by domain, including entity relationships and Universal State v2 mappings.

## Quick Reference

| Domain | Entities | Database | Primary Purpose |
|--------|----------|----------|-----------------|
| **Core System** | 7 | system.db | Routers, users, authentication, global config |
| **Alerts & Notifications** | 9 | system.db | Alert rules, escalation, digests, channels |
| **Network Services** | 6 | system.db + router-{id}.db | Service marketplace, instances, templates |
| **Networking** | 4 | router-{id}.db | VLANs, virtual interfaces, routing chains |
| **Resources & Events** | 3 | router-{id}.db | Universal State v2 resource model |
| **Security** | 3 | system.db | API keys, router secrets, port knocking |
| **Traffic & Diagnostics** | 2 | router-{id}.db | Traffic stats, diagnostic results |

**Total:** 34 entities across 7 domains

---

## Domain 1: Core System (7 entities)

**Database:** system.db (shared across all routers)

### 1.1 Router
**File:** `router.go`
**Purpose:** Managed MikroTik/OpenWrt/VyOS device registry
**Key Fields:**
- `id` (ULID) - Primary key
- `name` - Human-readable router name
- `host` - Hostname or IP address
- `port` - RouterOS API port (default: 8728)
- `platform` - Enum: mikrotik, openwrt, vyos
- `status` - Enum: online, offline, unreachable
- `last_seen_at` - Last successful connection timestamp

**Edges:**
- `capabilities` → RouterCapability (1:1)
- `secret` → RouterSecret (1:1)
- `resources` → Resource (1:many) - Router-specific resources

**Universal State v2 Layer:** Platform (Layer 8)

---

### 1.2 RouterCapability
**File:** `router_capability.go`
**Purpose:** Router platform capabilities and feature support
**Key Fields:**
- `id` (ULID)
- `router_id` - Foreign key to Router
- `has_bridge` - Bridge support (bool)
- `has_vlan` - VLAN support (bool)
- `has_firewall` - Firewall support (bool)
- `has_vpn` - VPN support (bool)
- `ros_version` - RouterOS version string

**Edges:**
- `router` ← Router (1:1 inverse)

**Universal State v2 Layer:** Platform (Layer 8)

---

### 1.3 User
**File:** `user.go`
**Purpose:** User account management
**Key Fields:**
- `id` (ULID)
- `username` - Unique username
- `email` - Email address
- `password_hash` - bcrypt hashed password
- `role` - Enum: admin, operator, viewer
- `is_active` - Account active flag (bool)

**Edges:**
- `sessions` → Session (1:many)
- `api_keys` → APIKey (1:many)

---

### 1.4 Session
**File:** `session.go`
**Purpose:** User session management (JWT-based)
**Key Fields:**
- `id` (ULID)
- `user_id` - Foreign key to User
- `token_hash` - SHA-256 hash of JWT token
- `expires_at` - Session expiration timestamp
- `ip_address` - Client IP address
- `user_agent` - Client user agent string

**Edges:**
- `user` ← User (many:1 inverse)

**Indexes:**
- `user_id`, `expires_at`
- `token_hash` (unique)

---

### 1.5 APIKey
**File:** `api_key.go`
**Purpose:** API key authentication for programmatic access
**Key Fields:**
- `id` (ULID)
- `user_id` - Foreign key to User
- `name` - Human-readable key name
- `key_hash` - SHA-256 hash of API key
- `scopes` - JSON array of permission scopes
- `expires_at` - Optional expiration timestamp

**Edges:**
- `user` ← User (many:1 inverse)

---

### 1.6 GlobalSettings
**File:** `global_settings.go`
**Purpose:** Application-wide configuration (singleton pattern)
**Key Fields:**
- `id` (ULID) - Always "01HZZZZZZZZZZZZZZZZZZZZZZ" (singleton)
- `backup_enabled` - Auto backup enabled (bool)
- `backup_interval_hours` - Backup interval
- `retention_days` - Event retention period
- `default_theme` - Enum: light, dark, auto
- `config` - JSON field for additional settings

---

### 1.7 SchemaVersion
**File:** `schema_version.go`
**Purpose:** Database schema version tracking for migrations
**Key Fields:**
- `id` (ULID)
- `version` - Schema version number (int)
- `applied_at` - Migration timestamp
- `description` - Migration description

**Indexes:**
- `version` (unique)

---

## Domain 2: Alerts & Notifications (9 entities)

**Database:** system.db (shared across all routers)

### 2.1 AlertRule
**File:** `alert_rule.go`
**Purpose:** Alert rule definitions with conditions and thresholds
**Key Fields:**
- `id` (ULID)
- `name` - Rule name
- `description` - Optional description
- `event_type` - Event type to match (e.g., 'router.offline', 'cpu.high')
- `conditions` - JSON array of condition objects
- `severity` - Enum: info, warning, critical
- `enabled` - Rule enabled flag (bool)
- `router_id` - Optional: Router-specific rule

**Edges:**
- `template` ← AlertRuleTemplate (many:1)
- `escalations` → AlertEscalation (1:many)
- `alerts` → Alert (1:many)

**Indexes:**
- `event_type`, `enabled`
- `router_id`

---

### 2.2 AlertRuleTemplate
**File:** `alert_rule_template.go`
**Purpose:** Reusable alert rule templates
**Key Fields:**
- `id` (ULID)
- `name` - Template name
- `description` - Template description
- `category` - Category (e.g., 'network', 'security', 'system')
- `default_conditions` - JSON array of default conditions
- `default_severity` - Default severity level

**Edges:**
- `rules` → AlertRule (1:many)

---

### 2.3 Alert
**File:** `alert.go`
**Purpose:** Fired alert instances (active and historical)
**Key Fields:**
- `id` (ULID)
- `rule_id` - Foreign key to AlertRule
- `event_type` - Event type that triggered alert
- `severity` - Alert severity
- `status` - Enum: firing, acknowledged, resolved
- `message` - Alert message
- `metadata` - JSON field with event data
- `fired_at` - Alert fired timestamp
- `acknowledged_at` - Optional acknowledgment timestamp
- `resolved_at` - Optional resolution timestamp

**Edges:**
- `rule` ← AlertRule (many:1 inverse)
- `escalations` → AlertEscalation (1:many)
- `digest_entries` → AlertDigestEntry (1:many)

**Indexes:**
- `rule_id`, `status`, `fired_at`
- `status`, `fired_at`

---

### 2.4 AlertEscalation
**File:** `alert_escalation.go`
**Purpose:** Alert escalation tracking (multi-level notification)
**Key Fields:**
- `id` (ULID)
- `alert_id` - Foreign key to Alert
- `rule_id` - Foreign key to AlertRule
- `level` - Escalation level (int, 0-indexed)
- `status` - Enum: pending, sent, failed, suppressed
- `channel` - Notification channel used
- `scheduled_at` - When escalation should fire
- `sent_at` - When notification was sent

**Edges:**
- `alert` ← Alert (many:1 inverse)
- `rule` ← AlertRule (many:1 inverse)

**Indexes:**
- `alert_id`, `level`
- `status`, `scheduled_at`

---

### 2.5 AlertDigestEntry
**File:** `alert_digest_entry.go`
**Purpose:** Alert digest batching (group alerts for scheduled delivery)
**Key Fields:**
- `id` (ULID)
- `alert_id` - Foreign key to Alert
- `digest_key` - Digest group key (e.g., 'daily-2024-01-15')
- `added_at` - When alert was added to digest
- `sent_at` - When digest was sent (null if pending)

**Edges:**
- `alert` ← Alert (many:1 inverse)

**Indexes:**
- `digest_key`, `sent_at`
- `alert_id`

---

### 2.6 AlertTemplate
**File:** `alert_template.go`
**Purpose:** Notification message templates (email, webhook, etc.)
**Key Fields:**
- `id` (ULID)
- `name` - Template name
- `channel` - Enum: email, telegram, pushover, webhook, inapp, ntfy
- `subject_template` - Go template for subject/title
- `body_template` - Go template for message body
- `variables` - JSON array of required variables

**Indexes:**
- `channel`, `name`

---

### 2.7 NotificationSettings
**File:** `notification_settings.go`
**Purpose:** Notification channel credentials (encrypted)
**Key Fields:**
- `id` (ULID)
- `channel` - Enum: email, telegram, pushover, webhook, ntfy
- `credentials_encrypted` - AES-256-GCM encrypted JSON credentials
- `encryption_key_id` - Key ID used for encryption
- `enabled` - Channel enabled flag (bool)

**Indexes:**
- `channel` (unique)

**Security Note:** Credentials are encrypted at rest using AES-256-GCM

---

### 2.8 NotificationChannelConfig
**File:** `notificationchannelconfig.go`
**Purpose:** Per-user notification channel preferences
**Key Fields:**
- `id` (ULID)
- `user_id` - Foreign key to User
- `channel` - Notification channel type
- `enabled` - User enabled this channel (bool)
- `min_severity` - Minimum severity to notify (enum)
- `quiet_hours_start` - Optional quiet hours start time
- `quiet_hours_end` - Optional quiet hours end time

**Indexes:**
- `user_id`, `channel`

---

### 2.9 NotificationLog
**File:** `notification_log.go`
**Purpose:** Notification delivery audit log
**Key Fields:**
- `id` (ULID)
- `alert_id` - Foreign key to Alert
- `channel` - Channel used
- `status` - Enum: pending, sent, failed, throttled
- `error_message` - Optional error details
- `sent_at` - Delivery timestamp
- `metadata` - JSON field with delivery metadata

**Indexes:**
- `alert_id`, `sent_at`
- `status`, `sent_at`

---

## Domain 3: Network Services (6 entities)

**Database:** system.db (templates) + router-{id}.db (instances)

### 3.1 ServiceTemplate
**File:** `servicetemplate.go`
**Database:** system.db
**Purpose:** Service template definitions for Feature Marketplace
**Key Fields:**
- `id` (ULID)
- `feature_id` - Feature identifier (e.g., 'tor', 'sing-box', 'xray-core')
- `name` - Human-readable name
- `description` - Service description
- `category` - Category (e.g., 'vpn', 'proxy', 'dns')
- `version` - Template version
- `config_schema` - JSON schema for configuration
- `manifest` - JSON manifest with dependencies, ports, resources

**Example Services:** Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home

---

### 3.2 ServiceInstance
**File:** `serviceinstance.go`
**Database:** router-{id}.db
**Purpose:** Running service instances
**Key Fields:**
- `id` (ULID)
- `feature_id` - Feature identifier
- `instance_name` - Human-readable instance name
- `router_id` - Foreign key to Router
- `status` - Enum: pending, installing, running, stopped, failed, uninstalling
- `config` - JSON service-specific configuration
- `resources` - JSON resource allocation (CPU, RAM, disk)
- `installed_at` - Installation timestamp
- `process_pid` - Process ID if running

**Edges:**
- `virtual_interfaces` → VirtualInterface (1:many)
- `dependencies` → ServiceDependency (1:many)
- `traffic_stats` → ServiceTrafficHourly (1:many)

**Indexes:**
- `router_id`, `status`
- `feature_id`

**Universal State v2 Layer:** Runtime (Layer 4)

---

### 3.3 ServiceDependency
**File:** `servicedependency.go`
**Database:** router-{id}.db
**Purpose:** Service dependency graph (topological ordering for boot sequence)
**Key Fields:**
- `id` (ULID)
- `instance_id` - Dependent service instance
- `depends_on_id` - Service instance dependency
- `dependency_type` - Enum: hard, soft
- `created_at` - Dependency creation timestamp

**Edges:**
- `instance` ← ServiceInstance (many:1 inverse)
- `depends_on` ← ServiceInstance (many:1 inverse)

**Indexes:**
- `instance_id`, `depends_on_id` (unique composite)

**Note:** Used for topological sort during service start/stop operations

---

### 3.4 VirtualInterface
**File:** `virtualinterface.go`
**Database:** router-{id}.db
**Purpose:** Virtual network interfaces for service isolation
**Key Fields:**
- `id` (ULID)
- `instance_id` - Foreign key to ServiceInstance
- `interface_name` - VLAN interface name (e.g., 'nnc-tor-usa')
- `vlan_id` - VLAN ID (1-4094)
- `ip_address` - IP address assigned to interface
- `gateway_type` - Enum: none, hev_socks5_tunnel
- `gateway_status` - Enum: stopped, starting, running, failed
- `routing_table_id` - Routing table ID for policy-based routing

**Edges:**
- `instance` ← ServiceInstance (many:1 inverse)
- `routing_chains` → RoutingChain (1:many)

**Indexes:**
- `instance_id`
- `vlan_id` (unique)

**Universal State v2 Layer:** Deployment (Layer 3) + Runtime (Layer 4)

---

### 3.5 VLANAllocation
**File:** `vlanallocation.go`
**Database:** router-{id}.db
**Purpose:** VLAN ID allocation tracking (prevent conflicts)
**Key Fields:**
- `id` (ULID)
- `vlan_id` - Allocated VLAN ID (1-4094)
- `instance_id` - Foreign key to ServiceInstance
- `allocated_at` - Allocation timestamp
- `released_at` - Optional release timestamp

**Indexes:**
- `vlan_id` (unique when not released)
- `instance_id`

**Note:** Implements VLAN pool management with orphan cleanup

---

### 3.6 ServiceTrafficHourly
**File:** `servicetraffichourly.go`
**Database:** router-{id}.db
**Purpose:** Hourly traffic statistics per service instance
**Key Fields:**
- `id` (ULID)
- `instance_id` - Foreign key to ServiceInstance
- `hour_start` - Hour bucket timestamp (truncated to hour)
- `bytes_rx` - Bytes received (int64)
- `bytes_tx` - Bytes transmitted (int64)
- `packets_rx` - Packets received (int64)
- `packets_tx` - Packets transmitted (int64)

**Edges:**
- `instance` ← ServiceInstance (many:1 inverse)

**Indexes:**
- `instance_id`, `hour_start` (unique composite)

**Universal State v2 Layer:** Telemetry (Layer 5)

---

## Domain 4: Networking (4 entities)

**Database:** router-{id}.db

### 4.1 RoutingChain
**File:** `routingchain.go`
**Purpose:** Multi-hop routing chains for service traffic routing
**Key Fields:**
- `id` (ULID)
- `chain_name` - Human-readable chain name
- `chain_type` - Enum: direct, multi_hop, load_balanced, failover
- `source_vif_id` - Source virtual interface (foreign key)
- `active` - Chain active flag (bool)

**Edges:**
- `source_vif` ← VirtualInterface (many:1 inverse)
- `hops` → ChainHop (1:many, ordered)
- `schedules` → RoutingSchedule (1:many)

**Indexes:**
- `source_vif_id`, `active`

**Universal State v2 Layer:** Configuration (Layer 1) + Deployment (Layer 3)

---

### 4.2 ChainHop
**File:** `chainhop.go`
**Purpose:** Individual hops in routing chain (ordered)
**Key Fields:**
- `id` (ULID)
- `chain_id` - Foreign key to RoutingChain
- `hop_order` - Hop sequence number (int, 1-indexed)
- `target_instance_id` - Target service instance
- `gateway_ip` - Gateway IP address for this hop
- `latency_ms` - Measured latency (optional)

**Edges:**
- `chain` ← RoutingChain (many:1 inverse)

**Indexes:**
- `chain_id`, `hop_order` (unique composite)

**Universal State v2 Layer:** Configuration (Layer 1)

---

### 4.3 RoutingSchedule
**File:** `routing_schedule.go`
**Purpose:** Time-based routing chain activation
**Key Fields:**
- `id` (ULID)
- `chain_id` - Foreign key to RoutingChain
- `schedule_type` - Enum: one_time, daily, weekly, cron
- `cron_expression` - Cron expression (if schedule_type=cron)
- `time_of_day` - Time for daily/weekly schedules
- `days_of_week` - JSON array of weekday numbers (0=Sunday)
- `enabled` - Schedule enabled flag (bool)
- `next_run_at` - Next scheduled execution timestamp

**Edges:**
- `chain` ← RoutingChain (many:1 inverse)

**Indexes:**
- `chain_id`, `enabled`, `next_run_at`

**Universal State v2 Layer:** Configuration (Layer 1)

---

### 4.4 DeviceRouting
**File:** `devicerouting.go`
**Purpose:** Per-device policy-based routing rules
**Key Fields:**
- `id` (ULID)
- `device_mac` - Device MAC address (unique identifier)
- `device_name` - Optional human-readable name
- `target_chain_id` - Foreign key to RoutingChain
- `priority` - Rule priority (int, lower = higher priority)
- `enabled` - Rule enabled flag (bool)

**Edges:**
- `target_chain` ← RoutingChain (many:1 inverse)

**Indexes:**
- `device_mac` (unique)
- `priority`

**Universal State v2 Layer:** Configuration (Layer 1) + Deployment (Layer 3)

---

## Domain 5: Resources & Events (3 entities)

**Database:** router-{id}.db

### 5.1 Resource
**File:** `resource.go`
**Purpose:** Universal State v2 8-layer resource model
**Key Fields:**
- `id` (ULID)
- `type` - Resource type path (e.g., 'ip/address', 'firewall/filter')
- `category` - Resource category for UI grouping
- `ros_id` - RouterOS internal ID (e.g., '*1', '*A')

**8-Layer Fields:**
1. **Configuration** (Layer 1) - `config_desired` (JSON)
2. **Validation** (Layer 2) - `validation_status`, `validation_errors`
3. **Deployment** (Layer 3) - `deployment_status`, `deployed_at`
4. **Runtime** (Layer 4) - `runtime_state` (JSON), `runtime_status`
5. **Telemetry** (Layer 5) - `telemetry` (JSON), `last_telemetry_at`
6. **Metadata** (Layer 6) - `tags`, `labels`, `annotations`
7. **Relationships** (Layer 7) - `parent_id`, `dependencies` (JSON)
8. **Platform** (Layer 8) - `platform_capabilities` (JSON), `ros_id`

**Edges:**
- `events` → ResourceEvent (1:many)
- `parent` ← Resource (many:1 self-reference)
- `children` → Resource (1:many self-reference)

**Indexes:**
- `type`, `category`
- `ros_id`
- `deployment_status`, `runtime_status`

**Reference:** See `Docs/architecture/adrs/012-universal-state-v2.md`

---

### 5.2 ResourceEvent
**File:** `resource_event.go`
**Purpose:** Audit log for resource changes (event sourcing)
**Key Fields:**
- `id` (ULID)
- `resource_id` - Foreign key to Resource
- `event_type` - Enum: created, updated, deleted, deployed, failed
- `layer` - Which layer changed (1-8)
- `change_summary` - Human-readable change description
- `diff` - JSON diff of changes
- `triggered_by` - User/system that triggered change
- `occurred_at` - Event timestamp

**Edges:**
- `resource` ← Resource (many:1 inverse)

**Indexes:**
- `resource_id`, `occurred_at`
- `event_type`, `occurred_at`

**Universal State v2 Layer:** Metadata (Layer 6) - Audit trail

---

### 5.3 ConfigSnapshot
**File:** `config_snapshot.go`
**Purpose:** Point-in-time configuration backups
**Key Fields:**
- `id` (ULID)
- `router_id` - Foreign key to Router
- `snapshot_type` - Enum: manual, scheduled, pre_change, auto
- `full_config` - Complete RouterOS export (text)
- `resource_count` - Number of resources captured
- `created_at` - Snapshot timestamp
- `created_by` - User/system that created snapshot
- `comment` - Optional snapshot description

**Indexes:**
- `router_id`, `created_at`
- `snapshot_type`

**Universal State v2 Layer:** Configuration (Layer 1) - Historical snapshots

---

## Domain 6: Security (3 entities)

**Database:** system.db

### 6.1 RouterSecret
**File:** `router_secret.go`
**Purpose:** Encrypted router credentials
**Key Fields:**
- `id` (ULID)
- `router_id` - Foreign key to Router (unique)
- `username` - Router admin username (encrypted)
- `password_encrypted` - AES-256-GCM encrypted password
- `encryption_key_id` - Key ID used for encryption
- `api_port` - RouterOS API port
- `ssh_port` - SSH port
- `last_rotated_at` - Password rotation timestamp

**Edges:**
- `router` ← Router (1:1 inverse)

**Indexes:**
- `router_id` (unique)

**Security Note:** Credentials are encrypted at rest using AES-256-GCM

---

### 6.2 PortKnockSequence
**File:** `portknocksequence.go`
**Purpose:** Port knocking sequences for dynamic firewall rules
**Key Fields:**
- `id` (ULID)
- `name` - Sequence name
- `ports` - JSON array of port numbers in sequence
- `timeout_seconds` - Timeout between knocks
- `action` - Enum: allow_ssh, allow_api, allow_http
- `enabled` - Sequence enabled flag (bool)

**Indexes:**
- `name` (unique)

**Note:** Not currently used in production (planned feature)

---

### 6.3 PortAllocation
**File:** `portallocation.go`
**Purpose:** Port allocation registry (prevent conflicts)
**Key Fields:**
- `id` (ULID)
- `port` - Allocated port number (1-65535)
- `protocol` - Enum: tcp, udp, both
- `instance_id` - Foreign key to ServiceInstance
- `service_name` - Service using this port
- `allocated_at` - Allocation timestamp
- `released_at` - Optional release timestamp

**Indexes:**
- `port`, `protocol` (unique when not released)
- `instance_id`

**Note:** Implements port pool management for service isolation

---

## Domain 7: Traffic & Diagnostics (2 entities)

**Database:** router-{id}.db

### 7.1 ServiceTrafficHourly
**File:** `servicetraffichourly.go`
**Purpose:** Hourly traffic statistics per service instance
*(Already documented in Domain 3.6 - duplicate listing for completeness)*

**Universal State v2 Layer:** Telemetry (Layer 5)

---

### 7.2 DiagnosticResult
**File:** `diagnosticresult.go`
**Purpose:** Diagnostic test results (ping, traceroute, DNS, speed test)
**Key Fields:**
- `id` (ULID)
- `router_id` - Foreign key to Router
- `test_type` - Enum: ping, traceroute, dns_lookup, speed_test, port_scan
- `target` - Test target (hostname/IP)
- `status` - Enum: running, success, failed, timeout
- `result_data` - JSON test results
- `started_at` - Test start timestamp
- `completed_at` - Test completion timestamp
- `error_message` - Optional error details

**Indexes:**
- `router_id`, `test_type`, `started_at`

**Universal State v2 Layer:** Telemetry (Layer 5) - Diagnostic data

---

## Entity Relationships Summary

### System Database Relationships
```
User
├── Sessions (1:many)
└── APIKeys (1:many)

Router
├── Capabilities (1:1)
├── Secret (1:1)
└── Resources (1:many, in router-{id}.db)

AlertRule
├── Template (many:1)
├── Escalations (1:many)
└── Alerts (1:many)
    ├── Escalations (1:many)
    └── DigestEntries (1:many)

ServiceTemplate (marketplace)
```

### Router Database Relationships
```
ServiceInstance (per router)
├── VirtualInterfaces (1:many)
├── Dependencies (1:many)
└── TrafficStats (1:many)

VirtualInterface
└── RoutingChains (1:many)
    ├── Hops (1:many, ordered)
    └── Schedules (1:many)

Resource (Universal State v2)
├── Events (1:many)
├── Parent (many:1, self-reference)
└── Children (1:many, self-reference)
```

---

## Universal State v2 Layer Mapping

| Layer | Entities | Purpose |
|-------|----------|---------|
| **Layer 1: Configuration** | Resource, RoutingChain, ChainHop, RoutingSchedule, DeviceRouting, ConfigSnapshot | User intent and desired state |
| **Layer 2: Validation** | Resource | Pre-flight checks and validation |
| **Layer 3: Deployment** | Resource, VirtualInterface, RoutingChain, DeviceRouting | Applied configuration on router |
| **Layer 4: Runtime** | Resource, ServiceInstance, VirtualInterface | Live operational state |
| **Layer 5: Telemetry** | Resource, ServiceTrafficHourly, DiagnosticResult | Time-series metrics and stats |
| **Layer 6: Metadata** | Resource, ResourceEvent | Lifecycle, tags, audit trail |
| **Layer 7: Relationships** | Resource, ServiceDependency | Dependencies and graph |
| **Layer 8: Platform** | Router, RouterCapability, Resource | Platform capabilities and mappings |

**Reference:** See `Docs/architecture/adrs/012-universal-state-v2.md` for complete layer specifications.

---

## Database Distribution

### system.db (Shared)
**17 entities:**
- Router, RouterCapability, RouterSecret
- User, Session, APIKey
- GlobalSettings, SchemaVersion
- AlertRule, AlertRuleTemplate, Alert, AlertEscalation, AlertDigestEntry
- AlertTemplate, NotificationSettings, NotificationChannelConfig, NotificationLog
- ServiceTemplate

### router-{id}.db (Per Router)
**17 entities:**
- Resource, ResourceEvent, ConfigSnapshot
- ServiceInstance, ServiceDependency, VirtualInterface, VLANAllocation, ServiceTrafficHourly
- RoutingChain, ChainHop, RoutingSchedule, DeviceRouting
- DiagnosticResult
- PortAllocation
- PortKnockSequence (planned, may move to system.db)

---

## Naming Conventions

### Files
- Snake_case for multi-word entities (e.g., `alert_rule.go`, `routing_schedule.go`)
- Lowercase for single-word entities (e.g., `router.go`, `user.go`)

### Fields
- Snake_case for all field names (e.g., `router_id`, `created_at`, `last_seen_at`)
- Prefix foreign keys with entity name (e.g., `router_id`, not `id`)
- Suffix timestamps with `_at` (e.g., `created_at`, `deployed_at`)
- Suffix durations with `_seconds`, `_minutes`, `_hours` (e.g., `timeout_seconds`)
- Suffix flags with descriptive names (e.g., `enabled`, `is_active`, `has_vpn`)

### Enums
- Lowercase with underscores (e.g., `pending`, `running`, `load_balanced`)
- Status enums: `pending`, `running`, `stopped`, `failed`, `completed`
- Boolean-like: `online`/`offline`, `enabled`/`disabled`, `active`/`inactive`

---

## Migration Strategy

When modifying schemas:

1. **Add new fields** - Add with `Optional()` to allow existing rows
2. **Remove fields** - Deprecate first, then remove in next version
3. **Rename fields** - Add new field, migrate data, remove old field
4. **Change types** - Create new field, migrate, remove old field
5. **Add indexes** - Safe to add anytime
6. **Add entities** - Safe to add anytime
7. **Remove entities** - Ensure no foreign key references first

**Always regenerate code after schema changes:**
```bash
npm run codegen:ent
```

---

## Testing Schemas

### Unit Tests
Test schema definitions in isolation:
```go
func TestServiceInstanceSchema(t *testing.T) {
    client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
    defer client.Close()

    instance := client.ServiceInstance.Create().
        SetID(ulid.Make().String()).
        SetFeatureID("tor").
        SetInstanceName("Tor Exit USA").
        SetRouterID(routerID).
        SetStatus(serviceinstance.StatusRunning).
        SaveX(context.Background())

    assert.Equal(t, serviceinstance.StatusRunning, instance.Status)
}
```

### Integration Tests
Test relationships and edge traversal:
```go
func TestServiceInstanceRelationships(t *testing.T) {
    // Test virtual interface relationships
    instance := client.ServiceInstance.Query().
        Where(serviceinstance.IDEQ(id)).
        WithVirtualInterfaces().
        OnlyX(ctx)

    assert.Len(t, instance.Edges.VirtualInterfaces, 1)
}
```

---

## Related Documentation

- **Generated Code:** See `apps/backend/generated/README.md`
- **ent Source:** See `apps/backend/internal/ent-schema/README.md`
- **Universal State v2:** See `Docs/architecture/adrs/012-universal-state-v2.md`
- **Data Architecture:** See `Docs/architecture/data-architecture.md`
- **API Contracts:** See `Docs/architecture/api-contracts.md`

---

**Last Updated:** 2026-02-14
**Schema Count:** 34 entities across 7 domains
**Database Architecture:** Hybrid (system.db + router-{id}.db per router)
