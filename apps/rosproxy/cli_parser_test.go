package main

import (
	"strings"
	"testing"
)

func TestParseSimpleCommands(t *testing.T) {
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
		{
			name:       "interface list add",
			input:      `/interface list add name="WAN"`,
			wantPath:   "/interface list",
			wantAction: "add",
			wantProps:  map[string]string{"name": "WAN"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmd := parser.ParseCommand(tt.input, 1)

			if cmd.Path != tt.wantPath {
				t.Errorf("Path = %q, want %q", cmd.Path, tt.wantPath)
			}
			if cmd.Action != tt.wantAction {
				t.Errorf("Action = %q, want %q", cmd.Action, tt.wantAction)
			}
			for k, v := range tt.wantProps {
				if cmd.Properties[k] != v {
					t.Errorf("Property %q = %q, want %q", k, cmd.Properties[k], v)
				}
			}
			if cmd.ParseError != "" {
				t.Errorf("Unexpected parse error: %s", cmd.ParseError)
			}
		})
	}
}

func TestParseFindQuery(t *testing.T) {
	parser := NewCLIParser()

	tests := []struct {
		name       string
		input      string
		wantField  string
		wantValue  string
	}{
		{
			name:      "set with find default-name",
			input:     `/interface ethernet set [ find default-name=ether2 ] comment="WAN - Foreign Link 1"`,
			wantField: "default-name",
			wantValue: "ether2",
		},
		{
			name:      "set with find name",
			input:     `/interface wifi set [ find name="wifi2.4-ForeignLAN" ] steering="Foreign"`,
			wantField: "name",
			wantValue: "wifi2.4-ForeignLAN",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmd := parser.ParseCommand(tt.input, 1)

			if cmd.FindQuery == nil {
				t.Fatal("Expected FindQuery to be set")
			}
			if cmd.FindQuery.Field != tt.wantField {
				t.Errorf("FindQuery.Field = %q, want %q", cmd.FindQuery.Field, tt.wantField)
			}
			if cmd.FindQuery.Value != tt.wantValue {
				t.Errorf("FindQuery.Value = %q, want %q", cmd.FindQuery.Value, tt.wantValue)
			}
		})
	}
}

func TestParseMultilineCommand(t *testing.T) {
	parser := NewCLIParser()

	script := `/interface wireguard
add name="wireguard-client-VPN 1" private-key="0NMd7T7qcbIZHvK80j0cgqTbvweWInlq1z0yv6gezkQ=" \
    comment="wg-client-VPN 1"`

	commands, err := parser.ParseScript(script)
	if err != nil {
		t.Fatalf("ParseScript error: %v", err)
	}

	// Should have 2 commands: context switch + add
	if len(commands) < 1 {
		t.Fatalf("Expected at least 1 command, got %d", len(commands))
	}

	// Find the add command
	var addCmd *CLICommand
	for _, cmd := range commands {
		if cmd.Action == "add" {
			addCmd = cmd
			break
		}
	}

	if addCmd == nil {
		t.Fatal("Expected to find add command")
	}

	if addCmd.Properties["name"] != "wireguard-client-VPN 1" {
		t.Errorf("name = %q, want %q", addCmd.Properties["name"], "wireguard-client-VPN 1")
	}
}

func TestParseScriptCommand(t *testing.T) {
	parser := NewCLIParser()

	cmd := parser.ParseCommand(":delay 30", 1)

	if cmd.Path != "script" {
		t.Errorf("Path = %q, want %q", cmd.Path, "script")
	}
	if cmd.Action != "execute" {
		t.Errorf("Action = %q, want %q", cmd.Action, "execute")
	}
}

func TestToAPICommand(t *testing.T) {
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
		{
			name:        "ip address add",
			input:       `/ip address add address="192.168.1.1/24" interface="ether1"`,
			wantCommand: "/ip/address/add",
			wantArgs:    []string{"=address=192.168.1.1/24", "=interface=ether1"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmd := parser.ParseCommand(tt.input, 1)
			apiCmd, err := cmd.ToAPICommand()

			if err != nil {
				t.Fatalf("ToAPICommand error: %v", err)
			}
			if apiCmd == nil {
				t.Fatal("Expected APICommand, got nil")
			}
			if apiCmd.Command != tt.wantCommand {
				t.Errorf("Command = %q, want %q", apiCmd.Command, tt.wantCommand)
			}

			// Check that all expected args are present
			for _, wantArg := range tt.wantArgs {
				found := false
				for _, gotArg := range apiCmd.Args {
					if gotArg == wantArg {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Missing expected arg %q in %v", wantArg, apiCmd.Args)
				}
			}
		})
	}
}

func TestParseBatch(t *testing.T) {
	parser := NewCLIParser()

	script := `
# This is a comment
:delay 30

/interface bridge
add name="LANBridgeSplit" comment="Split"
add name="LANBridgeDomestic" comment="Domestic"

/interface list
add name="WAN"
add name="LAN"

/ip pool
add name="DHCP-pool-Split" ranges="192.168.10.2-192.168.10.254"
`

	result := parser.ParseBatch(script)

	if result.ParsedCount < 5 {
		t.Errorf("ParsedCount = %d, want at least 5", result.ParsedCount)
	}
	if result.ErrorCount != 0 {
		t.Errorf("ErrorCount = %d, want 0", result.ErrorCount)
	}

	t.Logf("Parsed %d commands, skipped %d, errors %d", 
		result.ParsedCount, result.SkippedCount, result.ErrorCount)
}

func TestCleanCommandText(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{
			input: `add name="test" \     comment="foo"`,
			want:  `add name="test" comment="foo"`,
		},
		{
			input: `multiple   spaces   here`,
			want:  `multiple spaces here`,
		},
	}

	for _, tt := range tests {
		got := cleanCommandText(tt.input)
		if got != tt.want {
			t.Errorf("cleanCommandText(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestGenerateRollback(t *testing.T) {
	cmd := &CLICommand{
		Path:   "/interface/bridge",
		Action: "add",
		Properties: map[string]string{
			"name":    "test-bridge",
			"comment": "test",
		},
	}

	rollback := GenerateRollback(cmd, "*1", nil)

	if rollback.UndoCommand == nil {
		t.Fatal("Expected UndoCommand to be set")
	}
	if rollback.UndoCommand.Command != "/interface/bridge/remove" {
		t.Errorf("UndoCommand.Command = %q, want %q", 
			rollback.UndoCommand.Command, "/interface/bridge/remove")
	}
	if !strings.Contains(rollback.UndoCommand.Args[0], "*1") {
		t.Errorf("UndoCommand.Args should contain *1, got %v", rollback.UndoCommand.Args)
	}
}

func TestRollbackForSet(t *testing.T) {
	cmd := &CLICommand{
		Path:   "/interface/ethernet",
		Action: "set",
		Properties: map[string]string{
			"comment": "new comment",
		},
	}

	originalValues := map[string]string{
		".id":     "*1",
		"comment": "old comment",
		"name":    "ether1",
	}

	rollback := GenerateRollback(cmd, "*1", originalValues)

	if rollback.UndoCommand == nil {
		t.Fatal("Expected UndoCommand to be set")
	}
	if rollback.UndoCommand.Command != "/interface/ethernet/set" {
		t.Errorf("UndoCommand.Command = %q, want %q", 
			rollback.UndoCommand.Command, "/interface/ethernet/set")
	}
}








