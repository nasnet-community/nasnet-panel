package parser

import (
	"context"
	"fmt"
	"strings"
)

// keyValueParser parses colon-separated key-value output from system info commands.
//
// Example key-value format:
//
//	uptime: 2w3d12h30m45s
//	version: 7.13.2 (stable)
//	board-name: RB4011iGS+5HacQ2HnD-IN
//	platform: MikroTik
//	cpu-load: 5
//	free-memory: 512.0MiB
//	total-memory: 1024.0MiB
type keyValueParser struct {
	normalizer *Normalizer
}

// NewKeyValueParser creates a new key-value format parser.
func NewKeyValueParser(normalizer *Normalizer) ParserStrategy {
	return &keyValueParser{normalizer: normalizer}
}

// Name returns the strategy name.
func (p *keyValueParser) Name() string {
	return "keyvalue"
}

// Priority returns the strategy priority.
func (p *keyValueParser) Priority() int {
	return 5 // Lowest priority - fallback
}

// CanParse returns true if this looks like key-value format.
func (p *keyValueParser) CanParse(raw string, hints ParseHints) bool {
	// System resource hint is strongest indicator
	if hints.CommandType == CommandSystemResource || hints.CommandType == CommandGet {
		return true
	}

	lines := strings.Split(raw, "\n")
	colonLines := 0

	for i, line := range lines {
		if i > 15 {
			break
		}

		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		// Skip flag definition lines
		if IsFlagDefinitionLine(trimmed) {
			continue
		}

		// Count lines with colon separator
		if isKeyValueLine(trimmed) {
			colonLines++
		}
	}

	// Need at least 3 key-value lines
	return colonLines >= 3
}

// Parse parses key-value format output.
func (p *keyValueParser) Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error) {
	lines := strings.Split(raw, "\n")

	result := &ParseResult{
		Resources: []Resource{},
		Metadata: ParseMetadata{
			Format: FormatKeyValue,
		},
	}

	// Key-value format typically represents a single resource
	resource := make(map[string]any)

	for lineNum, line := range lines {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("parse key-value: %w", ctx.Err())
		default:
		}

		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		// Skip flag definition lines
		if IsFlagDefinitionLine(trimmed) {
			continue
		}

		// Parse key: value
		key, value, ok := parseKeyValueLine(trimmed)
		if ok {
			resource[key] = value
		} else if trimmed != "" {
			result.Warnings = append(result.Warnings, ParseWarning{
				Line:    lineNum + 1,
				Message: "could not parse key-value line",
				Code:    WarnMalformedLine,
			})
		}
	}

	if len(resource) > 0 {
		result.Resources = append(result.Resources, p.normalizer.NormalizeResource(resource))
	}

	result.Metadata.RowCount = len(result.Resources)

	return result, nil
}

// isKeyValueLine checks if a line is in key: value format.
func isKeyValueLine(line string) bool {
	// Must have colon separator
	colonIdx := strings.Index(line, ":")
	if colonIdx <= 0 {
		return false
	}

	// Key should not have spaces (unless it's a multi-word key like "board name")
	key := strings.TrimSpace(line[:colonIdx])
	if key == "" {
		return false
	}

	// Key should not start with # (comment) or / (path)
	if strings.HasPrefix(key, "#") || strings.HasPrefix(key, "/") {
		return false
	}

	// Key should be reasonable length
	if len(key) > 50 {
		return false
	}

	return true
}

// parseKeyValueLine parses a single "key: value" line.
func parseKeyValueLine(line string) (key, value string, ok bool) {
	colonIdx := strings.Index(line, ":")
	if colonIdx <= 0 {
		return "", "", false
	}

	key = strings.TrimSpace(line[:colonIdx])
	value = strings.TrimSpace(line[colonIdx+1:])

	return key, value, key != ""
}

// Compile-time verification.
var _ ParserStrategy = (*keyValueParser)(nil)
