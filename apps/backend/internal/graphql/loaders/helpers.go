package loaders

import (
	"fmt"

	"github.com/graph-gophers/dataloader/v7"
)

// mapToResults maps fetched items back to their original key order.
// This is critical for DataLoader correctness - results must be returned in the same order as input keys.
//
// Handles three cases:
//   - Total success: All items found, mapped to results in key order
//   - Total failure: Error passed, all keys get the same error
//   - Partial failure: Found items returned, missing keys get "not found" errors
//
// Parameters:
//   - keys: Original input keys in the order they were requested
//   - items: Fetched items (may be fewer than keys if some not found)
//   - err: Error from the batch fetch (if any)
//   - keyFunc: Function to extract the key from an item (for building lookup map)
//
// Returns:
//   - Results array in the same order as input keys
func mapToResults[K comparable, V any](
	keys []K,
	items []V,
	err error,
	keyFunc func(V) K,
) []*dataloader.Result[V] {
	results := make([]*dataloader.Result[V], len(keys))

	// Case 1: Total failure - return error for all keys
	if err != nil {
		for i := range keys {
			results[i] = &dataloader.Result[V]{Error: err}
		}
		return results
	}

	// Build lookup map from items
	lookup := make(map[K]V, len(items))
	for _, item := range items {
		key := keyFunc(item)
		lookup[key] = item
	}

	// Map results to original key order
	for i, key := range keys {
		if item, ok := lookup[key]; ok {
			// Case 2: Item found
			results[i] = &dataloader.Result[V]{Data: item}
		} else {
			// Case 3: Item not found - return individual error with context
			results[i] = &dataloader.Result[V]{
				Error: NewNotFoundError(key),
			}
		}
	}

	return results
}

// mapToSliceResults maps fetched items to slice results for one-to-many relationships.
// Used when each key maps to multiple items (e.g., router ID -> []resources).
//
// Parameters:
//   - keys: Original input keys
//   - items: All fetched items (will be grouped by key)
//   - err: Error from the batch fetch (if any)
//   - keyFunc: Function to extract the grouping key from an item
//
// Returns:
//   - Results array where each result contains a slice of items for that key
func mapToSliceResults[K comparable, V any](
	keys []K,
	items []V,
	err error,
	keyFunc func(V) K,
) []*dataloader.Result[[]V] {
	results := make([]*dataloader.Result[[]V], len(keys))

	// Case 1: Total failure - return error for all keys
	if err != nil {
		for i := range keys {
			results[i] = &dataloader.Result[[]V]{Error: err}
		}
		return results
	}

	// Group items by key
	groups := make(map[K][]V, len(keys))
	for _, item := range items {
		key := keyFunc(item)
		groups[key] = append(groups[key], item)
	}

	// Map results to original key order
	for i, key := range keys {
		if items, ok := groups[key]; ok {
			// Items found for this key
			results[i] = &dataloader.Result[[]V]{Data: items}
		} else {
			// No items found - return empty slice (not an error)
			results[i] = &dataloader.Result[[]V]{Data: []V{}}
		}
	}

	return results
}

// NotFoundError represents an error when a requested key is not found.
type NotFoundError struct {
	Key interface{}
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("dataloader: key not found: %v", e.Key)
}

// NewNotFoundError creates a new NotFoundError for the given key.
func NewNotFoundError(key interface{}) *NotFoundError {
	return &NotFoundError{Key: key}
}

// IsNotFoundError checks if an error is a NotFoundError.
func IsNotFoundError(err error) bool {
	_, ok := err.(*NotFoundError)
	return ok
}

// PartialBatchError represents an error where some keys failed in a batch.
// This allows returning partial success while still reporting failures.
type PartialBatchError struct {
	SuccessCount int
	FailureCount int
	Errors       map[interface{}]error
}

func (e *PartialBatchError) Error() string {
	return fmt.Sprintf("dataloader: partial batch failure: %d succeeded, %d failed",
		e.SuccessCount, e.FailureCount)
}

// NewPartialBatchError creates a new PartialBatchError.
func NewPartialBatchError(successCount, failureCount int, errors map[interface{}]error) *PartialBatchError {
	return &PartialBatchError{
		SuccessCount: successCount,
		FailureCount: failureCount,
		Errors:       errors,
	}
}
