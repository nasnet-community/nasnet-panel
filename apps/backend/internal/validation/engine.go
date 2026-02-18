package validation

import (
	"context"
	"fmt"
	"log"

	"backend/internal/router"
)

// Engine orchestrates the 7-stage validation pipeline.
// It runs stages sequentially, stopping on the first blocking error
// unless ContinueOnError is set.
type Engine struct {
	registry        *stageRegistry
	routerPort      router.RouterPort
	continueOnError bool
}

// EngineConfig holds configuration for the validation engine.
type EngineConfig struct {
	// RouterPort is used by stage 7 (dry-run) for router communication.
	RouterPort router.RouterPort

	// ContinueOnError, if true, runs all stages even after errors.
	// Default (false) stops at the first stage with blocking errors.
	ContinueOnError bool
}

// NewEngine creates a new validation engine.
func NewEngine(config EngineConfig) *Engine {
	return &Engine{
		registry:        newStageRegistry(),
		routerPort:      config.RouterPort,
		continueOnError: config.ContinueOnError,
	}
}

// RegisterStage adds a validation stage to the engine.
func (e *Engine) RegisterStage(stage Stage) {
	e.registry.Register(stage)
}

// RegisterDefaults registers the standard 7-stage validation pipeline.
// This is a convenience method for typical usage.
func (e *Engine) RegisterDefaults() {
	// Stages are registered in the stages/ sub-package
	// and added here by the caller. This method is a placeholder
	// for when all stage implementations are available.
}

// Validate runs the full validation pipeline on the given input.
// Returns the aggregate result with findings from all executed stages.
func (e *Engine) Validate(ctx context.Context, input *StageInput) *Result {
	result := NewResult()
	stages := e.registry.GetStages()

	if len(stages) == 0 {
		log.Printf("[validation] No stages registered, skipping validation")
		return result
	}

	for _, stage := range stages {
		select {
		case <-ctx.Done():
			result.AddError(&Error{
				Stage:     stage.Number(),
				StageName: stage.Name(),
				Severity:  SeverityError,
				Field:     "",
				Message:   fmt.Sprintf("validation canceled: %v", ctx.Err()),
				Code:      "CANCELED",
			})
			return result
		default:
		}

		stageResult := stage.Validate(ctx, input)
		result.Merge(stageResult)
		result.StagesRun++

		// Stop on first blocking error unless configured to continue
		if stageResult.HasErrors() && !e.continueOnError {
			log.Printf("[validation] Stage %d (%s) failed, stopping pipeline",
				stage.Number(), stage.Name())
			break
		}
	}

	return result
}

// ValidateField runs validation on a single field (for real-time form feedback).
// Only runs stages 1-3 (schema, syntax, semantic) for fast response.
func (e *Engine) ValidateField(ctx context.Context, input *StageInput, field string) *Result {
	result := NewResult()
	stages := e.registry.GetStages()

	for _, stage := range stages {
		// Only run stages 1-3 for field validation
		if stage.Number() > 3 {
			break
		}

		stageResult := stage.Validate(ctx, input)

		// Filter to only include errors for the specified field
		for _, err := range stageResult.Errors {
			if err.Field == field {
				result.AddError(err)
			}
		}
		result.StagesRun++
	}

	return result
}

// StageCount returns the number of registered stages.
func (e *Engine) StageCount() int {
	return len(e.registry.GetStages())
}
