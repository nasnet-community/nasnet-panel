package orchestrator

import (
	"context"

	"backend/internal/router"
)

// RollbackResult summarizes the outcome of a rollback operation.
type RollbackResult struct {
	TotalResources int
	Removed        int
	Failed         int
	Errors         []RollbackError
}

// RollbackError records a failure that occurred while removing a single resource.
type RollbackError struct {
	Path  string
	ID    string
	Error error
}

// Rollback removes resources created in the provided phase results in reverse
// order (phases 8→1, resources within each phase in reverse creation order).
//
// Only resources with Action "add" can be removed; "set" resources are logged
// as warnings and skipped. Removal failures are accumulated and returned in
// the summary — the function always attempts all resources (best-effort).
func (o *Orchestrator) Rollback(ctx context.Context, results []PhaseResult) *RollbackResult {
	summary := &RollbackResult{}

	// Iterate phases in reverse order.
	for i := len(results) - 1; i >= 0; i-- {
		phaseResult := results[i]
		ids := phaseResult.ResourceIDs

		// Iterate resources within the phase in reverse creation order.
		for j := len(ids) - 1; j >= 0; j-- {
			res := ids[j]
			summary.TotalResources++

			cmd := router.Command{
				Path:   res.Path,
				Action: "remove",
				Args:   map[string]string{".id": res.ID},
			}

			o.logger.Infow("rolling back provisioned resource",
				"phase", phaseResult.Phase,
				"path", res.Path,
				"id", res.ID,
			)

			cmdResult, err := o.routerPort.ExecuteCommand(ctx, cmd)
			if err != nil {
				o.logger.Warnw("rollback remove failed",
					"phase", phaseResult.Phase,
					"path", res.Path,
					"id", res.ID,
					"error", err,
				)
				summary.Failed++
				summary.Errors = append(summary.Errors, RollbackError{
					Path:  res.Path,
					ID:    res.ID,
					Error: err,
				})
				continue
			}

			if !cmdResult.Success && cmdResult.Error != nil {
				o.logger.Warnw("rollback remove command unsuccessful",
					"phase", phaseResult.Phase,
					"path", res.Path,
					"id", res.ID,
					"error", cmdResult.Error,
				)
				summary.Failed++
				summary.Errors = append(summary.Errors, RollbackError{
					Path:  res.Path,
					ID:    res.ID,
					Error: cmdResult.Error,
				})
				continue
			}

			summary.Removed++
		}
	}

	o.logger.Infow("rollback complete",
		"total", summary.TotalResources,
		"removed", summary.Removed,
		"failed", summary.Failed,
	)

	return summary
}
