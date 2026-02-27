// Package directives implements GraphQL directive handlers for NasNetConnect.
// These directives provide runtime validation, authorization, and field-level security.
package directives

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/99designs/gqlgen/graphql"
	"github.com/vektah/gqlparser/v2/gqlerror"

	internalerrors "backend/internal/apperrors"
)

// Config holds directive handler configuration.
type Config struct {
	// ValidateEnabled enables @validate directive processing
	ValidateEnabled bool
	// AuthEnabled enables @auth directive processing
	AuthEnabled bool
	// SensitiveEnabled enables @sensitive directive processing
	SensitiveEnabled bool
	// CapabilityEnabled enables @capability directive processing
	CapabilityEnabled bool
}

// DefaultConfig returns the default directive configuration.
func DefaultConfig() Config {
	return Config{
		ValidateEnabled:   true,
		AuthEnabled:       true,
		SensitiveEnabled:  true,
		CapabilityEnabled: true,
	}
}

// Directives holds all directive implementations for gqlgen.
type Directives struct {
	config Config
}

// New creates a new Directives instance with the given configuration.
func New(config Config) *Directives {
	return &Directives{config: config}
}

// NewDefault creates a new Directives instance with default configuration.
func NewDefault() *Directives {
	return New(DefaultConfig())
}

// =============================================================================
// @validate Directive
// =============================================================================

// ValidateFormat represents predefined validation formats.
type ValidateFormat string

const (
	FormatEmail    ValidateFormat = "EMAIL"
	FormatURL      ValidateFormat = "URL"
	FormatUUID     ValidateFormat = "UUID"
	FormatIPv4     ValidateFormat = "IPV4"
	FormatIPv6     ValidateFormat = "IPV6"
	FormatMAC      ValidateFormat = "MAC"
	FormatCIDR     ValidateFormat = "CIDR"
	FormatHostname ValidateFormat = "HOSTNAME"
	FormatFQDN     ValidateFormat = "FQDN"
)

// Validation patterns for predefined formats.
var formatPatterns = map[ValidateFormat]*regexp.Regexp{
	FormatEmail:    regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`),
	FormatURL:      regexp.MustCompile(`^https?://[^\s/$.?#].\S*$`),
	FormatUUID:     regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`),
	FormatIPv4:     regexp.MustCompile(`^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`),
	FormatIPv6:     regexp.MustCompile(`^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$`),
	FormatMAC:      regexp.MustCompile(`^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`),
	FormatCIDR:     regexp.MustCompile(`^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(?:3[0-2]|[12]?[0-9])$`),
	FormatHostname: regexp.MustCompile(`^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$`),
	FormatFQDN:     regexp.MustCompile(`^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$`),
}

// Validate implements the @validate directive handler.
// It validates field values against min, max, minLength, maxLength, pattern, and format constraints.
func (d *Directives) Validate(ctx context.Context, obj interface{}, next graphql.Resolver,
	minVal *int, maxVal *int, minLength *int, maxLength *int, pattern *string, format *ValidateFormat) (interface{}, error) {

	if !d.config.ValidateEnabled {
		return next(ctx)
	}

	val, err := next(ctx)
	if err != nil {
		return nil, err
	}

	if val == nil {
		//nolint:nilnil // nil is valid for nullable directive
		return nil, nil
	}

	fieldCtx := graphql.GetFieldContext(ctx)
	fieldPath := fieldCtx.Path().String()
	fieldName := fieldCtx.Field.Name

	if err := validateNumericRange(ctx, val, fieldPath, fieldName, minVal, maxVal); err != nil {
		return nil, err
	}

	if err := validateStringConstraints(ctx, val, fieldPath, fieldName, minLength, maxLength, pattern, format); err != nil {
		return nil, err
	}

	return val, nil
}

// validateNumericRange checks min/max constraints on numeric values.
func validateNumericRange(ctx context.Context, val interface{}, fieldPath, fieldName string, minVal, maxVal *int) error {
	if minVal == nil && maxVal == nil {
		return nil
	}
	numVal, ok := toInt64(val)
	if !ok {
		return nil
	}
	if minVal != nil && numVal < int64(*minVal) {
		return createValidationError(ctx, fieldPath, fieldName, val,
			fmt.Sprintf("value %d is less than minimum %d", numVal, *minVal),
			fmt.Sprintf("Use a value >= %d", *minVal),
			"validation/numeric-range")
	}
	if maxVal != nil && numVal > int64(*maxVal) {
		return createValidationError(ctx, fieldPath, fieldName, val,
			fmt.Sprintf("value %d is greater than maximum %d", numVal, *maxVal),
			fmt.Sprintf("Use a value <= %d", *maxVal),
			"validation/numeric-range")
	}
	return nil
}

// validateStringConstraints checks minLength, maxLength, pattern, and format on string values.
func validateStringConstraints(ctx context.Context, val interface{}, fieldPath, fieldName string,
	minLength, maxLength *int, pattern *string, format *ValidateFormat) error {

	strVal, ok := val.(string)
	if !ok {
		return nil
	}
	if minLength != nil && len(strVal) < *minLength {
		return createValidationError(ctx, fieldPath, fieldName, val,
			fmt.Sprintf("string length %d is less than minimum %d", len(strVal), *minLength),
			fmt.Sprintf("Use a string with at least %d characters", *minLength),
			"validation/string-length")
	}
	if maxLength != nil && len(strVal) > *maxLength {
		return createValidationError(ctx, fieldPath, fieldName, val,
			fmt.Sprintf("string length %d exceeds maximum %d", len(strVal), *maxLength),
			fmt.Sprintf("Use a string with at most %d characters", *maxLength),
			"validation/string-length")
	}
	if err := validatePattern(ctx, strVal, fieldPath, fieldName, val, pattern); err != nil {
		return err
	}
	return validateFormat(ctx, strVal, fieldPath, fieldName, val, format)
}

// validatePattern checks if a string matches the given regex pattern.
func validatePattern(ctx context.Context, strVal, fieldPath, fieldName string, val interface{}, pattern *string) error {
	if pattern == nil {
		return nil
	}
	re, err := regexp.Compile(*pattern)
	if err != nil {
		return fmt.Errorf("invalid validation pattern: %w", err)
	}
	if !re.MatchString(strVal) {
		return createValidationError(ctx, fieldPath, fieldName, val,
			"value does not match required pattern",
			fmt.Sprintf("Value must match pattern: %s", *pattern),
			"validation/pattern")
	}
	return nil
}

// validateFormat checks if a string matches a predefined format (EMAIL, IPV4, etc.).
func validateFormat(ctx context.Context, strVal, fieldPath, fieldName string, val interface{}, format *ValidateFormat) error {
	if format == nil {
		return nil
	}
	re, exists := formatPatterns[*format]
	if !exists {
		return nil
	}
	if !re.MatchString(strVal) {
		return createValidationError(ctx, fieldPath, fieldName, val,
			fmt.Sprintf("value is not a valid %s", strings.ToLower(string(*format))),
			fmt.Sprintf("Provide a valid %s format", strings.ToLower(string(*format))),
			"validation/format")
	}
	return nil
}

// =============================================================================
// @auth Directive
// =============================================================================

// authContextKey is the context key for authentication info.
type authContextKey struct{}

// AuthInfo holds authentication information extracted from the request.
type AuthInfo struct {
	Authenticated bool
	UserID        string
	Roles         []string
}

// WithAuthInfo adds authentication info to the context.
func WithAuthInfo(ctx context.Context, info AuthInfo) context.Context {
	return context.WithValue(ctx, authContextKey{}, info)
}

// GetAuthInfo retrieves authentication info from context.
func GetAuthInfo(ctx context.Context) (AuthInfo, bool) {
	info, ok := ctx.Value(authContextKey{}).(AuthInfo)
	return info, ok
}

// Auth implements the @auth directive handler.
// It checks if the user is authenticated and optionally has the required role.
func (d *Directives) Auth(ctx context.Context, obj interface{}, next graphql.Resolver, requires *string) (interface{}, error) {
	if !d.config.AuthEnabled {
		return next(ctx)
	}

	authInfo, ok := GetAuthInfo(ctx)
	if !ok || !authInfo.Authenticated {
		fieldCtx := graphql.GetFieldContext(ctx)
		return nil, createAuthError(ctx, fieldCtx.Path().String(), fieldCtx.Field.Name,
			"authentication required",
			"Please provide valid authentication credentials",
			"auth/authentication-required")
	}

	// Check role requirement if specified
	if requires != nil && *requires != "" {
		hasRole := false
		for _, role := range authInfo.Roles {
			if role == *requires {
				hasRole = true
				break
			}
		}
		if !hasRole {
			fieldCtx := graphql.GetFieldContext(ctx)
			return nil, createAuthError(ctx, fieldCtx.Path().String(), fieldCtx.Field.Name,
				fmt.Sprintf("role '%s' required", *requires),
				fmt.Sprintf("This operation requires the '%s' role", *requires),
				"auth/insufficient-permissions")
		}
	}

	return next(ctx)
}

// =============================================================================
// @sensitive Directive
// =============================================================================

// sensitiveContextKey is the context key for tracking sensitive fields.
type sensitiveContextKey struct{}

// SensitiveFields tracks which fields contain sensitive data.
type SensitiveFields struct {
	Fields map[string]bool
}

// WithSensitiveTracking adds sensitive field tracking to context.
func WithSensitiveTracking(ctx context.Context) context.Context {
	return context.WithValue(ctx, sensitiveContextKey{}, &SensitiveFields{
		Fields: make(map[string]bool),
	})
}

// GetSensitiveFields retrieves tracked sensitive fields from context.
func GetSensitiveFields(ctx context.Context) *SensitiveFields {
	if sf, ok := ctx.Value(sensitiveContextKey{}).(*SensitiveFields); ok {
		return sf
	}
	return nil
}

// Sensitive implements the @sensitive directive handler.
// It marks the field as containing sensitive data for log redaction.
func (d *Directives) Sensitive(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if !d.config.SensitiveEnabled {
		return next(ctx)
	}

	// Track this field as sensitive
	if sf := GetSensitiveFields(ctx); sf != nil {
		fieldCtx := graphql.GetFieldContext(ctx)
		sf.Fields[fieldCtx.Path().String()] = true
	}

	return next(ctx)
}

// =============================================================================
// @capability Directive
// =============================================================================

// capabilityContextKey is the context key for router capabilities.
type capabilityContextKey struct{}

// RouterCapabilities holds the capabilities of the connected router.
type RouterCapabilities struct {
	Capabilities map[string]bool
}

// WithCapabilities adds router capabilities to context.
func WithCapabilities(ctx context.Context, caps []string) context.Context {
	capMap := make(map[string]bool)
	for _, cap := range caps {
		capMap[cap] = true
	}
	return context.WithValue(ctx, capabilityContextKey{}, &RouterCapabilities{
		Capabilities: capMap,
	})
}

// WithCapabilitiesFromDetection adds capabilities from the detection system.
// This converts capability entries with levels to the simple bool map used by the directive.
// Capabilities at level BASIC or higher are considered "available".
func WithCapabilitiesFromDetection(ctx context.Context, capEntries map[string]int) context.Context {
	capMap := make(map[string]bool)
	for cap, level := range capEntries {
		// Level >= 1 (BASIC) means the capability is available
		capMap[strings.ToLower(cap)] = level >= 1
	}
	return context.WithValue(ctx, capabilityContextKey{}, &RouterCapabilities{
		Capabilities: capMap,
	})
}

// GetCapabilities retrieves router capabilities from context.
func GetCapabilities(ctx context.Context) *RouterCapabilities {
	if caps, ok := ctx.Value(capabilityContextKey{}).(*RouterCapabilities); ok {
		return caps
	}
	return nil
}

// Capability implements the @capability directive handler.
// It checks if the router has the required capabilities before resolving the field.
func (d *Directives) Capability(ctx context.Context, obj interface{}, next graphql.Resolver, requires []string) (interface{}, error) {
	if !d.config.CapabilityEnabled {
		return next(ctx)
	}

	caps := GetCapabilities(ctx)
	if caps == nil {
		// No capability context - allow field but it may return null/error later
		return next(ctx)
	}

	// Check all required capabilities
	var missingCaps []string
	for _, req := range requires {
		if !caps.Capabilities[req] {
			missingCaps = append(missingCaps, req)
		}
	}

	if len(missingCaps) > 0 {
		fieldCtx := graphql.GetFieldContext(ctx)
		return nil, createCapabilityError(ctx, fieldCtx.Path().String(), fieldCtx.Field.Name,
			missingCaps,
			fmt.Sprintf("Router does not support required capabilities: %s", strings.Join(missingCaps, ", ")),
			"capability/unsupported")
	}

	return next(ctx)
}

// =============================================================================
// Error Helpers
// =============================================================================

// createValidationError creates a GraphQL error with validation extensions.
func createValidationError(ctx context.Context, fieldPath, _ string, value interface{}, message, suggestedFix, docsPath string) *gqlerror.Error {
	requestID := internalerrors.GetRequestID(ctx)

	return &gqlerror.Error{
		Message: message,
		Path:    graphql.GetPath(ctx),
		Extensions: map[string]interface{}{
			"code":         "V400",
			"category":     "validation",
			"field":        fieldPath,
			"value":        redactIfSensitive(ctx, fieldPath, value),
			"suggestedFix": suggestedFix,
			"docsUrl":      fmt.Sprintf("https://docs.nasnetconnect.io/api/errors/%s", docsPath),
			"requestId":    requestID,
			"recoverable":  true,
		},
	}
}

// createAuthError creates a GraphQL error for authentication/authorization failures.
func createAuthError(ctx context.Context, fieldPath, _, message, suggestedFix, docsPath string) *gqlerror.Error {
	requestID := internalerrors.GetRequestID(ctx)

	return &gqlerror.Error{
		Message: message,
		Path:    graphql.GetPath(ctx),
		Extensions: map[string]interface{}{
			"code":         "A401",
			"category":     "auth",
			"field":        fieldPath,
			"suggestedFix": suggestedFix,
			"docsUrl":      fmt.Sprintf("https://docs.nasnetconnect.io/api/errors/%s", docsPath),
			"requestId":    requestID,
			"recoverable":  true,
		},
	}
}

// createCapabilityError creates a GraphQL error for capability check failures.
func createCapabilityError(ctx context.Context, fieldPath, _ string, missing []string, message, docsPath string) *gqlerror.Error {
	requestID := internalerrors.GetRequestID(ctx)

	return &gqlerror.Error{
		Message: message,
		Path:    graphql.GetPath(ctx),
		Extensions: map[string]interface{}{
			"code":                "C403",
			"category":            "capability",
			"field":               fieldPath,
			"missingCapabilities": missing,
			"suggestedFix":        "This feature requires router hardware or software capabilities that are not available",
			"docsUrl":             fmt.Sprintf("https://docs.nasnetconnect.io/api/errors/%s", docsPath),
			"requestId":           requestID,
			"recoverable":         false,
		},
	}
}

// redactIfSensitive redacts the value if the field is marked sensitive.
func redactIfSensitive(ctx context.Context, fieldPath string, value interface{}) interface{} {
	if sf := GetSensitiveFields(ctx); sf != nil {
		if sf.Fields[fieldPath] {
			return "[REDACTED]"
		}
	}
	// Check production mode
	if internalerrors.IsProductionMode(ctx) {
		// In production, be more conservative about exposing values
		if str, ok := value.(string); ok && len(str) > 50 {
			return str[:50] + "..."
		}
	}
	return value
}

// toInt64 converts various numeric types to int64.
func toInt64(v interface{}) (int64, bool) {
	switch val := v.(type) {
	case int:
		return int64(val), true
	case int32:
		return int64(val), true
	case int64:
		return val, true
	case float32:
		return int64(val), true
	case float64:
		return int64(val), true
	default:
		return 0, false
	}
}
