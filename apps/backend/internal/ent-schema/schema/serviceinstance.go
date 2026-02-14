// Package schema contains ent schema definitions for NasNetConnect.
// ServiceInstance represents a running instance of a downloadable network service (Feature Marketplace).
package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ServiceInstance holds the schema definition for the ServiceInstance entity.
// ServiceInstances represent running instances of downloadable network services
// (Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home, etc.) managed by NasNetConnect.
type ServiceInstance struct {
	ent.Schema
}

// Fields of the ServiceInstance entity.
func (ServiceInstance) Fields() []ent.Field {
	return []ent.Field{
		// ULID primary key (26 characters, base32 encoded)
		field.String("id").
			MaxLen(26).
			NotEmpty().
			Unique().
			Immutable().
			Comment("ULID primary key"),

		// Feature identification
		field.String("feature_id").
			NotEmpty().
			MaxLen(100).
			Comment("Feature identifier (e.g., 'tor', 'sing-box', 'xray-core')"),

		field.String("instance_name").
			NotEmpty().
			MaxLen(255).
			Comment("Human-readable instance name"),

		// Router association
		field.String("router_id").
			MaxLen(26).
			NotEmpty().
			Comment("Router ID this instance belongs to"),

		// Status tracking
		field.Enum("status").
			Values(
				"installing",
				"installed",
				"starting",
				"running",
				"stopping",
				"stopped",
				"failed",
				"deleting",
			).
			Default("installing").
			Comment("Current instance lifecycle status"),

		// Network configuration
		field.Int("vlan_id").
			Optional().
			Nillable().
			Min(1).
			Max(4094).
			Comment("VLAN ID for network isolation (optional)"),

		field.String("bind_ip").
			Optional().
			MaxLen(45). // IPv6 max length
			Comment("IP address to bind the service to (optional)"),

		field.JSON("ports", []int{}).
			Optional().
			Comment("List of ports used by this service instance"),

		// Service configuration and binary info
		field.JSON("config", map[string]interface{}{}).
			Optional().
			Comment("Service-specific configuration (JSON)"),

		field.String("binary_path").
			Optional().
			MaxLen(512).
			Comment("Path to the service binary on the router filesystem"),

		field.String("binary_version").
			Optional().
			MaxLen(50).
			Comment("Version of the service binary"),

		field.String("binary_checksum").
			Optional().
			MaxLen(128).
			Comment("SHA256 checksum of the service binary for integrity verification"),

		// Resource budgeting fields (NAS-8.15: Resource Budgeting System)
		field.Int64("memory_limit").
			Optional().
			Nillable().
			Min(1048576).
			Comment("Memory limit in bytes for this service instance (minimum 1MB)"),

		field.Int("cpu_weight").
			Optional().
			Default(100).
			Min(1).
			Max(100).
			Comment("CPU weight for cgroups scheduling (1-100, default 100)"),

		// Binary verification fields (ADR-XXX: Binary Verification System)
		field.Bool("verification_enabled").
			Default(false).
			Comment("Whether binary verification is enabled for this instance"),

		field.String("archive_hash").
			Optional().
			MaxLen(64).
			Comment("SHA256 hash of the original downloaded archive (from checksums.txt)"),

		field.String("binary_hash").
			Optional().
			MaxLen(64).
			Comment("SHA256 hash of the extracted binary (computed at runtime)"),

		field.Bool("gpg_verified").
			Default(false).
			Comment("Whether GPG signature verification was performed and passed"),

		field.String("gpg_key_id").
			Optional().
			MaxLen(64).
			Comment("GPG key ID that signed the checksums file"),

		field.String("checksums_url").
			Optional().
			MaxLen(512).
			Comment("URL where checksums.txt was fetched from"),

		field.Time("verified_at").
			Optional().
			Nillable().
			Comment("Timestamp when binary was last verified"),

		// Storage availability tracking
		field.String("unavailable_reason").
			Optional().
			MaxLen(500).
			Comment("Reason why instance is unavailable (e.g., 'External storage disconnected: /usb1')"),

		// Auto-start on system boot
		field.Bool("auto_start").
			Default(false).
			Comment("Whether to automatically start this service instance on system boot"),

		// Health monitoring fields (NAS-8.6: Service Health Monitoring)
		field.Enum("health_status").
			Values("HEALTHY", "UNHEALTHY", "UNKNOWN", "CHECKING").
			Default("UNKNOWN").
			Comment("Current health status of the service instance"),

		field.Bool("health_process_alive").
			Default(false).
			Comment("Whether the service process is alive (PID check)"),

		field.Enum("health_connection_status").
			Values("CONNECTED", "CONNECTING", "FAILED").
			Default("FAILED").
			Comment("Connection status from health probe (TCP/HTTP check)"),

		field.Int("health_latency_ms").
			Optional().
			Nillable().
			Min(0).
			Comment("Health probe latency in milliseconds (null if probe hasn't run)"),

		field.Time("health_last_healthy_at").
			Optional().
			Nillable().
			Comment("Timestamp of when the instance was last healthy"),

		field.Int("health_consecutive_fails").
			Default(0).
			Min(0).
			Comment("Number of consecutive health check failures"),

		field.Int("health_check_interval_seconds").
			Default(30).
			Min(10).
			Max(300).
			Comment("Health check interval in seconds (10-300, default 30)"),

		field.Int("health_failure_threshold").
			Default(3).
			Min(1).
			Max(10).
			Comment("Number of consecutive failures before marking unhealthy (1-10, default 3)"),

		// Traffic quota fields (NAS-8.8: Traffic Statistics & Quotas)
		field.Int64("quota_bytes").
			Optional().
			Nillable().
			Min(0).
			Comment("Traffic quota limit in bytes (0 or null = unlimited)"),

		field.Enum("quota_period").
			Optional().
			Nillable().
			Values("daily", "weekly", "monthly").
			Comment("Quota period: daily, weekly, or monthly"),

		field.Enum("quota_action").
			Optional().
			Nillable().
			Values("LOG_ONLY", "ALERT", "STOP_SERVICE", "THROTTLE").
			Comment("Action to take when quota is exceeded"),

		field.Int64("quota_used_bytes").
			Default(0).
			Min(0).
			Comment("Bytes consumed in current quota period"),

		field.Time("quota_reset_at").
			Optional().
			Nillable().
			Comment("Timestamp when quota will reset (period boundary)"),

		// Update management fields (NAS-8.7: Service Update Manager)
		field.String("available_update_version").
			Optional().
			MaxLen(50).
			Comment("Version of available update (null if no update available)"),

		field.Enum("available_update_severity").
			Optional().
			Nillable().
			Values("CRITICAL", "MAJOR", "MINOR", "PATCH").
			Comment("Severity of available update"),

		field.Time("last_update_check").
			Optional().
			Nillable().
			Comment("Timestamp of last update check"),

		field.String("last_update_etag").
			Optional().
			MaxLen(128).
			Comment("ETag from last GitHub API check (for conditional requests)"),

		field.String("update_changelog_url").
			Optional().
			MaxLen(512).
			Comment("URL to release notes for available update"),

		field.String("update_check_schedule").
			Optional().
			MaxLen(50).
			Default("6h").
			Comment("Update check schedule (e.g., '6h', '12h', '24h', 'manual')"),

		field.Enum("auto_apply_threshold").
			Optional().
			Nillable().
			Values("CRITICAL", "MAJOR", "MINOR", "PATCH", "MANUAL").
			Default("CRITICAL").
			Comment("Minimum severity to auto-apply updates (MANUAL = never auto-apply)"),

		field.Bool("has_backup").
			Default(false).
			Comment("Whether a backup of the current version exists"),

		field.String("backup_version").
			Optional().
			MaxLen(50).
			Comment("Version of the backed-up binary"),

		field.Time("last_updated_at").
			Optional().
			Nillable().
			Comment("Timestamp when binary was last updated to a new version"),

		// Timestamps
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Comment("Record creation timestamp"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Last update timestamp"),
	}
}

// Edges of the ServiceInstance entity.
func (ServiceInstance) Edges() []ent.Edge {
	return []ent.Edge{
		// Belongs to Router (many-to-one relationship)
		edge.From("router", Router.Type).
			Ref("service_instances").
			Field("router_id").
			Unique().
			Required().
			Comment("The router this service instance belongs to"),

		// Has many PortAllocations (one-to-many relationship)
		edge.To("port_allocations", PortAllocation.Type).
			Comment("Port allocations for this service instance"),

		// Has many VLANAllocations (one-to-many relationship)
		edge.To("vlan_allocations", VLANAllocation.Type).
			Comment("VLAN allocations for this service instance"),

		// Has one VirtualInterface (one-to-one relationship)
		edge.To("virtual_interface", VirtualInterface.Type).
			Unique().
			Comment("Virtual interface for this service instance"),

		// Has many dependencies (services this instance depends on)
		edge.To("dependencies", ServiceDependency.Type).
			Comment("Service dependencies - services this instance depends on"),

		// Has many dependents (services that depend on this instance)
		edge.To("dependents", ServiceDependency.Type).
			Comment("Service dependents - services that depend on this instance"),

		// Has many device routings (devices routed through this instance)
		edge.To("device_routings", DeviceRouting.Type).
			Comment("Device routing assignments using this service instance"),

		// Has many diagnostic results (test results for this instance)
		edge.To("diagnostic_results", DiagnosticResult.Type).
			Comment("Diagnostic test results for this service instance"),

		// Has many hourly traffic records (for historical traffic analysis)
		edge.To("traffic_hourly", ServiceTrafficHourly.Type).
			Comment("Hourly aggregated traffic statistics for this service instance"),
	}
}

// Indexes of the ServiceInstance entity.
func (ServiceInstance) Indexes() []ent.Index {
	return []ent.Index{
		// Index for looking up instances by router
		index.Fields("router_id"),
		// Index for filtering by status
		index.Fields("status"),
		// Index for filtering by feature type
		index.Fields("feature_id"),
		// Composite index for router + feature queries
		index.Fields("router_id", "feature_id"),
		// Composite index for router + status queries
		index.Fields("router_id", "status"),
	}
}
