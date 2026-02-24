package orchestrator

import (
	"context"
	"fmt"

	"backend/internal/events"
	"backend/internal/router"

	"go.uber.org/zap"
)

// ProvisioningResource describes a single RouterOS resource to be provisioned.
type ProvisioningResource struct {
	// Path is the RouterOS resource path (e.g., "/interface/wireguard").
	Path string

	// Action is "add" or "set".
	Action string

	// Args are the command arguments.
	Args map[string]string

	// Phase is automatically classified from Path if left as zero.
	Phase Phase
}

// PhaseResult holds the outcome of executing a single phase.
type PhaseResult struct {
	Phase       Phase
	ResourceIDs []ResourceID
	Error       error
}

// ResourceID identifies a RouterOS resource that was created during provisioning.
type ResourceID struct {
	Path string
	ID   string
}

// Orchestrator executes provisioning resources in dependency-ordered phases and
// performs best-effort rollback on failure.
type Orchestrator struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	publisher  *events.Publisher
	logger     *zap.SugaredLogger
}

// Config holds dependencies for creating an Orchestrator.
type Config struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewOrchestrator creates a new Orchestrator from the provided configuration.
func NewOrchestrator(cfg Config) *Orchestrator {
	var publisher *events.Publisher
	if cfg.EventBus != nil {
		publisher = events.NewPublisher(cfg.EventBus, "provisioning.orchestrator")
	}
	return &Orchestrator{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		publisher:  publisher,
		logger:     cfg.Logger,
	}
}

// Provision provisions the given resources in phase order (1→8).
//
// It classifies each resource into a phase, groups them, then executes phase by
// phase. On failure it calls Rollback on all completed phases and returns the
// partial results alongside the error.
func (o *Orchestrator) Provision(
	ctx context.Context,
	routerID, sessionID string,
	resources []ProvisioningResource,
) ([]PhaseResult, error) {
	// Classify resources into phases.
	phaseResources := o.classifyResources(resources)

	var completedResults []PhaseResult

	for _, phase := range PhaseOrder() {
		phaseRes, ok := phaseResources[phase]
		if !ok || len(phaseRes) == 0 {
			continue
		}

		comment := fmt.Sprintf("session=%s phase=%s", sessionID, phase)
		result, err := o.executePhase(ctx, phase, phaseRes, comment)
		if result != nil {
			completedResults = append(completedResults, *result)
		}

		if err != nil {
			o.logger.Warnw("provisioning phase failed, rolling back",
				"routerID", routerID,
				"sessionID", sessionID,
				"phase", phase,
				"error", err,
			)
			_ = o.Rollback(ctx, completedResults)
			return completedResults, fmt.Errorf("phase %s failed: %w", phase, err)
		}
	}

	return completedResults, nil
}

// executePhase runs every resource in the given phase sequentially, tracking
// the IDs of created resources for later rollback.
func (o *Orchestrator) executePhase(
	ctx context.Context,
	phase Phase,
	resources []ProvisioningResource,
	comment string,
) (*PhaseResult, error) {

	result := &PhaseResult{Phase: phase}

	for i := range resources {
		res := &resources[i]

		args := make(map[string]string, len(res.Args))
		for k, v := range res.Args {
			args[k] = v
		}
		if comment != "" {
			args["comment"] = comment
		}

		cmd := router.Command{
			Path:   res.Path,
			Action: res.Action,
			Args:   args,
		}

		o.logger.Debugw("executing provisioning command",
			"phase", phase,
			"path", res.Path,
			"action", res.Action,
		)

		cmdResult, err := o.routerPort.ExecuteCommand(ctx, cmd)
		if err != nil {
			result.Error = fmt.Errorf("command %s %s failed: %w", res.Action, res.Path, err)
			return result, result.Error
		}
		if !cmdResult.Success {
			result.Error = fmt.Errorf("command %s %s unsuccessful: %w", res.Action, res.Path, cmdResult.Error)
			return result, result.Error
		}

		// Track created resource IDs for rollback (only for "add" operations).
		if res.Action == "add" && cmdResult.ID != "" {
			result.ResourceIDs = append(result.ResourceIDs, ResourceID{
				Path: res.Path,
				ID:   cmdResult.ID,
			})
		}
	}

	return result, nil
}

// classifyResources groups resources by their phase using ClassifyResourcePath.
func (o *Orchestrator) classifyResources(resources []ProvisioningResource) map[Phase][]ProvisioningResource {
	grouped := make(map[Phase][]ProvisioningResource)
	for _, res := range resources {
		phase := res.Phase
		if phase == 0 {
			phase = ClassifyResourcePath(res.Path)
		}
		grouped[phase] = append(grouped[phase], res)
	}
	return grouped
}
