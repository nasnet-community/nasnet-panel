package templates

import "time"

// TemplateCategory represents the category of a service template
type TemplateCategory string

const (
	CategoryPrivacy       TemplateCategory = "privacy"
	CategoryAntiCensorship TemplateCategory = "anti-censorship"
	CategoryMessaging     TemplateCategory = "messaging"
	CategoryGaming        TemplateCategory = "gaming"
	CategorySecurity      TemplateCategory = "security"
	CategoryNetworking    TemplateCategory = "networking"
)

// TemplateScope defines the deployment scope of a template
type TemplateScope string

const (
	ScopeSingle   TemplateScope = "single"   // Single service instance
	ScopeMultiple TemplateScope = "multiple" // Multiple coordinated services
	ScopeChain    TemplateScope = "chain"    // Chained service instances (e.g., Tor -> Xray)
)

// VariableType defines the type of a configuration variable
type VariableType string

const (
	VarTypeString  VariableType = "string"
	VarTypeNumber  VariableType = "number"
	VarTypeBoolean VariableType = "boolean"
	VarTypeEnum    VariableType = "enum"
	VarTypePort    VariableType = "port"
	VarTypeIP      VariableType = "ip"
)

// ServiceTemplate represents a pre-configured service deployment template
type ServiceTemplate struct {
	// Metadata
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Category    TemplateCategory `json:"category"`
	Scope       TemplateScope    `json:"scope"`
	Version     string           `json:"version"`
	Author      string           `json:"author,omitempty"`
	CreatedAt   time.Time        `json:"createdAt,omitempty"`
	UpdatedAt   time.Time        `json:"updatedAt,omitempty"`

	// Template configuration
	Services          []ServiceSpec          `json:"services"`
	ConfigVariables   []TemplateVariable     `json:"configVariables"`
	SuggestedRouting  []SuggestedRoutingRule `json:"suggestedRouting,omitempty"`
	EstimatedResources ResourceEstimate      `json:"estimatedResources,omitempty"`

	// Documentation
	Tags          []string `json:"tags,omitempty"`
	Prerequisites []string `json:"prerequisites,omitempty"`
	Documentation string   `json:"documentation,omitempty"`
	Examples      []string `json:"examples,omitempty"`
}

// ServiceSpec defines a service instance within a template
type ServiceSpec struct {
	// Service identification
	ServiceType string `json:"serviceType"` // Feature ID (e.g., "tor", "xray-core")
	Name        string `json:"name"`        // Instance name template (supports variables)

	// Configuration
	ConfigOverrides map[string]interface{} `json:"configOverrides,omitempty"` // Service-specific config

	// Dependencies
	DependsOn []string `json:"dependsOn,omitempty"` // References to other services in this template (by Name)

	// Resource constraints
	MemoryLimitMB int `json:"memoryLimitMB,omitempty"`
	CPUShares     int `json:"cpuShares,omitempty"`

	// Network configuration
	RequiresBridge bool   `json:"requiresBridge,omitempty"` // Whether this service needs Virtual Interface Factory
	VLANID         *int   `json:"vlanId,omitempty"`         // Optional VLAN ID (if nil, auto-allocate)
	PortMappings   []Port `json:"portMappings,omitempty"`   // Port allocations
}

// Port represents a port mapping
type Port struct {
	Internal int    `json:"internal"`          // Container port
	External int    `json:"external"`          // Host port (0 = auto-allocate)
	Protocol string `json:"protocol"`          // "tcp" or "udp"
	Purpose  string `json:"purpose,omitempty"` // Description (e.g., "SOCKS5 proxy")
}

// TemplateVariable defines a user-configurable variable
type TemplateVariable struct {
	Name        string       `json:"name"`        // Variable name (e.g., "TOR_NAME")
	Type        VariableType `json:"type"`        // Variable type
	Required    bool         `json:"required"`    // Whether the variable is required
	Default     interface{}  `json:"default"`     // Default value (can be nil)
	Description string       `json:"description"` // Human-readable description
	Label       string       `json:"label"`       // Display label for UI

	// Validation
	ValidationPattern string        `json:"validationPattern,omitempty"` // Regex pattern for validation
	MinValue          *float64      `json:"minValue,omitempty"`          // For number types
	MaxValue          *float64      `json:"maxValue,omitempty"`          // For number types
	EnumValues        []interface{} `json:"enumValues,omitempty"`        // For enum types
}

// SuggestedRoutingRule provides routing recommendations for the template
type SuggestedRoutingRule struct {
	DevicePattern   string `json:"devicePattern"`             // Device name pattern (e.g., "all", "phone-*")
	TargetService   string `json:"targetService"`             // Service name from template
	Protocol        string `json:"protocol,omitempty"`        // "tcp", "udp", or "all"
	DestinationPort *int   `json:"destinationPort,omitempty"` // Optional port filter
	Description     string `json:"description"`               // Explanation of this routing rule
}

// ResourceEstimate provides estimated resource usage for the template
type ResourceEstimate struct {
	TotalMemoryMB  int `json:"totalMemoryMB"`  // Total estimated memory usage
	TotalCPUShares int `json:"totalCPUShares"` // Total CPU shares
	DiskSpaceMB    int `json:"diskSpaceMB"`    // Estimated disk space needed
	NetworkPorts   int `json:"networkPorts"`   // Number of ports that will be allocated
	VLANsRequired  int `json:"vlansRequired"`  // Number of VLANs needed
}

// InstallationProgress tracks the installation progress of a template
type InstallationProgress struct {
	TemplateID     string            `json:"templateId"`
	TotalServices  int               `json:"totalServices"`
	InstalledCount int               `json:"installedCount"`
	CurrentService string            `json:"currentService,omitempty"`
	Status         InstallationStatus `json:"status"`
	ErrorMessage   string            `json:"errorMessage,omitempty"`
	StartedAt      time.Time         `json:"startedAt"`
	CompletedAt    *time.Time        `json:"completedAt,omitempty"`
	ServiceResults []ServiceResult   `json:"serviceResults"`
}

// InstallationStatus represents the status of template installation
type InstallationStatus string

const (
	InstallationPending    InstallationStatus = "pending"
	InstallationInProgress InstallationStatus = "in_progress"
	InstallationCompleted  InstallationStatus = "completed"
	InstallationFailed     InstallationStatus = "failed"
	InstallationPartial    InstallationStatus = "partial" // Some services installed, some failed
)

// ServiceResult tracks the result of installing a single service from a template
type ServiceResult struct {
	ServiceName  string    `json:"serviceName"`
	InstanceID   string    `json:"instanceId,omitempty"`
	Status       string    `json:"status"` // "success", "failed", "skipped"
	ErrorMessage string    `json:"errorMessage,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// InstallationRequest represents a request to install a template
type InstallationRequest struct {
	TemplateID string                 `json:"templateId"`
	Variables  map[string]interface{} `json:"variables"`
	DryRun     bool                   `json:"dryRun,omitempty"` // Preview without actually installing
}

// InstallationResult represents the result of a template installation
type InstallationResult struct {
	Success        bool            `json:"success"`
	InstanceIDs    []string        `json:"instanceIds"`    // Created service instance IDs
	ServiceMapping map[string]string `json:"serviceMapping"` // Map of service names to instance IDs
	Errors         []string        `json:"errors,omitempty"`
	Progress       *InstallationProgress `json:"progress,omitempty"`
}
