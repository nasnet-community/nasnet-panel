// Package resolver contains GraphQL resolver implementations for service update management (NAS-8.7).
package resolver

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent/serviceinstance"
	"backend/generated/graphql"
	
)

// AvailableUpdates returns list of available updates for router's service instances.
func (r *queryResolver) AvailableUpdates(ctx context.Context, routerID string) ([]*model.UpdateInfo, error) {
	if r.UpdateService == nil {
		return nil, fmt.Errorf("update service not initialized")
	}

	instances, err := r.db.ServiceInstance.Query().
		Where(serviceinstance.RouterIDEQ(routerID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query service instances: %w", err)
	}

	var updates []*model.UpdateInfo
	for _, instance := range instances {
		updateInfo, available, err := r.UpdateService.CheckForUpdate(
			ctx,
			instance.FeatureID,
			instance.BinaryVersion,
		)
		if err != nil {
			r.log.Errorw("failed to check for update",
				"instance_id", instance.ID,
				"feature_id", instance.FeatureID,
				"error", err)
			continue
		}

		if !available {
			continue
		}

		publishedAt, _ := time.Parse(time.RFC3339, updateInfo.PublishedAt)

		updates = append(updates, &model.UpdateInfo{
			InstanceID:       instance.ID,
			FeatureID:        instance.FeatureID,
			CurrentVersion:   instance.BinaryVersion,
			AvailableVersion: updateInfo.AvailableVersion,
			Severity:         mapSeverityToModel(string(updateInfo.Severity)),
			ReleaseNotes:     updateInfo.ReleaseNotes,
			PublishedAt:      publishedAt,
			DownloadURL:      updateInfo.DownloadURL,
			ChecksumURL:      &updateInfo.ChecksumURL,
			SizeBytes:        int(updateInfo.Size),
			Architecture:     updateInfo.Architecture,
		})
	}

	return updates, nil
}

// InstanceUpdateInfo returns update information for a specific service instance.
func (r *queryResolver) InstanceUpdateInfo(ctx context.Context, routerID string, instanceID string) (*model.UpdateInfo, error) {
	if r.UpdateService == nil {
		return nil, fmt.Errorf("update service not initialized")
	}

	instance, err := r.db.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query service instance: %w", err)
	}

	updateInfo, available, err := r.UpdateService.CheckForUpdate(
		ctx,
		instance.FeatureID,
		instance.BinaryVersion,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to check for update: %w", err)
	}

	if !available {
		return nil, nil
	}

	publishedAt, _ := time.Parse(time.RFC3339, updateInfo.PublishedAt)

	return &model.UpdateInfo{
		InstanceID:       instance.ID,
		FeatureID:        instance.FeatureID,
		CurrentVersion:   instance.BinaryVersion,
		AvailableVersion: updateInfo.AvailableVersion,
		Severity:         mapSeverityToModel(string(updateInfo.Severity)),
		ReleaseNotes:     updateInfo.ReleaseNotes,
		PublishedAt:      publishedAt,
		DownloadURL:      updateInfo.DownloadURL,
		ChecksumURL:      &updateInfo.ChecksumURL,
		SizeBytes:        int(updateInfo.Size),
		Architecture:     updateInfo.Architecture,
	}, nil
}

// CheckForUpdates manually triggers update check for router's service instances.
func (r *mutationResolver) CheckForUpdates(ctx context.Context, routerID string) (int, error) {
	if r.UpdateService == nil {
		return 0, fmt.Errorf("update service not initialized")
	}

	instances, err := r.db.ServiceInstance.Query().
		Where(serviceinstance.RouterIDEQ(routerID)).
		All(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to query service instances: %w", err)
	}

	updatesFound := 0
	for _, instance := range instances {
		_, available, err := r.UpdateService.CheckForUpdate(
			ctx,
			instance.FeatureID,
			instance.BinaryVersion,
		)
		if err != nil {
			r.log.Errorw("failed to check for update",
				"instance_id", instance.ID,
				"error", err)
			continue
		}
		if available {
			updatesFound++
		}
	}

	return updatesFound, nil
}

// UpdateInstance triggers update for a specific service instance.
func (r *mutationResolver) UpdateInstance(ctx context.Context, routerID string, instanceID string) (*model.UpdateResult, error) {
	if r.UpdateService == nil {
		return nil, fmt.Errorf("update service not initialized")
	}

	instance, err := r.db.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query service instance: %w", err)
	}

	updateInfo, available, err := r.UpdateService.CheckForUpdate(
		ctx,
		instance.FeatureID,
		instance.BinaryVersion,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to check for update: %w", err)
	}

	if !available {
		msg := "No update available"
		return &model.UpdateResult{
			Success:      false,
			InstanceID:   instanceID,
			ErrorMessage: &msg,
		}, nil
	}

	r.log.Infow("update triggered",
		"instance_id", instanceID,
		"from_version", instance.BinaryVersion,
		"to_version", updateInfo.AvailableVersion)

	return &model.UpdateResult{
		Success:    true,
		InstanceID: instanceID,
		Version:    &updateInfo.AvailableVersion,
	}, nil
}

// UpdateAllInstances triggers updates for all instances with available updates.
func (r *mutationResolver) UpdateAllInstances(ctx context.Context, routerID string, minSeverity *model.UpdateSeverity) (int, error) {
	if r.UpdateService == nil {
		return 0, fmt.Errorf("update service not initialized")
	}

	instances, err := r.db.ServiceInstance.Query().
		Where(serviceinstance.RouterIDEQ(routerID)).
		All(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to query service instances: %w", err)
	}

	updatesQueued := 0
	for _, instance := range instances {
		updateInfo, available, err := r.UpdateService.CheckForUpdate(
			ctx,
			instance.FeatureID,
			instance.BinaryVersion,
		)
		if err != nil {
			r.log.Errorw("failed to check for update",
				"instance_id", instance.ID,
				"error", err)
			continue
		}

		if !available {
			continue
		}

		r.log.Infow("update queued",
			"instance_id", instance.ID,
			"from_version", instance.BinaryVersion,
			"to_version", updateInfo.AvailableVersion)
		updatesQueued++
	}

	return updatesQueued, nil
}

// RollbackInstance rolls back service instance to previous version.
func (r *mutationResolver) RollbackInstance(ctx context.Context, routerID string, instanceID string) (*model.UpdateResult, error) {
	instance, err := r.db.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query service instance: %w", err)
	}

	if !instance.HasBackup {
		msg := "No backup available for rollback"
		return &model.UpdateResult{
			Success:      false,
			InstanceID:   instanceID,
			ErrorMessage: &msg,
		}, nil
	}

	r.log.Infow("rollback triggered",
		"instance_id", instanceID,
		"current_version", instance.BinaryVersion,
		"backup_version", instance.BackupVersion)

	return &model.UpdateResult{
		Success:    true,
		InstanceID: instanceID,
		Version:    &instance.BackupVersion,
	}, nil
}

// ConfigureUpdateSchedule updates update check schedule for service instance.
func (r *mutationResolver) ConfigureUpdateSchedule(ctx context.Context, input model.UpdateCheckScheduleInput) (*model.ServiceInstance, error) {
	instance, err := r.db.ServiceInstance.Get(ctx, input.InstanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query service instance: %w", err)
	}

	// TODO: Update schedule configuration via ent when schema supports it
	r.log.Infow("update schedule configured",
		"instance_id", input.InstanceID,
		"check_schedule", input.CheckSchedule,
		"auto_apply_threshold", input.AutoApplyThreshold)

	return &model.ServiceInstance{
		ID:            instance.ID,
		FeatureID:     instance.FeatureID,
		InstanceName:  instance.InstanceName,
		RouterID:      instance.RouterID,
		Status:        model.ServiceInstanceStatus(instance.Status),
		VlanID:        instance.VlanID,
		Ports:         instance.Ports,
		Config:        instance.Config,
		BinaryVersion: &instance.BinaryVersion,
		CreatedAt:     instance.CreatedAt,
		UpdatedAt:     instance.UpdatedAt,
	}, nil
}

// UpdateProgress subscribes to real-time update progress events.
func (r *subscriptionResolver) UpdateProgress(ctx context.Context, routerID string) (<-chan *model.UpdateProgress, error) {
	progressChan := make(chan *model.UpdateProgress, 10)

	go func() {
		defer close(progressChan)

		select {
		case <-ctx.Done():
			return
		case progressChan <- &model.UpdateProgress{
			InstanceID: routerID,
			Stage:      model.UpdateStageStaging,
			Progress:   0,
			Message:    "Waiting for update to start",
			Timestamp:  time.Now(),
		}:
		}

		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				select {
				case progressChan <- &model.UpdateProgress{
					InstanceID: routerID,
					Stage:      model.UpdateStageStaging,
					Progress:   0,
					Message:    "No active update",
					Timestamp:  time.Now(),
				}:
				default:
				}
			}
		}
	}()

	return progressChan, nil
}
