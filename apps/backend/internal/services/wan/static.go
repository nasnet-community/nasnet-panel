package wan

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// ConfigureStaticIP configures static IP on a WAN interface.
func (s *WANService) ConfigureStaticIP(ctx context.Context, routerID string, input StaticIPInput) (*WANInterfaceData, error) {
	log.Printf("[WANService] Configuring static IP on router %s, interface %s, address %s", routerID, input.Interface, input.Address)

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
		log.Printf("[WANService] Removing %d existing IP address(es) from interface %s", len(checkIPResult.Data), input.Interface)
		for _, item := range checkIPResult.Data {
			if id, ok := item[".id"]; ok {
				removeIPCmd := router.Command{
					Path:   "/ip/address/remove",
					Action: "remove",
					Args:   map[string]string{".id": id},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeIPCmd); err != nil {
					return nil, fmt.Errorf("failed to remove existing IP address: %w", err)
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
		return nil, fmt.Errorf("IP address configuration failed: %s", addIPResult.Error)
	}

	log.Printf("[WANService] IP address %s added to interface %s", input.Address, input.Interface)

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
		return nil, fmt.Errorf("default route configuration failed: %s", addRouteResult.Error)
	}

	log.Printf("[WANService] Default route added via gateway %s", input.Gateway)

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

		dnsResult, err := s.routerPort.ExecuteCommand(ctx, setDNSCmd)
		if err != nil {
			log.Printf("[WANService] Warning: Failed to set DNS servers: %v", err)
		} else if !dnsResult.Success {
			log.Printf("[WANService] Warning: DNS configuration failed: %s", dnsResult.Error)
		} else {
			log.Printf("[WANService] DNS servers configured: %s", dnsServers)
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

	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "STATIC", true)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN configured event: %v", err)
	}

	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "STATIC")
	statusEvent.PublicIP = wanData.PublicIP
	statusEvent.Gateway = wanData.Gateway
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		log.Printf("[WANService] Failed to publish WAN status changed event: %v", err)
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
		log.Printf("[WANService] Warning: Failed to check existing routes: %v", err)
		return
	}

	if checkRouteResult != nil && checkRouteResult.Success && len(checkRouteResult.Data) > 0 {
		log.Printf("[WANService] Removing %d existing default route(s)", len(checkRouteResult.Data))
		for _, item := range checkRouteResult.Data {
			if id, ok := item[".id"]; ok {
				removeRouteCmd := router.Command{
					Path:   "/ip/route/remove",
					Action: "remove",
					Args:   map[string]string{".id": id},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeRouteCmd); err != nil {
					log.Printf("[WANService] Warning: Failed to remove existing route: %v", err)
				}
			}
		}
	}
}
