//go:build test

package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestParseSimpleCommandsWithTestify demonstrates Testify assertions pattern
// This file shows how to migrate from standard testing to Testify
func TestParseSimpleCommandsWithTestify(t *testing.T) {
	parser := NewCLIParser()

	tests := []struct {
		name       string
		input      string
		wantPath   string
		wantAction string
		wantProps  map[string]string
	}{
		{
			name:       "interface bridge add",
			input:      `/interface bridge add name="LANBridgeSplit" comment="Split"`,
			wantPath:   "/interface bridge",
			wantAction: "add",
			wantProps:  map[string]string{"name": "LANBridgeSplit", "comment": "Split"},
		},
		{
			name:       "ip pool add",
			input:      `/ip pool add name="DHCP-pool-Split" ranges="192.168.10.2-192.168.10.254" comment="Split"`,
			wantPath:   "/ip pool",
			wantAction: "add",
			wantProps:  map[string]string{"name": "DHCP-pool-Split", "ranges": "192.168.10.2-192.168.10.254", "comment": "Split"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmd := parser.ParseCommand(tt.input, 1)

			// Use require for fatal assertions (stops test on failure)
			require.NotNil(t, cmd, "ParseCommand should return a command")
			require.Empty(t, cmd.ParseError, "ParseCommand should not have parse errors")

			// Use assert for non-fatal assertions (continues on failure)
			assert.Equal(t, tt.wantPath, cmd.Path, "Path should match")
			assert.Equal(t, tt.wantAction, cmd.Action, "Action should match")

			// Check each expected property
			for k, v := range tt.wantProps {
				assert.Equal(t, v, cmd.Properties[k], "Property %s should match", k)
			}
		})
	}
}

// TestCLIParserCreation tests parser initialization using Testify
func TestCLIParserCreation(t *testing.T) {
	parser := NewCLIParser()
	require.NotNil(t, parser, "NewCLIParser should return a parser")
}

// TestToAPICommandWithTestify demonstrates testing API command conversion
func TestToAPICommandWithTestify(t *testing.T) {
	parser := NewCLIParser()

	tests := []struct {
		name        string
		input       string
		wantCommand string
		wantArgs    []string
	}{
		{
			name:        "bridge add",
			input:       `/interface bridge add name="test"`,
			wantCommand: "/interface/bridge/add",
			wantArgs:    []string{"=name=test"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmd := parser.ParseCommand(tt.input, 1)
			apiCmd, err := cmd.ToAPICommand()

			require.NoError(t, err, "ToAPICommand should not error")
			require.NotNil(t, apiCmd, "APICommand should not be nil")
			assert.Equal(t, tt.wantCommand, apiCmd.Command, "Command should match")

			// Check that all expected args are present using Contains
			for _, wantArg := range tt.wantArgs {
				assert.Contains(t, apiCmd.Args, wantArg, "Args should contain %s", wantArg)
			}
		})
	}
}
