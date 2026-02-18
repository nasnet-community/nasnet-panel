package parser

import (
	"context"
	"regexp"
	"strings"
)

// detailParser parses detail format output from /print detail commands.
//
// Example detail format:
//
//	0 R name="vpn-usa" listen-port=51820 mtu=1420 private-key="xxx"
//	    running=true disabled=false
//
//	1 R name="vpn-eu" listen-port=51821 mtu=1420 private-key="yyy"
//	    running=true disabled=false
type detailParser struct {
	normalizer *Normalizer
}

// NewDetailParser creates a new detail format parser.
func NewDetailParser(normalizer *Normalizer) ParserStrategy {
	return &detailParser{normalizer: normalizer}
}

// Name returns the strategy name.
func (p *detailParser) Name() string {
	return "detail"
}

// Priority returns the strategy priority.
func (p *detailParser) Priority() int {
	return 3 // After table parser
}

// CanParse returns true if this looks like detail format.
func (p *detailParser) CanParse(raw string, hints ParseHints) bool {
	// Detail format hint is strongest indicator
	if hints.CommandType == CommandPrintDetail {
		return true
	}

	lines := strings.Split(raw, "\n")

	// Look for detail format indicators:
	// 1. Lines starting with number and flags (like table but followed by key=value)
	// 2. Continuation lines with indentation and key=value pairs
	// 3. No column header line

	hasRowWithKeyValue := false
	hasContinuationLine := false

	for i, line := range lines {
		if i > 15 {
			break
		}

		// Skip empty lines and flag definitions
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || IsFlagDefinitionLine(trimmed) {
			continue
		}

		// Check for row start (number + flags + key=value)
		if isDetailRowStart(line) {
			hasRowWithKeyValue = true
		}

		// Check for continuation line (starts with spaces + key=value)
		if isContinuationLine(line) {
			hasContinuationLine = true
		}
	}

	return hasRowWithKeyValue && hasContinuationLine
}

// Parse parses detail format output.
//
//nolint:gocyclo // parser complexity inherent to parsing logic
func (p *detailParser) Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error) {
	lines := strings.Split(raw, "\n")

	result := &ParseResult{
		Resources: []Resource{},
		Metadata: ParseMetadata{
			Format: FormatDetail,
		},
	}

	var currentResource map[string]any
	var currentRowNum string
	var currentFlags TableFlags

	for lineNum, line := range lines {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		// Skip flag definition lines
		if IsFlagDefinitionLine(strings.TrimSpace(line)) {
			continue
		}

		// Check if this is a new row start
		if rowNum, flags, keyValues, isStart := p.parseRowStart(line); isStart {
			// Save previous resource if any
			if len(currentResource) > 0 {
				result.Resources = append(result.Resources, p.normalizer.NormalizeResource(currentResource))
			}

			// Start new resource
			currentResource = make(map[string]any)
			currentRowNum = rowNum
			currentFlags = flags

			if currentRowNum != "" {
				currentResource[".id"] = "*" + currentRowNum
			}
			ApplyFlagsToResource(currentResource, currentFlags)

			// Add key-value pairs from this line
			for k, v := range keyValues {
				currentResource[k] = v
			}
			continue
		}

		// Check if this is a continuation line
		if isContinuationLine(line) && currentResource != nil {
			keyValues := p.parseKeyValuePairs(strings.TrimSpace(line))
			for k, v := range keyValues {
				currentResource[k] = v
			}
			continue
		}

		// Handle lines that might be single items (for single-item queries)
		if currentResource == nil && strings.Contains(line, "=") {
			currentResource = make(map[string]any)
			keyValues := p.parseKeyValuePairs(strings.TrimSpace(line))
			for k, v := range keyValues {
				currentResource[k] = v
			}
		}

		// Add warning for unparseable lines
		trimmed := strings.TrimSpace(line)
		if trimmed != "" && currentResource == nil {
			result.Warnings = append(result.Warnings, ParseWarning{
				Line:    lineNum + 1,
				Message: "could not parse line",
				Code:    WarnMalformedLine,
			})
		}
	}

	// Save last resource
	if len(currentResource) > 0 {
		result.Resources = append(result.Resources, p.normalizer.NormalizeResource(currentResource))
	}

	result.Metadata.RowCount = len(result.Resources)

	return result, nil
}

// parseRowStart checks if a line is the start of a new detail row.
// Returns row number, flags, key-value pairs, and whether it's a row start.
func (p *detailParser) parseRowStart(line string) (rowNum string, flags TableFlags, keyValues map[string]any, isStart bool) {
	// Detail rows typically start with optional space, number, optional flags
	// Pattern: " 0 R name=value ..." or "12 XD name=value ..."
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return "", TableFlags{}, nil, false
	}

	// Must start with a digit or be indented less than 3 spaces for row start
	if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") {
		// Line not indented - could be a row start if has key=value
		// But detail format usually has indentation
		return "", TableFlags{}, nil, false
	}

	// Count leading spaces (indentation)
	leadingSpaces := 0
	for _, ch := range line {
		switch {
		case ch == ' ':
			leadingSpaces++
		case ch == '\t':
			leadingSpaces += 4
		default:
			break
		}
	}

	// Row start has minimal indentation (0-4 spaces typically)
	if leadingSpaces > 5 {
		return "", TableFlags{}, nil, false
	}

	// Parse the prefix to extract number and flags
	rowNum, flags, dataStart := extractRowPrefix(trimmed)

	// Must have key=value pairs after the prefix
	if dataStart >= len(trimmed) {
		return "", TableFlags{}, nil, false
	}

	data := trimmed[dataStart:]
	if !strings.Contains(data, "=") {
		return "", TableFlags{}, nil, false
	}

	keyValues = p.parseKeyValuePairs(data)
	if len(keyValues) == 0 {
		return "", TableFlags{}, nil, false
	}

	return rowNum, flags, keyValues, true
}

// parseKeyValuePairs parses key=value pairs from a line.
func (p *detailParser) parseKeyValuePairs(line string) map[string]any { //nolint:gocyclo // key-value parser inherently complex
	result := make(map[string]any)

	// Use a state machine to handle quoted values
	var key strings.Builder
	var value strings.Builder
	inKey := true
	inValue := false
	inQuote := false
	quoteChar := rune(0)

	flush := func() {
		if key.Len() > 0 {
			k := strings.TrimSpace(key.String())
			v := strings.TrimSpace(value.String())
			if k != "" {
				result[k] = v
			}
		}
		key.Reset()
		value.Reset()
		inKey = true
		inValue = false
	}

	for _, ch := range line {
		switch {
		case ch == '"' || ch == '\'':
			if !inQuote { //nolint:gocritic // if-else chain needed for quote handling
				inQuote = true
				quoteChar = ch
			} else if ch == quoteChar {
				inQuote = false
				quoteChar = 0
			} else if inValue {
				value.WriteRune(ch)
			}

		case ch == '=' && !inQuote:
			if inKey {
				inKey = false
				inValue = true
			} else {
				// = inside value
				value.WriteRune(ch)
			}

		case ch == ' ' && !inQuote:
			if inValue {
				// Space ends unquoted value
				flush()
			} else if inKey && key.Len() > 0 {
				// Space in key area with content - shouldn't happen
				// but treat as start of value
				inKey = false
				inValue = true
			}
			// Skip leading spaces

		default:
			if inKey {
				key.WriteRune(ch)
			} else if inValue {
				value.WriteRune(ch)
			}
		}
	}

	// Flush final pair
	flush()

	return result
}

// extractRowPrefix extracts the row number and flags from the beginning of a row.
func extractRowPrefix(line string) (rowNum string, flags TableFlags, dataStart int) {
	var numBuilder strings.Builder
	var flagBuilder strings.Builder
	inNumber := false
	inFlags := false
	i := 0

	for ; i < len(line); i++ {
		ch := line[i]

		if ch == ' ' || ch == '\t' {
			if inNumber {
				inNumber = false
				inFlags = true
			} else if inFlags && flagBuilder.Len() > 0 {
				break
			}
			continue
		}

		switch {
		case ch >= '0' && ch <= '9':
			if inFlags {
				break
			}
			inNumber = true
			numBuilder.WriteByte(ch)
		case isRowFlag(ch):
			inFlags = true
			flagBuilder.WriteByte(ch)
		default:
			break
		}
	}

	rowNum = numBuilder.String()
	flags = ParseFlags(flagBuilder.String())

	// Skip spaces before data
	for i < len(line) && (line[i] == ' ' || line[i] == '\t') {
		i++
	}
	dataStart = i

	return rowNum, flags, dataStart
}

// isDetailRowStart checks if a line is the start of a detail row.
func isDetailRowStart(line string) bool {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return false
	}

	// Must start with a digit
	if trimmed[0] < '0' || trimmed[0] > '9' {
		return false
	}

	// Must have key=value pair with quoted or unquoted value
	return detailRowPattern.MatchString(trimmed)
}

// isContinuationLine checks if a line is a continuation of a detail row.
func isContinuationLine(line string) bool {
	if line == "" {
		return false
	}

	// Count leading spaces
	leadingSpaces := 0
	for _, ch := range line {
		switch {
		case ch == ' ':
			leadingSpaces++
		case ch == '\t':
			leadingSpaces += 4
		default:
			break
		}
	}

	// Continuation lines have significant indentation (more than row start)
	if leadingSpaces < 4 {
		return false
	}

	// Must have key=value
	trimmed := strings.TrimSpace(line)
	return strings.Contains(trimmed, "=")
}

// detailRowPattern matches detail row starts: "0 R name=value" or "12 name=value".
var detailRowPattern = regexp.MustCompile(`^\d+\s*[A-Z]*\s+\w+=`)

// Compile-time verification.
var _ ParserStrategy = (*detailParser)(nil)
