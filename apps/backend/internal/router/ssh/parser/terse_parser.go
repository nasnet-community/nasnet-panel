package parser

import (
	"context"
	"strings"
)

// terseParser parses terse format output from /print terse commands.
// Available in RouterOS 6.43+ and is the most reliable format to parse.
//
// Example terse format:
//
//	.id=*1;name=vpn-usa;listen-port=51820;mtu=1420;running=true
//	.id=*2;name=vpn-eu;listen-port=51821;mtu=1420;running=true
type terseParser struct {
	normalizer *Normalizer
}

// NewTerseParser creates a new terse format parser.
func NewTerseParser(normalizer *Normalizer) ParserStrategy {
	return &terseParser{normalizer: normalizer}
}

// Name returns the strategy name.
func (p *terseParser) Name() string {
	return "terse"
}

// Priority returns the strategy priority.
func (p *terseParser) Priority() int {
	return 1 // Highest priority - most reliable format
}

// CanParse returns true if this looks like terse format.
func (p *terseParser) CanParse(raw string, hints ParseHints) bool {
	// Terse format hint is strongest indicator
	if hints.CommandType == CommandPrintTerse {
		return true
	}

	// Check for terse format indicators
	lines := strings.Split(raw, "\n")
	terseLikeLines := 0

	for i, line := range lines {
		if i > 10 {
			break // Only check first few lines
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Terse format has semicolon-separated key=value pairs
		if isTerseLine(line) {
			terseLikeLines++
		}
	}

	// Need at least 1 terse-like line with reasonable confidence
	return terseLikeLines >= 1
}

// Parse parses terse format output.
func (p *terseParser) Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error) {
	lines := strings.Split(raw, "\n")

	result := &ParseResult{
		Resources: []Resource{},
		Metadata: ParseMetadata{
			Format: FormatTerse,
		},
	}

	for lineNum, line := range lines {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		resource, warning := p.parseTerseLine(line, lineNum+1)
		if len(resource) > 0 {
			result.Resources = append(result.Resources, p.normalizer.NormalizeResource(resource))
		}
		if warning != nil {
			result.Warnings = append(result.Warnings, *warning)
		}
	}

	result.Metadata.RowCount = len(result.Resources)

	return result, nil
}

// parseTerseLine parses a single terse format line.
func (p *terseParser) parseTerseLine(line string, lineNum int) (map[string]any, *ParseWarning) {
	resource := make(map[string]any)

	// Split by semicolon, respecting quotes
	pairs := splitTersePairs(line)

	for _, pair := range pairs {
		key, value, ok := parseTerseKeyValue(pair)
		if !ok {
			continue
		}

		resource[key] = value
	}

	if len(resource) == 0 {
		return nil, &ParseWarning{
			Line:    lineNum,
			Message: "no key-value pairs found in terse line",
			Code:    WarnMalformedLine,
		}
	}

	return resource, nil
}

// splitTersePairs splits a terse line by semicolons, respecting quoted values.
func splitTersePairs(line string) []string {
	var pairs []string
	var current strings.Builder
	inQuote := false
	quoteChar := rune(0)

	for _, ch := range line {
		switch {
		case ch == '"' || ch == '\'':
			if !inQuote {
				inQuote = true
				quoteChar = ch
			} else if ch == quoteChar {
				inQuote = false
				quoteChar = 0
			}
			current.WriteRune(ch)

		case ch == ';' && !inQuote:
			pair := strings.TrimSpace(current.String())
			if pair != "" {
				pairs = append(pairs, pair)
			}
			current.Reset()

		default:
			current.WriteRune(ch)
		}
	}

	// Add final pair
	pair := strings.TrimSpace(current.String())
	if pair != "" {
		pairs = append(pairs, pair)
	}

	return pairs
}

// parseTerseKeyValue parses a single key=value pair.
func parseTerseKeyValue(pair string) (key, value string, ok bool) {
	idx := strings.Index(pair, "=")
	if idx <= 0 {
		return "", "", false
	}

	key = strings.TrimSpace(pair[:idx])
	value = strings.TrimSpace(pair[idx+1:])

	// Remove quotes from value
	if len(value) >= 2 {
		if (value[0] == '"' && value[len(value)-1] == '"') ||
			(value[0] == '\'' && value[len(value)-1] == '\'') {

			value = value[1 : len(value)-1]
		}
	}

	return key, value, true
}

// isTerseLine checks if a line looks like terse format.
func isTerseLine(line string) bool {
	// Must have at least one semicolon
	if !strings.Contains(line, ";") {
		// Single key=value line is also valid terse
		if strings.Contains(line, "=") && !strings.Contains(line, " ") {
			return true
		}
		return false
	}

	// Count key=value pairs separated by semicolons
	pairs := strings.Split(line, ";")
	validPairs := 0

	for _, pair := range pairs {
		pair = strings.TrimSpace(pair)
		if strings.Contains(pair, "=") {
			validPairs++
		}
	}

	// Need at least 2 key=value pairs for it to be terse format
	return validPairs >= 2
}

// Compile-time verification.
var _ ParserStrategy = (*terseParser)(nil)
