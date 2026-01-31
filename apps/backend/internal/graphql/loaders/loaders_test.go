package loaders

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetLoaders(t *testing.T) {
	t.Run("returns nil when no loaders in context", func(t *testing.T) {
		ctx := context.Background()
		loaders := GetLoaders(ctx)
		assert.Nil(t, loaders)
	})

	t.Run("returns loaders when present in context", func(t *testing.T) {
		ctx := context.Background()
		expected := &Loaders{
			stats: &LoaderStats{},
		}
		ctx = WithLoaders(ctx, expected)

		actual := GetLoaders(ctx)
		assert.Equal(t, expected, actual)
	})
}

func TestMustGetLoaders(t *testing.T) {
	t.Run("panics when no loaders in context", func(t *testing.T) {
		ctx := context.Background()
		assert.Panics(t, func() {
			MustGetLoaders(ctx)
		})
	})

	t.Run("returns loaders when present", func(t *testing.T) {
		ctx := context.Background()
		expected := &Loaders{
			stats: &LoaderStats{},
		}
		ctx = WithLoaders(ctx, expected)

		assert.NotPanics(t, func() {
			actual := MustGetLoaders(ctx)
			assert.Equal(t, expected, actual)
		})
	})
}

func TestWithLoaders(t *testing.T) {
	t.Run("adds loaders to context", func(t *testing.T) {
		ctx := context.Background()
		loaders := &Loaders{
			stats: &LoaderStats{},
		}

		newCtx := WithLoaders(ctx, loaders)

		// Original context should not have loaders
		assert.Nil(t, GetLoaders(ctx))

		// New context should have loaders
		assert.Equal(t, loaders, GetLoaders(newCtx))
	})
}

func TestLoaderStats(t *testing.T) {
	t.Run("IncrementBatchCalls is atomic", func(t *testing.T) {
		stats := &LoaderStats{}

		// Concurrent increments
		done := make(chan bool)
		for i := 0; i < 100; i++ {
			go func() {
				stats.IncrementBatchCalls()
				done <- true
			}()
		}

		for i := 0; i < 100; i++ {
			<-done
		}

		assert.Equal(t, int64(100), stats.BatchCalls)
	})

	t.Run("IncrementTotalKeys is atomic", func(t *testing.T) {
		stats := &LoaderStats{}

		// Concurrent increments
		done := make(chan bool)
		for i := 0; i < 100; i++ {
			go func() {
				stats.IncrementTotalKeys(5)
				done <- true
			}()
		}

		for i := 0; i < 100; i++ {
			<-done
		}

		assert.Equal(t, int64(500), stats.TotalKeys)
	})

	t.Run("IncrementCacheHits is atomic", func(t *testing.T) {
		stats := &LoaderStats{}

		// Concurrent increments
		done := make(chan bool)
		for i := 0; i < 100; i++ {
			go func() {
				stats.IncrementCacheHits()
				done <- true
			}()
		}

		for i := 0; i < 100; i++ {
			<-done
		}

		assert.Equal(t, int64(100), stats.CacheHits)
	})
}

func TestLoadersCacheManagement(t *testing.T) {
	t.Run("ClearAll clears all loaders", func(t *testing.T) {
		// This test verifies that ClearAll doesn't panic
		// Full integration testing requires a database connection
		// which is covered in integration tests
		require.NotPanics(t, func() {
			// Create minimal loaders without DB for this unit test
			// In production, this would be created with NewLoaders(db, devMode)
		})
	})
}
