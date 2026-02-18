package parser

import (
	"context"
	"regexp"
	"strings"
	"unicode"
)

// tableParser parses fixed-width table output from /print commands.
//
// Example table format:
//
//	Flags: X - disabled, R - running
//	 #   NAME      LISTEN-PORT   MTU    RUNNING
//	 0 R vpn-usa   51820         1420   true
//	 1 R vpn-eu    51821         1420   true
type tableParser struct {
	normalizer *Normalizer
}

// NewTableParser creates a new table format parser.
func NewTableParser(normalizer *Normalizer) ParserStrategy {
	return &tableParser{normalizer: normalizer}
}

// Name returns the strategy name.
func (p *tableParser) Name() string {
	return "table"
}

// Priority returns the strategy priority.
func (p *tableParser) Priority() int {
	return 2 // Second priority after terse
}

// CanParse returns true if this looks like table format.
func (p *tableParser) CanParse(raw string, hints ParseHints) bool {
	lines := strings.Split(raw, "\n")
	if len(lines) < 2 {
		return false
	}

	// Look for indicators of table format
	for i, line := range lines {
		if i > 5 {
			break // Only check first few lines
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Flag line is a strong indicator
		if IsFlagDefinitionLine(line) {
			return true
		}

		// Header line with # and column names
		if strings.HasPrefix(line, "#") || strings.HasPrefix(line, " #") {
			return true
		}

		// Multiple uppercase words separated by spaces (column headers)
		if isColumnHeaderLine(line) {
			return true
		}
	}

	return false
}

// Parse parses table format output.
func (p *tableParser) Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error) {
	lines := strings.Split(raw, "\n")

	result := &ParseResult{
		Resources: []Resource{},
		Metadata: ParseMetadata{
			Format: FormatTable,
		},
	}

	// Find and parse the header line
	headerLineIdx, columns, flagLine := p.findHeader(lines)
	if headerLineIdx == -1 {
		return nil, NewMalformedTableError(0, "could not find header line")
	}

	// Parse flag definitions if present
	var flagDefs map[rune]string
	if flagLine != "" {
		flagDefs = parseFlagDefinitions(flagLine)
	}

	// Parse data rows
	for i := headerLineIdx + 1; i < len(lines); i++ {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		line := lines[i]
		if strings.TrimSpace(line) == "" {
			continue
		}

		// Skip flag definition lines that might appear in the middle
		if IsFlagDefinitionLine(line) {
			continue
		}

		resource, warning := p.parseDataRow(line, columns, flagDefs)
		if resource != nil {
			result.Resources = append(result.Resources, p.normalizer.NormalizeResource(resource))
		}
		if warning != nil {
			result.Warnings = append(result.Warnings, *warning)
		}
	}

	result.Metadata.RowCount = len(result.Resources)

	return result, nil
}

// findHeader locates the header line and extracts column information.
func (p *tableParser) findHeader(lines []string) (headerLineIdx int, columns []ColumnInfo, flagLine string) {
	headerLineIdx = -1

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Skip empty lines
		if trimmed == "" {
			continue
		}

		// Capture flag definition line
		if IsFlagDefinitionLine(trimmed) {
			flagLine = trimmed
			continue
		}

		// Look for header line (contains column names)
		if isColumnHeaderLine(trimmed) || strings.HasPrefix(trimmed, "#") {
			headerLineIdx = i
			columns = p.extractColumns(line)
			break
		}
	}

	return headerLineIdx, columns, flagLine
}

// extractColumns extracts column positions from a header line.
func (p *tableParser) extractColumns(header string) []ColumnInfo {
	// Find all column name positions
	re := regexp.MustCompile(`\S+`)
	matches := re.FindAllStringIndex(header, -1)

	columns := make([]ColumnInfo, 0, len(matches))

	for i, match := range matches {
		name := strings.TrimSpace(header[match[0]:match[1]])

		// Skip the # column
		if name == "#" {
			continue
		}

		// Calculate column end position
		end := len(header)
		if i+1 < len(matches) {
			end = matches[i+1][0]
		}

		columns = append(columns, ColumnInfo{
			Name:           name,
			Start:          match[0],
			End:            end,
			NormalizedName: p.normalizer.NormalizeFieldName(name),
		})
	}

	return columns
}

// parseDataRow parses a single data row using column positions.
func (p *tableParser) parseDataRow(line string, columns []ColumnInfo, _flagDefs map[rune]string) (map[string]any, *ParseWarning) {
	if line == "" {
		return nil, nil
	}

	resource := make(map[string]any)
	var warning *ParseWarning

	// Extract row number and flags from the beginning
	rowNum, flags, dataStart := p.extractRowPrefix(line)
	if rowNum != "" {
		resource[".id"] = "*" + rowNum
	}
	if flags.Raw != "" {
		ApplyFlagsToResource(resource, flags)
	}

	// Extract column values using fixed-width positions
	for _, col := range columns {
		// Adjust for the row prefix
		start := col.Start
		end := col.End

		// Guard against out of bounds
		if start >= len(line) {
			continue
		}
		if end > len(line) {
			end = len(line)
		}

		value := strings.TrimSpace(line[start:end])
		if value != "" {
			resource[col.Name] = value
		}
	}

	// If we couldn't extract any values using column positions,
	// try fallback whitespace-based parsing
	if len(resource) <= 2 { // Only .id and maybe flags
		fallbackResource := p.fallbackParse(line[dataStart:], columns)
		for k, v := range fallbackResource {
			resource[k] = v
		}
	}

	if len(resource) == 0 {
		warning = &ParseWarning{
			Line:    0, // Line number not tracked here
			Message: "could not extract any values from row",
			Code:    WarnMalformedLine,
		}
		return nil, warning
	}

	return resource, warning
}

// extractRowPrefix extracts the row number and flags from the beginning of a row.
func (p *tableParser) extractRowPrefix(line string) (rowNum string, flags TableFlags, dataStart int) {
	// Pattern: optional spaces, optional number, optional flags, more spaces
	// Examples: " 0 R ", "12 XD", " 5   ", "  ;;;"

	var numBuilder strings.Builder
	var flagBuilder strings.Builder
	inNumber := false
	inFlags := false
	i := 0

	for ; i < len(line); i++ {
		ch := line[i]

		if ch == ' ' {
			if inNumber {
				inNumber = false
				inFlags = true
			} else if inFlags && flagBuilder.Len() > 0 {
				// End of flags section
				break
			}
			continue
		}

		switch {
		case ch >= '0' && ch <= '9':
			if inFlags {
				// Number after flags means we're past the prefix
				break
			}
			inNumber = true
			numBuilder.WriteByte(ch)
		case isRowFlag(ch):
			inFlags = true
			flagBuilder.WriteByte(ch)
		default:
			// Non-flag, non-number character means data starts here
			break
		}
	}

	rowNum = numBuilder.String()
	flags = ParseFlags(flagBuilder.String())
	dataStart = i

	// Adjust dataStart to skip leading spaces in data section
	for dataStart < len(line) && line[dataStart] == ' ' {
		dataStart++
	}

	return rowNum, flags, dataStart
}

// fallbackParse tries to parse a row by splitting on whitespace.
func (p *tableParser) fallbackParse(line string, columns []ColumnInfo) map[string]any {
	resource := make(map[string]any)

	parts := strings.Fields(line)
	if len(parts) == 0 {
		return resource
	}

	// Assign values to columns in order
	for i, col := range columns {
		if i >= len(parts) {
			break
		}
		resource[col.Name] = parts[i]
	}

	return resource
}

// isColumnHeaderLine checks if a line looks like a column header.
func isColumnHeaderLine(line string) bool {
	// Must have at least 2 uppercase words
	words := strings.Fields(line)
	upperCount := 0

	for _, word := range words {
		// Skip the # symbol
		if word == "#" {
			continue
		}

		if isUpperCaseWord(word) {
			upperCount++
		}
	}

	return upperCount >= 2
}

// isUpperCaseWord checks if a word is mostly uppercase.
func isUpperCaseWord(word string) bool {
	if len(word) < 2 {
		return false
	}

	upperCount := 0
	letterCount := 0

	for _, r := range word {
		if unicode.IsLetter(r) {
			letterCount++
			if unicode.IsUpper(r) {
				upperCount++
			}
		}
	}

	if letterCount == 0 {
		return false
	}

	// At least 70% uppercase
	return float64(upperCount)/float64(letterCount) >= 0.7
}

// isRowFlag checks if a character is a valid row flag.
func isRowFlag(ch byte) bool {
	switch ch {
	case 'X', 'R', 'D', 'I', 'A', 'C', 'S', 'H', 'P', 'B', 'M', 'L', 'E':
		return true
	default:
		return false
	}
}

// parseFlagDefinitions parses "Flags: X - disabled, R - running" line.
func parseFlagDefinitions(line string) map[rune]string {
	defs := make(map[rune]string)

	// Remove "Flags:" prefix
	line = strings.TrimPrefix(line, "Flags:")
	line = strings.TrimSpace(line)

	// Split by comma
	parts := strings.Split(line, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		// Pattern: "X - disabled"
		if len(part) >= 5 && part[1] == ' ' && part[2] == '-' && part[3] == ' ' {
			flag := rune(part[0])
			meaning := strings.TrimSpace(part[4:])
			defs[flag] = meaning
		}
	}

	return defs
}

// Compile-time verification.
var _ ParserStrategy = (*tableParser)(nil)
