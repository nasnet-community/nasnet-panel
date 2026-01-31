package loaders

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testItem is a simple struct for testing mapToResults
type testItem struct {
	ID   string
	Name string
}

func TestMapToResults(t *testing.T) {
	keyFunc := func(item *testItem) string {
		return item.ID
	}

	t.Run("maps items to results in key order", func(t *testing.T) {
		keys := []string{"a", "b", "c"}
		items := []*testItem{
			{ID: "c", Name: "Charlie"},
			{ID: "a", Name: "Alice"},
			{ID: "b", Name: "Bob"},
		}

		results := mapToResults(keys, items, nil, keyFunc)

		require.Len(t, results, 3)

		// Results should be in the same order as keys
		assert.NoError(t, results[0].Error)
		assert.Equal(t, "Alice", results[0].Data.Name)

		assert.NoError(t, results[1].Error)
		assert.Equal(t, "Bob", results[1].Data.Name)

		assert.NoError(t, results[2].Error)
		assert.Equal(t, "Charlie", results[2].Data.Name)
	})

	t.Run("returns error for all keys on total failure", func(t *testing.T) {
		keys := []string{"a", "b", "c"}
		items := []*testItem{}
		err := errors.New("database connection failed")

		results := mapToResults(keys, items, err, keyFunc)

		require.Len(t, results, 3)
		for i, result := range results {
			assert.Error(t, result.Error, "result %d should have error", i)
			assert.Equal(t, err, result.Error)
			assert.Nil(t, result.Data)
		}
	})

	t.Run("handles partial success - missing keys get NotFoundError", func(t *testing.T) {
		keys := []string{"a", "b", "c", "d"}
		items := []*testItem{
			{ID: "a", Name: "Alice"},
			{ID: "c", Name: "Charlie"},
		}

		results := mapToResults(keys, items, nil, keyFunc)

		require.Len(t, results, 4)

		// Key "a" - found
		assert.NoError(t, results[0].Error)
		assert.Equal(t, "Alice", results[0].Data.Name)

		// Key "b" - not found
		assert.Error(t, results[1].Error)
		assert.True(t, IsNotFoundError(results[1].Error))
		assert.Nil(t, results[1].Data)

		// Key "c" - found
		assert.NoError(t, results[2].Error)
		assert.Equal(t, "Charlie", results[2].Data.Name)

		// Key "d" - not found
		assert.Error(t, results[3].Error)
		assert.True(t, IsNotFoundError(results[3].Error))
		assert.Nil(t, results[3].Data)
	})

	t.Run("handles empty keys", func(t *testing.T) {
		keys := []string{}
		items := []*testItem{}

		results := mapToResults(keys, items, nil, keyFunc)

		assert.Len(t, results, 0)
	})

	t.Run("handles duplicate keys", func(t *testing.T) {
		keys := []string{"a", "a", "b"}
		items := []*testItem{
			{ID: "a", Name: "Alice"},
			{ID: "b", Name: "Bob"},
		}

		results := mapToResults(keys, items, nil, keyFunc)

		require.Len(t, results, 3)

		// Both "a" keys should return Alice
		assert.NoError(t, results[0].Error)
		assert.Equal(t, "Alice", results[0].Data.Name)

		assert.NoError(t, results[1].Error)
		assert.Equal(t, "Alice", results[1].Data.Name)

		assert.NoError(t, results[2].Error)
		assert.Equal(t, "Bob", results[2].Data.Name)
	})
}

func TestMapToSliceResults(t *testing.T) {
	keyFunc := func(item *testItem) string {
		return item.ID
	}

	t.Run("groups items by key", func(t *testing.T) {
		keys := []string{"router1", "router2"}
		items := []*testItem{
			{ID: "router1", Name: "Resource A"},
			{ID: "router1", Name: "Resource B"},
			{ID: "router2", Name: "Resource C"},
			{ID: "router1", Name: "Resource D"},
		}

		results := mapToSliceResults(keys, items, nil, keyFunc)

		require.Len(t, results, 2)

		// router1 should have 3 items
		assert.NoError(t, results[0].Error)
		assert.Len(t, results[0].Data, 3)

		// router2 should have 1 item
		assert.NoError(t, results[1].Error)
		assert.Len(t, results[1].Data, 1)
		assert.Equal(t, "Resource C", results[1].Data[0].Name)
	})

	t.Run("returns empty slice for missing keys (not error)", func(t *testing.T) {
		keys := []string{"router1", "router2", "router3"}
		items := []*testItem{
			{ID: "router1", Name: "Resource A"},
		}

		results := mapToSliceResults(keys, items, nil, keyFunc)

		require.Len(t, results, 3)

		// router1 has items
		assert.NoError(t, results[0].Error)
		assert.Len(t, results[0].Data, 1)

		// router2 returns empty slice, not error
		assert.NoError(t, results[1].Error)
		assert.Len(t, results[1].Data, 0)
		assert.NotNil(t, results[1].Data) // Should be empty slice, not nil

		// router3 returns empty slice, not error
		assert.NoError(t, results[2].Error)
		assert.Len(t, results[2].Data, 0)
	})

	t.Run("returns error for all keys on total failure", func(t *testing.T) {
		keys := []string{"router1", "router2"}
		items := []*testItem{}
		err := errors.New("database error")

		results := mapToSliceResults(keys, items, err, keyFunc)

		require.Len(t, results, 2)
		for _, result := range results {
			assert.Error(t, result.Error)
			assert.Equal(t, err, result.Error)
		}
	})
}

func TestNotFoundError(t *testing.T) {
	t.Run("Error() returns key info", func(t *testing.T) {
		err := NewNotFoundError("test-key-123")
		assert.Contains(t, err.Error(), "test-key-123")
		assert.Contains(t, err.Error(), "not found")
	})

	t.Run("IsNotFoundError identifies NotFoundError", func(t *testing.T) {
		notFoundErr := NewNotFoundError("key")
		otherErr := errors.New("some other error")

		assert.True(t, IsNotFoundError(notFoundErr))
		assert.False(t, IsNotFoundError(otherErr))
		assert.False(t, IsNotFoundError(nil))
	})
}

func TestPartialBatchError(t *testing.T) {
	t.Run("Error() returns counts", func(t *testing.T) {
		errors := map[interface{}]error{
			"key1": errors.New("error 1"),
			"key2": errors.New("error 2"),
		}
		err := NewPartialBatchError(3, 2, errors)

		assert.Contains(t, err.Error(), "3 succeeded")
		assert.Contains(t, err.Error(), "2 failed")
	})
}
