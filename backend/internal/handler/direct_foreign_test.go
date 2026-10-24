package handler

import (
	"testing"

	"nasnet-panel/pkg/routeros"
)

func TestDirectForeignRulesMatch(t *testing.T) {
	rules := []routeros.MangleRule{{Disabled: true}, {Disabled: true}}
	if !directForeignRulesMatch(rules, false) || directForeignRulesMatch(rules, true) {
		t.Fatal("all-disabled rules must match only the disabled state")
	}

	rules[0].Disabled = false
	if directForeignRulesMatch(rules, true) || directForeignRulesMatch(rules, false) {
		t.Fatal("partially enabled rules must match neither state")
	}

	if toDirectForeignResponse(rules, 0, true, 0).Enabled {
		t.Fatal("partially enabled rules must not report enabled")
	}
}
