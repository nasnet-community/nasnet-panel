package ulid

import (
	"testing"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNew(t *testing.T) {
	id := New()

	// AC7: IDs match ULID format (26 chars)
	assert.Len(t, id.String(), 26)

	// Should be valid ULID
	_, err := ulid.Parse(id.String())
	assert.NoError(t, err)
}

func TestNewString(t *testing.T) {
	str := NewString()

	// AC7: IDs match ULID format (26 chars)
	assert.Len(t, str, 26)

	// Should be valid ULID
	assert.True(t, IsValid(str))
}

func TestNew_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	count := 10000

	for i := 0; i < count; i++ {
		id := NewString()
		if seen[id] {
			t.Fatalf("duplicate ULID generated: %s", id)
		}
		seen[id] = true
	}
}

func TestNew_TimeSorted(t *testing.T) {
	id1 := New()
	time.Sleep(2 * time.Millisecond)
	id2 := New()

	// ULID strings should be lexicographically sortable by time
	assert.Less(t, id1.String(), id2.String(),
		"ULIDs should be time-sorted: %s < %s", id1.String(), id2.String())
}

func TestMustParse(t *testing.T) {
	original := New()
	str := original.String()

	parsed := MustParse(str)
	assert.Equal(t, original, parsed)
}

func TestMustParse_Panic(t *testing.T) {
	assert.Panics(t, func() {
		MustParse("invalid-ulid")
	})
}

func TestParse(t *testing.T) {
	t.Run("valid ULID", func(t *testing.T) {
		original := New()
		str := original.String()

		parsed, err := Parse(str)
		require.NoError(t, err)
		assert.Equal(t, original, parsed)
	})

	t.Run("invalid ULID", func(t *testing.T) {
		_, err := Parse("invalid")
		assert.Error(t, err)
	})

	t.Run("wrong length", func(t *testing.T) {
		_, err := Parse("01ARZ3NDEKTSV4RRFFQ69G5FA") // 25 chars
		assert.Error(t, err)
	})
}

func TestIsValid(t *testing.T) {
	testCases := []struct {
		name  string
		input string
		valid bool
	}{
		{"valid ULID", NewString(), true},
		{"empty string", "", false},
		{"too short", "01ARZ3NDEKTSV4RRFFQ69G5F", false},
		{"too long", "01ARZ3NDEKTSV4RRFFQ69G5FAAA", false},
		{"invalid chars", "01ARZ3NDEKTSV4RRFFQ69G5FU", false}, // U is not valid
		{"lowercase valid", "01arz3ndektsv4rrffq69g5fav", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.valid, IsValid(tc.input))
		})
	}
}

func TestTime(t *testing.T) {
	// Add small buffer for clock precision
	before := time.Now().Add(-time.Millisecond)
	id := New()
	after := time.Now().Add(time.Millisecond)

	extractedTime := Time(id)

	// The time should be between before and after (with small tolerance for clock precision)
	assert.True(t, extractedTime.After(before) || extractedTime.Equal(before),
		"extracted time %v should be >= before %v", extractedTime, before)
	assert.True(t, extractedTime.Before(after) || extractedTime.Equal(after),
		"extracted time %v should be <= after %v", extractedTime, after)
}

func TestZero(t *testing.T) {
	zero := Zero()
	assert.Equal(t, ulid.ULID{}, zero)
	assert.True(t, IsZero(zero))
}

func TestIsZero(t *testing.T) {
	t.Run("zero ULID", func(t *testing.T) {
		assert.True(t, IsZero(Zero()))
	})

	t.Run("non-zero ULID", func(t *testing.T) {
		assert.False(t, IsZero(New()))
	})
}

func TestString(t *testing.T) {
	id := New()
	str := String(id)

	assert.Equal(t, id.String(), str)
	assert.Len(t, str, 26)
}

// Benchmark for ULID generation
func BenchmarkNew(b *testing.B) {
	for i := 0; i < b.N; i++ {
		New()
	}
}

func BenchmarkNewString(b *testing.B) {
	for i := 0; i < b.N; i++ {
		NewString()
	}
}

func BenchmarkParse(b *testing.B) {
	str := NewString()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Parse(str)
	}
}
