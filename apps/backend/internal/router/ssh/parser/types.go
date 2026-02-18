// Package parser implements multi-strategy parsing of RouterOS SSH command output.
//
// RouterOS SSH responses come in multiple formats (table, detail, terse, export).
// This package provides a unified parsing interface with automatic format detection
// and a fallback chain strategy pattern.
//
// Architecture:
//
//	SSH Output → Format Detection → Strategy Selection → Parse → Normalize → Result
//
// Supported formats:
//   - Table: Fixed-width columns with header line (most common)
//   - Detail: Key-value pairs with = separator
//   - Terse: Semicolon-separated key=value pairs (RouterOS 6.43+)
//   - Export: RSC script format from /export command
package parser

import (
	"time"
)

// ParseResult contains the result of parsing SSH output.
type ParseResult struct {
	// Resources contains the parsed resources with GraphQL field names.
	Resources []Resource

	// Metadata contains information about the parse operation.
	Metadata ParseMetadata

	// Warnings contains non-fatal issues encountered during parsing.
	Warnings []ParseWarning

	// PartialData contains any unparseable sections (for graceful degradation).
	PartialData *PartialParseData
}

// Resource represents a single parsed resource as a map of field names to values.
// Field names are normalized to GraphQL camelCase format.
type Resource map[string]any

// ParseMetadata contains information about the parse operation.
type ParseMetadata struct {
	// Format is the detected format of the input.
	Format OutputFormat

	// RowCount is the number of resources parsed.
	RowCount int

	// ParseTime is how long parsing took.
	ParseTime time.Duration

	// StrategyUsed is the name of the parser strategy that succeeded.
	StrategyUsed string

	// RouterOSVersion is the detected RouterOS version (if available from output).
	RouterOSVersion string
}

// ParseWarning represents a non-fatal issue during parsing.
type ParseWarning struct {
	// Line is the line number where the issue occurred (1-indexed).
	Line int

	// Message describes the warning.
	Message string

	// Code is a warning code for programmatic handling.
	Code WarningCode
}

// WarningCode represents a specific type of parse warning.
type WarningCode string

const (
	// WarnUnknownField indicates an unknown field was encountered.
	WarnUnknownField WarningCode = "UNKNOWN_FIELD"
	// WarnTypeConversion indicates a type conversion issue.
	WarnTypeConversion WarningCode = "TYPE_CONVERSION"
	// WarnTruncatedValue indicates a value was truncated.
	WarnTruncatedValue WarningCode = "TRUNCATED_VALUE"
	// WarnMalformedLine indicates a line couldn't be fully parsed.
	WarnMalformedLine WarningCode = "MALFORMED_LINE"
	// WarnMissingColumn indicates a column value was missing.
	WarnMissingColumn WarningCode = "MISSING_COLUMN"
)

// PartialParseData contains data from a partial parse (graceful degradation).
type PartialParseData struct {
	// ParsedCount is the number of successfully parsed rows.
	ParsedCount int

	// FailedCount is the number of rows that failed to parse.
	FailedCount int

	// UnparseableLines contains the raw lines that couldn't be parsed.
	UnparseableLines []string

	// LastSuccessfulLine is the last line that was successfully parsed.
	LastSuccessfulLine int
}

// OutputFormat represents the format of RouterOS SSH output.
type OutputFormat string

const (
	// FormatUnknown indicates the format couldn't be detected.
	FormatUnknown OutputFormat = "unknown"
	// FormatTable is fixed-width column output from /print commands.
	FormatTable OutputFormat = "table"
	// FormatDetail is key-value output from /print detail commands.
	FormatDetail OutputFormat = "detail"
	// FormatTerse is semicolon-separated key=value from /print terse (6.43+).
	FormatTerse OutputFormat = "terse"
	// FormatExport is RSC script format from /export commands.
	FormatExport OutputFormat = "export"
	// FormatKeyValue is colon-separated key:value from system info commands.
	FormatKeyValue OutputFormat = "keyvalue"
)

// ParseHints provides context to help the parser select the right strategy.
type ParseHints struct {
	// CommandType indicates what type of command generated the output.
	CommandType CommandType

	// ResourcePath is the RouterOS path being queried (e.g., "/interface/wireguard").
	ResourcePath string

	// ExpectedFormat hints at the expected output format.
	ExpectedFormat OutputFormat

	// RouterOSVersion is the known RouterOS version (for version-specific parsing).
	RouterOSVersion *RouterOSVersionInfo
}

// CommandType indicates the type of RouterOS command.
type CommandType string

const (
	// CommandPrint is a /print command (returns table or detail).
	CommandPrint CommandType = "print"
	// CommandPrintDetail is /print detail (returns detail format).
	CommandPrintDetail CommandType = "print_detail"
	// CommandPrintTerse is /print terse (returns terse format).
	CommandPrintTerse CommandType = "print_terse"
	// CommandExport is /export (returns RSC script format).
	CommandExport CommandType = "export"
	// CommandExportVerbose is /export verbose (detailed RSC format).
	CommandExportVerbose CommandType = "export_verbose"
	// CommandGet is a single-item query.
	CommandGet CommandType = "get"
	// CommandSystemResource is /system resource print.
	CommandSystemResource CommandType = "system_resource"
)

// RouterOSVersionInfo contains parsed RouterOS version information.
type RouterOSVersionInfo struct {
	Major   int
	Minor   int
	Patch   int
	Channel string // stable, testing, development
	Raw     string // Original version string
}

// IsROS7 returns true if this is RouterOS 7.x or higher.
func (v *RouterOSVersionInfo) IsROS7() bool {
	return v.Major >= 7
}

// IsROS6 returns true if this is RouterOS 6.x.
func (v *RouterOSVersionInfo) IsROS6() bool {
	return v.Major == 6
}

// SupportsREST returns true if this version supports the REST API (7.1+).
func (v *RouterOSVersionInfo) SupportsREST() bool {
	return v.Major > 7 || (v.Major == 7 && v.Minor >= 1)
}

// SupportsTerse returns true if this version supports terse output (6.43+).
func (v *RouterOSVersionInfo) SupportsTerse() bool {
	return v.Major > 6 || (v.Major == 6 && v.Minor >= 43)
}

// FieldType represents the expected type of a field value.
type FieldType string

const (
	FieldTypeString   FieldType = "string"
	FieldTypeInt      FieldType = "int"
	FieldTypeInt64    FieldType = "int64"
	FieldTypeBool     FieldType = "bool"
	FieldTypeDuration FieldType = "duration"
	FieldTypeIP       FieldType = "ip"
	FieldTypeIPv6     FieldType = "ipv6"
	FieldTypeMAC      FieldType = "mac"
	FieldTypeTime     FieldType = "time"
	FieldTypeBytes    FieldType = "bytes"
	FieldTypeFloat    FieldType = "float"
)

// TableFlags represents RouterOS table flags (X, R, D, I, etc.).
type TableFlags struct {
	// Disabled indicates the X flag (disabled item).
	Disabled bool
	// Running indicates the R flag (running/active item).
	Running bool
	// Dynamic indicates the D flag (dynamically created item).
	Dynamic bool
	// Invalid indicates the I flag (invalid configuration).
	Invalid bool
	// Active indicates the A flag (active route).
	Active bool
	// Connected indicates the C flag (connected route).
	Connected bool
	// Static indicates the S flag (static route).
	Static bool
	// Raw contains the original flag characters.
	Raw string
}

// ColumnInfo describes a column in table format output.
type ColumnInfo struct {
	// Name is the column header name (uppercase, e.g., "LISTEN-PORT").
	Name string
	// Start is the starting position of the column (0-indexed).
	Start int
	// End is the ending position of the column (exclusive).
	End int
	// NormalizedName is the GraphQL camelCase field name.
	NormalizedName string
}

// ExportSection represents a section in /export output.
type ExportSection struct {
	// Path is the RouterOS path (e.g., "/interface/wireguard").
	Path string
	// Commands contains the add/set commands in this section.
	Commands []ExportCommand
}

// ExportCommand represents a single command in /export output.
type ExportCommand struct {
	// Action is the command action (add, set, remove).
	Action string
	// Properties contains the key-value pairs.
	Properties map[string]string
	// Comment is any inline comment.
	Comment string
	// LineNumber is the line number in the export (for error reporting).
	LineNumber int
}

// ParserConfig contains configuration options for the parser service.
//
//nolint:revive // type name is appropriate
type ParserConfig struct {
	// MaxOutputSize is the maximum output size to parse (bytes). Default: 10MB.
	MaxOutputSize int

	// MaxLineLength is the maximum line length to process. Default: 10000.
	MaxLineLength int

	// ParseTimeout is the maximum time to spend parsing. Default: 5s.
	ParseTimeout time.Duration

	// EnablePartialResults enables returning partial results on parse failure.
	EnablePartialResults bool

	// StrictMode fails on any parse error instead of returning warnings.
	StrictMode bool

	// LogRawOnError logs raw output on parse failure (debug level, truncated).
	LogRawOnError bool

	// MaxLogOutputSize is the max size of raw output to log on error. Default: 1000.
	MaxLogOutputSize int
}

// DefaultParserConfig returns the default parser configuration.
func DefaultParserConfig() ParserConfig {
	return ParserConfig{
		MaxOutputSize:        10 * 1024 * 1024, // 10MB
		MaxLineLength:        10000,
		ParseTimeout:         5 * time.Second,
		EnablePartialResults: true,
		StrictMode:           false,
		LogRawOnError:        true,
		MaxLogOutputSize:     1000,
	}
}
