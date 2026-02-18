package wan

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/internal/utils"

	"backend/internal/events"
	"backend/internal/router"
)

const (
	dhcpTrue       = "true"
	dhcpBound      = "bound"
	dhcpSearching  = "searching"
	dhcpRequesting = "requesting"
)

// ConfigureDHCPClient configures DHCP client on a WAN interface.
//
//nolint:gocyclo // DHCP configuration complexity
func (s *WANService) ConfigureDHCPClient(ctx context.Context, routerID string, input DhcpClientInput) (*WANInterfaceData, error) {
	log.Printf("[WANService] Configuring DHCP client on router %s, interface %s", routerID, input.Interface)

	checkCmd := router.Command{
		Path:   "/ip/dhcp-client/print",
		Action: "print",
		Args:   map[string]string{"interface": input.Interface},
	}

	checkResult, err := s.routerPort.ExecuteCommand(ctx, checkCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing DHCP client: %w", err)
	}

	if checkResult.Success && len(checkResult.Data) > 0 {
		log.Printf("[WANService] Removing existing DHCP client on interface %s", input.Interface)
		for _, item := range checkResult.Data {
			if id, ok := item[".id"]; ok {
				removeCmd := router.Command{
					Path:   "/ip/dhcp-client/remove",
					Action: "remove",
					Args:   map[string]string{".id": id},
				}
				if _, removeErr := s.routerPort.ExecuteCommand(ctx, removeCmd); removeErr != nil {
					return nil, fmt.Errorf("failed to remove existing DHCP client: %w", removeErr)
				}
			}
		}
	}

	addArgs := map[string]string{
		"interface":         input.Interface,
		"add-default-route": boolToString(input.AddDefaultRoute),
		"use-peer-dns":      boolToString(input.UsePeerDNS),
		"use-peer-ntp":      boolToString(input.UsePeerNTP),
		"disabled":          "no",
	}
	if input.Comment != "" {
		addArgs["comment"] = input.Comment
	}

	addCmd := router.Command{
		Path:   "/ip/dhcp-client/add",
		Action: "add",
		Args:   addArgs,
	}

	addResult, err := s.routerPort.ExecuteCommand(ctx, addCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add DHCP client: %w", err)
	}
	if !addResult.Success {
		return nil, fmt.Errorf("DHCP client configuration failed: %w", addResult.Error)
	}

	log.Printf("[WANService] DHCP client configured successfully on interface %s", input.Interface)
	time.Sleep(2 * time.Second)

	statusCmd := router.Command{
		Path:   "/ip/dhcp-client/print",
		Action: "print",
		Args:   map[string]string{"interface": input.Interface},
	}

	statusResult, err := s.routerPort.ExecuteCommand(ctx, statusCmd)
	if err != nil {
		log.Printf("[WANService] Warning: Failed to fetch DHCP status: %v", err)
	}

	wanData := &WANInterfaceData{
		ID:             fmt.Sprintf("wan-dhcp-%s", input.Interface),
		InterfaceName:  input.Interface,
		ConnectionType: "DHCP",
		Status:         "CONNECTING",
		IsDefaultRoute: input.AddDefaultRoute,
		HealthStatus:   "UNKNOWN",
		HealthEnabled:  false,
	}

	if statusResult != nil && statusResult.Success && len(statusResult.Data) > 0 {
		dhcpData := statusResult.Data[0]
		wanData.DhcpClient = &DhcpClientData{
			ID:              dhcpData[".id"],
			Interface:       input.Interface,
			Disabled:        dhcpData["disabled"] == dhcpTrue,
			AddDefaultRoute: input.AddDefaultRoute,
			UsePeerDNS:      input.UsePeerDNS,
			UsePeerNTP:      input.UsePeerNTP,
			Status:          dhcpData["status"],
			Address:         dhcpData["address"],
			DhcpServer:      dhcpData["dhcp-server"],
			Gateway:         dhcpData["gateway"],
			Comment:         input.Comment,
		}

		const statusConnected = "CONNECTED"
		const statusConnecting = "CONNECTING"

		switch dhcpData["status"] {
		case dhcpBound:
			wanData.Status = statusConnected
			wanData.PublicIP = dhcpData["address"]
			wanData.Gateway = dhcpData["gateway"]
			wanData.LastConnected = time.Now()
		case dhcpSearching, dhcpRequesting:
			wanData.Status = statusConnecting
		default:
			wanData.Status = "DISCONNECTED"
		}

		if expiresStr, ok := dhcpData["expires-after"]; ok {
			if duration, err := utils.ParseRouterOSDuration(expiresStr); err == nil {
				wanData.DhcpClient.ExpiresAfter = duration
			}
		}
	}

	s.cache.Invalidate(routerID)

	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		PublicIP:       wanData.PublicIP,
		Gateway:        wanData.Gateway,
		Reason:         "DHCP client configured",
	}
	s.history.Add(routerID, historyEvent)

	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "DHCP", input.AddDefaultRoute)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN configured event: %v", err)
	}

	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "DHCP")
	statusEvent.PublicIP = wanData.PublicIP
	statusEvent.Gateway = wanData.Gateway
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		log.Printf("[WANService] Failed to publish WAN status changed event: %v", err)
	}

	return wanData, nil
}
