//go:build !dev
// +build !dev

package main

import (
	"backend/generated/ent"
	"backend/internal/bootstrap"

	"backend/internal/events"
	"backend/internal/router"
)

// initNetworkAndFirewall initializes network and firewall services.
func initNetworkAndFirewall(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) (*bootstrap.NetworkComponents, *bootstrap.FirewallComponents, error) {
	// Initialize Network Services (IP address, WAN, bridge, VLAN)
	network, err := bootstrap.InitializeNetworkServices(
		systemDB,
		eventBus,
		routerPort,
	)
	if err != nil {
		return nil, nil, err
	}

	// Initialize Firewall Services (templates, address lists)
	firewall, err := bootstrap.InitializeFirewallServices()
	if err != nil {
		return nil, nil, err
	}

	return network, firewall, nil
}
