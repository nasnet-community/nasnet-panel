package resolver

// Interface resolver implementations for NAS-6.1
// These resolvers connect GraphQL queries, mutations, and subscriptions to the InterfaceService

import (
	"backend/graph/model"
	"backend/internal/events"
	"backend/internal/services"
	"context"
	"fmt"
	"log"
)

// =============================================================================
// Query Resolvers
// =============================================================================

// Interface resolves the interface query for a single interface by ID.
func (r *queryResolver) Interface(ctx context.Context, routerID string, id string) (*model.Interface, error) {
	// Fetch interface data from service
	interfaceData, err := r.InterfaceService.GetInterface(ctx, routerID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get interface: %w", err)
	}

	// Convert to GraphQL model
	return mapInterfaceDataToGraphQL(interfaceData), nil
}

// Interfaces resolves the interfaces query with optional filtering and pagination.
func (r *queryResolver) Interfaces(
	ctx context.Context,
	routerID string,
	interfaceType *model.InterfaceType,
	pagination *model.PaginationInput,
) (*model.InterfaceConnection, error) {
	// Convert GraphQL type to service type
	var serviceType *string
	if interfaceType != nil {
		typeStr := string(*interfaceType)
		serviceType = &typeStr
	}

	// Fetch interfaces from service
	interfaces, err := r.InterfaceService.ListInterfaces(ctx, routerID, serviceType)
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	// Apply pagination (simple offset-based for now)
	start := 0
	limit := len(interfaces)
	if pagination != nil && pagination.First != nil {
		limit = *pagination.First
		if pagination.After != nil {
			// After cursor is base64-encoded offset
			// For simplicity, we'll skip cursor-based pagination for now
		}
	}

	if start >= len(interfaces) {
		start = len(interfaces)
	}
	end := start + limit
	if end > len(interfaces) {
		end = len(interfaces)
	}

	paginatedInterfaces := interfaces[start:end]

	// Build edges
	edges := make([]*model.InterfaceEdge, len(paginatedInterfaces))
	for i, iface := range paginatedInterfaces {
		edges[i] = &model.InterfaceEdge{
			Node:   mapInterfaceDataToGraphQL(iface),
			Cursor: fmt.Sprintf("%d", start+i), // Simple offset-based cursor
		}
	}

	// Build page info
	pageInfo := &model.PageInfo{
		HasNextPage:     end < len(interfaces),
		HasPreviousPage: start > 0,
	}
	if len(edges) > 0 {
		pageInfo.StartCursor = &edges[0].Cursor
		pageInfo.EndCursor = &edges[len(edges)-1].Cursor
	}

	totalCount := len(interfaces)

	return &model.InterfaceConnection{
		Edges:      edges,
		PageInfo:   pageInfo,
		TotalCount: &totalCount,
	}, nil
}

// =============================================================================
// Mutation Resolvers
// =============================================================================

// UpdateInterface resolves the updateInterface mutation.
func (r *mutationResolver) UpdateInterface(
	ctx context.Context,
	routerID string,
	interfaceID string,
	input model.UpdateInterfaceInput,
) (*model.UpdateInterfacePayload, error) {
	// Convert GraphQL input to service input
	serviceInput := services.UpdateInterfaceInput{
		Enabled: input.Enabled,
		MTU:     input.Mtu,
		Comment: input.Comment,
	}

	// Call service
	result, err := r.InterfaceService.UpdateInterface(ctx, routerID, interfaceID, serviceInput)
	if err != nil {
		return &model.UpdateInterfacePayload{
			Interface: nil,
			Errors: []*model.MutationError{
				{
					Code:    "UPDATE_FAILED",
					Message: err.Error(),
				},
			},
		}, nil
	}

	return &model.UpdateInterfacePayload{
		Interface: mapInterfaceDataToGraphQL(result),
		Errors:    []*model.MutationError{},
	}, nil
}

// EnableInterface resolves the enableInterface mutation.
func (r *mutationResolver) EnableInterface(
	ctx context.Context,
	routerID string,
	interfaceID string,
) (*model.UpdateInterfacePayload, error) {
	// Call service
	result, err := r.InterfaceService.EnableInterface(ctx, routerID, interfaceID)
	if err != nil {
		return &model.UpdateInterfacePayload{
			Interface: nil,
			Errors: []*model.MutationError{
				{
					Code:    "ENABLE_FAILED",
					Message: err.Error(),
				},
			},
		}, nil
	}

	return &model.UpdateInterfacePayload{
		Interface: mapInterfaceDataToGraphQL(result),
		Errors:    []*model.MutationError{},
	}, nil
}

// DisableInterface resolves the disableInterface mutation.
func (r *mutationResolver) DisableInterface(
	ctx context.Context,
	routerID string,
	interfaceID string,
) (*model.UpdateInterfacePayload, error) {
	// Call service
	result, err := r.InterfaceService.DisableInterface(ctx, routerID, interfaceID)
	if err != nil {
		return &model.UpdateInterfacePayload{
			Interface: nil,
			Errors: []*model.MutationError{
				{
					Code:    "DISABLE_FAILED",
					Message: err.Error(),
				},
			},
		}, nil
	}

	return &model.UpdateInterfacePayload{
		Interface: mapInterfaceDataToGraphQL(result),
		Errors:    []*model.MutationError{},
	}, nil
}

// BatchInterfaceOperation resolves the batchInterfaceOperation mutation.
func (r *mutationResolver) BatchInterfaceOperation(
	ctx context.Context,
	routerID string,
	input model.BatchInterfaceInput,
) (*model.BatchInterfacePayload, error) {
	// Convert GraphQL action to service action
	var serviceAction services.BatchAction
	switch input.Action {
	case model.BatchInterfaceActionEnable:
		serviceAction = services.BatchActionEnable
	case model.BatchInterfaceActionDisable:
		serviceAction = services.BatchActionDisable
	case model.BatchInterfaceActionUpdate:
		serviceAction = services.BatchActionUpdate
	default:
		return &model.BatchInterfacePayload{
			Succeeded: []*model.Interface{},
			Failed:    []*model.InterfaceOperationError{},
			Errors: []*model.MutationError{
				{
					Code:    "INVALID_ACTION",
					Message: fmt.Sprintf("unknown batch action: %s", input.Action),
				},
			},
		}, nil
	}

	// Convert input if provided (for UPDATE action)
	var serviceInput *services.UpdateInterfaceInput
	if input.Input.IsSet() && input.Input.Value() != nil {
		updateInput := input.Input.Value()
		var enabled *bool
		if updateInput.Enabled.IsSet() {
			enabled = updateInput.Enabled.Value()
		}
		var mtu *int
		if updateInput.Mtu.IsSet() {
			mtu = updateInput.Mtu.Value()
		}
		var comment *string
		if updateInput.Comment.IsSet() {
			comment = updateInput.Comment.Value()
		}

		serviceInput = &services.UpdateInterfaceInput{
			Enabled: enabled,
			MTU:     mtu,
			Comment: comment,
		}
	}

	// Call service
	succeeded, failed, err := r.InterfaceService.BatchOperation(
		ctx,
		routerID,
		input.InterfaceIds,
		serviceAction,
		serviceInput,
	)

	// Handle general errors
	if err != nil {
		return &model.BatchInterfacePayload{
			Succeeded: []*model.Interface{},
			Failed:    []*model.InterfaceOperationError{},
			Errors: []*model.MutationError{
				{
					Code:    "BATCH_OPERATION_FAILED",
					Message: err.Error(),
				},
			},
		}, nil
	}

	// Convert results to GraphQL models
	succeededInterfaces := make([]*model.Interface, len(succeeded))
	for i, iface := range succeeded {
		succeededInterfaces[i] = mapInterfaceDataToGraphQL(iface)
	}

	failedOperations := make([]*model.InterfaceOperationError, len(failed))
	for i, opErr := range failed {
		failedOperations[i] = &model.InterfaceOperationError{
			InterfaceID:   opErr.InterfaceID,
			InterfaceName: opErr.InterfaceName,
			Error:         opErr.Error,
		}
	}

	return &model.BatchInterfacePayload{
		Succeeded: succeededInterfaces,
		Failed:    failedOperations,
		Errors:    []*model.MutationError{},
	}, nil
}

// =============================================================================
// Subscription Resolvers
// =============================================================================

// InterfaceStatusChanged subscribes to interface status change events.
// If routerID is provided, only events for that router are streamed.
// If interfaceID is provided, only events for that specific interface are streamed.
func (r *subscriptionResolver) InterfaceStatusChanged(
	ctx context.Context,
	routerID string,
	interfaceID *string,
) (<-chan *model.InterfaceStatusEvent, error) {
	// Create a buffered channel for events
	ch := make(chan *model.InterfaceStatusEvent, 10)

	// Subscribe to the event bus
	if r.EventBus != nil {
		handler := func(eventCtx context.Context, event events.Event) error {
			// Type assert to InterfaceStatusChangedEvent
			statusEvent, ok := event.(*events.InterfaceStatusChangedEvent)
			if !ok {
				return nil // Skip non-matching events
			}

			// Filter by routerID
			if statusEvent.RouterID != routerID {
				return nil
			}

			// Filter by interfaceID if specified
			if interfaceID != nil && statusEvent.InterfaceID != *interfaceID {
				return nil
			}

			// Convert to GraphQL model
			graphQLEvent := &model.InterfaceStatusEvent{
				InterfaceID:    statusEvent.InterfaceID,
				InterfaceName:  statusEvent.InterfaceName,
				Status:         mapInterfaceStatusToGraphQL(statusEvent.Status),
				PreviousStatus: mapInterfaceStatusToGraphQL(statusEvent.PreviousStatus),
				Timestamp:      statusEvent.GetTimestamp(),
			}

			// Non-blocking send with context check
			select {
			case <-ctx.Done():
				return ctx.Err()
			case ch <- graphQLEvent:
				return nil
			default:
				// Channel full, log warning but don't block
				log.Printf("[SUBSCRIPTION] InterfaceStatusChanged channel full, dropping event for interface %s", statusEvent.InterfaceID)
				return nil
			}
		}

		if err := r.EventBus.Subscribe(events.EventTypeInterfaceStatusChanged, handler); err != nil {
			close(ch)
			return nil, err
		}
	}

	// Clean up when context is cancelled
	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// =============================================================================
// Helper Functions
// =============================================================================

// mapInterfaceDataToGraphQL converts service InterfaceData to GraphQL Interface model.
func mapInterfaceDataToGraphQL(data *services.InterfaceData) *model.Interface {
	if data == nil {
		return nil
	}

	// Convert status
	status := mapInterfaceStatusToGraphQL(data.Status)

	// Convert type
	interfaceType := model.InterfaceType(data.Type)

	// Convert optional fields
	var macAddress, comment *string
	if data.MacAddress != "" {
		macAddress = &data.MacAddress
	}
	if data.Comment != "" {
		comment = &data.Comment
	}

	var mtu *int
	if data.MTU > 0 {
		mtu = &data.MTU
	}

	var linkSpeed *string
	if data.LinkSpeed != "" {
		linkSpeed = &data.LinkSpeed
	}

	var linkPartner *string
	if data.LinkPartner != "" {
		linkPartner = &data.LinkPartner
	}

	return &model.Interface{
		ID:          data.ID,
		Name:        data.Name,
		Type:        interfaceType,
		Status:      status,
		Enabled:     data.Enabled,
		Running:     data.Running,
		MacAddress:  macAddress,
		Mtu:         mtu,
		Comment:     comment,
		IP:          data.IP,
		TxBytes:     int(data.TxBytes),
		RxBytes:     int(data.RxBytes),
		TxRate:      int(data.TxRate),
		RxRate:      int(data.RxRate),
		LinkSpeed:   linkSpeed,
		LinkPartner: linkPartner,
		UsedBy:      data.UsedBy,
	}
}

// mapInterfaceStatusToGraphQL converts string status to GraphQL InterfaceStatus enum.
func mapInterfaceStatusToGraphQL(status string) model.InterfaceStatus {
	switch status {
	case "UP":
		return model.InterfaceStatusUp
	case "DOWN":
		return model.InterfaceStatusDown
	case "DISABLED":
		return model.InterfaceStatusDisabled
	default:
		return model.InterfaceStatusUnknown
	}
}
