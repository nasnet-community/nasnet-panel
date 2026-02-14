package resolver

// This file contains service template subscription resolvers and helper functions (NAS-8.9).
// Query and mutation resolvers are in templates.resolvers.go.

import (
	"context"
	"fmt"
	"time"

	"backend/generated/graphql"
	
	"backend/internal/events"
	"backend/internal/templates"
)

// TemplateInstallProgress subscribes to template installation progress
func (r *subscriptionResolver) TemplateInstallProgress(ctx context.Context, routerID string) (<-chan *model.TemplateInstallProgress, error) {
	r.log.Infow("TemplateInstallProgress subscription started", "routerID", routerID)

	// Create channel for GraphQL subscription
	ch := make(chan *model.TemplateInstallProgress, 10)

	// Subscribe to template installation events from EventBus
	eventHandler := func(ctx context.Context, event events.Event) error {
		// Convert event to GraphQL model based on event type
		switch evt := event.(type) {
		case *events.TemplateInstallStartedEvent:
			if evt.RouterID != routerID {
				return nil // Skip events for other routers
			}

			now := time.Now()
			progress := &model.TemplateInstallProgress{
				TemplateID:     evt.TemplateID,
				TotalServices:  evt.TotalServices,
				InstalledCount: 0,
				Status:         model.TemplateInstallationStatusInProgress,
				StartedAt:      now,
			}

			select {
			case ch <- progress:
			case <-ctx.Done():
				return ctx.Err()
			}

		case *events.TemplateInstallProgressEvent:
			if evt.RouterID != routerID {
				return nil
			}

			currentSvc := evt.CurrentService
			progress := &model.TemplateInstallProgress{
				TemplateID:     evt.TemplateID,
				TotalServices:  evt.TotalServices,
				InstalledCount: evt.InstalledCount,
				CurrentService: &currentSvc,
				Status:         model.TemplateInstallationStatusInProgress,
				StartedAt:      evt.StartedAt,
			}

			select {
			case ch <- progress:
			case <-ctx.Done():
				return ctx.Err()
			}

		case *events.TemplateInstallCompletedEvent:
			if evt.RouterID != routerID {
				return nil
			}

			completedAt := evt.CompletedAt
			progress := &model.TemplateInstallProgress{
				TemplateID:     evt.TemplateID,
				TotalServices:  evt.TotalServices,
				InstalledCount: evt.InstalledCount,
				Status:         model.TemplateInstallationStatusCompleted,
				StartedAt:      evt.StartedAt,
				CompletedAt:    &completedAt,
			}

			select {
			case ch <- progress:
			case <-ctx.Done():
				return ctx.Err()
			}

			// Close channel after completion
			close(ch)

		case *events.TemplateInstallFailedEvent:
			if evt.RouterID != routerID {
				return nil
			}

			errMsg := evt.ErrorMessage
			failedAt := evt.FailedAt
			progress := &model.TemplateInstallProgress{
				TemplateID:     evt.TemplateID,
				TotalServices:  evt.TotalServices,
				InstalledCount: evt.InstalledCount,
				Status:         model.TemplateInstallationStatusFailed,
				ErrorMessage:   &errMsg,
				StartedAt:      evt.StartedAt,
				CompletedAt:    &failedAt,
			}

			select {
			case ch <- progress:
			case <-ctx.Done():
				return ctx.Err()
			}

			// Close channel after failure
			close(ch)
		}

		return nil
	}

	// Subscribe to event bus
	if r.EventBus != nil {
		if err := r.EventBus.SubscribeAll(eventHandler); err != nil {
			r.log.Errorw("failed to subscribe to template events", "error", err)
			close(ch)
			return nil, fmt.Errorf("failed to subscribe to template events: %w", err)
		}
	}

	// Cleanup when context is canceled
	go func() {
		<-ctx.Done()
		r.log.Infow("TemplateInstallProgress subscription ended", "routerID", routerID)
	}()

	return ch, nil
}

// convertTemplateToGraphQL converts a templates.ServiceTemplate to GraphQL model
func convertTemplateToGraphQL(tmpl *templates.ServiceTemplate) *model.ServiceTemplate {
	if tmpl == nil {
		return nil
	}

	// Convert category
	category := model.ServiceTemplateCategory(tmpl.Category)

	// Convert scope
	scope := model.TemplateScope(tmpl.Scope)

	// Convert services
	services := make([]*model.ServiceSpec, len(tmpl.Services))
	for i, svc := range tmpl.Services {
		services[i] = &model.ServiceSpec{
			ServiceType:     svc.ServiceType,
			Name:            svc.Name,
			ConfigOverrides: svc.ConfigOverrides,
			DependsOn:       svc.DependsOn,
			MemoryLimitMb:   &svc.MemoryLimitMB,
			CPUShares:       &svc.CPUShares,
			RequiresBridge:  &svc.RequiresBridge,
			VlanID:          svc.VLANID,
			PortMappings:    convertPortMappings(svc.PortMappings),
		}
	}

	// Convert config variables
	configVars := make([]*model.TemplateVariable, len(tmpl.ConfigVariables))
	for i, v := range tmpl.ConfigVariables {
		varType := model.TemplateVariableType(v.Type)

		// Type assert Default to map[string]any
		var defaultVal map[string]any
		if v.Default != nil {
			if m, ok := v.Default.(map[string]any); ok {
				defaultVal = m
			}
		}

		// Type assert EnumValues to []map[string]any
		var enumVals []map[string]any
		if len(v.EnumValues) > 0 {
			enumVals = make([]map[string]any, 0, len(v.EnumValues))
			for _, val := range v.EnumValues {
				if m, ok := val.(map[string]any); ok {
					enumVals = append(enumVals, m)
				}
			}
		}

		configVars[i] = &model.TemplateVariable{
			Name:              v.Name,
			Type:              varType,
			Required:          v.Required,
			Default:           defaultVal,
			Description:       v.Description,
			Label:             v.Label,
			ValidationPattern: &v.ValidationPattern,
			MinValue:          v.MinValue,
			MaxValue:          v.MaxValue,
			EnumValues:        enumVals,
		}
	}

	// Convert routing suggestions
	var routingSuggestions []*model.SuggestedRoutingRule
	if len(tmpl.SuggestedRouting) > 0 {
		routingSuggestions = make([]*model.SuggestedRoutingRule, len(tmpl.SuggestedRouting))
		for i, rule := range tmpl.SuggestedRouting {
			routingSuggestions[i] = &model.SuggestedRoutingRule{
				DevicePattern:   rule.DevicePattern,
				TargetService:   rule.TargetService,
				Protocol:        &rule.Protocol,
				DestinationPort: rule.DestinationPort,
				Description:     rule.Description,
			}
		}
	}

	// Convert resource estimate
	var resourceEst *model.ResourceEstimate
	if tmpl.EstimatedResources.TotalMemoryMB > 0 {
		resourceEst = &model.ResourceEstimate{
			TotalMemoryMb:  tmpl.EstimatedResources.TotalMemoryMB,
			TotalCPUShares: tmpl.EstimatedResources.TotalCPUShares,
			DiskSpaceMb:    tmpl.EstimatedResources.DiskSpaceMB,
			NetworkPorts:   tmpl.EstimatedResources.NetworkPorts,
			VlansRequired:  tmpl.EstimatedResources.VLANsRequired,
		}
	}

	return &model.ServiceTemplate{
		ID:                 tmpl.ID,
		Name:               tmpl.Name,
		Description:        tmpl.Description,
		Category:           category,
		Scope:              scope,
		Version:            tmpl.Version,
		IsBuiltIn:          true,
		Author:             &tmpl.Author,
		RouterID:           nil,
		Services:           services,
		ConfigVariables:    configVars,
		SuggestedRouting:   routingSuggestions,
		EstimatedResources: resourceEst,
		Tags:               tmpl.Tags,
		Prerequisites:      tmpl.Prerequisites,
		Documentation:      &tmpl.Documentation,
		Examples:           tmpl.Examples,
		CreatedAt:          tmpl.CreatedAt,
		UpdatedAt:          tmpl.UpdatedAt,
	}
}

// convertPortMappings converts templates.Port to GraphQL model
func convertPortMappings(ports []templates.Port) []*model.PortMapping {
	result := make([]*model.PortMapping, len(ports))
	for i, p := range ports {
		result[i] = &model.PortMapping{
			Internal: p.Internal,
			External: p.External,
			Protocol: p.Protocol,
			Purpose:  &p.Purpose,
		}
	}
	return result
}
