package errors

import (
	"context"
	"errors"

	"github.com/99designs/gqlgen/graphql"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// contextKey is a custom type for context keys to avoid collisions.
type contextKey string

const (
	// RequestIDKey is the context key for request correlation ID.
	RequestIDKey contextKey = "requestId"
	// ProductionModeKey is the context key for production mode flag.
	ProductionModeKey contextKey = "productionMode"
)

// GetRequestID extracts the request ID from context.
func GetRequestID(ctx context.Context) string {
	if id, ok := ctx.Value(RequestIDKey).(string); ok {
		return id
	}
	return ""
}

// IsProductionMode checks if running in production mode.
func IsProductionMode(ctx context.Context) bool {
	if prod, ok := ctx.Value(ProductionModeKey).(bool); ok {
		return prod
	}
	return false
}

// WithRequestID adds a request ID to the context.
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, RequestIDKey, requestID)
}

// WithProductionMode sets the production mode flag in context.
func WithProductionMode(ctx context.Context, production bool) context.Context {
	return context.WithValue(ctx, ProductionModeKey, production)
}

// ErrorPresenter is the gqlgen error presenter that converts errors to GraphQL errors
// with rich extensions including suggested fixes and documentation URLs.
func ErrorPresenter(ctx context.Context, err error) *gqlerror.Error {
	requestID := GetRequestID(ctx)
	isProduction := IsProductionMode(ctx)

	// Try to extract RouterError
	var routerErr *RouterError
	if errors.As(err, &routerErr) {
		return presentRouterError(ctx, routerErr, requestID, isProduction)
	}

	// Handle gqlgen errors (pass through with requestId)
	var gqlErr *gqlerror.Error
	if errors.As(err, &gqlErr) {
		if gqlErr.Extensions == nil {
			gqlErr.Extensions = make(map[string]interface{})
		}
		gqlErr.Extensions["requestId"] = requestID
		return gqlErr
	}

	// Handle unknown errors
	return presentUnknownError(ctx, err, requestID, isProduction)
}

// presentRouterError converts a RouterError to a GraphQL error with extensions.
func presentRouterError(ctx context.Context, err *RouterError, requestID string, isProduction bool) *gqlerror.Error {
	// In production, redact sensitive data and strip internal details
	if isProduction {
		err = RedactErrorForProduction(err, requestID)
	}

	extensions := buildExtensions(err, requestID)

	// Add suggested fix and docs URL
	extensions["suggestedFix"] = SuggestedFix(err)
	extensions["docsUrl"] = DocsURL(err.Code)

	// Add field path for validation errors
	if valErr, ok := interface{}(err).(*ValidationError); ok {
		extensions["field"] = valErr.Field
		extensions["value"] = valErr.Value
	} else if field, ok := err.Context["field"]; ok {
		extensions["field"] = field
	}

	// Add troubleshooting steps for protocol/network errors
	if err.Category == CategoryProtocol || err.Category == CategoryNetwork {
		extensions["troubleshootingSteps"] = TroubleshootingSteps(err)
	}

	gqlErr := &gqlerror.Error{
		Message:    err.Message,
		Extensions: extensions,
	}

	// Add path from graphql context if available
	if path := graphql.GetPath(ctx); path != nil {
		gqlErr.Path = path
	}

	return gqlErr
}

// buildExtensions creates the error extensions map.
func buildExtensions(err *RouterError, requestID string) map[string]interface{} {
	extensions := map[string]interface{}{
		"code":        err.Code,
		"category":    string(err.Category),
		"recoverable": err.Recoverable,
		"requestId":   requestID,
	}

	// Add non-sensitive context values
	for key, value := range err.Context {
		if !IsSensitiveKey(key) {
			extensions[key] = value
		}
	}

	return extensions
}

// presentUnknownError handles errors that are not RouterErrors.
func presentUnknownError(ctx context.Context, err error, requestID string, isProduction bool) *gqlerror.Error {
	message := err.Error()

	// In production, don't expose internal error details
	if isProduction {
		message = "An unexpected error occurred. Please try again later."
	}

	extensions := map[string]interface{}{
		"code":        "I500",
		"category":    string(CategoryInternal),
		"recoverable": false,
		"requestId":   requestID,
		"suggestedFix": "An unexpected error occurred. Please try again or contact support.",
		"docsUrl":     DocsURL("I500"),
	}

	gqlErr := &gqlerror.Error{
		Message:    message,
		Extensions: extensions,
	}

	if path := graphql.GetPath(ctx); path != nil {
		gqlErr.Path = path
	}

	return gqlErr
}

// ErrorRecoverer is a panic recovery function for gqlgen.
// It converts panics to internal errors with proper formatting.
func ErrorRecoverer(ctx context.Context, p interface{}) error {
	requestID := GetRequestID(ctx)

	// Create an internal error
	internalErr := NewInternalError("internal server error", nil).
		WithComponent("graphql")
	internalErr.Context["requestId"] = requestID
	internalErr.Context["panic"] = p

	return internalErr
}

// PresenterConfig holds configuration for the error presenter.
type PresenterConfig struct {
	Production    bool
	BaseDocsURL   string
	IncludeStacks bool
}

// DefaultPresenterConfig returns the default presenter configuration.
func DefaultPresenterConfig() *PresenterConfig {
	return &PresenterConfig{
		Production:    false,
		BaseDocsURL:   "https://docs.nasnet.io/errors",
		IncludeStacks: false,
	}
}

// NewErrorPresenter creates a configured error presenter.
func NewErrorPresenter(config *PresenterConfig) func(ctx context.Context, err error) *gqlerror.Error {
	if config == nil {
		config = DefaultPresenterConfig()
	}

	return func(ctx context.Context, err error) *gqlerror.Error {
		// Override production mode from config if not set in context
		if _, ok := ctx.Value(ProductionModeKey).(bool); !ok {
			ctx = WithProductionMode(ctx, config.Production)
		}
		return ErrorPresenter(ctx, err)
	}
}

// ToGraphQLError converts any error to a gqlerror.Error.
// Useful for returning errors from resolvers.
func ToGraphQLError(ctx context.Context, err error) *gqlerror.Error {
	return ErrorPresenter(ctx, err)
}

// NewGraphQLValidationError creates a GraphQL error for validation failures.
// This is a convenience function for use in resolvers.
func NewGraphQLValidationError(ctx context.Context, field string, message string, value interface{}) *gqlerror.Error {
	valErr := NewValidationError(field, value, message)
	return ErrorPresenter(ctx, valErr)
}

// NewGraphQLAuthError creates a GraphQL error for auth failures.
func NewGraphQLAuthError(ctx context.Context, message string, code string) *gqlerror.Error {
	authErr := NewAuthError(code, message)
	return ErrorPresenter(ctx, authErr)
}

// NewGraphQLProtocolError creates a GraphQL error for protocol failures.
func NewGraphQLProtocolError(ctx context.Context, message string, protocol string, routerID string) *gqlerror.Error {
	protoErr := NewProtocolError(CodeProtocolError, message, protocol)
	if routerID != "" {
		protoErr = protoErr.WithRouter(routerID, "")
	}
	return ErrorPresenter(ctx, protoErr)
}
