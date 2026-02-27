package wan

import (
	"context"
	"fmt"

	"backend/internal/router"

	"go.uber.org/zap"
)

// Discovery discovers WAN interfaces on MikroTik routers by querying
// DHCP clients, PPPoE clients, VPN tunnels, and default routes.
type Discovery struct {
	routerPort router.RouterPort
	logger     *zap.Logger
}

// NewDiscovery creates a new WAN discovery service.
func NewDiscovery(routerPort router.RouterPort, logger *zap.Logger) *Discovery {
	return &Discovery{
		routerPort: routerPort,
		logger:     logger,
	}
}

// DiscoverWANs queries the router for all WAN-capable interfaces and returns
// them as a combined list. It queries:
//  1. /ip/dhcp-client — DHCP clients (potential domestic/foreign WANs)
//  2. /interface/pppoe-client — PPPoE clients
//  3. /interface/wireguard — WireGuard tunnels (VPN)
//  4. /interface/ovpn-client — OpenVPN tunnels (VPN)
//
// Default route information is merged from /ip/route.
// Classification defaults to empty (user must classify).
func (d *Discovery) DiscoverWANs(ctx context.Context, routerID string) ([]DiscoveredWAN, error) {
	_ = routerID // Reserved for multi-router support; single router uses d.routerPort.

	// Gather default-route interfaces for annotation.
	defaultRouteIfaces, err := d.GetDefaultRoutes(ctx, routerID)
	if err != nil {
		d.logger.Warn("failed to query default routes, continuing without",
			zap.String("router_id", routerID),
			zap.Error(err))
	}
	defaultRouteSet := make(map[string]bool, len(defaultRouteIfaces))
	for _, iface := range defaultRouteIfaces {
		defaultRouteSet[iface] = true
	}

	var wans []DiscoveredWAN

	// 1. DHCP clients
	dhcpWANs, err := d.discoverDHCPClients(ctx, defaultRouteSet)
	if err != nil {
		d.logger.Warn("failed to discover DHCP clients", zap.Error(err))
	} else {
		wans = append(wans, dhcpWANs...)
	}

	// 2. PPPoE clients
	pppoeWANs, err := d.discoverPPPoEClients(ctx, defaultRouteSet)
	if err != nil {
		d.logger.Warn("failed to discover PPPoE clients", zap.Error(err))
	} else {
		wans = append(wans, pppoeWANs...)
	}

	// 3. WireGuard tunnels
	wgWANs, err := d.discoverWireGuard(ctx, defaultRouteSet)
	if err != nil {
		d.logger.Warn("failed to discover WireGuard tunnels", zap.Error(err))
	} else {
		wans = append(wans, wgWANs...)
	}

	// 4. OpenVPN tunnels
	ovpnWANs, err := d.discoverOpenVPN(ctx, defaultRouteSet)
	if err != nil {
		d.logger.Warn("failed to discover OpenVPN tunnels", zap.Error(err))
	} else {
		wans = append(wans, ovpnWANs...)
	}

	d.logger.Info("wan discovery complete",
		zap.String("router_id", routerID),
		zap.Int("total_wans", len(wans)))

	return wans, nil
}

// GetDefaultRoutes returns the list of interface names that have a default route (0.0.0.0/0).
func (d *Discovery) GetDefaultRoutes(ctx context.Context, routerID string) ([]string, error) {
	_ = routerID

	result, err := d.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/route",
		Action: "print",
		QueryFilter: map[string]string{
			"dst-address": "0.0.0.0/0",
		},
		Props: []string{"gateway", "interface"},
	})
	if err != nil {
		return nil, fmt.Errorf("query default routes: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("query default routes failed: %w", result.Error)
	}

	var ifaces []string
	for _, row := range result.Data {
		if iface, ok := row["interface"]; ok && iface != "" {
			ifaces = append(ifaces, iface)
		}
	}
	return ifaces, nil
}

// discoverDHCPClients queries /ip/dhcp-client for active DHCP clients.
func (d *Discovery) discoverDHCPClients(ctx context.Context, defaultRoutes map[string]bool) ([]DiscoveredWAN, error) {
	result, err := d.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-client",
		Action: "print",
		Props:  []string{"interface", "address", "status", "comment"},
	})
	if err != nil {
		return nil, fmt.Errorf("query dhcp clients: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("query dhcp clients failed: %w", result.Error)
	}

	var wans []DiscoveredWAN
	for _, row := range result.Data {
		iface := row["interface"]
		if iface == "" {
			continue
		}
		name := row["comment"]
		if name == "" {
			name = "DHCP-" + iface
		}
		wans = append(wans, DiscoveredWAN{
			Name:            name,
			RouterInterface: iface,
			Type:            "dhcp-client",
			DefaultRoute:    defaultRoutes[iface],
			IPAddress:       row["address"],
		})
	}
	return wans, nil
}

// discoverPPPoEClients queries /interface/pppoe-client for PPPoE connections.
func (d *Discovery) discoverPPPoEClients(ctx context.Context, defaultRoutes map[string]bool) ([]DiscoveredWAN, error) {
	result, err := d.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/pppoe-client",
		Action: "print",
		Props:  []string{"name", "interface", "comment"},
	})
	if err != nil {
		return nil, fmt.Errorf("query pppoe clients: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("query pppoe clients failed: %w", result.Error)
	}

	var wans []DiscoveredWAN
	for _, row := range result.Data {
		name := row["name"]
		if name == "" {
			continue
		}
		label := row["comment"]
		if label == "" {
			label = "PPPoE-" + name
		}
		wans = append(wans, DiscoveredWAN{
			Name:            label,
			RouterInterface: name,
			Type:            "pppoe-client",
			DefaultRoute:    defaultRoutes[name],
		})
	}
	return wans, nil
}

// discoverWireGuard queries /interface/wireguard for WireGuard VPN tunnels.
func (d *Discovery) discoverWireGuard(ctx context.Context, defaultRoutes map[string]bool) ([]DiscoveredWAN, error) {
	result, err := d.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/wireguard",
		Action: "print",
		Props:  []string{"name", "comment"},
	})
	if err != nil {
		return nil, fmt.Errorf("query wireguard interfaces: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("query wireguard interfaces failed: %w", result.Error)
	}

	var wans []DiscoveredWAN
	for _, row := range result.Data {
		name := row["name"]
		if name == "" {
			continue
		}
		label := row["comment"]
		if label == "" {
			label = "WG-" + name
		}
		wans = append(wans, DiscoveredWAN{
			Name:            label,
			RouterInterface: name,
			Type:            "vpn-tunnel",
			Classification:  ClassificationVPN,
			DefaultRoute:    defaultRoutes[name],
		})
	}
	return wans, nil
}

// discoverOpenVPN queries /interface/ovpn-client for OpenVPN tunnels.
func (d *Discovery) discoverOpenVPN(ctx context.Context, defaultRoutes map[string]bool) ([]DiscoveredWAN, error) {
	result, err := d.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/ovpn-client",
		Action: "print",
		Props:  []string{"name", "comment"},
	})
	if err != nil {
		return nil, fmt.Errorf("query ovpn clients: %w", err)
	}
	if !result.Success {
		return nil, fmt.Errorf("query ovpn clients failed: %w", result.Error)
	}

	var wans []DiscoveredWAN
	for _, row := range result.Data {
		name := row["name"]
		if name == "" {
			continue
		}
		label := row["comment"]
		if label == "" {
			label = "OVPN-" + name
		}
		wans = append(wans, DiscoveredWAN{
			Name:            label,
			RouterInterface: name,
			Type:            "vpn-tunnel",
			Classification:  ClassificationVPN,
			DefaultRoute:    defaultRoutes[name],
		})
	}
	return wans, nil
}
