// Package ulid provides ULID generation and parsing utilities.
// ULIDs are Universally Unique Lexicographically Sortable Identifiers
// that combine a timestamp with random data for globally unique,
// time-sortable IDs.
package ulid

import (
	"crypto/rand"
	"time"

	"github.com/oklog/ulid/v2"
)

// New generates a new ULID using cryptographic randomness.
// The ULID encodes the current time with millisecond precision
// plus 80 bits of cryptographic random data.
func New() ulid.ULID {
	return ulid.MustNew(ulid.Timestamp(time.Now()), rand.Reader)
}

// NewString generates a new ULID and returns its string representation.
// This is a convenience function for cases where only the string is needed.
func NewString() string {
	return New().String()
}

// MustParse parses a ULID string or panics.
// Use this when you have a ULID that is known to be valid.
func MustParse(s string) ulid.ULID {
	return ulid.MustParse(s)
}

// Parse parses a ULID string with error handling.
// Returns an error if the string is not a valid ULID.
func Parse(s string) (ulid.ULID, error) {
	return ulid.Parse(s)
}

// String returns the string representation of a ULID.
func String(u ulid.ULID) string {
	return u.String()
}

// IsValid checks if a string is a valid ULID.
// Returns true if the string can be parsed as a ULID.
func IsValid(s string) bool {
	_, err := ulid.Parse(s)
	return err == nil
}

// Time extracts the timestamp from a ULID.
func Time(u ulid.ULID) time.Time {
	return ulid.Time(u.Time())
}

// Zero returns the zero-value ULID.
func Zero() ulid.ULID {
	return ulid.ULID{}
}

// IsZero checks if a ULID is the zero value.
func IsZero(u ulid.ULID) bool {
	return u == ulid.ULID{}
}
