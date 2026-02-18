package validation

import (
	"context"
)

// Stage defines the interface for a validation stage.
// Each stage receives a context describing the configuration change
// and returns validation findings.
type Stage interface {
	// Number returns the stage number (1-7).
	Number() int

	// Name returns the human-readable stage name.
	Name() string

	// Validate performs validation and returns findings.
	// The input map contains the configuration being validated.
	// Keys depend on the resource type being validated.
	Validate(ctx context.Context, input *StageInput) *Result
}

// StageInput holds the data passed to each validation stage.
type StageInput struct {
	// ResourceType identifies the type of resource being validated
	// (e.g., "bridge", "route", "vlan", "firewall-rule").
	ResourceType string

	// Operation is the operation being performed ("create", "update", "delete").
	Operation string

	// ResourceID is the ID of the resource being modified (empty for create).
	ResourceID string

	// Fields contains the field values being validated.
	// Keys are field names, values are their proposed values.
	Fields map[string]interface{}

	// CurrentState holds the current resource state (for update/delete).
	// Nil for create operations.
	CurrentState map[string]string

	// RelatedResources holds related resources for cross-resource validation.
	// Key is the resource type, value is a list of resource data maps.
	RelatedResources map[string][]map[string]string

	// RouterID is the target router for platform-specific validation.
	RouterID string

	// Metadata holds additional context for validation stages.
	Metadata map[string]interface{}
}

// NewStageInput creates a new stage input with required fields.
func NewStageInput(resourceType, operation string) *StageInput {
	return &StageInput{
		ResourceType:     resourceType,
		Operation:        operation,
		Fields:           make(map[string]interface{}),
		RelatedResources: make(map[string][]map[string]string),
		Metadata:         make(map[string]interface{}),
	}
}

// stageRegistry holds registered validation stages.
type stageRegistry struct {
	stages []Stage
}

// newStageRegistry creates a new empty stage registry.
func newStageRegistry() *stageRegistry {
	return &stageRegistry{
		stages: make([]Stage, 0, 7),
	}
}

// Register adds a stage to the registry.
// Stages are automatically sorted by number when the engine runs.
func (r *stageRegistry) Register(stage Stage) {
	r.stages = append(r.stages, stage)
}

// GetStages returns all registered stages sorted by number.
func (r *stageRegistry) GetStages() []Stage {
	// Simple insertion sort (max 7 stages).
	sorted := make([]Stage, len(r.stages))
	copy(sorted, r.stages)
	for i := 1; i < len(sorted); i++ {
		key := sorted[i]
		j := i - 1
		for j >= 0 && sorted[j].Number() > key.Number() {
			sorted[j+1] = sorted[j]
			j--
		}
		sorted[j+1] = key
	}
	return sorted
}
