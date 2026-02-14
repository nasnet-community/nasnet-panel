package sharing

import (
	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/router"
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"time"
)

// ServiceExportPackage represents an exported service configuration
type ServiceExportPackage struct {
	SchemaVersion    string                 `json:"schema_version"`
	ExportedAt       time.Time              `json:"exported_at"`
	ServiceType      string                 `json:"service_type"`
	ServiceName      string                 `json:"service_name"`
	BinaryVersion    string                 `json:"binary_version"`
	Config           map[string]interface{} `json:"config"`
	RoutingRules     []RoutingRule          `json:"routing_rules,omitempty"`
	IncludesSecrets  bool                   `json:"includes_secrets"`
	ExportedByUserID string                 `json:"exported_by_user_id,omitempty"`
}

// RoutingRule represents a mangle rule for device routing
type RoutingRule struct {
	Chain          string `json:"chain"`
	Action         string `json:"action"`
	SrcAddress     string `json:"src_address,omitempty"`
	DstAddress     string `json:"dst_address,omitempty"`
	Protocol       string `json:"protocol,omitempty"`
	Comment        string `json:"comment,omitempty"`
	RoutingMark    string `json:"routing_mark,omitempty"`
	NewRoutingMark string `json:"new_routing_mark,omitempty"`
}

// ExportOptions configures what to include in the export
type ExportOptions struct {
	RedactSecrets       bool
	IncludeRoutingRules bool
	UserID              string
}

// SharingService handles service configuration export/import
type SharingService struct {
	entClient       *ent.Client
	routerPort      router.RouterPort
	eventBus        events.EventBus
	featureRegistry *FeatureRegistry
	auditService    AuditService
}

// AuditService interface for audit logging (dependency injection)
type AuditService interface {
	LogExport(ctx context.Context, instanceID, userID string) error
	LogImport(ctx context.Context, instanceID, userID string) error
}

// NewSharingService creates a new sharing service with dependencies
func NewSharingService(
	entClient *ent.Client,
	routerPort router.RouterPort,
	eventBus events.EventBus,
	featureRegistry *FeatureRegistry,
	auditService AuditService,
) *SharingService {
	return &SharingService{
		entClient:       entClient,
		routerPort:      routerPort,
		eventBus:        eventBus,
		featureRegistry: featureRegistry,
		auditService:    auditService,
	}
}

// sensitivePatterns are field name patterns that indicate sensitive data
var sensitivePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)password`),
	regexp.MustCompile(`(?i)secret`),
	regexp.MustCompile(`(?i)token`),
	regexp.MustCompile(`(?i)key`),
	regexp.MustCompile(`(?i)credential`),
	regexp.MustCompile(`(?i)private`),
	regexp.MustCompile(`(?i)apikey`),
	regexp.MustCompile(`(?i)passphrase`),
}

// Export exports a service instance configuration
func (s *SharingService) Export(ctx context.Context, instanceID string, options ExportOptions) (*ServiceExportPackage, error) {
	// Fetch service instance from database
	instance, err := s.entClient.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, &ExportError{
				Code:    "S600",
				Message: fmt.Sprintf("service instance not found: %s", instanceID),
			}
		}
		return nil, fmt.Errorf("failed to fetch service instance: %w", err)
	}

	// Get the feature manifest for schema validation
	manifest, err := s.featureRegistry.GetManifest(instance.FeatureID)
	if err != nil {
		return nil, fmt.Errorf("failed to get feature manifest: %w", err)
	}

	// Clone config to avoid modifying original
	config := make(map[string]interface{})
	for k, v := range instance.Config {
		config[k] = v
	}

	// Redact secrets if requested
	includesSecrets := true
	if options.RedactSecrets {
		config = s.redactSecrets(config, manifest.ConfigSchema)
		includesSecrets = false
	}

	// Build export package
	pkg := &ServiceExportPackage{
		SchemaVersion:    "1.0",
		ExportedAt:       time.Now().UTC(),
		ServiceType:      instance.FeatureID,
		ServiceName:      instance.InstanceName,
		BinaryVersion:    instance.BinaryVersion,
		Config:           config,
		IncludesSecrets:  includesSecrets,
		ExportedByUserID: options.UserID,
	}

	// Add routing rules if requested
	if options.IncludeRoutingRules {
		rules, err := s.fetchRoutingRules(ctx, instance.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch routing rules: %w", err)
		}
		pkg.RoutingRules = rules
	}

	// Publish ServiceConfigExportedEvent
	event := NewServiceConfigExportedEvent(
		instance.ID,
		instance.FeatureID,
		instance.InstanceName,
		includesSecrets,
		options.IncludeRoutingRules,
		options.UserID,
		"sharing-service",
	)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		// Log but don't fail - event publishing is non-critical
		fmt.Printf("Warning: failed to publish ServiceConfigExportedEvent: %v\n", err)
	}

	// Audit log the export
	if s.auditService != nil && options.UserID != "" {
		if err := s.auditService.LogExport(ctx, instance.ID, options.UserID); err != nil {
			// Log but don't fail - audit logging is non-critical
			fmt.Printf("Warning: failed to log export audit: %v\n", err)
		}
	}

	return pkg, nil
}

// redactSecrets removes sensitive fields from config based on schema directives and pattern matching
func (s *SharingService) redactSecrets(config map[string]interface{}, configSchema json.RawMessage) map[string]interface{} {
	redacted := make(map[string]interface{})

	// Parse schema to find @sensitive fields
	var schema map[string]interface{}
	if len(configSchema) > 0 {
		if err := json.Unmarshal(configSchema, &schema); err == nil {
			// Schema successfully parsed, use it for directive-based redaction
			if properties, ok := schema["properties"].(map[string]interface{}); ok {
				for key, value := range config {
					if s.isSensitiveField(key, properties) {
						redacted[key] = "***REDACTED***"
					} else {
						redacted[key] = value
					}
				}
				return redacted
			}
		}
	}

	// Fallback: pattern-based redaction if schema parsing failed
	for key, value := range config {
		if s.matchesSensitivePattern(key) {
			redacted[key] = "***REDACTED***"
		} else {
			redacted[key] = value
		}
	}

	return redacted
}

// isSensitiveField checks if a field has @sensitive directive in schema
func (s *SharingService) isSensitiveField(fieldName string, properties map[string]interface{}) bool {
	if prop, ok := properties[fieldName].(map[string]interface{}); ok {
		if sensitive, ok := prop["@sensitive"].(bool); ok && sensitive {
			return true
		}
		// Also check x-sensitive extension (common in JSON Schema)
		if sensitive, ok := prop["x-sensitive"].(bool); ok && sensitive {
			return true
		}
	}

	// Fallback to pattern matching
	return s.matchesSensitivePattern(fieldName)
}

// matchesSensitivePattern checks if field name matches sensitive patterns
func (s *SharingService) matchesSensitivePattern(fieldName string) bool {
	for _, pattern := range sensitivePatterns {
		if pattern.MatchString(fieldName) {
			return true
		}
	}
	return false
}

// fetchRoutingRules queries mangle rules from router for this service instance
func (s *SharingService) fetchRoutingRules(ctx context.Context, instanceID string) ([]RoutingRule, error) {
	// Query mangle rules via RouterPort
	query := router.StateQuery{
		Path: "/ip/firewall/mangle",
		Filter: map[string]string{
			"comment": fmt.Sprintf("nasnet-service-%s", instanceID),
		},
	}

	result, err := s.routerPort.QueryState(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query mangle rules: %w", err)
	}

	// Parse result into routing rules
	var rules []RoutingRule
	for _, resource := range result.Resources {
		rules = append(rules, RoutingRule{
			Chain:          resource["chain"],
			Action:         resource["action"],
			SrcAddress:     resource["src-address"],
			DstAddress:     resource["dst-address"],
			Protocol:       resource["protocol"],
			Comment:        resource["comment"],
			RoutingMark:    resource["routing-mark"],
			NewRoutingMark: resource["new-routing-mark"],
		})
	}

	return rules, nil
}


// ExportError represents an error during export operation
type ExportError struct {
	Code    string
	Message string
}

func (e *ExportError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// ServiceConfigExportedEvent is emitted when a service config is exported
type ServiceConfigExportedEvent struct {
	events.BaseEvent
	InstanceID          string `json:"instanceId"`
	ServiceType         string `json:"serviceType"`
	ServiceName         string `json:"serviceName"`
	IncludesSecrets     bool   `json:"includesSecrets"`
	IncludesRoutingRules bool   `json:"includesRoutingRules"`
	ExportedByUserID    string `json:"exportedByUserId,omitempty"`
}

// Payload returns the JSON-serialized event payload
func (e *ServiceConfigExportedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewServiceConfigExportedEvent creates a new ServiceConfigExportedEvent
func NewServiceConfigExportedEvent(
	instanceID, serviceType, serviceName string,
	includesSecrets, includesRoutingRules bool,
	exportedByUserID, source string,
) *ServiceConfigExportedEvent {
	return &ServiceConfigExportedEvent{
		BaseEvent:            events.NewBaseEvent("service.config.exported", events.PriorityNormal, source),
		InstanceID:           instanceID,
		ServiceType:          serviceType,
		ServiceName:          serviceName,
		IncludesSecrets:      includesSecrets,
		IncludesRoutingRules: includesRoutingRules,
		ExportedByUserID:     exportedByUserID,
	}
}
