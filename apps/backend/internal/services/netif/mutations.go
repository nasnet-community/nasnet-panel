package netif

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/internal/router"
)

// StartMonitoring starts background monitoring for interface status changes.
func (s *InterfaceService) StartMonitoring(ctx context.Context, routerID string) {
	if s.eventPublisher == nil {
		log.Printf("warning: event publisher not available, skipping monitoring: router_id=%s", routerID)
		return
	}

	log.Printf("starting interface monitoring: router_id=%s", routerID)

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	previousState := make(map[string]string)

	for {
		select {
		case <-ctx.Done():
			log.Printf("stopping interface monitoring: router_id=%s", routerID)
			return
		case <-ticker.C:
			s.InvalidateCache(routerID)

			interfaces, err := s.ListInterfaces(ctx, routerID, nil)
			if err != nil {
				log.Printf("failed to fetch interfaces during monitoring: router_id=%s error=%v", routerID, err)
				continue
			}

			for _, iface := range interfaces {
				prevStatus, exists := previousState[iface.ID]
				if exists && prevStatus != iface.Status {
					if err := s.eventPublisher.PublishInterfaceStatusChanged(
						ctx, routerID, iface.ID, iface.Name, iface.Status, prevStatus,
					); err != nil {
						log.Printf("failed to publish status change event: router_id=%s interface=%s error=%v", routerID, iface.Name, err)
					} else {
						log.Printf("interface status changed: router_id=%s interface=%s status=%s previous=%s", routerID, iface.Name, iface.Status, prevStatus)
					}
				}
				previousState[iface.ID] = iface.Status
			}
		}
	}
}

// EnableInterface enables a disabled interface.
func (s *InterfaceService) EnableInterface(ctx context.Context, routerID, interfaceID string) (*InterfaceData, error) {
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	var targetInterface *InterfaceData
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			targetInterface = iface
			break
		}
	}
	if targetInterface == nil {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}

	cmd := router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     interfaceID,
		Args:   map[string]string{"disabled": "no"},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to enable interface: %w", err)
	}

	s.cache.Invalidate(routerID)

	updatedInterfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated interfaces: %w", err)
	}

	for _, iface := range updatedInterfaces {
		if iface.ID == interfaceID {
			if s.eventPublisher != nil {
				if err := s.eventPublisher.PublishInterfaceStatusChanged(
					ctx, routerID, iface.ID, iface.Name, iface.Status, "DISABLED",
				); err != nil {
					log.Printf("failed to publish interface status changed event: %v", err)
				}
			}
			return iface, nil
		}
	}

	return nil, fmt.Errorf("interface not found after enable: %s", interfaceID)
}

// DisableInterface disables an active interface.
func (s *InterfaceService) DisableInterface(ctx context.Context, routerID, interfaceID string) (*InterfaceData, error) {
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	var targetInterface *InterfaceData
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			targetInterface = iface
			break
		}
	}
	if targetInterface == nil {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}

	if targetInterface.UsedBy != nil {
		for _, usage := range targetInterface.UsedBy {
			if usage == "gateway" {
				log.Printf("warning: disabling interface %s which is used by gateway", targetInterface.Name)
			}
		}
	}

	cmd := router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     interfaceID,
		Args:   map[string]string{"disabled": "yes"},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to disable interface: %w", err)
	}

	s.cache.Invalidate(routerID)

	updatedInterfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated interfaces: %w", err)
	}

	for _, iface := range updatedInterfaces {
		if iface.ID == interfaceID {
			if s.eventPublisher != nil {
				if err := s.eventPublisher.PublishInterfaceStatusChanged(
					ctx, routerID, iface.ID, iface.Name, iface.Status, targetInterface.Status,
				); err != nil {
					log.Printf("failed to publish interface status changed event: %v", err)
				}
			}
			return iface, nil
		}
	}

	return nil, fmt.Errorf("interface not found after disable: %s", interfaceID)
}

// UpdateInterface updates interface settings (MTU, comment, enabled).
//
//nolint:gocyclo // interface updates require checking multiple conditions
func (s *InterfaceService) UpdateInterface(ctx context.Context, routerID, interfaceID string, input UpdateInterfaceInput) (*InterfaceData, error) {
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	var targetInterface *InterfaceData
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			targetInterface = iface
			break
		}
	}
	if targetInterface == nil {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}

	args := make(map[string]string)

	if input.Enabled != nil {
		if *input.Enabled {
			args["disabled"] = "no"
		} else {
			args["disabled"] = "yes"
		}
	}

	if input.MTU != nil {
		if *input.MTU < 68 || *input.MTU > 9000 {
			return nil, fmt.Errorf("invalid MTU value: %d (must be between 68 and 9000)", *input.MTU)
		}
		args["mtu"] = fmt.Sprintf("%d", *input.MTU)
	}

	if input.Comment != nil {
		if len(*input.Comment) > 255 {
			return nil, fmt.Errorf("comment too long: %d characters (max 255)", len(*input.Comment))
		}
		args["comment"] = *input.Comment
	}

	cmd := router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     interfaceID,
		Args:   args,
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to update interface: %w", err)
	}

	s.cache.Invalidate(routerID)

	updatedInterfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated interfaces: %w", err)
	}

	for _, iface := range updatedInterfaces {
		if iface.ID == interfaceID {
			if input.Enabled != nil && s.eventPublisher != nil {
				if err := s.eventPublisher.PublishInterfaceStatusChanged(
					ctx, routerID, iface.ID, iface.Name, iface.Status, targetInterface.Status,
				); err != nil {
					log.Printf("failed to publish interface status changed event: %v", err)
				}
			}
			return iface, nil
		}
	}

	return nil, fmt.Errorf("interface not found after update: %s", interfaceID)
}

// BatchOperation performs operations on multiple interfaces.
func (s *InterfaceService) BatchOperation(
	ctx context.Context,
	routerID string,
	interfaceIDs []string,
	action BatchAction,
	input *UpdateInterfaceInput,
) (succeeded []*InterfaceData, failed []InterfaceOperationError, err error) {

	succeeded = make([]*InterfaceData, 0, len(interfaceIDs))
	failed = make([]InterfaceOperationError, 0)

	interfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	interfaceMap := make(map[string]*InterfaceData)
	for _, iface := range interfaces {
		interfaceMap[iface.ID] = iface
	}

	for _, interfaceID := range interfaceIDs {
		var result *InterfaceData
		var opErr error

		switch action {
		case BatchActionEnable:
			result, opErr = s.EnableInterface(ctx, routerID, interfaceID)
		case BatchActionDisable:
			result, opErr = s.DisableInterface(ctx, routerID, interfaceID)
		case BatchActionUpdate:
			if input == nil {
				opErr = fmt.Errorf("input required for UPDATE action")
			} else {
				result, opErr = s.UpdateInterface(ctx, routerID, interfaceID, *input)
			}
		default:
			opErr = fmt.Errorf("unsupported batch action: %s", action)
		}

		if opErr != nil {
			interfaceName := interfaceID
			if iface, ok := interfaceMap[interfaceID]; ok {
				interfaceName = iface.Name
			}
			failed = append(failed, InterfaceOperationError{
				InterfaceID:   interfaceID,
				InterfaceName: interfaceName,
				Error:         opErr.Error(),
			})
		} else {
			succeeded = append(succeeded, result)
		}
	}

	return succeeded, failed, nil
}
