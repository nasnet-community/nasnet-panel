// Package model contains GraphQL model definitions and custom scalar types.
package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"regexp"
	"strconv"
	"strings"

	"github.com/99designs/gqlgen/graphql"
	"github.com/oklog/ulid/v2"
)

// =============================================================================
// Custom Scalar Type Definitions
// =============================================================================
// These scalars provide type safety for network-specific data types.
// Each implements graphql.Marshaler and graphql.Unmarshaler interfaces.
// =============================================================================

// -----------------------------------------------------------------------------
// IPv4 Scalar
// -----------------------------------------------------------------------------

// IPv4 represents an IPv4 address string.
type IPv4 string

// MarshalGQL implements graphql.Marshaler interface.
func (ip IPv4) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(ip)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (ip *IPv4) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("IPv4 must be a string")
	}

	// Validate IPv4 format
	parsed := net.ParseIP(str)
	if parsed == nil || parsed.To4() == nil {
		return fmt.Errorf("invalid IPv4 address: %s", str)
	}

	*ip = IPv4(str)
	return nil
}

// -----------------------------------------------------------------------------
// IPv6 Scalar
// -----------------------------------------------------------------------------

// IPv6 represents an IPv6 address string.
type IPv6 string

// MarshalGQL implements graphql.Marshaler interface.
func (ip IPv6) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(ip)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (ip *IPv6) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("IPv6 must be a string")
	}

	// Validate IPv6 format
	parsed := net.ParseIP(str)
	if parsed == nil || parsed.To16() == nil || parsed.To4() != nil {
		return fmt.Errorf("invalid IPv6 address: %s", str)
	}

	*ip = IPv6(str)
	return nil
}

// -----------------------------------------------------------------------------
// MAC Scalar
// -----------------------------------------------------------------------------

// MAC represents a MAC address string.
type MAC string

// macPattern matches common MAC address formats.
var macPattern = regexp.MustCompile(`^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`)

// MarshalGQL implements graphql.Marshaler interface.
func (m MAC) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(m)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (m *MAC) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("MAC must be a string")
	}

	// Validate MAC format
	if !macPattern.MatchString(str) {
		return fmt.Errorf("invalid MAC address: %s", str)
	}

	*m = MAC(strings.ToUpper(str))
	return nil
}

// -----------------------------------------------------------------------------
// CIDR Scalar
// -----------------------------------------------------------------------------

// CIDR represents a CIDR notation network address.
type CIDR string

// MarshalGQL implements graphql.Marshaler interface.
func (c CIDR) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(c)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (c *CIDR) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("CIDR must be a string")
	}

	// Validate CIDR format
	_, _, err := net.ParseCIDR(str)
	if err != nil {
		return fmt.Errorf("invalid CIDR notation: %s", str)
	}

	*c = CIDR(str)
	return nil
}

// -----------------------------------------------------------------------------
// Port Scalar
// -----------------------------------------------------------------------------

// Port represents a TCP/UDP port number (1-65535).
type Port int

// MarshalGQL implements graphql.Marshaler interface.
func (p Port) MarshalGQL(w io.Writer) {
	graphql.MarshalInt(int(p)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (p *Port) UnmarshalGQL(v interface{}) error {
	switch val := v.(type) {
	case int:
		if val < 1 || val > 65535 {
			return fmt.Errorf("port must be between 1 and 65535, got %d", val)
		}
		*p = Port(val)
	case int64:
		if val < 1 || val > 65535 {
			return fmt.Errorf("port must be between 1 and 65535, got %d", val)
		}
		*p = Port(val)
	case json.Number:
		n, err := val.Int64()
		if err != nil {
			return err
		}
		if n < 1 || n > 65535 {
			return fmt.Errorf("port must be between 1 and 65535, got %d", n)
		}
		*p = Port(n)
	default:
		return errors.New("port must be an integer")
	}
	return nil
}

// -----------------------------------------------------------------------------
// PortRange Scalar
// -----------------------------------------------------------------------------

// PortRange represents a port or port range string (e.g., "80", "80-443", "80,443,8080").
type PortRange string

// portRangePattern validates port range formats.
var portRangePattern = regexp.MustCompile(`^(\d{1,5}(-\d{1,5})?)(,\d{1,5}(-\d{1,5})?)*$`)

// MarshalGQL implements graphql.Marshaler interface.
func (pr PortRange) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(pr)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (pr *PortRange) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("PortRange must be a string")
	}

	if !portRangePattern.MatchString(str) {
		return fmt.Errorf("invalid port range format: %s", str)
	}

	// Validate individual port numbers are in valid range
	parts := strings.FieldsFunc(str, func(r rune) bool {
		return r == ',' || r == '-'
	})
	for _, part := range parts {
		port, err := strconv.Atoi(part)
		if err != nil || port < 1 || port > 65535 {
			return fmt.Errorf("invalid port number in range: %s", part)
		}
	}

	*pr = PortRange(str)
	return nil
}

// -----------------------------------------------------------------------------
// Duration Scalar
// -----------------------------------------------------------------------------

// Duration represents a RouterOS duration string (e.g., "1d2h3m4s").
type Duration string

// durationPattern validates RouterOS duration format.
var durationPattern = regexp.MustCompile(`^(\d+w)?(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+ms)?$`)

// MarshalGQL implements graphql.Marshaler interface.
func (d Duration) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(d)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (d *Duration) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("Duration must be a string")
	}

	if str == "" {
		*d = Duration("0s")
		return nil
	}

	if !durationPattern.MatchString(str) {
		return fmt.Errorf("invalid duration format: %s (expected format like '1d2h3m4s')", str)
	}

	*d = Duration(str)
	return nil
}

// -----------------------------------------------------------------------------
// Bandwidth Scalar
// -----------------------------------------------------------------------------

// Bandwidth represents a bandwidth string with unit (e.g., "10M", "1G", "100k").
type Bandwidth string

// bandwidthPattern validates bandwidth format.
var bandwidthPattern = regexp.MustCompile(`^(\d+)(k|K|m|M|g|G)?$`)

// MarshalGQL implements graphql.Marshaler interface.
func (b Bandwidth) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(b)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (b *Bandwidth) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("Bandwidth must be a string")
	}

	if !bandwidthPattern.MatchString(str) {
		return fmt.Errorf("invalid bandwidth format: %s (expected format like '10M', '1G', '100k')", str)
	}

	*b = Bandwidth(str)
	return nil
}

// -----------------------------------------------------------------------------
// Size Scalar
// -----------------------------------------------------------------------------

// Size represents a byte size with optional unit (e.g., "1024", "1k", "1M", "1G").
type Size string

// sizePattern validates size format.
var sizePattern = regexp.MustCompile(`^(\d+)(k|K|m|M|g|G|t|T)?$`)

// MarshalGQL implements graphql.Marshaler interface.
func (s Size) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(s)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (s *Size) UnmarshalGQL(v interface{}) error {
	switch val := v.(type) {
	case string:
		if !sizePattern.MatchString(val) {
			return fmt.Errorf("invalid size format: %s (expected format like '1024', '1k', '1M')", val)
		}
		*s = Size(val)
	case int:
		*s = Size(strconv.Itoa(val))
	case int64:
		*s = Size(strconv.FormatInt(val, 10))
	case json.Number:
		*s = Size(val.String())
	default:
		return errors.New("Size must be a string or integer")
	}
	return nil
}

// -----------------------------------------------------------------------------
// ULID Scalar
// -----------------------------------------------------------------------------

// ULID represents a Universally Unique Lexicographically Sortable Identifier.
// ULIDs are 26-character strings that are time-sortable and globally unique.
type ULID string

// MarshalGQL implements graphql.Marshaler interface.
func (u ULID) MarshalGQL(w io.Writer) {
	graphql.MarshalString(string(u)).MarshalGQL(w)
}

// UnmarshalGQL implements graphql.Unmarshaler interface.
func (u *ULID) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return errors.New("ULID must be a string")
	}

	// Validate ULID format (26 characters, Crockford's Base32)
	if len(str) != 26 {
		return fmt.Errorf("invalid ULID: must be 26 characters, got %d", len(str))
	}

	// Parse to validate the ULID is well-formed
	_, err := ulid.Parse(str)
	if err != nil {
		return fmt.Errorf("invalid ULID format: %w", err)
	}

	*u = ULID(str)
	return nil
}
