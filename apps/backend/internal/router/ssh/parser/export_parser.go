package parser

import (
	"context"
	"regexp"
	"strings"
)

// exportParser parses RSC script format output from /export commands.
//
// Example export format:
//
//	# jan/15/2024 10:30:00 by RouterOS 7.13.2
//	# software id = XXXX-XXXX
//	#
//	/interface wireguard
//	add listen-port=51820 mtu=1420 name=vpn-usa
//	add listen-port=51821 mtu=1420 name=vpn-eu
type exportParser struct {
	normalizer *Normalizer
}

// NewExportParser creates a new export format parser.
func NewExportParser(normalizer *Normalizer) ParserStrategy {
	return &exportParser{normalizer: normalizer}
}

// Name returns the strategy name.
func (p *exportParser) Name() string {
	return "export"
}

// Priority returns the strategy priority.
func (p *exportParser) Priority() int {
	return 4 // After detail parser
}

// CanParse returns true if this looks like export/RSC format.
func (p *exportParser) CanParse(raw string, hints ParseHints) bool {
	// Export command hint is strongest indicator
	if hints.CommandType == CommandExport || hints.CommandType == CommandExportVerbose {
		return true
	}

	lines := strings.Split(raw, "\n")

	// Look for export format indicators:
	// 1. Comment lines starting with #
	// 2. Path lines starting with /
	// 3. Command lines (add, set, remove)

	hasHeader := false
	hasPath := false
	hasCommand := false

	for i, line := range lines {
		if i > 20 {
			break
		}

		trimmed := strings.TrimSpace(line)

		// Export header comment
		if strings.HasPrefix(trimmed, "#") {
			if exportHeaderPattern.MatchString(trimmed) {
				hasHeader = true
			}
			continue
		}

		// Path line
		if strings.HasPrefix(trimmed, "/") && !strings.Contains(trimmed, "=") {
			hasPath = true
			continue
		}

		// Command line
		if isExportCommand(trimmed) {
			hasCommand = true
		}
	}

	// Need at least path + command, or header + command
	return (hasPath && hasCommand) || (hasHeader && hasCommand)
}

// Parse parses export format output.
func (p *exportParser) Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error) {
	lines := strings.Split(raw, "\n")

	result := &ParseResult{
		Resources: []Resource{},
		Metadata: ParseMetadata{
			Format: FormatExport,
		},
	}

	// Extract sections and commands
	sections := p.parseSections(lines)

	// Convert export commands to resources
	for _, section := range sections {
		for _, cmd := range section.Commands {
			resource := p.commandToResource(section.Path, cmd)
			if len(resource) > 0 {
				result.Resources = append(result.Resources, p.normalizer.NormalizeResource(resource))
			}
		}
	}

	result.Metadata.RowCount = len(result.Resources)

	// Extract version from header if present
	for _, line := range lines[:min(10, len(lines))] {
		if version := extractExportVersion(line); version != "" {
			result.Metadata.RouterOSVersion = version
			break
		}
	}

	return result, nil
}

// parseSections parses the export into path sections.
func (p *exportParser) parseSections(lines []string) []ExportSection {
	var sections []ExportSection
	var currentSection *ExportSection
	var currentCommand strings.Builder
	var commandStartLine int

	for lineNum, line := range lines {
		// Skip empty lines and comments (except for inline comments)
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		if strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Check for path line
		if strings.HasPrefix(trimmed, "/") && !strings.Contains(trimmed, "=") {
			// Save current section
			if currentSection != nil {
				sections = append(sections, *currentSection)
			}

			// Start new section
			currentSection = &ExportSection{
				Path:     trimmed,
				Commands: []ExportCommand{},
			}
			continue
		}

		// Handle line continuation
		if strings.HasSuffix(trimmed, "\\") {
			if currentCommand.Len() == 0 {
				commandStartLine = lineNum + 1
			}
			currentCommand.WriteString(strings.TrimSuffix(trimmed, "\\"))
			currentCommand.WriteString(" ")
			continue
		}

		// Complete command line
		var fullCommand string
		if currentCommand.Len() > 0 {
			currentCommand.WriteString(trimmed)
			fullCommand = currentCommand.String()
			currentCommand.Reset()
		} else {
			fullCommand = trimmed
			commandStartLine = lineNum + 1
		}

		// Parse the command
		if isExportCommand(fullCommand) && currentSection != nil {
			cmd := p.parseExportCommand(fullCommand, commandStartLine)
			currentSection.Commands = append(currentSection.Commands, cmd)
		} else if isExportCommand(fullCommand) {
			// Command without explicit section (uses last path or implied)
			if currentSection == nil {
				currentSection = &ExportSection{
					Path:     "/",
					Commands: []ExportCommand{},
				}
			}
			cmd := p.parseExportCommand(fullCommand, commandStartLine)
			currentSection.Commands = append(currentSection.Commands, cmd)
		}
	}

	// Save final section
	if currentSection != nil {
		sections = append(sections, *currentSection)
	}

	return sections
}

// parseExportCommand parses a single export command line.
func (p *exportParser) parseExportCommand(line string, lineNum int) ExportCommand {
	cmd := ExportCommand{
		LineNumber: lineNum,
		Properties: make(map[string]string),
	}

	// Extract inline comment
	commentIdx := strings.LastIndex(line, " #")
	if commentIdx > 0 {
		cmd.Comment = strings.TrimSpace(line[commentIdx+2:])
		line = strings.TrimSpace(line[:commentIdx])
	}

	// Extract action (first word)
	parts := strings.SplitN(line, " ", 2)
	cmd.Action = parts[0]

	if len(parts) < 2 {
		return cmd
	}

	// Parse properties
	propsStr := parts[1]
	cmd.Properties = p.parseExportProperties(propsStr)

	return cmd
}

// parseExportProperties parses key=value properties from an export command.
func (p *exportParser) parseExportProperties(propsStr string) map[string]string {
	props := make(map[string]string)

	// State machine for parsing
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
				props[k] = v
			}
		}
		key.Reset()
		value.Reset()
		inKey = true
		inValue = false
	}

	for _, ch := range propsStr {
		switch {
		case ch == '"':
			if !inQuote {
				inQuote = true
				quoteChar = ch
			} else if ch == quoteChar {
				inQuote = false
				quoteChar = 0
			} else {
				if inValue {
					value.WriteRune(ch)
				}
			}

		case ch == '=' && !inQuote:
			if inKey {
				inKey = false
				inValue = true
			} else {
				value.WriteRune(ch)
			}

		case ch == ' ' && !inQuote:
			if inValue && value.Len() > 0 {
				flush()
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

	flush()

	return props
}

// commandToResource converts an export command to a resource.
func (p *exportParser) commandToResource(path string, cmd ExportCommand) map[string]any {
	resource := make(map[string]any)

	// Add path information
	resource["_path"] = path
	resource["_action"] = cmd.Action

	// Add all properties
	for k, v := range cmd.Properties {
		resource[k] = v
	}

	// Add comment if present
	if cmd.Comment != "" {
		resource["_comment"] = cmd.Comment
	}

	return resource
}

// isExportCommand checks if a line is an export command (add, set, remove, etc.).
func isExportCommand(line string) bool {
	line = strings.TrimSpace(line)
	if len(line) == 0 {
		return false
	}

	// Get first word
	parts := strings.SplitN(line, " ", 2)
	action := parts[0]

	return exportCommands[action]
}

// exportCommands are valid export command actions.
var exportCommands = map[string]bool{
	"add":     true,
	"set":     true,
	"remove":  true,
	"enable":  true,
	"disable": true,
	"move":    true,
	"comment": true,
}

// exportHeaderPattern matches export header lines.
var exportHeaderPattern = regexp.MustCompile(`^#\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/\d+/\d+|^#\s*software id|^#\s*model|^#\s*RouterOS`)

// extractExportVersion extracts the RouterOS version from an export header.
func extractExportVersion(line string) string {
	// Pattern: "# jan/15/2024 10:30:00 by RouterOS 7.13.2"
	line = strings.TrimSpace(line)
	if !strings.HasPrefix(line, "#") {
		return ""
	}

	versionPattern := regexp.MustCompile(`RouterOS\s+(\d+\.\d+(?:\.\d+)?)`)
	matches := versionPattern.FindStringSubmatch(line)
	if len(matches) >= 2 {
		return matches[1]
	}

	return ""
}

// min returns the smaller of two integers.
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Compile-time verification.
var _ ParserStrategy = (*exportParser)(nil)
