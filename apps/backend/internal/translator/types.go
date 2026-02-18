// Package translator implements the two-layer translation pattern for converting
// GraphQL operations to RouterOS commands across multiple protocols (REST, API, SSH).
//
// Architecture:
//
//	GraphQL → Canonical → Protocol
//	   ↓         ↓           ↓
//	Type-safe  Portable    Native
//
// The translator extracts field mappings from @mikrotik directives at startup
// and uses them to convert GraphQL mutations/queries to platform-specific commands.
package translator

import (
	"fmt"
	"strings"
	"time"
)

// Action represents the type of operation to perform on a RouterOS path.
type Action string

const (
	// ActionGet retrieves a single item by ID.
	ActionGet Action = "get"
	// ActionPrint retrieves multiple items (list query).
	ActionPrint Action = "print"
	// ActionAdd creates a new item.
	ActionAdd Action = "add"
	// ActionSet modifies an existing item.
	ActionSet Action = "set"
	// ActionRemove deletes an item.
	ActionRemove Action = "remove"
	// ActionEnable enables a disabled item.
	ActionEnable Action = "enable"
	// ActionDisable disables an enabled item.
	ActionDisable Action = "disable"
	// ActionMove reorders an item in a list.
	ActionMove Action = "move"
)

// Protocol represents the communication protocol used to connect to a router.
type Protocol string

const (
	// ProtocolREST uses RouterOS REST API (RouterOS 7.1+).
	ProtocolREST Protocol = "REST"
	// ProtocolAPI uses RouterOS Binary API (port 8728).
	ProtocolAPI Protocol = "API"
	// ProtocolAPISSL uses RouterOS Binary API over TLS (port 8729).
	ProtocolAPISSL Protocol = "API-SSL"
	// ProtocolSSH uses SSH CLI commands.
	ProtocolSSH Protocol = "SSH"
	// ProtocolTelnet uses Telnet CLI commands (legacy fallback).
	ProtocolTelnet Protocol = "TELNET"
)

// RouterOSVersion represents a RouterOS version for version-aware translations.
type RouterOSVersion struct {
	Major   int    `json:"major"`
	Minor   int    `json:"minor"`
	Patch   int    `json:"patch,omitempty"`
	Channel string `json:"channel,omitempty"` // stable, testing, development
}

// String returns the version as a string (e.g., "7.13.2").
func (v RouterOSVersion) String() string {
	if v.Patch > 0 {
		return fmt.Sprintf("%d.%d.%d", v.Major, v.Minor, v.Patch)
	}
	return fmt.Sprintf("%d.%d", v.Major, v.Minor)
}

// IsAtLeast returns true if this version is at least the given version.
func (v RouterOSVersion) IsAtLeast(major, minor int) bool {
	if v.Major > major {
		return true
	}
	if v.Major == major && v.Minor >= minor {
		return true
	}
	return false
}

// IsROS7 returns true if this is RouterOS 7.x.
func (v RouterOSVersion) IsROS7() bool {
	return v.Major >= 7
}

// IsROS6 returns true if this is RouterOS 6.x.
func (v RouterOSVersion) IsROS6() bool {
	return v.Major == 6
}

// ParseVersion parses a RouterOS version string (e.g., "7.13.2 (stable)").
func ParseVersion(s string) (RouterOSVersion, error) {
	var v RouterOSVersion

	// Remove channel suffix in parentheses
	if idx := strings.Index(s, " ("); idx != -1 {
		v.Channel = strings.Trim(s[idx+2:], ")")
		s = s[:idx]
	}

	// Parse version numbers
	parts := strings.Split(s, ".")
	if len(parts) < 2 {
		return v, fmt.Errorf("invalid version format: %s", s)
	}

	if _, err := fmt.Sscanf(parts[0], "%d", &v.Major); err != nil {
		return v, fmt.Errorf("invalid major version: %w", err)
	}
	if _, err := fmt.Sscanf(parts[1], "%d", &v.Minor); err != nil {
		return v, fmt.Errorf("invalid minor version: %w", err)
	}
	if len(parts) > 2 {
		_, _ = fmt.Sscanf(parts[2], "%d", &v.Patch) //nolint:errcheck // best-effort parse
	}

	return v, nil
}

// Filter represents a query filter for print operations.
type Filter struct {
	Field    string      // Field name to filter on
	Operator FilterOp    // Comparison operator
	Value    interface{} // Value to compare against
}

// FilterOp represents a filter comparison operator.
type FilterOp string

const (
	FilterOpEquals      FilterOp = "="
	FilterOpNotEquals   FilterOp = "!="
	FilterOpGreater     FilterOp = ">"
	FilterOpLess        FilterOp = "<"
	FilterOpGreaterOrEq FilterOp = ">="
	FilterOpLessOrEq    FilterOp = "<="
	FilterOpContains    FilterOp = "~"  // Regex match
	FilterOpIn          FilterOp = "in" // In list
)

// String returns the filter as a RouterOS-style query string.
func (f Filter) String() string {
	return fmt.Sprintf("?%s%s%v", f.Field, f.Operator, f.Value)
}

// CanonicalCommand represents a platform-agnostic command that can be
// translated to any supported protocol format.
//
// This is the intermediate representation between GraphQL operations
// and protocol-specific commands. It contains all information needed
// to execute the operation on any supported router platform.
type CanonicalCommand struct {
	// Path is the RouterOS API path (e.g., "/interface/ethernet").
	Path string `json:"path"`

	// Action is the operation to perform (get, set, add, remove, print).
	Action Action `json:"action"`

	// Parameters contains the field values for the operation.
	// Keys are canonical field names (GraphQL-style camelCase).
	Parameters map[string]interface{} `json:"parameters,omitempty"`

	// Filters contains query filters for print operations.
	Filters []Filter `json:"filters,omitempty"`

	// ID is the .id of the item for get/set/remove operations.
	ID string `json:"id,omitempty"`

	// Version is the target RouterOS version for version-aware mappings.
	Version *RouterOSVersion `json:"version,omitempty"`

	// PropList limits which fields to return in print operations.
	PropList []string `json:"proplist,omitempty"`

	// Timeout overrides the default command timeout.
	Timeout time.Duration `json:"timeout,omitempty"`

	// Metadata contains additional context for logging and debugging.
	Metadata CommandMetadata `json:"metadata,omitempty"`
}

// CommandMetadata contains additional context for logging and debugging.
type CommandMetadata struct {
	// RequestID is the correlation ID from the GraphQL request.
	RequestID string `json:"requestId,omitempty"`

	// OperationName is the GraphQL operation name.
	OperationName string `json:"operationName,omitempty"`

	// FieldPath is the GraphQL field path (e.g., "mutation.updateInterface").
	FieldPath string `json:"fieldPath,omitempty"`

	// RouterID is the target router identifier.
	RouterID string `json:"routerId,omitempty"`
}

// CanonicalResponse represents the platform-agnostic response from a command.
//
// This is the result of executing a command, normalized to a common format
// regardless of which protocol was used.
type CanonicalResponse struct {
	// Success indicates whether the command completed successfully.
	Success bool `json:"success"`

	// Data contains the response data for successful queries.
	// For single-item queries, this is a map[string]interface{}.
	// For list queries, this is []map[string]interface{}.
	Data interface{} `json:"data,omitempty"`

	// ID is the .id of a created item (for add operations).
	ID string `json:"id,omitempty"`

	// Error contains error information if Success is false.
	Error *CommandError `json:"error,omitempty"`

	// Metadata contains additional response context.
	Metadata ResponseMetadata `json:"metadata,omitempty"`
}

// CommandError represents an error from command execution.
type CommandError struct {
	// Code is the error code (platform-specific or mapped).
	Code string `json:"code"`

	// Message is the human-readable error message.
	Message string `json:"message"`

	// Category classifies the error type.
	Category ErrorCategory `json:"category"`

	// Details contains additional error context.
	Details map[string]interface{} `json:"details,omitempty"`

	// Retryable indicates if the operation can be retried.
	Retryable bool `json:"retryable"`
}

// Error implements the error interface.
func (e *CommandError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.Category, e.Code, e.Message)
}

// ErrorCategory classifies command errors.
type ErrorCategory string

const (
	// ErrorCategoryValidation indicates invalid input data.
	ErrorCategoryValidation ErrorCategory = "VALIDATION"
	// ErrorCategoryNotFound indicates the requested item doesn't exist.
	ErrorCategoryNotFound ErrorCategory = "NOT_FOUND"
	// ErrorCategoryConflict indicates a conflict (e.g., duplicate name).
	ErrorCategoryConflict ErrorCategory = "CONFLICT"
	// ErrorCategoryPermission indicates insufficient permissions.
	ErrorCategoryPermission ErrorCategory = "PERMISSION"
	// ErrorCategoryConnection indicates a connection/network error.
	ErrorCategoryConnection ErrorCategory = "CONNECTION"
	// ErrorCategoryTimeout indicates the operation timed out.
	ErrorCategoryTimeout ErrorCategory = "TIMEOUT"
	// ErrorCategoryInternal indicates an internal error.
	ErrorCategoryInternal ErrorCategory = "INTERNAL"
	// ErrorCategoryUnsupported indicates the operation is not supported.
	ErrorCategoryUnsupported ErrorCategory = "UNSUPPORTED"
)

// ResponseMetadata contains additional response context.
type ResponseMetadata struct {
	// Protocol is the protocol used to execute the command.
	Protocol Protocol `json:"protocol,omitempty"`

	// Duration is how long the command took to execute.
	Duration time.Duration `json:"duration,omitempty"`

	// RecordCount is the number of records returned (for list queries).
	RecordCount int `json:"recordCount,omitempty"`

	// TotalCount is the total number of matching records (if pagination is used).
	TotalCount int `json:"totalCount,omitempty"`
}

// NewSuccessResponse creates a successful response with data.
func NewSuccessResponse(data interface{}) *CanonicalResponse {
	return &CanonicalResponse{
		Success: true,
		Data:    data,
	}
}

// NewErrorResponse creates an error response.
func NewErrorResponse(code, message string, category ErrorCategory) *CanonicalResponse {
	return &CanonicalResponse{
		Success: false,
		Error: &CommandError{
			Code:     code,
			Message:  message,
			Category: category,
		},
	}
}

// NewCreateResponse creates a successful response for add operations.
func NewCreateResponse(id string) *CanonicalResponse {
	return &CanonicalResponse{
		Success: true,
		ID:      id,
	}
}
