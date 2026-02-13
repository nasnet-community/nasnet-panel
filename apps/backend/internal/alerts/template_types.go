package alerts

import (
	"time"
)

// AlertRuleTemplate represents a reusable alert rule configuration
type AlertRuleTemplate struct {
	ID          string                       `json:"id"`
	Name        string                       `json:"name"`
	Description string                       `json:"description"`
	Category    AlertRuleTemplateCategory    `json:"category"`
	Severity    string                       `json:"severity"`
	EventType   string                       `json:"eventType"`
	Conditions  []TemplateCondition          `json:"conditions"`
	Throttle    *TemplateThrottle            `json:"throttle,omitempty"`
	Channels    []string                     `json:"channels"`
	Variables   []AlertRuleTemplateVariable  `json:"variables"`
	IsBuiltIn   bool                         `json:"isBuiltIn"`
	Version     string                       `json:"version"`
	CreatedAt   *time.Time                   `json:"createdAt,omitempty"`
	UpdatedAt   *time.Time                   `json:"updatedAt,omitempty"`
}

// AlertRuleTemplateCategory represents template categories
type AlertRuleTemplateCategory string

const (
	CategoryNetwork   AlertRuleTemplateCategory = "NETWORK"
	CategorySecurity  AlertRuleTemplateCategory = "SECURITY"
	CategoryResources AlertRuleTemplateCategory = "RESOURCES"
	CategoryVPN       AlertRuleTemplateCategory = "VPN"
	CategoryDHCP      AlertRuleTemplateCategory = "DHCP"
	CategorySystem    AlertRuleTemplateCategory = "SYSTEM"
	CategoryCustom    AlertRuleTemplateCategory = "CUSTOM"
)

// AlertRuleTemplateVariable represents a configurable parameter in a template
type AlertRuleTemplateVariable struct {
	Name         string                         `json:"name"`
	Label        string                         `json:"label"`
	Type         AlertRuleTemplateVariableType  `json:"type"`
	Required     bool                           `json:"required"`
	DefaultValue *string                        `json:"defaultValue,omitempty"`
	Min          *int                           `json:"min,omitempty"`
	Max          *int                           `json:"max,omitempty"`
	Unit         *string                        `json:"unit,omitempty"`
	Description  *string                        `json:"description,omitempty"`
}

// AlertRuleTemplateVariableType represents variable data types
type AlertRuleTemplateVariableType string

const (
	VarTypeString     AlertRuleTemplateVariableType = "STRING"
	VarTypeInteger    AlertRuleTemplateVariableType = "INTEGER"
	VarTypeDuration   AlertRuleTemplateVariableType = "DURATION"
	VarTypePercentage AlertRuleTemplateVariableType = "PERCENTAGE"
)

// TemplateCondition represents a condition in a template (can contain variable references)
type TemplateCondition struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"` // Can be literal or {{VARIABLE_NAME}}
}

// TemplateThrottle represents throttle configuration in a template
type TemplateThrottle struct {
	MaxAlerts     int     `json:"maxAlerts"`
	PeriodSeconds int     `json:"periodSeconds"`
	GroupByField  *string `json:"groupByField,omitempty"`
}

// PreviewResult contains the result of template preview
type PreviewResult struct {
	Template          *AlertRuleTemplate
	ResolvedEventType string
	ResolvedConditions []ResolvedCondition
	ResolvedThrottle   *TemplateThrottle
	ValidationInfo     ValidationInfo
}

// ResolvedCondition represents a condition with variables substituted
type ResolvedCondition struct {
	Field    string
	Operator string
	Value    interface{}
}

// ValidationInfo provides validation feedback
type ValidationInfo struct {
	IsValid          bool
	MissingVariables []string
	InvalidVariables []string
	Warnings         []string
}

// ApplyResult contains the result of template application
type ApplyResult struct {
	Success      bool
	AlertRuleID  string
	TemplateName string
	Errors       []string
}
