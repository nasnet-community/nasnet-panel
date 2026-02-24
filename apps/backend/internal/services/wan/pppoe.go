package wan

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// ConfigurePPPoEClient configures PPPoE client on a WAN interface.
//
//nolint:gocyclo // PPPoE configuration complexity
func (s *WANService) ConfigurePPPoEClient(ctx context.Context, routerID string, input PppoeClientInput) (*WANInterfaceData, error) {
	s.logger.Infow("configuring PPPoE client",
		zap.String("routerID", routerID),
		zap.String("name", input.Name),
		zap.String("interface", input.Interface))

	checkCmd := router.Command{
		Path:   "/interface/pppoe-client/print",
		Action: "print",
		Args:   map[string]string{"name": input.Name},
	}

	checkResult, err := s.routerPort.ExecuteCommand(ctx, checkCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing PPPoE client: %w", err)
	}

	if checkResult.Success && len(checkResult.Data) > 0 {
		s.logger.Infow("removing existing PPPoE client", zap.String("name", input.Name))
		for _, item := range checkResult.Data {
			if id, ok := item[".id"]; ok {
				removeCmd := router.Command{
					Path:   "/interface/pppoe-client/remove",
					Action: "remove",
					Args:   map[string]string{".id": id},
				}
				if _, removeErr := s.routerPort.ExecuteCommand(ctx, removeCmd); removeErr != nil {
					return nil, fmt.Errorf("failed to remove existing PPPoE client: %w", removeErr)
				}
			}
		}
	}

	addArgs := map[string]string{
		"name":              input.Name,
		"interface":         input.Interface,
		"user":              input.Username,
		"password":          input.Password,
		"add-default-route": boolToString(input.AddDefaultRoute),
		"use-peer-dns":      boolToString(input.UsePeerDNS),
		"disabled":          "no",
	}

	if input.ServiceName != "" {
		addArgs["service-name"] = input.ServiceName
	}
	if input.MTU > 0 {
		addArgs["mtu"] = fmt.Sprintf("%d", input.MTU)
	}
	if input.MRU > 0 {
		addArgs["mru"] = fmt.Sprintf("%d", input.MRU)
	}
	if input.Comment != "" {
		addArgs["comment"] = input.Comment
	}

	addCmd := router.Command{
		Path:   "/interface/pppoe-client/add",
		Action: "add",
		Args:   addArgs,
	}

	addResult, err := s.routerPort.ExecuteCommand(ctx, addCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add PPPoE client: %w", err)
	}
	if !addResult.Success {
		return nil, fmt.Errorf("PPPoE client configuration failed: %w", addResult.Error)
	}

	s.logger.Infow("PPPoE client configured successfully", zap.String("name", input.Name))
	time.Sleep(2 * time.Second)

	statusCmd := router.Command{
		Path:   "/interface/pppoe-client/print",
		Action: "print",
		Args:   map[string]string{"name": input.Name},
	}

	statusResult, err := s.routerPort.ExecuteCommand(ctx, statusCmd)
	if err != nil {
		s.logger.Warnw("failed to fetch PPPoE status", zap.Error(err))
	}

	wanData := &WANInterfaceData{
		ID:             fmt.Sprintf("wan-pppoe-%s", input.Name),
		InterfaceName:  input.Name,
		ConnectionType: "PPPOE",
		Status:         "CONNECTING",
		IsDefaultRoute: input.AddDefaultRoute,
		HealthStatus:   "UNKNOWN",
		HealthEnabled:  false,
	}

	if statusResult != nil && statusResult.Success && len(statusResult.Data) > 0 {
		pppoeData := statusResult.Data[0]
		wanData.PppoeClient = &PppoeClientData{
			ID:              pppoeData[".id"],
			Name:            input.Name,
			Interface:       input.Interface,
			Disabled:        pppoeData["disabled"] == dhcpTrue,
			Username:        input.Username,
			ServiceName:     input.ServiceName,
			AddDefaultRoute: input.AddDefaultRoute,
			UsePeerDNS:      input.UsePeerDNS,
			Running:         pppoeData["running"] == dhcpTrue,
			MTU:             input.MTU,
			MRU:             input.MRU,
			Comment:         input.Comment,
		}

		switch {
		case pppoeData["running"] == dhcpTrue:
			wanData.Status = "CONNECTED"
			wanData.LastConnected = time.Now()
		case pppoeData["disabled"] == "false":
			wanData.Status = "CONNECTING"
		default:
			wanData.Status = "DISABLED"
		}
	}

	s.cache.Invalidate(routerID)

	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		Reason:         "PPPoE client configured",
	}
	s.history.Add(routerID, historyEvent)

	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Name, "PPPOE", "wan-service", input.AddDefaultRoute)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		s.logger.Warnw("failed to publish WAN configured event", zap.Error(err))
	}

	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Name, wanData.Status, "NONE", "PPPOE", "wan-service")
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		s.logger.Warnw("failed to publish WAN status changed event", zap.Error(err))
	}

	return wanData, nil
}
