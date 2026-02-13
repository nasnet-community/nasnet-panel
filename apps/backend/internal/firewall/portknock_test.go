package firewall

import (
	"context"
	"strings"
	"testing"
)

// TestGenerateKnockRules_BasicSequence tests basic rule generation
func TestGenerateKnockRules_BasicSequence(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "ssh_knock",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 5678, Protocol: "tcp", Order: 2},
			{Port: 9012, Protocol: "tcp", Order: 3},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
		Enabled:           true,
	}

	rules := service.GenerateKnockRules(sequence)

	// Should generate N+1 rules (3 stage rules + 1 accept rule)
	expectedCount := len(sequence.KnockPorts) + 1
	if len(rules) != expectedCount {
		t.Errorf("Expected %d rules, got %d", expectedCount, len(rules))
	}

	// Verify stage 1 rule
	stage1 := rules[0]
	if stage1.Action != "add-src-to-address-list" {
		t.Errorf("Stage 1 action should be add-src-to-address-list, got %s", stage1.Action)
	}
	if stage1.Comment != "!knock:ssh_knock:stage1" {
		t.Errorf("Stage 1 comment incorrect: %s", stage1.Comment)
	}
	if stage1.Properties["address-list"] != "knock_stage1_ssh_knock" {
		t.Errorf("Stage 1 address-list incorrect: %v", stage1.Properties["address-list"])
	}

	// Verify stage 2 has src-address-list check
	stage2 := rules[1]
	if stage2.Properties["src-address-list"] != "knock_stage1_ssh_knock" {
		t.Errorf("Stage 2 should check src-address-list from stage 1")
	}

	// Verify final stage uses allowed list and access timeout
	finalStage := rules[2]
	if finalStage.Properties["address-list"] != "ssh_knock_allowed" {
		t.Errorf("Final stage should use allowed list, got %v", finalStage.Properties["address-list"])
	}
	if finalStage.Properties["address-list-timeout"] != "5m" {
		t.Errorf("Final stage should use access timeout, got %v", finalStage.Properties["address-list-timeout"])
	}

	// Verify accept rule
	acceptRule := rules[3]
	if acceptRule.Action != "accept" {
		t.Errorf("Accept rule action should be accept, got %s", acceptRule.Action)
	}
	if acceptRule.Comment != "!knock:ssh_knock:accept" {
		t.Errorf("Accept rule comment incorrect: %s", acceptRule.Comment)
	}
	if acceptRule.Properties["src-address-list"] != "ssh_knock_allowed" {
		t.Errorf("Accept rule should check allowed list")
	}
}

// TestGenerateKnockRules_TwoPortSequence tests minimum (2-port) sequence
func TestGenerateKnockRules_TwoPortSequence(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "minimal",
		KnockPorts: []KnockPort{
			{Port: 1111, Protocol: "tcp", Order: 1},
			{Port: 2222, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     80,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "1h",
		KnockTimeout:      "30s",
		Enabled:           true,
	}

	rules := service.GenerateKnockRules(sequence)

	// Should generate 3 rules (2 stages + 1 accept)
	if len(rules) != 3 {
		t.Errorf("Expected 3 rules for 2-port sequence, got %d", len(rules))
	}
}

// TestGenerateKnockRules_EightPortSequence tests maximum (8-port) sequence
func TestGenerateKnockRules_EightPortSequence(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "max_knock",
		KnockPorts: []KnockPort{
			{Port: 1000, Protocol: "tcp", Order: 1},
			{Port: 2000, Protocol: "tcp", Order: 2},
			{Port: 3000, Protocol: "tcp", Order: 3},
			{Port: 4000, Protocol: "tcp", Order: 4},
			{Port: 5000, Protocol: "tcp", Order: 5},
			{Port: 6000, Protocol: "tcp", Order: 6},
			{Port: 7000, Protocol: "tcp", Order: 7},
			{Port: 8000, Protocol: "tcp", Order: 8},
		},
		ProtectedPort:     443,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "10m",
		KnockTimeout:      "20s",
		Enabled:           true,
	}

	rules := service.GenerateKnockRules(sequence)

	// Should generate 9 rules (8 stages + 1 accept)
	if len(rules) != 9 {
		t.Errorf("Expected 9 rules for 8-port sequence, got %d", len(rules))
	}
}

// TestGenerateKnockRules_UDPProtocol tests UDP protocol handling
func TestGenerateKnockRules_UDPProtocol(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "udp_knock",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "udp", Order: 1},
			{Port: 5678, Protocol: "udp", Order: 2},
		},
		ProtectedPort:     53,
		ProtectedProtocol: "udp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
		Enabled:           true,
	}

	rules := service.GenerateKnockRules(sequence)

	// Verify protocol is set to UDP
	if rules[0].Properties["protocol"] != "udp" {
		t.Errorf("Stage 1 protocol should be udp, got %v", rules[0].Properties["protocol"])
	}

	// Verify accept rule has UDP protocol
	acceptRule := rules[len(rules)-1]
	if acceptRule.Properties["protocol"] != "udp" {
		t.Errorf("Accept rule protocol should be udp, got %v", acceptRule.Properties["protocol"])
	}
}

// TestGenerateKnockRules_InvalidName tests invalid sequence name handling
func TestGenerateKnockRules_InvalidName(t *testing.T) {
	service := NewPortKnockService()

	// Test with spaces (invalid)
	sequence := PortKnockSequence{
		Name: "invalid name",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 5678, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	rules := service.GenerateKnockRules(sequence)

	// Should return empty rules for invalid name
	if len(rules) != 0 {
		t.Errorf("Expected 0 rules for invalid name, got %d", len(rules))
	}
}

// TestValidateSequence_ValidSequence tests valid sequence validation
func TestValidateSequence_ValidSequence(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "valid_sequence",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 5678, Protocol: "udp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err := service.ValidateSequence(sequence)
	if err != nil {
		t.Errorf("Expected valid sequence, got error: %v", err)
	}
}

// TestValidateSequence_InvalidName tests invalid name validation
func TestValidateSequence_InvalidName(t *testing.T) {
	service := NewPortKnockService()

	testCases := []struct {
		name        string
		sequenceName string
		expectError bool
	}{
		{"Valid name with underscore", "ssh_knock", false},
		{"Valid name with hyphen", "ssh-knock", false},
		{"Invalid name with space", "ssh knock", true},
		{"Invalid name with special char", "ssh@knock", true},
		{"Empty name", "", true},
		{"Too long name", "this_is_a_very_long_name_that_exceeds_the_limit_of_32_characters", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			sequence := PortKnockSequence{
				Name: tc.sequenceName,
				KnockPorts: []KnockPort{
					{Port: 1234, Protocol: "tcp", Order: 1},
					{Port: 5678, Protocol: "tcp", Order: 2},
				},
				ProtectedPort:     22,
				ProtectedProtocol: "tcp",
				AccessTimeout:     "5m",
				KnockTimeout:      "15s",
			}

			err := service.ValidateSequence(sequence)
			if tc.expectError && err == nil {
				t.Errorf("Expected error for %s, got nil", tc.name)
			}
			if !tc.expectError && err != nil {
				t.Errorf("Expected no error for %s, got: %v", tc.name, err)
			}
		})
	}
}

// TestValidateSequence_InvalidPortCount tests port count validation
func TestValidateSequence_InvalidPortCount(t *testing.T) {
	service := NewPortKnockService()

	// Test with 1 port (too few)
	sequence1 := PortKnockSequence{
		Name: "too_few",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err1 := service.ValidateSequence(sequence1)
	if err1 == nil {
		t.Error("Expected error for sequence with < 2 ports")
	}

	// Test with 9 ports (too many)
	sequence2 := PortKnockSequence{
		Name: "too_many",
		KnockPorts: []KnockPort{
			{Port: 1000, Protocol: "tcp", Order: 1},
			{Port: 2000, Protocol: "tcp", Order: 2},
			{Port: 3000, Protocol: "tcp", Order: 3},
			{Port: 4000, Protocol: "tcp", Order: 4},
			{Port: 5000, Protocol: "tcp", Order: 5},
			{Port: 6000, Protocol: "tcp", Order: 6},
			{Port: 7000, Protocol: "tcp", Order: 7},
			{Port: 8000, Protocol: "tcp", Order: 8},
			{Port: 9000, Protocol: "tcp", Order: 9},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err2 := service.ValidateSequence(sequence2)
	if err2 == nil {
		t.Error("Expected error for sequence with > 8 ports")
	}
}

// TestValidateSequence_DuplicatePorts tests duplicate port detection
func TestValidateSequence_DuplicatePorts(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "duplicate_ports",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 1234, Protocol: "tcp", Order: 2}, // Duplicate
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err := service.ValidateSequence(sequence)
	if err == nil {
		t.Error("Expected error for duplicate ports")
	}
	if !strings.Contains(err.Error(), "duplicate") {
		t.Errorf("Expected 'duplicate' in error message, got: %v", err)
	}
}

// TestValidateSequence_InvalidPortRange tests port range validation
func TestValidateSequence_InvalidPortRange(t *testing.T) {
	service := NewPortKnockService()

	// Test with port 0 (too low)
	sequence1 := PortKnockSequence{
		Name: "invalid_port_low",
		KnockPorts: []KnockPort{
			{Port: 0, Protocol: "tcp", Order: 1},
			{Port: 1234, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err1 := service.ValidateSequence(sequence1)
	if err1 == nil {
		t.Error("Expected error for port < 1")
	}

	// Test with port 65536 (too high)
	sequence2 := PortKnockSequence{
		Name: "invalid_port_high",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 65536, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err2 := service.ValidateSequence(sequence2)
	if err2 == nil {
		t.Error("Expected error for port > 65535")
	}
}

// TestValidateSequence_InvalidProtocol tests protocol validation
func TestValidateSequence_InvalidProtocol(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "invalid_protocol",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "icmp", Order: 1}, // Invalid protocol
			{Port: 5678, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err := service.ValidateSequence(sequence)
	if err == nil {
		t.Error("Expected error for invalid knock protocol")
	}

	// Test invalid protected protocol
	sequence2 := PortKnockSequence{
		Name: "invalid_protected_protocol",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 5678, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "icmp", // Invalid
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	err2 := service.ValidateSequence(sequence2)
	if err2 == nil {
		t.Error("Expected error for invalid protected protocol")
	}
}

// TestValidateSequence_InvalidTimeout tests timeout format validation
func TestValidateSequence_InvalidTimeout(t *testing.T) {
	service := NewPortKnockService()

	testCases := []struct {
		name          string
		accessTimeout string
		knockTimeout  string
		expectError   bool
	}{
		{"Valid timeouts", "5m", "15s", false},
		{"Valid timeout with hours", "1h", "30s", false},
		{"Valid timeout with days", "1d", "15s", false},
		{"Invalid access timeout", "5minutes", "15s", true},
		{"Invalid knock timeout", "5m", "15", true},
		{"Missing unit in access timeout", "5", "15s", true},
		{"Invalid unit", "5x", "15s", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			sequence := PortKnockSequence{
				Name: "test",
				KnockPorts: []KnockPort{
					{Port: 1234, Protocol: "tcp", Order: 1},
					{Port: 5678, Protocol: "tcp", Order: 2},
				},
				ProtectedPort:     22,
				ProtectedProtocol: "tcp",
				AccessTimeout:     tc.accessTimeout,
				KnockTimeout:      tc.knockTimeout,
			}

			err := service.ValidateSequence(sequence)
			if tc.expectError && err == nil {
				t.Errorf("Expected error for %s", tc.name)
			}
			if !tc.expectError && err != nil {
				t.Errorf("Expected no error for %s, got: %v", tc.name, err)
			}
		})
	}
}

// TestDetectSSHLockoutRisk tests SSH lockout risk detection
func TestDetectSSHLockoutRisk(t *testing.T) {
	service := NewPortKnockService()

	testCases := []struct {
		name              string
		protectedPort     int
		protectedProtocol string
		expectRisk        bool
	}{
		{"SSH on port 22", 22, "tcp", true},
		{"HTTP on port 80", 80, "tcp", false},
		{"HTTPS on port 443", 443, "tcp", false},
		{"SSH on UDP (unlikely)", 22, "udp", false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			sequence := PortKnockSequence{
				Name:              "test",
				ProtectedPort:     tc.protectedPort,
				ProtectedProtocol: tc.protectedProtocol,
			}

			risk := service.DetectSSHLockoutRisk(sequence)
			if risk != tc.expectRisk {
				t.Errorf("Expected risk=%v for %s, got %v", tc.expectRisk, tc.name, risk)
			}
		})
	}
}

// TestGenerateTestKnockRules tests test mode rule generation
func TestGenerateTestKnockRules(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "test_knock",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 5678, Protocol: "tcp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "1h",  // Original long timeout
		KnockTimeout:      "60s", // Original long timeout
		Enabled:           true,
	}

	testRules := service.GenerateTestKnockRules(sequence)

	// Should generate same number of rules
	if len(testRules) != 3 {
		t.Errorf("Expected 3 test rules, got %d", len(testRules))
	}

	// Verify TEST marker in comments
	for _, rule := range testRules {
		if !strings.Contains(rule.Comment, "!knock:TEST:") {
			t.Errorf("Test rule comment should contain TEST marker, got: %s", rule.Comment)
		}
	}

	// Verify shortened timeouts
	finalStage := testRules[1]
	if finalStage.Properties["address-list-timeout"] != "5m" {
		t.Errorf("Test mode should use 5m access timeout, got: %v",
			finalStage.Properties["address-list-timeout"])
	}
}

// TestCleanupKnockRules tests cleanup function with valid name
func TestCleanupKnockRules(t *testing.T) {
	service := NewPortKnockService()
	ctx := context.Background()

	// Test with valid name
	err := service.CleanupKnockRules(ctx, "ssh_knock")
	if err != nil {
		t.Errorf("Expected no error for valid name, got: %v", err)
	}

	// Test with invalid name
	err2 := service.CleanupKnockRules(ctx, "invalid name")
	if err2 == nil {
		t.Error("Expected error for invalid name")
	}
}

// TestSetKnockRulesEnabled tests enable/disable function
func TestSetKnockRulesEnabled(t *testing.T) {
	service := NewPortKnockService()
	ctx := context.Background()

	// Test enable
	err := service.SetKnockRulesEnabled(ctx, "ssh_knock", true)
	if err != nil {
		t.Errorf("Expected no error for enable, got: %v", err)
	}

	// Test disable
	err2 := service.SetKnockRulesEnabled(ctx, "ssh_knock", false)
	if err2 != nil {
		t.Errorf("Expected no error for disable, got: %v", err2)
	}

	// Test with invalid name
	err3 := service.SetKnockRulesEnabled(ctx, "invalid name", true)
	if err3 == nil {
		t.Error("Expected error for invalid name")
	}
}

// TestGenerateKnockInstructions tests instruction generation
func TestGenerateKnockInstructions(t *testing.T) {
	service := NewPortKnockService()

	sequence := PortKnockSequence{
		Name: "ssh_knock",
		KnockPorts: []KnockPort{
			{Port: 1234, Protocol: "tcp", Order: 1},
			{Port: 5678, Protocol: "udp", Order: 2},
		},
		ProtectedPort:     22,
		ProtectedProtocol: "tcp",
		AccessTimeout:     "5m",
		KnockTimeout:      "15s",
	}

	instructions := service.GenerateKnockInstructions(sequence)

	// Verify instructions contain key information
	if !strings.Contains(instructions, "port 22") {
		t.Error("Instructions should mention protected port")
	}
	if !strings.Contains(instructions, "1234") {
		t.Error("Instructions should mention first knock port")
	}
	if !strings.Contains(instructions, "5678") {
		t.Error("Instructions should mention second knock port")
	}
	if !strings.Contains(instructions, "knock <router-ip>") {
		t.Error("Instructions should include knock command example")
	}
}
