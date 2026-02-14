package resolver

// This file implements isolation status query and resource limits mutation resolvers.
// Part of NAS-8.4: Service Isolation (GraphQL Layer).

import (
	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/generated/graphql"
	
	"backend/internal/orchestrator"
	"context"
	"fmt"
	"time"
)

// InstanceIsolation is the resolver for the instanceIsolation query field.
// Returns complete isolation status including violations and resource limits.
func (r *queryResolver) InstanceIsolation(ctx context.Context, routerID string, instanceID string) (*model.IsolationStatus, error) {
	r.log.Infow("InstanceIsolation query called",
		"routerID", routerID,
		"instanceID", instanceID)

	// Load the service instance from database
	instance, err := r.db.ServiceInstance.Query().
		Where(serviceinstance.IDEQ(instanceID)).
		Where(serviceinstance.RouterIDEQ(routerID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("service instance not found: %s", instanceID)
		}
		r.log.Errorw("failed to query service instance",
			"error", err,
			"instanceID", instanceID)
		return nil, fmt.Errorf("failed to query service instance: %w", err)
	}

	// Initialize isolation status with empty violations
	isolationStatus := &model.IsolationStatus{
		Violations:   []*model.IsolationViolation{},
		LastVerified: nil,
	}

	// Check if IsolationVerifier is available
	isolationVerifier := r.InstanceManager.IsolationVerifier()
	if r.InstanceManager == nil || isolationVerifier == nil {
		r.log.Infow("IsolationVerifier not available, returning empty status",
			"instanceID", instanceID)

		// Return empty status with nil resource limits (verifier unavailable)
		return isolationStatus, nil
	}

	// Run isolation verification
	report, err := isolationVerifier.VerifyPreStart(ctx, instance)
	if err != nil {
		r.log.Errorw("failed to run isolation verification",
			"error", err,
			"instanceID", instanceID)
		return nil, fmt.Errorf("failed to run isolation verification: %w", err)
	}

	// Convert violations to GraphQL model
	now := time.Now()
	for _, violation := range report.Violations {
		isolationStatus.Violations = append(isolationStatus.Violations, &model.IsolationViolation{
			Layer:     violation.Layer,
			Severity:  convertIsolationSeverity(violation.Severity),
			Message:   violation.Description,
			Timestamp: now,
		})
	}

	isolationStatus.LastVerified = &now

	// Get resource limits if ResourceLimiter is available
	resourceLimiter := r.InstanceManager.ResourceLimiter()
	if resourceLimiter != nil {
		// Check if instance is running (has PID)
		// For MVP, we assume memory limit is stored somewhere or use default
		// In production, this would query actual cgroup limits
		resourceLimits := &model.ResourceLimits{
			MemoryMb:   50, // Default 50MB (would come from cgroup or database)
			CPUPercent: nil,
			Applied:    resourceLimiter.IsCgroupsEnabled(),
		}
		isolationStatus.ResourceLimits = resourceLimits
	}

	r.log.Infow("isolation status retrieved",
		"instanceID", instanceID,
		"violationCount", len(isolationStatus.Violations),
		"passed", len(isolationStatus.Violations) == 0)

	return isolationStatus, nil
}

// SetResourceLimits is the resolver for the setResourceLimits mutation field.
// Applies cgroups v2 memory limits to a running service instance.
func (r *mutationResolver) SetResourceLimits(ctx context.Context, input model.SetResourceLimitsInput) (*model.ResourceLimitsPayload, error) {
	r.log.Infow("SetResourceLimits mutation called",
		"routerID", input.RouterID,
		"instanceID", input.InstanceID,
		"memoryMB", input.MemoryMb)

	// Check if InstanceManager is available
	if r.InstanceManager == nil {
		return &model.ResourceLimitsPayload{
			Success:        false,
			ResourceLimits: nil,
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "Instance manager service is not available",
			}},
		}, nil
	}

	// Check if ResourceLimiter is available
	resourceLimiter := r.InstanceManager.ResourceLimiter()
	if resourceLimiter == nil {
		return &model.ResourceLimitsPayload{
			Success:        false,
			ResourceLimits: nil,
			Errors: []*model.MutationError{{
				Code:    "SERVICE_UNAVAILABLE",
				Message: "Resource limiter service is not available",
			}},
		}, nil
	}

	// Load the service instance from database
	instance, err := r.db.ServiceInstance.Query().
		Where(serviceinstance.IDEQ(input.InstanceID)).
		Where(serviceinstance.RouterIDEQ(input.RouterID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return &model.ResourceLimitsPayload{
				Success:        false,
				ResourceLimits: nil,
				Errors: []*model.MutationError{{
					Code:    "NOT_FOUND",
					Message: fmt.Sprintf("Service instance not found: %s", input.InstanceID),
				}},
			}, nil
		}
		r.log.Errorw("failed to query service instance",
			"error", err,
			"instanceID", input.InstanceID)
		return &model.ResourceLimitsPayload{
			Success:        false,
			ResourceLimits: nil,
			Errors: []*model.MutationError{{
				Code:    "DATABASE_ERROR",
				Message: fmt.Sprintf("Failed to query service instance: %v", err),
			}},
		}, nil
	}

	// Check if instance is running (would need PID to apply limits)
	// For MVP, we'll assume we can get the PID from the instance manager
	// In production, this would be stored in the database or tracked by InstanceManager
	pid := 0 // Placeholder - would come from instance manager's process tracker

	// Validate memory limit (minimum 16MB)
	if input.MemoryMb < 16 {
		return &model.ResourceLimitsPayload{
			Success:        false,
			ResourceLimits: nil,
			Errors: []*model.MutationError{{
				Code:    "INVALID_INPUT",
				Message: fmt.Sprintf("Memory limit %dMB is below minimum 16MB", input.MemoryMb),
				Field:   ptrString("memoryMB"),
			}},
		}, nil
	}

	// Apply memory limit via ResourceLimiter
	err = resourceLimiter.ApplyMemoryLimit(ctx, pid, input.MemoryMb, instance.ID, instance.FeatureID)
	if err != nil {
		r.log.Errorw("failed to apply memory limit",
			"error", err,
			"instanceID", input.InstanceID,
			"memoryMB", input.MemoryMb)
		return &model.ResourceLimitsPayload{
			Success:        false,
			ResourceLimits: nil,
			Errors: []*model.MutationError{{
				Code:    "LIMIT_APPLICATION_FAILED",
				Message: fmt.Sprintf("Failed to apply memory limit: %v", err),
			}},
		}, nil
	}

	// Return success with updated resource limits
	resourceLimits := &model.ResourceLimits{
		MemoryMb:   input.MemoryMb,
		CPUPercent: nil,
		Applied:    resourceLimiter.IsCgroupsEnabled(),
	}

	r.log.Infow("resource limits applied successfully",
		"instanceID", input.InstanceID,
		"memoryMB", input.MemoryMb,
		"cgroupsEnabled", resourceLimits.Applied)

	return &model.ResourceLimitsPayload{
		Success:        true,
		ResourceLimits: resourceLimits,
		Errors:         []*model.MutationError{},
	}, nil
}

// convertIsolationSeverity converts orchestrator.IsolationSeverity to GraphQL model
func convertIsolationSeverity(severity orchestrator.IsolationSeverity) model.IsolationSeverity {
	switch severity {
	case orchestrator.SeverityError:
		return model.IsolationSeverityError
	case orchestrator.SeverityWarning:
		return model.IsolationSeverityWarning
	default:
		return model.IsolationSeverityInfo
	}
}

// ptrString returns a pointer to the given string.
func ptrString(s string) *string {
	return &s
}
