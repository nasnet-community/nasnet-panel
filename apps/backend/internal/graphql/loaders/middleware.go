package loaders

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"

	"backend/generated/ent"
)

// Config holds configuration for the DataLoader middleware.
type Config struct {
	// DB is the ent database client
	DB *ent.Client

	// DevMode enables development logging (batch sizes, query counts)
	DevMode bool

	// LogStats logs loader statistics at the end of each request
	LogStats bool
}

// Middleware returns an Echo middleware that injects DataLoaders into the request context.
// DataLoaders are request-scoped - a new instance is created for each request.
//
// Usage:
//
//	e.Use(loaders.Middleware(loaders.Config{
//	    DB:      entClient,
//	    DevMode: true,
//	}))
func Middleware(cfg Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Create new DataLoaders for this request
			loaders := NewLoaders(cfg.DB, cfg.DevMode)

			// Add loaders to context
			ctx := WithLoaders(c.Request().Context(), loaders)
			c.SetRequest(c.Request().WithContext(ctx))

			// Execute request
			err := next(c)

			// Log stats if enabled (development mode)
			if cfg.LogStats && cfg.DevMode {
				loaders.LogStats()
			}

			return err
		}
	}
}

// HTTPMiddleware returns a standard net/http middleware that injects DataLoaders.
// This can be used with http.Handler or any framework that supports it.
//
// Usage:
//
//	handler := loaders.HTTPMiddleware(loaders.Config{DB: entClient})(yourHandler)
func HTTPMiddleware(cfg Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create new DataLoaders for this request
			loaders := NewLoaders(cfg.DB, cfg.DevMode)

			// Add loaders to context
			ctx := WithLoaders(r.Context(), loaders)

			// Execute request with updated context
			next.ServeHTTP(w, r.WithContext(ctx))

			// Log stats if enabled (development mode)
			if cfg.LogStats && cfg.DevMode {
				loaders.LogStats()
			}
		})
	}
}

// GraphQLMiddleware returns a middleware specifically for wrapping the GraphQL handler.
// This ensures DataLoaders are available throughout the GraphQL request lifecycle.
//
// Usage with gqlgen:
//
//	graphqlHandler := handler.New(schema)
//	wrappedHandler := loaders.GraphQLMiddleware(loaders.Config{DB: entClient})(graphqlHandler)
func GraphQLMiddleware(cfg Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create new DataLoaders for this request
			loaders := NewLoaders(cfg.DB, cfg.DevMode)

			// Add loaders to context
			ctx := WithLoaders(r.Context(), loaders)

			if cfg.DevMode {
				log.Printf("[DataLoader] Initialized for request: %s %s", r.Method, r.URL.Path)
			}

			// Execute request with updated context
			next.ServeHTTP(w, r.WithContext(ctx))

			// Log stats at end of request (development mode)
			if cfg.LogStats && cfg.DevMode {
				loaders.LogStats()
			}
		})
	}
}
