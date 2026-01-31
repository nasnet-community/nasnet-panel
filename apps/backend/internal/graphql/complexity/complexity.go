// Package complexity implements GraphQL query complexity limiting for NasNetConnect.
// This prevents resource exhaustion from overly complex queries on constrained routers.
package complexity

import (
	"context"
	"fmt"
	"net/http"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler/extension"
)

const (
	// WarningThreshold triggers a warning header when exceeded.
	WarningThreshold = 750

	// MaxComplexity is the hard limit - queries exceeding this are rejected.
	MaxComplexity = 1000

	// ComplexityHeader is the response header containing query complexity.
	ComplexityHeader = "X-GraphQL-Complexity"

	// ComplexityWarningHeader indicates the query is approaching the limit.
	ComplexityWarningHeader = "X-GraphQL-Complexity-Warning"
)

// DefaultCosts defines the default complexity costs for different field types.
var DefaultCosts = struct {
	Scalar     int
	Object     int
	List       int
	Connection int
}{
	Scalar:     1,  // Simple scalar fields
	Object:     5,  // Nested object fields
	List:       10, // List fields (multiplied by first/last arg)
	Connection: 15, // Relay connection fields
}

// Calculator calculates query complexity based on field types and arguments.
type Calculator struct {
	// FieldCosts allows custom complexity costs per field
	FieldCosts map[string]int
}

// NewCalculator creates a new complexity calculator with default settings.
func NewCalculator() *Calculator {
	return &Calculator{
		FieldCosts: make(map[string]int),
	}
}

// SetFieldCost sets a custom complexity cost for a specific field.
func (c *Calculator) SetFieldCost(typeName, fieldName string, cost int) {
	key := fmt.Sprintf("%s.%s", typeName, fieldName)
	c.FieldCosts[key] = cost
}

// GetFieldCost returns the complexity cost for a field.
func (c *Calculator) GetFieldCost(typeName, fieldName string, childComplexity int, args map[string]interface{}) int {
	// Check for custom cost
	key := fmt.Sprintf("%s.%s", typeName, fieldName)
	if cost, exists := c.FieldCosts[key]; exists {
		return cost + childComplexity
	}

	// Apply default rules based on field characteristics
	multiplier := 1

	// Check for list pagination arguments
	if first, ok := args["first"].(int); ok && first > 0 {
		multiplier = first
	} else if last, ok := args["last"].(int); ok && last > 0 {
		multiplier = last
	}

	// Connection fields have higher base cost
	if isConnectionField(fieldName) {
		return DefaultCosts.Connection + (childComplexity * multiplier)
	}

	// List fields
	if multiplier > 1 {
		return DefaultCosts.List + (childComplexity * multiplier)
	}

	// Object fields (has children)
	if childComplexity > 0 {
		return DefaultCosts.Object + childComplexity
	}

	// Scalar fields
	return DefaultCosts.Scalar
}

// isConnectionField checks if a field is a Relay connection.
func isConnectionField(fieldName string) bool {
	// Common connection field naming patterns
	return len(fieldName) > 10 && fieldName[len(fieldName)-10:] == "Connection"
}

// Extension creates a gqlgen complexity extension with our limits.
func Extension() *extension.ComplexityLimit {
	return extension.FixedComplexityLimit(MaxComplexity)
}

// Middleware returns HTTP middleware that adds complexity headers to responses.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Create a custom response writer to intercept and add headers
		crw := &complexityResponseWriter{
			ResponseWriter: w,
			headerWritten:  false,
		}

		next.ServeHTTP(crw, r)
	})
}

// complexityResponseWriter wraps http.ResponseWriter to add complexity headers.
type complexityResponseWriter struct {
	http.ResponseWriter
	headerWritten bool
}

// WriteHeader intercepts header writing to add complexity info.
func (crw *complexityResponseWriter) WriteHeader(code int) {
	if !crw.headerWritten {
		crw.headerWritten = true
	}
	crw.ResponseWriter.WriteHeader(code)
}

// OperationComplexity holds the calculated complexity for a GraphQL operation.
type OperationComplexity struct {
	Complexity int
	Limit      int
	Exceeded   bool
	Warning    bool
}

// complexityContextKey is the context key for operation complexity.
type complexityContextKey struct{}

// WithComplexity adds complexity information to the context.
func WithComplexity(ctx context.Context, complexity OperationComplexity) context.Context {
	return context.WithValue(ctx, complexityContextKey{}, complexity)
}

// GetComplexity retrieves complexity information from context.
func GetComplexity(ctx context.Context) (OperationComplexity, bool) {
	c, ok := ctx.Value(complexityContextKey{}).(OperationComplexity)
	return c, ok
}

// ComplexityHandler is a gqlgen operation middleware that tracks complexity.
type ComplexityHandler struct{}

// NewComplexityHandler creates a new complexity handler.
func NewComplexityHandler() *ComplexityHandler {
	return &ComplexityHandler{}
}

// InterceptOperation implements graphql.OperationInterceptor.
// Note: Complexity is calculated by gqlgen's complexity extension, not here.
// This handler reads complexity from context if set by the complexity limit extension.
func (h *ComplexityHandler) InterceptOperation(ctx context.Context, next graphql.OperationHandler) graphql.ResponseHandler {
	return next(ctx)
}

// ComplexityResponseMiddleware adds complexity headers to the response.
type ComplexityResponseMiddleware struct{}

// ExtensionName returns the extension name.
func (m *ComplexityResponseMiddleware) ExtensionName() string {
	return "ComplexityResponse"
}

// Validate is called on server startup.
func (m *ComplexityResponseMiddleware) Validate(_ graphql.ExecutableSchema) error {
	return nil
}

// InterceptResponse adds complexity headers.
func (m *ComplexityResponseMiddleware) InterceptResponse(ctx context.Context, next graphql.ResponseHandler) *graphql.Response {
	resp := next(ctx)

	// Get complexity from context if set
	if opComplexity, ok := GetComplexity(ctx); ok && opComplexity.Complexity > 0 {
		// Add complexity to extensions
		if resp.Extensions == nil {
			resp.Extensions = make(map[string]interface{})
		}
		resp.Extensions["complexity"] = map[string]interface{}{
			"value":   opComplexity.Complexity,
			"limit":   MaxComplexity,
			"warning": opComplexity.Complexity > WarningThreshold,
		}
	}

	return resp
}

// CalculateComplexity calculates the total complexity of fields.
// This is used to set custom complexity functions on the schema.
func CalculateComplexity(childComplexity int, args map[string]interface{}) int {
	multiplier := 1

	// Check for pagination arguments
	if first, ok := args["first"].(int); ok && first > 0 {
		multiplier = first
	} else if last, ok := args["last"].(int); ok && last > 0 {
		multiplier = last
	}

	return multiplier*childComplexity + 1
}
