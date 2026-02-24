package wan

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// ConfigureStaticIP configures static IP on a WAN interface.
//
//nolint:gocyclo // static IP configuration complexity
func (s *WANService) ConfigureStaticIP(ctx context.Context, routerID string, input StaticIPInput) (*WANInterfaceData, error) {
	s.logger.Infow("configuring static IP",
		zap.String("routerID", routerID),
		zap.String("interface", input.Interface),
		zap.String("address", input.Address))

	// Step 1: Remove existing IP addresses on this interface
	checkIPCmd := router.Command{
		Path:   "/ip/address/print",
		Action: "print",
		Args:   map[string]string{"interface": input.Interface},
	}

	checkIPResult, err := s.routerPort.ExecuteCommand(ctx, checkIPCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing IP addresses: %w", err)
	}

	if checkIPResult.Success && len(checkIPResult.Data) > 0 {
		s.logger.Infow("removing existing IP addresses from interface",
			zap.Int("count", len(checkIPResult.Data)),
			zap.String("interface", input.Interface))
		for _, item := range checkIPResult.Data {
			if id, ok := item[".id"]; ok {
				removeIPCmd := router.Command{
					Path:   "/ip/address/remove",
					Action: "remove",
					Args:   map[string]string{".id": id},
				}
				if _, removeErr := s.routerPort.ExecuteCommand(ctx, removeIPCmd); removeErr != nil {
					return nil, fmt.Errorf("failed to remove existing IP address: %w", removeErr)
				}
			}
		}
	}

	// Step 2: Add new IP address
	addIPParams := map[string]string{
		"address":   input.Address,
		"interface": input.Interface,
	}
	if input.Comment != "" {
		addIPParams["comment"] = input.Comment
	}

	addIPCmd := router.Command{
		Path:   "/ip/address/add",
		Action: "add",
		Args:   addIPParams,
	}

	addIPResult, err := s.routerPort.ExecuteCommand(ctx, addIPCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add IP address: %w", err)
	}
	if !addIPResult.Success {
		return nil, fmt.Errorf("IP address configuration failed: %w", addIPResult.Error)
	}

	s.logger.Infow("IP address added to interface",
		zap.String("address", input.Address),
		zap.String("interface", input.Interface))

	// Step 3: Remove existing default routes
	s.removeDefaultRoutes(ctx)

	// Step 4: Add default route
	addRouteCmd := router.Command{
		Path:   "/ip/route/add",
		Action: "add",
		Args: map[string]string{
			"gateway":     input.Gateway,
			"dst-address": "0.0.0.0/0",
		},
	}

	addRouteResult, err := s.routerPort.ExecuteCommand(ctx, addRouteCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add default route: %w", err)
	}
	if !addRouteResult.Success {
		return nil, fmt.Errorf("default route configuration failed: %w", addRouteResult.Error)
	}

	s.logger.Infow("default route added via gateway", zap.String("gateway", input.Gateway))

	// Step 5: Configure DNS servers
	if input.PrimaryDNS != "" {
		dnsServers := input.PrimaryDNS
		if input.SecondaryDNS != "" {
			dnsServers += "," + input.SecondaryDNS
		}

		setDNSCmd := router.Command{
			Path:   "/ip/dns/set",
			Action: "set",
			Args:   map[string]string{"servers": dnsServers},
		}

		dnsResult, dnsErr := s.routerPort.ExecuteCommand(ctx, setDNSCmd)
		switch {
		case dnsErr != nil:
			s.logger.Warnw("failed to set DNS servers", zap.Error(dnsErr))
		case !dnsResult.Success:
			s.logger.Warnw("DNS configuration failed", zap.Error(dnsResult.Error))
		default:
			s.logger.Infow("DNS servers configured", zap.String("servers", dnsServers))
		}
	}

	// Build WAN interface data
	wanData := &WANInterfaceData{
		ID:             fmt.Sprintf("wan-static-%s", input.Interface),
		InterfaceName:  input.Interface,
		ConnectionType: "STATIC",
		Status:         "CONNECTED",
		PublicIP:       input.Address,
		Gateway:        input.Gateway,
		PrimaryDNS:     input.PrimaryDNS,
		SecondaryDNS:   input.SecondaryDNS,
		IsDefaultRoute: true,
		HealthStatus:   "UNKNOWN",
		HealthEnabled:  false,
		LastConnected:  time.Now(),
		StaticConfig: &StaticIPConfigData{
			ID:           fmt.Sprintf("static-%s", input.Interface),
			Interface:    input.Interface,
			Address:      input.Address,
			Gateway:      input.Gateway,
			PrimaryDNS:   input.PrimaryDNS,
			SecondaryDNS: input.SecondaryDNS,
			Comment:      input.Comment,
		},
	}

	s.cache.Invalidate(routerID)

	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		PublicIP:       input.Address,
		Gateway:        input.Gateway,
		Reason:         "Static IP configured",
	}
	s.history.Add(routerID, historyEvent)

	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "STATIC", "wan-service", true)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		s.logger.Warnw("failed to publish WAN configured event", zap.Error(err))
	}

	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "STATIC", "wan-service")
	statusEvent.PublicIP = wanData.PublicIP
	statusEvent.Gateway = wanData.Gateway
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		s.logger.Warnw("failed to publish WAN status changed event", zap.Error(err))
	}

	return wanData, nil
}

// removeDefaultRoutes removes existing default routes.
func (s *WANService) removeDefaultRoutes(ctx context.Context) {
	checkRouteCmd := router.Command{
		Path:   "/ip/route/print",
		Action: "print",
		Args:   map[string]string{"dst-address": "0.0.0.0/0"},
	}

	checkRouteResult, err := s.routerPort.ExecuteCommand(ctx, checkRouteCmd)
	if err != nil {
		s.logger.Warnw("failed to check existing routes", zap.Error(err))
		return
	}

	if checkRouteResult != nil && checkRouteResult.Success && len(checkRouteResult.Data) > 0 {
		s.logger.Infow("removing existing default routes", zap.Int("count", len(checkRouteResult.Data)))
		for _, item := range checkRouteResult.Data {
			if id, ok := item[".id"]; ok {
				removeRouteCmd := router.Command{
					Path:   "/ip/route/remove",
					Action: "remove",
					Args:   map[string]string{".id": id},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeRouteCmd); err != nil {
					s.logger.Warnw("failed to remove existing route", zap.Error(err))
				}
			}
		}
	}
}
