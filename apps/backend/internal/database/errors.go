// Package database provides the hybrid database architecture for NasNetConnect.
// It implements a dual-database strategy with system.db for fleet coordination
// and router-{id}.db files for per-router data isolation.
package database

import (
	"fmt"
)

// Error codes for database operations following Story 2.8 patterns.
// These codes provide machine-readable error identification for
// programmatic error handling and logging.
const (
	// ErrCodeDBConnectionFailed indicates a failure to establish database connection.
	ErrCodeDBConnectionFailed = "DB_CONNECTION_FAILED"

	// ErrCodeDBIntegrityFailed indicates a database integrity check failure.
	ErrCodeDBIntegrityFailed = "DB_INTEGRITY_FAILED"

	// ErrCodeDBMigrationFailed indicates a migration operation failure.
	ErrCodeDBMigrationFailed = "DB_MIGRATION_FAILED"

	// ErrCodeDBQueryFailed indicates a query execution failure.
	ErrCodeDBQueryFailed = "DB_QUERY_FAILED"

	// ErrCodeDBTransactionFailed indicates a transaction operation failure.
	ErrCodeDBTransactionFailed = "DB_TRANSACTION_FAILED"

	// ErrCodeDBRouterNotFound indicates the requested router database was not found.
	ErrCodeDBRouterNotFound = "DB_ROUTER_NOT_FOUND"

	// ErrCodeDBTimeout indicates a database operation timed out.
	ErrCodeDBTimeout = "DB_TIMEOUT"

	// ErrCodeDBBackupFailed indicates a backup operation failure.
	ErrCodeDBBackupFailed = "DB_BACKUP_FAILED"

	// ErrCodeDBRestoreFailed indicates a restore operation failure.
	ErrCodeDBRestoreFailed = "DB_RESTORE_FAILED"

	// ErrCodeDBClosed indicates an operation on a closed database.
	ErrCodeDBClosed = "DB_CLOSED"
)

// Error wraps database errors with context for debugging and monitoring.
// It follows the Rich Error Diagnostics pattern from Story 2.8.
type Error struct {
	// Code is the machine-readable error code (e.g., "DB_CONNECTION_FAILED").
	Code string

	// Message is the human-readable error description.
	Message string

	// Cause is the underlying error that caused this error.
	Cause error

	// Context contains additional debugging information such as
	// routerID, database path, operation name, etc.
	Context map[string]interface{}
}

// Error implements the error interface.
func (e *Error) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying cause for errors.Is/errors.As support.
func (e *Error) Unwrap() error {
	return e.Cause
}

// NewError creates a new Error with the given code, message, and cause.
func NewError(code, message string, cause error) *Error {
	return &Error{
		Code:    code,
		Message: message,
		Cause:   cause,
		Context: make(map[string]interface{}),
	}
}

// WithContext adds context information to the error and returns it for chaining.
func (e *Error) WithContext(key string, value interface{}) *Error {
	e.Context[key] = value
	return e
}

// WithRouterID adds router ID context to the error.
func (e *Error) WithRouterID(routerID string) *Error {
	return e.WithContext("routerID", routerID)
}

// WithPath adds database path context to the error.
func (e *Error) WithPath(path string) *Error {
	return e.WithContext("dbPath", path)
}

// WithOperation adds operation name context to the error.
func (e *Error) WithOperation(op string) *Error {
	return e.WithContext("operation", op)
}

// IsConnectionError checks if this is a connection-related error.
func (e *Error) IsConnectionError() bool {
	return e.Code == ErrCodeDBConnectionFailed
}

// IsIntegrityError checks if this is an integrity check error.
func (e *Error) IsIntegrityError() bool {
	return e.Code == ErrCodeDBIntegrityFailed
}

// IsRecoverable indicates whether the error might be recoverable through retry.
func (e *Error) IsRecoverable() bool {
	switch e.Code {
	case ErrCodeDBTimeout, ErrCodeDBConnectionFailed:
		return true
	default:
		return false
	}
}
