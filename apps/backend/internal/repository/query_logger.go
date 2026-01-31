package repository

import (
	"context"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"time"
)

// QueryCounter tracks the number of database queries executed.
// Use this in tests to verify N+1 prevention.
//
// Usage in tests:
//
//	counter := repository.NewQueryCounter()
//	client := repository.WithQueryCounter(client, counter)
//
//	// Execute repository method
//	router, _ := repo.GetWithRelations(ctx, id)
//
//	// Assert query count
//	assert.Equal(t, 1, counter.Count(), "GetWithRelations should execute 1 query")
type QueryCounter struct {
	count  int64
	mu     sync.Mutex
	traces []QueryTrace
}

// QueryTrace records details about a single query.
type QueryTrace struct {
	Operation string
	Table     string
	Duration  time.Duration
	Timestamp time.Time
}

// NewQueryCounter creates a new QueryCounter.
func NewQueryCounter() *QueryCounter {
	return &QueryCounter{
		traces: make([]QueryTrace, 0),
	}
}

// Count returns the number of queries executed.
func (qc *QueryCounter) Count() int {
	return int(atomic.LoadInt64(&qc.count))
}

// Increment increases the query count by one.
func (qc *QueryCounter) Increment() {
	atomic.AddInt64(&qc.count, 1)
}

// Reset resets the counter to zero.
func (qc *QueryCounter) Reset() {
	atomic.StoreInt64(&qc.count, 0)
	qc.mu.Lock()
	qc.traces = qc.traces[:0]
	qc.mu.Unlock()
}

// AddTrace adds a query trace.
func (qc *QueryCounter) AddTrace(trace QueryTrace) {
	qc.Increment()
	qc.mu.Lock()
	qc.traces = append(qc.traces, trace)
	qc.mu.Unlock()
}

// Traces returns all recorded query traces.
func (qc *QueryCounter) Traces() []QueryTrace {
	qc.mu.Lock()
	defer qc.mu.Unlock()
	result := make([]QueryTrace, len(qc.traces))
	copy(result, qc.traces)
	return result
}

// queryCounterKey is the context key for query counter.
type queryCounterKey struct{}

// WithQueryCounterContext adds a query counter to the context.
func WithQueryCounterContext(ctx context.Context, counter *QueryCounter) context.Context {
	return context.WithValue(ctx, queryCounterKey{}, counter)
}

// GetQueryCounter retrieves the query counter from context.
func GetQueryCounter(ctx context.Context) *QueryCounter {
	counter, ok := ctx.Value(queryCounterKey{}).(*QueryCounter)
	if !ok {
		return nil
	}
	return counter
}

// QueryLogger is a development middleware that logs all database queries.
// Enable this in dev mode to debug N+1 issues.
type QueryLogger struct {
	enabled bool
	prefix  string
}

// NewQueryLogger creates a new QueryLogger.
func NewQueryLogger(enabled bool, prefix string) *QueryLogger {
	if prefix == "" {
		prefix = "[query]"
	}
	return &QueryLogger{
		enabled: enabled,
		prefix:  prefix,
	}
}

// Log logs a query if logging is enabled.
func (ql *QueryLogger) Log(operation, table string, duration time.Duration) {
	if !ql.enabled {
		return
	}
	log.Printf("%s %s on %s took %v", ql.prefix, operation, table, duration)
}

// LogQuery logs a raw query if logging is enabled.
func (ql *QueryLogger) LogQuery(query string, args []interface{}, duration time.Duration) {
	if !ql.enabled {
		return
	}
	log.Printf("%s Query: %s (args: %v) took %v", ql.prefix, query, args, duration)
}

// =============================================================================
// Query Count Baselines for N+1 Verification
// =============================================================================

// QueryBaselines defines expected query counts for repository methods.
// Use these in tests to verify N+1 prevention.
//
// Example test:
//
//	func TestRouterRepository_GetWithRelations(t *testing.T) {
//	    counter := repository.NewQueryCounter()
//	    // ... setup ...
//	    _, err := repo.GetWithRelations(ctx, id)
//	    assert.NoError(t, err)
//	    assert.Equal(t, repository.QueryBaselines.RouterGetWithRelations, counter.Count())
//	}
var QueryBaselines = struct {
	// RouterRepository
	RouterGetWithRelations    int
	RouterListWithCapabilities int
	RouterCreateWithSecrets   int
	RouterUpdateStatus        int
	RouterDelete              int
	RouterGetByHost           int

	// UserRepository
	UserCreate           int
	UserGetByUsername    int
	UserGetByID          int
	UserGetWithSessions  int
	UserUpdatePassword   int
	UserVerifyPassword   int
	UserUpdateLastLogin  int

	// FeatureRepository
	FeatureGet                int
	FeatureGetWithDependencies int
	FeatureList               int
}{
	// RouterRepository baselines
	RouterGetWithRelations:    1, // Single query with eager loading (WithSecrets)
	RouterListWithCapabilities: 1, // Single query with eager loading
	RouterCreateWithSecrets:   2, // INSERT router + INSERT secret (within transaction)
	RouterUpdateStatus:        2, // SELECT router (for previous status) + UPDATE
	RouterDelete:              2, // DELETE secrets + DELETE router (within transaction)
	RouterGetByHost:           1, // Single query

	// UserRepository baselines
	UserCreate:           2, // SELECT exists + INSERT (could be optimized with upsert)
	UserGetByUsername:    1, // Single query
	UserGetByID:          1, // Single query
	UserGetWithSessions:  1, // Single query with eager loading
	UserUpdatePassword:   2, // SELECT exists + UPDATE
	UserVerifyPassword:   1, // Single query
	UserUpdateLastLogin:  1, // Single UPDATE

	// FeatureRepository baselines
	FeatureGet:                1, // Single query
	FeatureGetWithDependencies: 1, // Single query (will increase with proper deps in Epic 8)
	FeatureList:               1, // Single query
}

// =============================================================================
// Test Helpers
// =============================================================================

// AssertQueryCount asserts that the query count matches the expected value.
// Returns an error message if counts don't match, empty string if they do.
func AssertQueryCount(counter *QueryCounter, expected int, operation string) string {
	actual := counter.Count()
	if actual != expected {
		return formatQueryAssertionError(operation, expected, actual, counter.Traces())
	}
	return ""
}

// formatQueryAssertionError formats a helpful error message for query count mismatches.
func formatQueryAssertionError(operation string, expected, actual int, traces []QueryTrace) string {
	msg := fmt.Sprintf(
		"N+1 DETECTED: %s expected %d queries, got %d",
		operation, expected, actual,
	)

	if len(traces) > 0 {
		msg += "\nQuery traces:"
		for i, trace := range traces {
			msg += fmt.Sprintf("\n  %d. %s on %s (%v)",
				i+1, trace.Operation, trace.Table, trace.Duration)
		}
	}

	return msg
}
