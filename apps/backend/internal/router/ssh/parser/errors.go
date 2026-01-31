package parser

import (
	"fmt"
	"strings"
)

// ParseError represents a parsing error with diagnostic context.
type ParseError struct {
	// Code is a machine-readable error code.
	Code ErrorCode

	// Message is a human-readable error message.
	Message string

	// Command is the SSH command that generated the output (if known).
	Command string

	// LineNumber is the line where the error occurred (1-indexed, 0 if N/A).
	LineNumber int

	// RawSnippet is a snippet of the raw output around the error.
	RawSnippet string

	// Cause is the underlying error if any.
	Cause error

	// Suggestions contains troubleshooting suggestions.
	Suggestions []string
}

// ErrorCode is a machine-readable error code for parse errors.
type ErrorCode string

const (
	// ErrCodeParseTimeout indicates parsing timed out.
	ErrCodeParseTimeout ErrorCode = "PARSE_TIMEOUT"
	// ErrCodeInvalidFormat indicates the output format couldn't be detected.
	ErrCodeInvalidFormat ErrorCode = "INVALID_FORMAT"
	// ErrCodeUnknownCommand indicates an unknown command type.
	ErrCodeUnknownCommand ErrorCode = "UNKNOWN_COMMAND"
	// ErrCodePartialParse indicates only partial results could be obtained.
	ErrCodePartialParse ErrorCode = "PARTIAL_PARSE"
	// ErrCodeOutputTooLarge indicates the output exceeds size limits.
	ErrCodeOutputTooLarge ErrorCode = "OUTPUT_TOO_LARGE"
	// ErrCodeMalformedTable indicates table format was malformed.
	ErrCodeMalformedTable ErrorCode = "MALFORMED_TABLE"
	// ErrCodeMalformedDetail indicates detail format was malformed.
	ErrCodeMalformedDetail ErrorCode = "MALFORMED_DETAIL"
	// ErrCodeMalformedExport indicates export format was malformed.
	ErrCodeMalformedExport ErrorCode = "MALFORMED_EXPORT"
	// ErrCodeNoMatchingParser indicates no parser could handle the output.
	ErrCodeNoMatchingParser ErrorCode = "NO_MATCHING_PARSER"
	// ErrCodeEmptyOutput indicates the output was empty.
	ErrCodeEmptyOutput ErrorCode = "EMPTY_OUTPUT"
)

// Error implements the error interface.
func (e *ParseError) Error() string {
	var sb strings.Builder

	sb.WriteString(string(e.Code))
	sb.WriteString(": ")
	sb.WriteString(e.Message)

	if e.LineNumber > 0 {
		sb.WriteString(fmt.Sprintf(" (line %d)", e.LineNumber))
	}

	if e.Cause != nil {
		sb.WriteString(": ")
		sb.WriteString(e.Cause.Error())
	}

	return sb.String()
}

// Unwrap returns the underlying error.
func (e *ParseError) Unwrap() error {
	return e.Cause
}

// WithSuggestions adds troubleshooting suggestions to the error.
func (e *ParseError) WithSuggestions(suggestions ...string) *ParseError {
	e.Suggestions = append(e.Suggestions, suggestions...)
	return e
}

// WithRawSnippet adds a raw output snippet for debugging.
func (e *ParseError) WithRawSnippet(raw string, maxLen int) *ParseError {
	if len(raw) > maxLen {
		e.RawSnippet = raw[:maxLen] + "..."
	} else {
		e.RawSnippet = raw
	}
	return e
}

// DiagnosticString returns a detailed diagnostic string for logging.
func (e *ParseError) DiagnosticString() string {
	var sb strings.Builder

	sb.WriteString("Parse Error Diagnostic\n")
	sb.WriteString("======================\n")
	sb.WriteString(fmt.Sprintf("Code:    %s\n", e.Code))
	sb.WriteString(fmt.Sprintf("Message: %s\n", e.Message))

	if e.Command != "" {
		sb.WriteString(fmt.Sprintf("Command: %s\n", e.Command))
	}

	if e.LineNumber > 0 {
		sb.WriteString(fmt.Sprintf("Line:    %d\n", e.LineNumber))
	}

	if e.RawSnippet != "" {
		sb.WriteString("Raw Output Snippet:\n")
		sb.WriteString("---\n")
		sb.WriteString(e.RawSnippet)
		sb.WriteString("\n---\n")
	}

	if len(e.Suggestions) > 0 {
		sb.WriteString("Troubleshooting Suggestions:\n")
		for i, s := range e.Suggestions {
			sb.WriteString(fmt.Sprintf("  %d. %s\n", i+1, s))
		}
	}

	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf("Cause: %v\n", e.Cause))
	}

	return sb.String()
}

// NewParseTimeoutError creates a timeout error.
func NewParseTimeoutError(command string, timeoutDuration string) *ParseError {
	return &ParseError{
		Code:    ErrCodeParseTimeout,
		Message: fmt.Sprintf("parsing timed out after %s", timeoutDuration),
		Command: command,
		Suggestions: []string{
			"Check if the router is responding slowly",
			"Try reducing the number of items being queried",
			"Consider using /print terse for faster output",
			"Increase the parse timeout if large output is expected",
		},
	}
}

// NewInvalidFormatError creates an invalid format error.
func NewInvalidFormatError(raw string, detectedFormat OutputFormat) *ParseError {
	err := &ParseError{
		Code:    ErrCodeInvalidFormat,
		Message: fmt.Sprintf("could not detect valid output format (detected: %s)", detectedFormat),
		Suggestions: []string{
			"Verify the SSH command executed successfully",
			"Check if the router returned an error message",
			"Try running the command directly via SSH to see the actual output",
		},
	}
	return err.WithRawSnippet(raw, 500)
}

// NewUnknownCommandError creates an unknown command type error.
func NewUnknownCommandError(cmdType CommandType) *ParseError {
	return &ParseError{
		Code:    ErrCodeUnknownCommand,
		Message: fmt.Sprintf("unknown command type: %s", cmdType),
		Suggestions: []string{
			"This command type is not yet supported by the parser",
			"Try using a supported command type (print, print detail, export)",
		},
	}
}

// NewPartialParseError creates a partial parse error with context.
func NewPartialParseError(parsed int, failed int, lastLine int) *ParseError {
	return &ParseError{
		Code:       ErrCodePartialParse,
		Message:    fmt.Sprintf("only partially parsed output: %d succeeded, %d failed", parsed, failed),
		LineNumber: lastLine,
		Suggestions: []string{
			"Some rows in the output had unexpected format",
			"Check the router's RouterOS version for compatibility",
			"Review the partial results which may still be usable",
		},
	}
}

// NewOutputTooLargeError creates an output size exceeded error.
func NewOutputTooLargeError(actualSize int, maxSize int) *ParseError {
	return &ParseError{
		Code:    ErrCodeOutputTooLarge,
		Message: fmt.Sprintf("output size (%d bytes) exceeds maximum (%d bytes)", actualSize, maxSize),
		Suggestions: []string{
			"Use filtering to reduce the output size",
			"Add .proplist to limit returned fields",
			"Consider paginating the query",
		},
	}
}

// NewEmptyOutputError creates an empty output error.
func NewEmptyOutputError(command string) *ParseError {
	return &ParseError{
		Code:    ErrCodeEmptyOutput,
		Message: "router returned empty output",
		Command: command,
		Suggestions: []string{
			"The queried path may have no items",
			"Check if the path exists on this router",
			"Verify the user has permission to read this path",
		},
	}
}

// NewNoMatchingParserError creates an error when no parser can handle the output.
func NewNoMatchingParserError(raw string, triedStrategies []string) *ParseError {
	err := &ParseError{
		Code:    ErrCodeNoMatchingParser,
		Message: fmt.Sprintf("no parser strategy could handle this output (tried: %s)", strings.Join(triedStrategies, ", ")),
		Suggestions: []string{
			"The output format may be unsupported",
			"Check if this is a valid RouterOS command output",
			"Try using /export format as a fallback",
		},
	}
	return err.WithRawSnippet(raw, 500)
}

// NewMalformedTableError creates a malformed table format error.
func NewMalformedTableError(line int, issue string) *ParseError {
	return &ParseError{
		Code:       ErrCodeMalformedTable,
		Message:    fmt.Sprintf("malformed table format: %s", issue),
		LineNumber: line,
		Suggestions: []string{
			"The table format may have changed in this RouterOS version",
			"Check for special characters that may affect column alignment",
			"Try using /print terse for more reliable parsing",
		},
	}
}

// NewMalformedDetailError creates a malformed detail format error.
func NewMalformedDetailError(line int, issue string) *ParseError {
	return &ParseError{
		Code:       ErrCodeMalformedDetail,
		Message:    fmt.Sprintf("malformed detail format: %s", issue),
		LineNumber: line,
		Suggestions: []string{
			"Check for unbalanced quotes or special characters",
			"Try using /print terse for simpler output",
		},
	}
}

// NewMalformedExportError creates a malformed export format error.
func NewMalformedExportError(line int, issue string) *ParseError {
	return &ParseError{
		Code:       ErrCodeMalformedExport,
		Message:    fmt.Sprintf("malformed export format: %s", issue),
		LineNumber: line,
		Suggestions: []string{
			"Check if the export was interrupted or truncated",
			"Try running /export compact for simpler output",
		},
	}
}

// IsRetryable returns true if the error might succeed on retry.
func (e *ParseError) IsRetryable() bool {
	switch e.Code {
	case ErrCodeParseTimeout:
		return true
	default:
		return false
	}
}
