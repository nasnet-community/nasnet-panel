package main

// Thin wrapper that delegates to pkg/router/adapters/mikrotik/parser.
// The original implementation has been moved to backend/pkg/router/adapters/mikrotik/parser/.

import (
	"backend/pkg/router/adapters/mikrotik/parser"
)

// Type aliases for backward compatibility within package main.
type CLICommand = parser.CLICommand
type FindQuery = parser.FindQuery
type APICommand = parser.APICommand
type RollbackCommand = parser.RollbackCommand
type CLIParser = parser.CLIParser
type BatchParseResult = parser.BatchParseResult

// NewCLIParser delegates to the parser package.
var NewCLIParser = parser.NewCLIParser
