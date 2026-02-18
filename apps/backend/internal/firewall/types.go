package firewall

import (
	"time"
)

// Template represents a firewall template
type Template struct {
	ID          string             `json:"id"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	Category    string             `json:"category"`
	Complexity  string             `json:"complexity"`
	RuleCount   int                `json:"ruleCount"`
	Version     string             `json:"version"`
	IsBuiltIn   bool               `json:"isBuiltIn"`
	Variables   []TemplateVariable `json:"variables"`
	Rules       []TemplateRule     `json:"rules"`
	CreatedAt   *time.Time         `json:"createdAt,omitempty"`
	UpdatedAt   *time.Time         `json:"updatedAt,omitempty"`
}

// TemplateVariable represents a template parameter
type TemplateVariable struct {
	Name         string   `json:"name"`
	Label        string   `json:"label"`
	Type         string   `json:"type"`
	Required     bool     `json:"required"`
	DefaultValue string   `json:"defaultValue,omitempty"`
	Description  string   `json:"description,omitempty"`
	Options      []string `json:"options,omitempty"`
}

// TemplateRule represents a firewall rule in a template
type TemplateRule struct {
	Table      string                 `json:"table"`
	Chain      string                 `json:"chain"`
	Action     string                 `json:"action"`
	Comment    string                 `json:"comment,omitempty"`
	Position   *int                   `json:"position,omitempty"`
	Properties map[string]interface{} `json:"properties"`
}

// PreviewResult contains the result of a template preview
type PreviewResult struct {
	Template       *Template
	ResolvedRules  []TemplateRule
	Conflicts      []Conflict
	ImpactAnalysis ImpactAnalysis
}

// Conflict represents a detected conflict
type Conflict struct {
	Type           string
	Message        string
	ExistingRuleID string
	ProposedRule   TemplateRule
}

// ImpactAnalysis provides impact metrics
type ImpactAnalysis struct {
	NewRulesCount      int
	AffectedChains     []string
	EstimatedApplyTime int
	Warnings           []string
}

// ApplyResult contains the result of template application
type ApplyResult struct {
	Success           bool
	AppliedRulesCount int
	RollbackID        string
	Errors            []string
}

// RollbackState stores state for template rollback
type RollbackState struct {
	ID             string
	RouterID       string
	TemplateID     string
	AppliedAt      time.Time
	ExpiresAt      time.Time
	CreatedRuleIDs []string
	PreviousState  []Rule
}

// Rule represents an existing firewall rule
type Rule struct {
	ID         string
	Table      string
	Chain      string
	Action     string
	Comment    string
	Properties map[string]interface{}
}

// AddressListAggregate represents an aggregated view of an address list
type AddressListAggregate struct {
	Name                  string
	EntryCount            int
	DynamicCount          int
	ReferencingRulesCount int
}

// AddressListEntry represents a single entry in an address list
type AddressListEntry struct {
	ID           string
	List         string
	Address      string
	Comment      *string
	Timeout      *string
	CreationTime *time.Time
	Dynamic      bool
	Disabled     bool
}

// AddressListEntryConnection represents a paginated connection
type AddressListEntryConnection struct {
	Edges      []AddressListEntryEdge
	PageInfo   PageInfo
	TotalCount int
}

// AddressListEntryEdge represents an edge in the connection
type AddressListEntryEdge struct {
	Cursor string
	Node   AddressListEntry
}

// PageInfo represents pagination information
type PageInfo struct {
	HasNextPage bool
	EndCursor   *string
}

// CreateAddressListEntryInput represents input for creating an address list entry
type CreateAddressListEntryInput struct {
	List    string
	Address string
	Comment *string
	Timeout *string
}

// BulkAddressInput represents a single address in bulk import
type BulkAddressInput struct {
	Address string
	Comment *string
	Timeout *string
}

// BulkCreateResult represents the result of bulk address list entry creation
type BulkCreateResult struct {
	SuccessCount int
	FailedCount  int
	Errors       []BulkCreateError
}

// BulkCreateError represents a single error in bulk import
type BulkCreateError struct {
	Index   int
	Address string
	Message string
}
