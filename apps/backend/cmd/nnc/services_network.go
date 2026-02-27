//go:build !dev
// +build !dev

package main

import (
	"fmt"

	"go.uber.org/zap"

	"backend/internal/bootstrap"
	"backend/internal/events"
	"backend/internal/router"
)

// initNetworkAndFirewall initializes network and firewall services.
func initNetworkAndFirewall(
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) (*bootstrap.NetworkComponents, *bootstrap.FirewallComponents, error) {
	// Initialize Network Services (IP address, WAN, bridge, VLAN)
	network, err := bootstrap.InitializeNetworkServices(
		eventBus,
		routerPort,
		sugar,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("initializing network services: %w", err)
	}

	// Initialize Firewall Services (templates, address lists)
	firewall, err := bootstrap.InitializeFirewallServices(sugar)
	if err != nil {
		return nil, nil, fmt.Errorf("initializing firewall services: %w", err)
	}

	return network, firewall, nil
}
