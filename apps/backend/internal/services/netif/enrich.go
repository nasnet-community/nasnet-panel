package netif

import (
	"context"

	"backend/internal/router"

	"go.uber.org/zap"
)

// enrichWithIPs fetches IP addresses and assigns them to interfaces.
func (s *InterfaceService) enrichWithIPs(ctx context.Context, _routerID string, interfaces []*InterfaceData) {
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Warn("failed to fetch IP addresses", zap.Error(err))
		return
	}

	ipMap := make(map[string]string)
	for _, data := range result.Data {
		ifaceName, ok := data["interface"]
		if !ok {
			continue
		}
		address, ok := data["address"]
		if !ok {
			continue
		}
		if address == "" {
			continue
		}
		idx := len(address)
		for i, c := range address {
			if c == '/' {
				idx = i
				break
			}
		}
		ipMap[ifaceName] = address[:idx]
	}

	for _, iface := range interfaces {
		if ip, ok := ipMap[iface.Name]; ok {
			iface.IP = ip
		}
	}
}

// enrichWithTraffic fetches current traffic rates for interfaces.
func (s *InterfaceService) enrichWithTraffic(_ context.Context, _ string, _ []*InterfaceData) {
	s.logger.Debug("traffic rate monitoring not yet implemented, using byte counters")
}

// enrichWithLinkPartners fetches LLDP neighbor information.
func (s *InterfaceService) enrichWithLinkPartners(ctx context.Context, _routerID string, interfaces []*InterfaceData) {
	cmd := router.Command{
		Path:   "/ip/neighbor",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Debug("LLDP neighbors not available", zap.Error(err))
		return
	}

	neighborMap := make(map[string]string)
	for _, data := range result.Data {
		if ifaceName, ok := data["interface"]; ok {
			if identity, ok := data["identity"]; ok {
				neighborMap[ifaceName] = identity
			} else if address, ok := data["address"]; ok {
				neighborMap[ifaceName] = address
			}
		}
	}

	for _, iface := range interfaces {
		if partner, ok := neighborMap[iface.Name]; ok {
			iface.LinkPartner = partner
		}
	}
}

// enrichWithUsage determines which services are using each interface.
func (s *InterfaceService) enrichWithUsage(ctx context.Context, _routerID string, interfaces []*InterfaceData) {
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return
	}

	usageMap := make(map[string][]string)
	for _, data := range result.Data {
		ifaceName, ok := data["interface"]
		if !ok {
			continue
		}
		bridge, ok := data["bridge"]
		if !ok {
			continue
		}
		usageMap[ifaceName] = append(usageMap[ifaceName], "bridge:"+bridge)
	}

	for _, iface := range interfaces {
		if usage, ok := usageMap[iface.Name]; ok {
			iface.UsedBy = append(iface.UsedBy, usage...)
		}
	}
}

// calculateStatus derives the operational status from running and enabled flags.
func (s *InterfaceService) calculateStatus(interfaces []*InterfaceData) {
	for _, iface := range interfaces {
		switch {
		case !iface.Enabled:
			iface.Status = "DISABLED"
		case iface.Running:
			iface.Status = "UP"
		default:
			iface.Status = "DOWN"
		}
	}
}
