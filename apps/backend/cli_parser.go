package main

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// CLICommand represents a parsed RouterOS CLI command
type CLICommand struct {
	LineNumber  int               // Original line number in the source
	RawCommand  string            // Original command text
	Path        string            // API path, e.g., "/interface/bridge"
	Action      string            // Action: add, set, remove, print, etc.
	Properties  map[string]string // Key-value properties
	FindQuery   *FindQuery        // Optional find query for set/remove operations
	IsComplete  bool              // Whether command is fully parsed
	ParseError  string            // Any parsing error
}

// FindQuery represents a [ find ... ] query in RouterOS CLI
type FindQuery struct {
	Field string // Field to match, e.g., "default-name", "name", "interface"
	Value string // Value to match
}

// APICommand represents a command ready to execute via RouterOS API
type APICommand struct {
	Command string   // API command path, e.g., "/interface/bridge/add"
	Args    []string // Arguments in API format, e.g., "=name=bridge1"
}

// RollbackCommand represents a command that can undo a change
type RollbackCommand struct {
	OriginalCommand *CLICommand       // The original command that was executed
	UndoCommand     *APICommand       // Command to undo the change
	OriginalValues  map[string]string // Original values before modification
	CreatedID       string            // ID of created item (for add commands)
}

// CLIParser parses RouterOS CLI commands into API format
type CLIParser struct {
	currentPath string // Current context path for relative commands
}

// NewCLIParser creates a new CLI parser
func NewCLIParser() *CLIParser {
	return &CLIParser{}
}

// ParseScript parses a complete RouterOS script into commands
func (p *CLIParser) ParseScript(script string) ([]*CLICommand, error) {
	lines := strings.Split(script, "\n")
	var commands []*CLICommand
	var currentCommand strings.Builder
	var startLine int

	for i, line := range lines {
		lineNum := i + 1
		trimmed := strings.TrimSpace(line)

		// Skip empty lines and comments
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Handle line continuation with backslash
		if strings.HasSuffix(trimmed, "\\") {
			if currentCommand.Len() == 0 {
				startLine = lineNum
			}
			// Remove trailing backslash and add space
			currentCommand.WriteString(strings.TrimSuffix(trimmed, "\\"))
			currentCommand.WriteString(" ")
			continue
		}

		// Complete the command
		if currentCommand.Len() > 0 {
			currentCommand.WriteString(trimmed)
			cmd := p.ParseCommand(currentCommand.String(), startLine)
			commands = append(commands, cmd)
			currentCommand.Reset()
		} else {
			cmd := p.ParseCommand(trimmed, lineNum)
			commands = append(commands, cmd)
		}
	}

	// Handle any remaining command
	if currentCommand.Len() > 0 {
		cmd := p.ParseCommand(currentCommand.String(), startLine)
		commands = append(commands, cmd)
	}

	return commands, nil
}

// ParseCommand parses a single RouterOS CLI command
func (p *CLIParser) ParseCommand(cmdText string, lineNum int) *CLICommand {
	cmd := &CLICommand{
		LineNumber: lineNum,
		RawCommand: cmdText,
		Properties: make(map[string]string),
	}

	// Clean up the command text - remove extra spaces, backslash-space patterns
	cleaned := cleanCommandText(cmdText)

	// Handle special commands
	if strings.HasPrefix(cleaned, ":") {
		// Script commands like :delay, :log, :put
		cmd.Path = "script"
		cmd.Action = "execute"
		cmd.Properties["script"] = cleaned
		cmd.IsComplete = true
		return cmd
	}

	// Check if this is a path command
	if strings.HasPrefix(cleaned, "/") {
		// Full path command
		path, rest := extractPath(cleaned)
		p.currentPath = path
		cmd.Path = path

		if rest != "" {
			p.parseCommandBody(cmd, rest)
		} else {
			// Just a path change, mark as complete (context switch)
			cmd.Action = "context"
			cmd.IsComplete = true
		}
	} else {
		// Relative command using current context
		if p.currentPath == "" {
			cmd.ParseError = "no context path set"
			return cmd
		}
		cmd.Path = p.currentPath
		p.parseCommandBody(cmd, cleaned)
	}

	return cmd
}

// parseCommandBody parses the action and properties from command text
func (p *CLIParser) parseCommandBody(cmd *CLICommand, text string) {
	// Extract action (first word)
	parts := splitCommandParts(text)
	if len(parts) == 0 {
		cmd.ParseError = "empty command body"
		return
	}

	cmd.Action = parts[0]

	// Parse remaining parts
	for i := 1; i < len(parts); i++ {
		part := parts[i]

		// Handle [ find ... ] queries
		if part == "[" {
			query, endIdx := parseFindQuery(parts[i:])
			if query != nil {
				cmd.FindQuery = query
				i += endIdx
				continue
			}
		}

		// Handle key=value pairs
		if strings.Contains(part, "=") {
			key, value := parseKeyValue(part)
			if key != "" {
				cmd.Properties[key] = value
			}
		}
	}

	cmd.IsComplete = true
}

// ToAPICommand converts a parsed CLI command to API format
func (cmd *CLICommand) ToAPICommand() (*APICommand, error) {
	if !cmd.IsComplete {
		return nil, fmt.Errorf("incomplete command")
	}

	if cmd.ParseError != "" {
		return nil, fmt.Errorf("parse error: %s", cmd.ParseError)
	}

	// Handle script commands
	if cmd.Path == "script" {
		return &APICommand{
			Command: "/system/script/run",
			Args:    []string{fmt.Sprintf("=source=%s", cmd.Properties["script"])},
		}, nil
	}

	// Handle context switches (no actual command to execute)
	if cmd.Action == "context" {
		return nil, nil
	}

	// Build API command path
	apiPath := strings.ReplaceAll(cmd.Path, " ", "/")
	apiCmd := apiPath + "/" + cmd.Action

	var args []string

	// Add find query as .id if present
	if cmd.FindQuery != nil {
		// The find query will need to be resolved at execution time
		args = append(args, fmt.Sprintf("?%s=%s", cmd.FindQuery.Field, cmd.FindQuery.Value))
	}

	// Add properties
	for key, value := range cmd.Properties {
		args = append(args, fmt.Sprintf("=%s=%s", key, value))
	}

	return &APICommand{
		Command: apiCmd,
		Args:    args,
	}, nil
}

// cleanCommandText removes extra whitespace and backslash patterns
func cleanCommandText(text string) string {
	// Remove backslash followed by spaces (line continuation artifacts)
	re := regexp.MustCompile(`\\\s+`)
	text = re.ReplaceAllString(text, " ")

	// Remove multiple consecutive spaces
	re = regexp.MustCompile(`\s+`)
	text = re.ReplaceAllString(text, " ")

	return strings.TrimSpace(text)
}

// extractPath extracts the path from a command starting with /
func extractPath(text string) (path string, rest string) {
	// Find where the path ends (at first action word or property)
	var pathBuilder strings.Builder
	var i int

	for i = 0; i < len(text); i++ {
		ch := rune(text[i])

		if ch == ' ' {
			// Check if next part is a continuation of path or an action
			remaining := strings.TrimSpace(text[i:])
			if len(remaining) > 0 {
				firstWord := strings.Fields(remaining)[0]
				// Known actions that indicate end of path
				actions := map[string]bool{
					"add": true, "set": true, "remove": true, "print": true,
					"enable": true, "disable": true, "move": true, "comment": true,
					"export": true, "import": true, "reset": true, "find": true,
				}
				if actions[firstWord] || strings.Contains(firstWord, "=") || firstWord == "[" {
					break
				}
			}
		}

		pathBuilder.WriteRune(ch)
	}

	path = strings.TrimSpace(pathBuilder.String())
	if i < len(text) {
		rest = strings.TrimSpace(text[i:])
	}

	return path, rest
}

// splitCommandParts splits command text into parts, respecting quotes
func splitCommandParts(text string) []string {
	var parts []string
	var current strings.Builder
	inQuote := false
	quoteChar := rune(0)
	inBracket := 0

	for _, ch := range text {
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

		case ch == '[':
			inBracket++
			if current.Len() > 0 {
				parts = append(parts, current.String())
				current.Reset()
			}
			parts = append(parts, "[")

		case ch == ']':
			inBracket--
			if current.Len() > 0 {
				parts = append(parts, strings.TrimSpace(current.String()))
				current.Reset()
			}
			parts = append(parts, "]")

		case unicode.IsSpace(ch) && !inQuote:
			// Split on whitespace both inside and outside brackets
			if current.Len() > 0 {
				parts = append(parts, strings.TrimSpace(current.String()))
				current.Reset()
			}

		default:
			current.WriteRune(ch)
		}
	}

	if current.Len() > 0 {
		parts = append(parts, strings.TrimSpace(current.String()))
	}

	// Filter out empty strings
	var filtered []string
	for _, p := range parts {
		if p != "" {
			filtered = append(filtered, p)
		}
	}

	return filtered
}

// parseFindQuery parses a [ find ... ] query
func parseFindQuery(parts []string) (*FindQuery, int) {
	if len(parts) < 4 || parts[0] != "[" {
		return nil, 0
	}

	// Look for pattern: [ find field=value ]
	var query *FindQuery
	var endIdx int
	foundFind := false

	for i := 1; i < len(parts); i++ {
		if parts[i] == "]" {
			endIdx = i
			break
		}

		// Skip the "find" keyword
		if parts[i] == "find" {
			foundFind = true
			continue
		}

		// Parse field=value (only after seeing "find")
		if foundFind && strings.Contains(parts[i], "=") {
			key, value := parseKeyValue(parts[i])
			// Remove "find " prefix if it got concatenated
			key = strings.TrimPrefix(key, "find ")
			query = &FindQuery{
				Field: key,
				Value: value,
			}
		}
	}

	return query, endIdx
}

// parseKeyValue parses a key=value pair
func parseKeyValue(text string) (key, value string) {
	// Handle .property=value format
	text = strings.TrimPrefix(text, ".")

	idx := strings.Index(text, "=")
	if idx == -1 {
		return text, ""
	}

	key = strings.TrimSpace(text[:idx])
	value = strings.TrimSpace(text[idx+1:])

	// Remove quotes from value
	value = strings.Trim(value, `"'`)

	return key, value
}

// GenerateRollback generates a rollback command for a successful command
func GenerateRollback(cmd *CLICommand, createdID string, originalValues map[string]string) *RollbackCommand {
	rollback := &RollbackCommand{
		OriginalCommand: cmd,
		OriginalValues:  originalValues,
		CreatedID:       createdID,
	}

	switch cmd.Action {
	case "add":
		// Rollback for add is remove
		if createdID != "" {
			rollback.UndoCommand = &APICommand{
				Command: cmd.Path + "/remove",
				Args:    []string{fmt.Sprintf("=.id=%s", createdID)},
			}
		}

	case "set":
		// Rollback for set is set with original values
		if len(originalValues) > 0 {
			var args []string
			for k, v := range originalValues {
				args = append(args, fmt.Sprintf("=%s=%s", k, v))
			}
			rollback.UndoCommand = &APICommand{
				Command: cmd.Path + "/set",
				Args:    args,
			}
		}

	case "remove":
		// Rollback for remove is add with original values
		if len(originalValues) > 0 {
			var args []string
			for k, v := range originalValues {
				if k != ".id" { // Don't include .id in add
					args = append(args, fmt.Sprintf("=%s=%s", k, v))
				}
			}
			rollback.UndoCommand = &APICommand{
				Command: cmd.Path + "/add",
				Args:    args,
			}
		}

	case "enable":
		// Rollback for enable is disable
		rollback.UndoCommand = &APICommand{
			Command: cmd.Path + "/disable",
			Args:    []string{fmt.Sprintf("=.id=%s", createdID)},
		}

	case "disable":
		// Rollback for disable is enable
		rollback.UndoCommand = &APICommand{
			Command: cmd.Path + "/enable",
			Args:    []string{fmt.Sprintf("=.id=%s", createdID)},
		}
	}

	return rollback
}

// BatchParseResult holds the result of parsing a batch of commands
type BatchParseResult struct {
	Commands     []*CLICommand
	TotalLines   int
	ParsedCount  int
	SkippedCount int
	ErrorCount   int
	Errors       []ParseError
}

// ParseError represents a parsing error with context
type ParseError struct {
	LineNumber int
	RawCommand string
	Error      string
}

// ParseBatch parses a script and returns detailed results
func (p *CLIParser) ParseBatch(script string) *BatchParseResult {
	result := &BatchParseResult{}

	lines := strings.Split(script, "\n")
	result.TotalLines = len(lines)

	commands, _ := p.ParseScript(script)

	for _, cmd := range commands {
		if cmd.ParseError != "" {
			result.ErrorCount++
			result.Errors = append(result.Errors, ParseError{
				LineNumber: cmd.LineNumber,
				RawCommand: cmd.RawCommand,
				Error:      cmd.ParseError,
			})
		} else if cmd.Action == "context" {
			result.SkippedCount++
		} else {
			result.ParsedCount++
		}
	}

	result.Commands = commands
	return result
}

