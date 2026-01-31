package formatters

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"backend/internal/translator"
)

// SSHFormatter formats commands for RouterOS CLI over SSH.
//
// CLI format examples:
//   - /interface ethernet print
//   - /interface ethernet set [find name=ether1] disabled=no
//   - /interface bridge add name=bridge1 protocol-mode=stp
//   - /interface bridge remove [find name=bridge1]
//
// The Format method returns CLI script text.
type SSHFormatter struct{}

// NewSSHFormatter creates a new SSH CLI formatter.
func NewSSHFormatter() *SSHFormatter {
	return &SSHFormatter{}
}

// Protocol returns the SSH protocol type.
func (f *SSHFormatter) Protocol() translator.Protocol {
	return translator.ProtocolSSH
}

// SSHCommand represents a formatted SSH command.
type SSHCommand struct {
	Script string `json:"script"` // The CLI script to execute
}

// Format converts a canonical command to SSH CLI format.
func (f *SSHFormatter) Format(cmd *translator.CanonicalCommand) ([]byte, error) {
	if cmd == nil {
		return nil, fmt.Errorf("nil command")
	}

	script := f.buildScript(cmd)

	sshCmd := SSHCommand{
		Script: script,
	}

	return json.Marshal(sshCmd)
}

// buildScript creates a CLI script from the canonical command.
func (f *SSHFormatter) buildScript(cmd *translator.CanonicalCommand) string {
	var parts []string

	// Start with path (convert slashes to spaces for CLI, keeping leading slash)
	path := cmd.Path
	if strings.HasPrefix(path, "/") {
		// CLI uses paths like "/interface ethernet" not "/interface/ethernet"
		path = "/" + strings.ReplaceAll(path[1:], "/", " ")
	}
	parts = append(parts, path)

	// Add action verb
	parts = append(parts, f.actionToVerb(cmd.Action))

	// Add target specifier (ID or find query)
	if cmd.ID != "" {
		// Use [find] syntax to locate by ID
		parts = append(parts, fmt.Sprintf("[find .id=%s]", f.escapeValue(cmd.ID)))
	} else if len(cmd.Filters) > 0 && (cmd.Action == translator.ActionSet ||
		cmd.Action == translator.ActionRemove ||
		cmd.Action == translator.ActionEnable ||
		cmd.Action == translator.ActionDisable) {
		// Use [find] for set/remove operations with filters
		parts = append(parts, f.buildFindQuery(cmd.Filters))
	}

	// Add parameters for add/set
	if cmd.Action == translator.ActionAdd || cmd.Action == translator.ActionSet {
		for key, value := range cmd.Parameters {
			parts = append(parts, fmt.Sprintf("%s=%s", key, f.escapeValue(value)))
		}
	}

	// Add enable/disable parameter
	if cmd.Action == translator.ActionEnable {
		parts = append(parts, "disabled=no")
	} else if cmd.Action == translator.ActionDisable {
		parts = append(parts, "disabled=yes")
	}

	// Add filters for print operations (as where clause)
	if cmd.Action == translator.ActionPrint && len(cmd.Filters) > 0 {
		parts = append(parts, "where")
		for _, filter := range cmd.Filters {
			parts = append(parts, f.formatFilterForPrint(filter))
		}
	}

	return strings.Join(parts, " ")
}

// actionToVerb converts a canonical action to CLI verb.
func (f *SSHFormatter) actionToVerb(action translator.Action) string {
	switch action {
	case translator.ActionPrint:
		return "print"
	case translator.ActionGet:
		return "print" // Get is print with ID filter
	case translator.ActionAdd:
		return "add"
	case translator.ActionSet:
		return "set"
	case translator.ActionRemove:
		return "remove"
	case translator.ActionEnable:
		return "enable"
	case translator.ActionDisable:
		return "disable"
	case translator.ActionMove:
		return "move"
	default:
		return string(action)
	}
}

// buildFindQuery creates a [find ...] query from filters.
func (f *SSHFormatter) buildFindQuery(filters []translator.Filter) string {
	if len(filters) == 0 {
		return ""
	}

	var conditions []string
	for _, filter := range filters {
		conditions = append(conditions, fmt.Sprintf("%s%s%s",
			filter.Field, filter.Operator, f.escapeValue(filter.Value)))
	}

	return "[find " + strings.Join(conditions, " ") + "]"
}

// formatFilterForPrint formats a filter for the print where clause.
func (f *SSHFormatter) formatFilterForPrint(filter translator.Filter) string {
	return fmt.Sprintf("%s%s%s", filter.Field, filter.Operator, f.escapeValue(filter.Value))
}

// escapeValue escapes a value for safe use in CLI commands.
func (f *SSHFormatter) escapeValue(v interface{}) string {
	var strVal string

	switch val := v.(type) {
	case bool:
		if val {
			return "yes"
		}
		return "no"
	case []string:
		strVal = strings.Join(val, ",")
	case string:
		strVal = val
	default:
		strVal = fmt.Sprintf("%v", v)
	}

	// Check if quoting is needed
	needsQuoting := strings.ContainsAny(strVal, " \t\n\"'\\;")

	if needsQuoting {
		// Escape quotes and backslashes, then wrap in quotes
		strVal = strings.ReplaceAll(strVal, "\\", "\\\\")
		strVal = strings.ReplaceAll(strVal, "\"", "\\\"")
		return "\"" + strVal + "\""
	}

	return strVal
}

// Parse converts SSH CLI response to canonical format.
// SSH responses are typically tabular text output or error messages.
func (f *SSHFormatter) Parse(response []byte) (*translator.CanonicalResponse, error) {
	if len(response) == 0 {
		return translator.NewSuccessResponse(nil), nil
	}

	text := string(response)

	// Check for error patterns
	if f.isErrorResponse(text) {
		return &translator.CanonicalResponse{
			Success: false,
			Error:   f.parseError(text),
			Metadata: translator.ResponseMetadata{
				Protocol: translator.ProtocolSSH,
			},
		}, nil
	}

	// Try to parse as table output
	records, err := f.parseTableOutput(text)
	if err == nil && len(records) > 0 {
		return &translator.CanonicalResponse{
			Success: true,
			Data:    records,
			Metadata: translator.ResponseMetadata{
				Protocol:    translator.ProtocolSSH,
				RecordCount: len(records),
			},
		}, nil
	}

	// Check for ID return (add operation)
	if id := f.extractReturnID(text); id != "" {
		return &translator.CanonicalResponse{
			Success: true,
			ID:      id,
			Metadata: translator.ResponseMetadata{
				Protocol: translator.ProtocolSSH,
			},
		}, nil
	}

	// Return raw text for unstructured output
	return &translator.CanonicalResponse{
		Success: true,
		Data:    text,
		Metadata: translator.ResponseMetadata{
			Protocol: translator.ProtocolSSH,
		},
	}, nil
}

// isErrorResponse checks if the response indicates an error.
func (f *SSHFormatter) isErrorResponse(text string) bool {
	errorPatterns := []string{
		"bad command name",
		"expected end of command",
		"syntax error",
		"no such item",
		"failure:",
		"input does not match any value",
		"invalid value",
		"already have",
	}

	lower := strings.ToLower(text)
	for _, pattern := range errorPatterns {
		if strings.Contains(lower, pattern) {
			return true
		}
	}

	return false
}

// parseError extracts error information from response text.
func (f *SSHFormatter) parseError(text string) *translator.CommandError {
	lower := strings.ToLower(text)

	var category translator.ErrorCategory
	var code string

	switch {
	case strings.Contains(lower, "no such item"):
		category = translator.ErrorCategoryNotFound
		code = "NOT_FOUND"
	case strings.Contains(lower, "already have"):
		category = translator.ErrorCategoryConflict
		code = "DUPLICATE"
	case strings.Contains(lower, "invalid value"), strings.Contains(lower, "syntax error"):
		category = translator.ErrorCategoryValidation
		code = "VALIDATION_ERROR"
	case strings.Contains(lower, "bad command"):
		category = translator.ErrorCategoryUnsupported
		code = "BAD_COMMAND"
	default:
		category = translator.ErrorCategoryInternal
		code = "CLI_ERROR"
	}

	// Extract the actual error message (first non-empty line)
	lines := strings.Split(text, "\n")
	message := text
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			message = line
			break
		}
	}

	return &translator.CommandError{
		Code:     code,
		Message:  message,
		Category: category,
	}
}

// parseTableOutput parses RouterOS tabular output.
// MikroTik table format:
//
//	Flags: X - disabled; R - running
//	0 X  ether1       ether  1500  00:11:22:33:44:55
//	1 R  ether2       ether  1500  00:11:22:33:44:56
func (f *SSHFormatter) parseTableOutput(text string) ([]map[string]interface{}, error) {
	lines := strings.Split(text, "\n")
	var records []map[string]interface{}

	// Look for structured output patterns
	// Pattern 1: Numbered list (0, 1, 2, ...)
	numberedPattern := regexp.MustCompile(`^\s*(\d+)\s+`)

	// Pattern 2: Key-value pairs (name: value or name=value)
	kvPattern := regexp.MustCompile(`^\s*([a-zA-Z-]+)\s*[=:]\s*(.*)$`)

	var currentRecord map[string]interface{}

	for _, line := range lines {
		line = strings.TrimRight(line, "\r")

		// Skip empty lines and header lines
		if strings.TrimSpace(line) == "" {
			continue
		}
		if strings.HasPrefix(line, "Flags:") || strings.HasPrefix(line, "#") {
			continue
		}

		// Try numbered list pattern
		if matches := numberedPattern.FindStringSubmatch(line); matches != nil {
			// This is a new record in table format
			if currentRecord != nil {
				records = append(records, currentRecord)
			}
			currentRecord = make(map[string]interface{})
			currentRecord["_index"] = matches[1]
			// Parse flags if present (X, R, etc.)
			remaining := strings.TrimPrefix(line, matches[0])
			f.parseTableRow(currentRecord, remaining)
			continue
		}

		// Try key-value pattern
		if matches := kvPattern.FindStringSubmatch(line); matches != nil {
			if currentRecord == nil {
				currentRecord = make(map[string]interface{})
			}
			currentRecord[matches[1]] = strings.TrimSpace(matches[2])
			continue
		}

		// If we have indented content, it might be continuation of previous record
		if currentRecord != nil && strings.HasPrefix(line, " ") {
			// Try to parse as additional key-value
			if matches := kvPattern.FindStringSubmatch(strings.TrimSpace(line)); matches != nil {
				currentRecord[matches[1]] = strings.TrimSpace(matches[2])
			}
		}
	}

	// Don't forget the last record
	if currentRecord != nil {
		records = append(records, currentRecord)
	}

	return records, nil
}

// parseTableRow parses a single row of table output.
func (f *SSHFormatter) parseTableRow(record map[string]interface{}, line string) {
	// Parse flags at the beginning (X, R, D, etc.)
	flagPattern := regexp.MustCompile(`^([XRDI]+)\s+`)
	if matches := flagPattern.FindStringSubmatch(line); matches != nil {
		flags := matches[1]
		record["_flags"] = flags
		record["disabled"] = strings.Contains(flags, "X")
		record["running"] = strings.Contains(flags, "R")
		record["dynamic"] = strings.Contains(flags, "D")
		record["invalid"] = strings.Contains(flags, "I")
		line = strings.TrimPrefix(line, matches[0])
	}

	// Split remaining by whitespace
	fields := strings.Fields(line)
	if len(fields) > 0 {
		record["name"] = fields[0]
	}
	if len(fields) > 1 {
		record["type"] = fields[1]
	}
}

// extractReturnID looks for an ID return value in the output.
func (f *SSHFormatter) extractReturnID(text string) string {
	// RouterOS returns the ID after add operations
	// Format: "*1" or "*A1B2C3"
	idPattern := regexp.MustCompile(`^\*[0-9A-Fa-f]+$`)

	lines := strings.Split(text, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if idPattern.MatchString(line) {
			return line
		}
	}

	return ""
}
