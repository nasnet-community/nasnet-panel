package repository

import (
	"errors"
	"fmt"
)

// =============================================================================
// Sentinel Errors
// =============================================================================

// These sentinel errors can be checked using errors.Is():
//
//	router, err := repo.Get(ctx, id)
//	if errors.Is(err, repository.ErrNotFound) {
//	    // Handle not found case
//	}
var (
	// ErrNotFound indicates the requested entity was not found.
	ErrNotFound = errors.New("entity not found")

	// ErrDuplicate indicates an entity with conflicting unique fields already exists.
	ErrDuplicate = errors.New("duplicate entity")

	// ErrConcurrentModification indicates a concurrent modification was detected.
	// This occurs when optimistic locking detects a version mismatch.
	ErrConcurrentModification = errors.New("concurrent modification detected")

	// ErrResourceLocked indicates the resource is locked by another operation.
	// This occurs with pessimistic locking when a lock cannot be acquired.
	ErrResourceLocked = errors.New("resource is locked")

	// ErrInvalidInput indicates the input data failed validation.
	ErrInvalidInput = errors.New("invalid input")

	// ErrInvalidCredentials indicates authentication credentials are invalid.
	ErrInvalidCredentials = errors.New("invalid credentials")

	// ErrTransactionFailed indicates a database transaction failed.
	ErrTransactionFailed = errors.New("transaction failed")

	// ErrCleanupPending indicates cleanup operations are pending.
	// This is an informational error, not a failure condition.
	ErrCleanupPending = errors.New("cleanup pending")
)

// =============================================================================
// Error Constructors with Context
// =============================================================================

// Error wraps a sentinel error with additional context.
type Error struct {
	// Err is the sentinel error (ErrNotFound, ErrDuplicate, etc.)
	Err error

	// Entity is the type of entity (e.g., "Router", "User")
	Entity string

	// Field is the field that caused the error (for validation/duplicate errors)
	Field string

	// Value is the value that caused the error
	Value interface{}

	// Message is an optional human-readable message
	Message string
}

// Error implements the error interface.
func (e *Error) Error() string {
	if e.Message != "" {
		return e.Message
	}
	if e.Field != "" && e.Value != nil {
		return fmt.Sprintf("%s: %s with %s=%v", e.Err, e.Entity, e.Field, e.Value)
	}
	if e.Value != nil {
		return fmt.Sprintf("%s: %s with id %v", e.Err, e.Entity, e.Value)
	}
	if e.Entity != "" {
		return fmt.Sprintf("%s: %s", e.Err, e.Entity)
	}
	return e.Err.Error()
}

// Unwrap returns the underlying sentinel error for errors.Is() support.
func (e *Error) Unwrap() error {
	return e.Err
}

// NotFound creates an ErrNotFound error with context.
//
// Usage:
//
//	return nil, repository.NotFound("Router", id)
//	return nil, repository.NotFound("User", username)
func NotFound(entity string, id interface{}) error {
	return &Error{
		Err:    ErrNotFound,
		Entity: entity,
		Value:  id,
	}
}

// NotFoundWithField creates an ErrNotFound error with field context.
//
// Usage:
//
//	return nil, repository.NotFoundWithField("User", "username", username)
func NotFoundWithField(entity, field string, value interface{}) error {
	return &Error{
		Err:    ErrNotFound,
		Entity: entity,
		Field:  field,
		Value:  value,
	}
}

// Duplicate creates an ErrDuplicate error with context.
//
// Usage:
//
//	return nil, repository.Duplicate("Router", "host:port", fmt.Sprintf("%s:%d", host, port))
//	return nil, repository.Duplicate("User", "username", username)
func Duplicate(entity, field string, value interface{}) error {
	return &Error{
		Err:    ErrDuplicate,
		Entity: entity,
		Field:  field,
		Value:  value,
	}
}

// ConcurrentModification creates an ErrConcurrentModification error with context.
//
// Usage:
//
//	return nil, repository.ConcurrentModification("Router", id, currentVersion, expectedVersion)
func ConcurrentModification(entity string, id interface{}, current, expected int) error {
	return &Error{
		Err:     ErrConcurrentModification,
		Entity:  entity,
		Value:   id,
		Message: fmt.Sprintf("concurrent modification detected: %s with id %v (version %d expected, got %d)", entity, id, expected, current),
	}
}

// ResourceLocked creates an ErrResourceLocked error with context.
//
// Usage:
//
//	return nil, repository.ResourceLocked("Router", id, "another operation")
func ResourceLocked(entity string, id interface{}, heldBy string) error {
	msg := fmt.Sprintf("resource locked: %s with id %v is locked", entity, id)
	if heldBy != "" {
		msg = fmt.Sprintf("resource locked: %s with id %v is locked by %s", entity, id, heldBy)
	}
	return &Error{
		Err:     ErrResourceLocked,
		Entity:  entity,
		Value:   id,
		Message: msg,
	}
}

// InvalidInput creates an ErrInvalidInput error with context.
//
// Usage:
//
//	return nil, repository.InvalidInput("CreateRouterInput", "host", "cannot be empty")
func InvalidInput(entity, field, reason string) error {
	return &Error{
		Err:     ErrInvalidInput,
		Entity:  entity,
		Field:   field,
		Message: fmt.Sprintf("invalid input: %s.%s %s", entity, field, reason),
	}
}

// InvalidInputWithValue creates an ErrInvalidInput error with value context.
//
// Usage:
//
//	return nil, repository.InvalidInputWithValue("CreateRouterInput", "port", 0, "must be between 1 and 65535")
func InvalidInputWithValue(entity, field string, value interface{}, reason string) error {
	return &Error{
		Err:     ErrInvalidInput,
		Entity:  entity,
		Field:   field,
		Value:   value,
		Message: fmt.Sprintf("invalid input: %s.%s=%v %s", entity, field, value, reason),
	}
}

// TransactionFailed creates an ErrTransactionFailed error with context.
//
// Usage:
//
//	return nil, repository.TransactionFailed("CreateRouterWithSecrets", err)
func TransactionFailed(operation string, cause error) error {
	return &Error{
		Err:     ErrTransactionFailed,
		Entity:  operation,
		Message: fmt.Sprintf("transaction failed during %s: %v", operation, cause),
	}
}

// =============================================================================
// Error Type Checks
// =============================================================================

// IsNotFound checks if an error is ErrNotFound.
func IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound)
}

// IsDuplicate checks if an error is ErrDuplicate.
func IsDuplicate(err error) bool {
	return errors.Is(err, ErrDuplicate)
}

// IsConcurrentModification checks if an error is ErrConcurrentModification.
func IsConcurrentModification(err error) bool {
	return errors.Is(err, ErrConcurrentModification)
}

// IsResourceLocked checks if an error is ErrResourceLocked.
func IsResourceLocked(err error) bool {
	return errors.Is(err, ErrResourceLocked)
}

// IsInvalidInput checks if an error is ErrInvalidInput.
func IsInvalidInput(err error) bool {
	return errors.Is(err, ErrInvalidInput)
}

// IsInvalidCredentials checks if an error is ErrInvalidCredentials.
func IsInvalidCredentials(err error) bool {
	return errors.Is(err, ErrInvalidCredentials)
}

// IsTransactionFailed checks if an error is ErrTransactionFailed.
func IsTransactionFailed(err error) bool {
	return errors.Is(err, ErrTransactionFailed)
}

// =============================================================================
// Error Details Extraction
// =============================================================================

// GetErrorDetails extracts details from a Error if available.
// Returns nil if the error is not a Error.
func GetErrorDetails(err error) *Error {
	var repoErr *Error
	if errors.As(err, &repoErr) {
		return repoErr
	}
	return nil
}
