package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"

	"backend/internal/auth"
)

// RateLimitConfig configures rate limiting behavior
type RateLimitConfig struct {
	// Rate is the number of tokens added per second
	Rate float64
	// Burst is the maximum number of tokens (bucket size)
	Burst int
	// KeyFunc extracts the rate limit key from the request
	KeyFunc func(c echo.Context) string
	// Skipper defines a function to skip middleware
	Skipper func(c echo.Context) bool
	// OnLimitReached is called when rate limit is exceeded
	OnLimitReached func(c echo.Context)
}

// DefaultRateLimitConfigs provides rate limit configurations for common endpoints
var DefaultRateLimitConfigs = map[string]RateLimitConfig{
	"login": {
		Rate:  0.1,  // 1 per 10 seconds
		Burst: 5,    // 5 attempts max
	},
	"graphql": {
		Rate:  10,   // 10 per second
		Burst: 100,  // 100 requests max
	},
	"api_key": {
		Rate:  20,   // 20 per second (higher for automation)
		Burst: 200,  // 200 requests max
	},
	"discovery": {
		Rate:  0.033, // 1 per 30 seconds
		Burst: 1,     // 1 request max
	},
}

// TokenBucket implements the token bucket algorithm for rate limiting
type TokenBucket struct {
	mu          sync.Mutex
	tokens      float64
	maxTokens   float64
	refillRate  float64
	lastRefill  time.Time
}

// NewTokenBucket creates a new token bucket
func NewTokenBucket(rate float64, burst int) *TokenBucket {
	return &TokenBucket{
		tokens:     float64(burst),
		maxTokens:  float64(burst),
		refillRate: rate,
		lastRefill: time.Now(),
	}
}

// Allow checks if a request is allowed and consumes a token if so
func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	// Refill tokens based on elapsed time
	now := time.Now()
	elapsed := now.Sub(tb.lastRefill).Seconds()
	tb.tokens += elapsed * tb.refillRate
	if tb.tokens > tb.maxTokens {
		tb.tokens = tb.maxTokens
	}
	tb.lastRefill = now

	// Check if we have a token
	if tb.tokens < 1 {
		return false
	}

	// Consume a token
	tb.tokens--
	return true
}

// Tokens returns the current number of tokens
func (tb *TokenBucket) Tokens() float64 {
	tb.mu.Lock()
	defer tb.mu.Unlock()
	return tb.tokens
}

// RateLimiter manages rate limiting across multiple keys
type RateLimiter struct {
	mu      sync.RWMutex
	buckets map[string]*TokenBucket
	config  RateLimitConfig

	// Cleanup settings
	cleanupInterval time.Duration
	maxIdleTime     time.Duration
	lastAccess      map[string]time.Time
}

// NewRateLimiter creates a new rate limiter with the given configuration
func NewRateLimiter(config RateLimitConfig) *RateLimiter {
	rl := &RateLimiter{
		buckets:         make(map[string]*TokenBucket),
		config:          config,
		cleanupInterval: 5 * time.Minute,
		maxIdleTime:     10 * time.Minute,
		lastAccess:      make(map[string]time.Time),
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// Allow checks if a request is allowed for the given key
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	bucket, exists := rl.buckets[key]
	if !exists {
		bucket = NewTokenBucket(rl.config.Rate, rl.config.Burst)
		rl.buckets[key] = bucket
	}
	rl.lastAccess[key] = time.Now()
	rl.mu.Unlock()

	return bucket.Allow()
}

// cleanup removes idle buckets periodically
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, lastAccess := range rl.lastAccess {
			if now.Sub(lastAccess) > rl.maxIdleTime {
				delete(rl.buckets, key)
				delete(rl.lastAccess, key)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware returns an Echo middleware that applies rate limiting
func RateLimitMiddleware(config RateLimitConfig) echo.MiddlewareFunc {
	// Set default key function (by IP)
	if config.KeyFunc == nil {
		config.KeyFunc = func(c echo.Context) string {
			return "ip:" + c.RealIP()
		}
	}

	rl := NewRateLimiter(config)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Check skipper
			if config.Skipper != nil && config.Skipper(c) {
				return next(c)
			}

			// Get rate limit key
			key := config.KeyFunc(c)

			// Check rate limit
			if !rl.Allow(key) {
				// Call callback if configured
				if config.OnLimitReached != nil {
					config.OnLimitReached(c)
				}

				return echo.NewHTTPError(http.StatusTooManyRequests, map[string]interface{}{
					"code":    auth.ErrCodeRateLimited,
					"message": "Rate limit exceeded. Please try again later.",
				})
			}

			return next(c)
		}
	}
}

// LoginRateLimitMiddleware returns a rate limiter configured for login attempts
func LoginRateLimitMiddleware() echo.MiddlewareFunc {
	config := DefaultRateLimitConfigs["login"]
	config.KeyFunc = func(c echo.Context) string {
		// Rate limit by IP for login attempts
		return "login:" + c.RealIP()
	}
	config.Skipper = func(c echo.Context) bool {
		// Only apply to login endpoint
		return c.Path() != "/graphql" || c.Request().Method != "POST"
	}
	return RateLimitMiddleware(config)
}

// GraphQLRateLimitMiddleware returns a rate limiter configured for GraphQL
func GraphQLRateLimitMiddleware() echo.MiddlewareFunc {
	config := DefaultRateLimitConfigs["graphql"]
	config.KeyFunc = func(c echo.Context) string {
		// Rate limit by user if authenticated, otherwise by IP
		user := UserFromContext(c.Request().Context())
		if user != nil {
			return "user:" + user.ID
		}
		return "ip:" + c.RealIP()
	}
	return RateLimitMiddleware(config)
}

// UserKeyFunc creates a key function that uses user ID if authenticated
func UserKeyFunc(prefix string) func(c echo.Context) string {
	return func(c echo.Context) string {
		user := UserFromContext(c.Request().Context())
		if user != nil {
			return prefix + ":user:" + user.ID
		}
		return prefix + ":ip:" + c.RealIP()
	}
}

// IPKeyFunc creates a key function that uses only IP
func IPKeyFunc(prefix string) func(c echo.Context) string {
	return func(c echo.Context) string {
		return prefix + ":ip:" + c.RealIP()
	}
}
