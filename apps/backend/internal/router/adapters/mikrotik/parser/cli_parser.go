package parser

import (
	"errors"
	"fmt"
	"strings"
)

const contextKey = "context"

// ErrContextNotSupported is returned when a context action is encountered.
var ErrContextNotSupported = errors.New("context action is not supported")

// CLICommand represents a parsed RouterOS CLI command.
type CLICommand struct {
	LineNumber int               // Original line number in the source
	RawCommand string            // Original command text
	Path       string            // API path, e.g., "/interface/bridge"
	Action     string            // Action: add, set, remove, print, etc.
	Properties map[string]string // Key-value properties
	FindQuery  *FindQuery        // Optional find query for set/remove operations
	IsComplete bool              // Whether command is fully parsed
	ParseError string            // Any parsing error
}

// FindQuery represents a [ find ... ] query in RouterOS CLI.
type FindQuery struct {
	Field string
	Value string
}

// APICommand represents a command ready to execute via RouterOS API.
type APICommand struct {
	Command string   // API command path, e.g., "/interface/bridge/add"
	Args    []string // Arguments in API format, e.g., "=name=bridge1"
}

// RollbackCommand represents a command that can undo a change.
type RollbackCommand struct {
	OriginalCommand *CLICommand
	UndoCommand     *APICommand
	OriginalValues  map[string]string
	CreatedID       string
}

// CLIParser parses RouterOS CLI commands into API format.
type CLIParser struct {
	currentPath string
}

// NewCLIParser creates a new CLI parser.
func NewCLIParser() *CLIParser {
	return &CLIParser{}
}

// ParseScript parses a complete RouterOS script into commands. //nolint:nestif
func (p *CLIParser) ParseScript(script string) ([]*CLICommand, error) {
	lines := strings.Split(script, "\n")
	var commands []*CLICommand
	var currentCommand strings.Builder
	var startLine int

	for i, line := range lines {
		lineNum := i + 1
		trimmed := strings.TrimSpace(line)

		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		if strings.HasSuffix(trimmed, "\\") {
			if currentCommand.Len() == 0 {
				startLine = lineNum
			}

			currentCommand.WriteString(strings.TrimSuffix(trimmed, "\\"))
			currentCommand.WriteString(" ")
			continue
		}

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

	if currentCommand.Len() > 0 {
		cmd := p.ParseCommand(currentCommand.String(), startLine)
		commands = append(commands, cmd)
	}

	return commands, nil
}

// ParseCommand parses a single RouterOS CLI command.
func (p *CLIParser) ParseCommand(cmdText string, lineNum int) *CLICommand {
	cmd := &CLICommand{
		LineNumber: lineNum,
		RawCommand: cmdText,
		Properties: make(map[string]string),
	}

	cleaned := CleanCommandText(cmdText)

	if strings.HasPrefix(cleaned, ":") {
		cmd.Path = "script"
		cmd.Action = "execute"
		cmd.Properties["script"] = cleaned
		cmd.IsComplete = true
		return cmd
	}

	if strings.HasPrefix(cleaned, "/") { //nolint:nestif // CLI command parsing
		path, rest := ExtractPath(cleaned)
		p.currentPath = path
		cmd.Path = path

		if rest != "" {
			p.parseCommandBody(cmd, rest)
		} else {
			cmd.Action = contextKey
			cmd.IsComplete = true
		}
	} else {
		if p.currentPath == "" {
			cmd.ParseError = "no context path set"
			return cmd
		}

		cmd.Path = p.currentPath
		p.parseCommandBody(cmd, cleaned)
	}

	return cmd
}

// parseCommandBody parses the action and properties from command text.
func (p *CLIParser) parseCommandBody(cmd *CLICommand, text string) {
	parts := SplitCommandParts(text)
	if len(parts) == 0 {
		cmd.ParseError = "empty command body"
		return
	}

	cmd.Action = parts[0]

	for i := 1; i < len(parts); i++ {
		part := parts[i]

		if part == "[" {
			query, endIdx := ParseFindQuery(parts[i:])
			if query != nil {
				cmd.FindQuery = query
				i += endIdx
				continue
			}
		}

		if strings.Contains(part, "=") {
			key, value := ParseKeyValue(part)
			if key != "" {
				cmd.Properties[key] = value
			}
		}
	}

	cmd.IsComplete = true
}

// ToAPICommand converts a parsed CLI command to API format.
func (cmd *CLICommand) ToAPICommand() (*APICommand, error) {
	if !cmd.IsComplete {
		return nil, fmt.Errorf("incomplete command")
	}

	if cmd.ParseError != "" {
		return nil, fmt.Errorf("parse error: %s", cmd.ParseError)
	}

	if cmd.Path == "script" {
		return &APICommand{
			Command: "/system/script/run",
			Args:    []string{fmt.Sprintf("=source=%s", cmd.Properties["script"])},
		}, nil
	}

	if cmd.Action == contextKey {
		return nil, ErrContextNotSupported
	}

	apiPath := strings.ReplaceAll(cmd.Path, " ", "/")
	apiCmd := apiPath + "/" + cmd.Action

	args := make([]string, 0, len(cmd.Properties)+1)

	if cmd.FindQuery != nil {
		args = append(args, fmt.Sprintf("?%s=%s", cmd.FindQuery.Field, cmd.FindQuery.Value))
	}

	for key, value := range cmd.Properties {
		args = append(args, fmt.Sprintf("=%s=%s", key, value))
	}

	return &APICommand{
		Command: apiCmd,
		Args:    args,
	}, nil
}

// GenerateRollback generates a rollback command for a successful command.
func GenerateRollback(cmd *CLICommand, createdID string, originalValues map[string]string) *RollbackCommand {
	rollback := &RollbackCommand{
		OriginalCommand: cmd,
		OriginalValues:  originalValues,
		CreatedID:       createdID,
	}

	switch cmd.Action {
	case "add":
		if createdID != "" {
			rollback.UndoCommand = &APICommand{
				Command: cmd.Path + "/remove",
				Args:    []string{fmt.Sprintf("=.id=%s", createdID)},
			}
		}
	case "set":
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
		if len(originalValues) > 0 {
			var args []string
			for k, v := range originalValues {
				if k != ".id" {
					args = append(args, fmt.Sprintf("=%s=%s", k, v))
				}
			}
			rollback.UndoCommand = &APICommand{
				Command: cmd.Path + "/add",
				Args:    args,
			}
		}
	case "enable":
		rollback.UndoCommand = &APICommand{
			Command: cmd.Path + "/disable",
			Args:    []string{fmt.Sprintf("=.id=%s", createdID)},
		}
	case "disable":
		rollback.UndoCommand = &APICommand{
			Command: cmd.Path + "/enable",
			Args:    []string{fmt.Sprintf("=.id=%s", createdID)},
		}
	}

	return rollback
}

// BatchParseResult holds the result of parsing a batch of commands.
type BatchParseResult struct {
	Commands     []*CLICommand
	TotalLines   int
	ParsedCount  int
	SkippedCount int
	ErrorCount   int
	Errors       []ParseError
}

// ParseError represents a parsing error with context.
type ParseError struct {
	LineNumber int
	RawCommand string
	Error      string
}

// ParseBatch parses a script and returns detailed results.
func (p *CLIParser) ParseBatch(script string) *BatchParseResult {
	result := &BatchParseResult{}

	lines := strings.Split(script, "\n")
	result.TotalLines = len(lines)

	commands, err := p.ParseScript(script)
	if err != nil {
		result.Errors = append(result.Errors, ParseError{
			Error: err.Error(),
		})
	}

	for _, cmd := range commands {
		switch {
		case cmd.ParseError != "":
			result.ErrorCount++
			result.Errors = append(result.Errors, ParseError{
				LineNumber: cmd.LineNumber,
				RawCommand: cmd.RawCommand,
				Error:      cmd.ParseError,
			})
		case cmd.Action == "context":
			result.SkippedCount++
		default:
			result.ParsedCount++
		}
	}

	result.Commands = commands
	return result
}
