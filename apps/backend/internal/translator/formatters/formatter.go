// Package formatters provides protocol-specific command formatting for RouterOS.
//
// Each formatter converts CanonicalCommands to the native format required by
// its protocol:
//   - REST: JSON payloads with HTTP methods
//   - API: Binary API sentence format (=key=value)
//   - SSH: CLI script commands
package formatters

import (
	"fmt"

	"backend/internal/translator"
)

// ProtocolFormatter converts canonical commands to protocol-specific format
// and parses protocol-specific responses back to canonical format.
type ProtocolFormatter interface {
	// Format converts a canonical command to protocol-specific bytes.
	Format(cmd *translator.CanonicalCommand) ([]byte, error)

	// Parse converts protocol-specific response bytes to canonical format.
	Parse(response []byte) (*translator.CanonicalResponse, error)

	// Protocol returns the protocol type this formatter handles.
	Protocol() translator.Protocol
}

// FormatterRegistry holds formatters for all supported protocols.
type FormatterRegistry struct {
	formatters map[translator.Protocol]ProtocolFormatter
}

// NewFormatterRegistry creates a new registry with all default formatters.
func NewFormatterRegistry() *FormatterRegistry {
	r := &FormatterRegistry{
		formatters: make(map[translator.Protocol]ProtocolFormatter),
	}

	// Register default formatters
	r.Register(NewRESTFormatter())
	r.Register(NewAPIFormatter())
	r.Register(NewSSHFormatter())

	return r
}

// Register adds a formatter to the registry.
func (r *FormatterRegistry) Register(f ProtocolFormatter) {
	r.formatters[f.Protocol()] = f
}

// Get returns the formatter for a specific protocol.
func (r *FormatterRegistry) Get(protocol translator.Protocol) (ProtocolFormatter, bool) {
	f, ok := r.formatters[protocol]
	return f, ok
}

// Format formats a command using the appropriate protocol formatter.
func (r *FormatterRegistry) Format(protocol translator.Protocol, cmd *translator.CanonicalCommand) ([]byte, error) {
	f, ok := r.Get(protocol)
	if !ok {
		return nil, &translator.CommandError{
			Code:     "UNSUPPORTED_PROTOCOL",
			Message:  "No formatter for protocol: " + string(protocol),
			Category: translator.ErrorCategoryUnsupported,
		}
	}
	if f == nil {
		return nil, &translator.CommandError{
			Code:     "INTERNAL_ERROR",
			Message:  "formatter is nil for protocol: " + string(protocol),
			Category: translator.ErrorCategoryUnsupported,
		}
	}
	formatted, err := f.Format(cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to format command for protocol %s: %w", protocol, err)
	}
	return formatted, nil
}

// Parse parses a response using the appropriate protocol formatter.
func (r *FormatterRegistry) Parse(protocol translator.Protocol, response []byte) (*translator.CanonicalResponse, error) {
	f, ok := r.Get(protocol)
	if !ok {
		return nil, &translator.CommandError{
			Code:     "UNSUPPORTED_PROTOCOL",
			Message:  "No formatter for protocol: " + string(protocol),
			Category: translator.ErrorCategoryUnsupported,
		}
	}
	if f == nil {
		return nil, &translator.CommandError{
			Code:     "INTERNAL_ERROR",
			Message:  "formatter is nil for protocol: " + string(protocol),
			Category: translator.ErrorCategoryUnsupported,
		}
	}
	parsed, err := f.Parse(response)
	if err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}
	return parsed, nil
}
