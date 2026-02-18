// Package base provides base service patterns for reducing code duplication.
package base

import (
	"fmt"
)

// CommandArgsBuilder provides a fluent interface for building RouterOS command arguments.
// This pattern appears 12+ times across service files with manual map building.
//
// Usage:
//
//	args := NewCommandArgsBuilder().
//	    AddString("name", input.Name).
//	    AddOptionalString("comment", input.Comment).
//	    AddOptionalInt("mtu", input.MTU).
//	    AddOptionalBool("disabled", input.Disabled).
//	    Build()
type CommandArgsBuilder struct {
	args map[string]string
}

// NewCommandArgsBuilder creates a new command args builder.
func NewCommandArgsBuilder() *CommandArgsBuilder {
	return &CommandArgsBuilder{
		args: make(map[string]string),
	}
}

// AddString adds a required string argument.
func (b *CommandArgsBuilder) AddString(key, value string) *CommandArgsBuilder {
	if value != "" {
		b.args[key] = value
	}
	return b
}

// AddInt adds a required int argument.
func (b *CommandArgsBuilder) AddInt(key string, value int) *CommandArgsBuilder {
	b.args[key] = fmt.Sprintf("%d", value)
	return b
}

// AddBool adds a required bool argument (yes/no format for RouterOS).
func (b *CommandArgsBuilder) AddBool(key string, value bool) *CommandArgsBuilder {
	if value {
		b.args[key] = "yes"
	} else {
		b.args[key] = "no"
	}
	return b
}

// AddOptionalString adds an optional string argument (only if pointer is non-nil and non-empty).
func (b *CommandArgsBuilder) AddOptionalString(key string, value *string) *CommandArgsBuilder {
	if value != nil && *value != "" {
		b.args[key] = *value
	}
	return b
}

// AddOptionalInt adds an optional int argument (only if pointer is non-nil).
func (b *CommandArgsBuilder) AddOptionalInt(key string, value *int) *CommandArgsBuilder {
	if value != nil {
		b.args[key] = fmt.Sprintf("%d", *value)
	}
	return b
}

// AddOptionalBool adds an optional bool argument (only if pointer is non-nil).
func (b *CommandArgsBuilder) AddOptionalBool(key string, value *bool) *CommandArgsBuilder {
	if value != nil {
		if *value {
			b.args[key] = "yes"
		} else {
			b.args[key] = "no"
		}
	}
	return b
}

// AddID adds a RouterOS ID argument (.id).
func (b *CommandArgsBuilder) AddID(id string) *CommandArgsBuilder {
	if id != "" {
		b.args[".id"] = id
	}
	return b
}

// Add adds a raw key-value pair.
func (b *CommandArgsBuilder) Add(key, value string) *CommandArgsBuilder {
	if value != "" {
		b.args[key] = value
	}
	return b
}

// Build returns the final args map.
func (b *CommandArgsBuilder) Build() map[string]string {
	return b.args
}
