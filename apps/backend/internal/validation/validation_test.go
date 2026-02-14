package validation_test

import (
	"context"
	"testing"

	"backend/internal/validation"
	"backend/internal/validation/stages"
)

func TestNewResult(t *testing.T) {
	r := validation.NewResult()
	if !r.Valid {
		t.Error("new result should be valid")
	}
	if len(r.Errors) != 0 {
		t.Error("new result should have no errors")
	}
}

func TestResultAddError(t *testing.T) {
	r := validation.NewResult()

	// Add warning - should stay valid
	r.AddError(&validation.ValidationError{
		Stage:     1,
		StageName: "schema",
		Severity:  validation.SeverityWarning,
		Field:     "name",
		Message:   "just a warning",
	})

	if !r.Valid {
		t.Error("result with only warnings should be valid")
	}
	if r.WarningCount() != 1 {
		t.Errorf("expected 1 warning, got %d", r.WarningCount())
	}

	// Add error - should become invalid
	r.AddError(&validation.ValidationError{
		Stage:     1,
		StageName: "schema",
		Severity:  validation.SeverityError,
		Field:     "name",
		Message:   "name is required",
	})

	if r.Valid {
		t.Error("result with errors should be invalid")
	}
	if r.ErrorCount() != 1 {
		t.Errorf("expected 1 error, got %d", r.ErrorCount())
	}
}

func TestResultMerge(t *testing.T) {
	r1 := validation.NewResult()
	r1.AddError(&validation.ValidationError{
		Stage:    1,
		Severity: validation.SeverityWarning,
		Field:    "f1",
		Message:  "w1",
	})

	r2 := validation.NewResult()
	r2.AddError(&validation.ValidationError{
		Stage:    2,
		Severity: validation.SeverityError,
		Field:    "f2",
		Message:  "e1",
	})

	r1.Merge(r2)

	if r1.Valid {
		t.Error("merged result should be invalid")
	}
	if len(r1.Errors) != 2 {
		t.Errorf("expected 2 findings, got %d", len(r1.Errors))
	}
}

func TestResultSummary(t *testing.T) {
	r := validation.NewResult()
	r.StagesRun = 3

	summary := r.Summary()
	if summary == "" {
		t.Error("summary should not be empty")
	}

	r.AddError(&validation.ValidationError{
		Stage:     1,
		StageName: "schema",
		Severity:  validation.SeverityError,
		Field:     "x",
		Message:   "err",
	})

	summary = r.Summary()
	if summary == "" {
		t.Error("failure summary should not be empty")
	}
}

func TestEngineWithNoStages(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	input := validation.NewStageInput("bridge", "create")

	result := engine.Validate(context.Background(), input)
	if !result.Valid {
		t.Error("engine with no stages should return valid result")
	}
}

func TestEngineSchemaStage(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	engine.RegisterStage(&stages.SchemaStage{})

	t.Run("missing resource type", func(t *testing.T) {
		input := validation.NewStageInput("", "create")
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for missing resource type")
		}
	})

	t.Run("missing operation", func(t *testing.T) {
		input := validation.NewStageInput("bridge", "")
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for missing operation")
		}
	})

	t.Run("create bridge without name", func(t *testing.T) {
		input := validation.NewStageInput("bridge", "create")
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for missing required field 'name'")
		}
	})

	t.Run("create bridge with name", func(t *testing.T) {
		input := validation.NewStageInput("bridge", "create")
		input.Fields["name"] = "bridge1"
		result := engine.Validate(context.Background(), input)
		if !result.Valid {
			t.Errorf("should pass: %s", result.Summary())
		}
	})

	t.Run("delete without resource ID", func(t *testing.T) {
		input := validation.NewStageInput("bridge", "delete")
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for missing resource ID on delete")
		}
	})
}

func TestEngineSyntaxStage(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	engine.RegisterStage(&stages.SyntaxStage{})

	t.Run("invalid IP address", func(t *testing.T) {
		input := validation.NewStageInput("ip-address", "create")
		input.Fields["dst-address"] = "not-an-ip"
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for invalid IP address")
		}
	})

	t.Run("invalid CIDR", func(t *testing.T) {
		input := validation.NewStageInput("route", "create")
		input.Fields["dst-address"] = "192.168.1.0/33"
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for invalid CIDR")
		}
	})

	t.Run("VLAN ID out of range", func(t *testing.T) {
		input := validation.NewStageInput("vlan", "create")
		input.Fields["vlan-id"] = 5000
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for VLAN ID out of range")
		}
	})

	t.Run("valid VLAN ID", func(t *testing.T) {
		input := validation.NewStageInput("vlan", "create")
		input.Fields["vlan-id"] = 100
		result := engine.Validate(context.Background(), input)
		if !result.Valid {
			t.Errorf("should pass: %s", result.Summary())
		}
	})
}

func TestEngineSemanticStage(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	engine.RegisterStage(&stages.SemanticStage{})

	t.Run("bridge self reference", func(t *testing.T) {
		input := validation.NewStageInput("bridge-port", "create")
		input.Fields["bridge"] = "bridge1"
		input.Fields["interface"] = "bridge1"
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for bridge self reference")
		}
	})

	t.Run("route without nexthop", func(t *testing.T) {
		input := validation.NewStageInput("route", "create")
		input.Fields["dst-address"] = "10.0.0.0/8"
		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for route without gateway or interface")
		}
	})
}

func TestEngineCrossStage(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	engine.RegisterStage(&stages.CrossStage{})

	t.Run("VLAN ID conflict", func(t *testing.T) {
		input := validation.NewStageInput("vlan", "create")
		input.Fields["vlan-id"] = 100
		input.Fields["interface"] = "ether1"
		input.RelatedResources["vlan"] = []map[string]string{
			{".id": "*1", "vlan-id": "100", "interface": "ether1"},
		}

		result := engine.Validate(context.Background(), input)
		if result.Valid {
			t.Error("should fail for VLAN ID conflict")
		}
	})

	t.Run("no conflict on different interface", func(t *testing.T) {
		input := validation.NewStageInput("vlan", "create")
		input.Fields["vlan-id"] = 100
		input.Fields["interface"] = "ether1"
		input.RelatedResources["vlan"] = []map[string]string{
			{".id": "*1", "vlan-id": "100", "interface": "ether2"},
		}

		result := engine.Validate(context.Background(), input)
		if !result.Valid {
			t.Error("should pass - different interfaces")
		}
	})
}

func TestEngineMultiStage(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	engine.RegisterStage(&stages.SchemaStage{})
	engine.RegisterStage(&stages.SyntaxStage{})
	engine.RegisterStage(&stages.SemanticStage{})

	if engine.StageCount() != 3 {
		t.Errorf("expected 3 stages, got %d", engine.StageCount())
	}

	t.Run("stops at first error by default", func(t *testing.T) {
		input := validation.NewStageInput("", "create")
		result := engine.Validate(context.Background(), input)
		if result.StagesRun != 1 {
			t.Errorf("should stop at stage 1, ran %d stages", result.StagesRun)
		}
	})

	t.Run("valid input passes all stages", func(t *testing.T) {
		input := validation.NewStageInput("bridge", "create")
		input.Fields["name"] = "bridge1"
		result := engine.Validate(context.Background(), input)
		if !result.Valid {
			t.Errorf("should pass: %s", result.Summary())
		}
		if result.StagesRun != 3 {
			t.Errorf("should run all 3 stages, ran %d", result.StagesRun)
		}
	})
}

func TestEngineValidateField(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{})
	engine.RegisterStage(&stages.SchemaStage{})
	engine.RegisterStage(&stages.SyntaxStage{})
	engine.RegisterStage(&stages.SemanticStage{})
	engine.RegisterStage(&stages.DependencyStage{})

	input := validation.NewStageInput("vlan", "create")
	input.Fields["vlan-id"] = 5000

	result := engine.ValidateField(context.Background(), input, "vlan-id")
	if result.Valid {
		t.Error("should fail for VLAN ID out of range")
	}
	// Should only run stages 1-3
	if result.StagesRun != 3 {
		t.Errorf("field validation should run 3 stages, ran %d", result.StagesRun)
	}
}

func TestEngineContinueOnError(t *testing.T) {
	engine := validation.NewEngine(validation.EngineConfig{ContinueOnError: true})
	engine.RegisterStage(&stages.SchemaStage{})
	engine.RegisterStage(&stages.SyntaxStage{})
	engine.RegisterStage(&stages.SemanticStage{})

	// Missing resource type should fail at stage 1 but continue
	input := validation.NewStageInput("", "create")
	result := engine.Validate(context.Background(), input)
	if result.StagesRun != 3 {
		t.Errorf("continue-on-error should run all 3 stages, ran %d", result.StagesRun)
	}
}

func TestSeverityString(t *testing.T) {
	tests := []struct {
		s    validation.Severity
		want string
	}{
		{validation.SeverityInfo, "info"},
		{validation.SeverityWarning, "warning"},
		{validation.SeverityError, "error"},
	}

	for _, tt := range tests {
		if got := tt.s.String(); got != tt.want {
			t.Errorf("Severity(%d).String() = %s, want %s", tt.s, got, tt.want)
		}
	}
}

func TestValidationErrorString(t *testing.T) {
	err := &validation.ValidationError{
		StageName: "schema",
		Field:     "name",
		Message:   "required",
	}

	s := err.Error()
	if s == "" {
		t.Error("error string should not be empty")
	}
}
