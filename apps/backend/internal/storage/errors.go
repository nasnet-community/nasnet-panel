package storage

import (
	"fmt"
)

// ErrorCode represents storage-specific error codes.
type ErrorCode string

const (
	// Mount point errors
	ErrCodeMountNotFound     ErrorCode = "MOUNT_NOT_FOUND"
	ErrCodeNotMounted        ErrorCode = "NOT_MOUNTED"
	ErrCodeInsufficientSpace ErrorCode = "INSUFFICIENT_SPACE"
	ErrCodeInvalidPath       ErrorCode = "INVALID_PATH"

	// Configuration errors
	ErrCodeInvalidConfig    ErrorCode = "INVALID_CONFIG"
	ErrCodeFlashNotAllowed  ErrorCode = "FLASH_NOT_ALLOWED"
	ErrCodeExternalRequired ErrorCode = "EXTERNAL_REQUIRED"
	ErrCodePathTraversal    ErrorCode = "PATH_TRAVERSAL_ATTEMPT"
	ErrCodeInvalidServiceID ErrorCode = "INVALID_SERVICE_ID"

	// Boot validation errors
	ErrCodeChecksumMismatch ErrorCode = "CHECKSUM_MISMATCH"
	ErrCodeBinaryNotFound   ErrorCode = "BINARY_NOT_FOUND"
	ErrCodeManifestInvalid  ErrorCode = "MANIFEST_INVALID"
)

// StorageError represents a storage-related error with additional context.
type StorageError struct { //nolint:revive // used across packages
	Code    ErrorCode
	Message string
	Path    string
	Details map[string]interface{}
	Err     error
}

// Error implements the error interface.
func (e *StorageError) Error() string {
	if e.Path != "" {
		return fmt.Sprintf("%s: %s (path: %s)", e.Code, e.Message, e.Path)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the underlying error.
func (e *StorageError) Unwrap() error {
	return e.Err
}

// NewStorageError creates a new StorageError.
func NewStorageError(code ErrorCode, message, path string) *StorageError {
	return &StorageError{
		Code:    code,
		Message: message,
		Path:    path,
	}
}

// NewStorageErrorWithDetails creates a StorageError with additional details.
func NewStorageErrorWithDetails(code ErrorCode, message, path string, details map[string]interface{}) *StorageError {
	return &StorageError{
		Code:    code,
		Message: message,
		Path:    path,
		Details: details,
	}
}

// WrapStorageError wraps an existing error with storage context.
func WrapStorageError(code ErrorCode, message, path string, err error) *StorageError {
	return &StorageError{
		Code:    code,
		Message: message,
		Path:    path,
		Err:     err,
	}
}
