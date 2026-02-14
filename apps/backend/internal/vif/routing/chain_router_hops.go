package routing

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/routingchain"
	"backend/internal/router"

	"github.com/rs/zerolog/log"
)

// createChainHops creates router rules and database records for each hop in the chain.
func (cr *ChainRouter) createChainHops(
	ctx context.Context,
	chain *ent.RoutingChain,
	input CreateRoutingChainInput,
	interfaceMap map[string]*ent.VirtualInterface,
) (*ent.RoutingChain, error) {
	// Track cleanup functions in LIFO order
	var cleanups []func() error
	defer func() {
		if len(cleanups) > 0 {
			log.Warn().Msg("Rolling back chain creation")
			for i := len(cleanups) - 1; i >= 0; i-- {
				if err := cleanups[i](); err != nil {
					log.Error().Err(err).Msg("Cleanup failed")
				}
			}
		}
	}()

	// Add cleanup for the chain record itself
	cleanups = append(cleanups, func() error {
		return cr.store.RoutingChain.DeleteOneID(chain.ID).Exec(ctx)
	})

	for i, hopInput := range input.Hops {
		iface := interfaceMap[hopInput.InterfaceID]
		if iface == nil {
			return nil, fmt.Errorf("interface %s not found in map", hopInput.InterfaceID)
		}

		hopOrder := hopInput.Order
		routingMark := fmt.Sprintf("chain-%s-hop%d", chain.ID, hopOrder)
		routeTableName := routingMark

		log.Info().
			Int("hop_order", hopOrder).
			Str("interface", iface.InterfaceName).
			Str("routing_mark", routingMark).
			Msg("Creating hop rules")

		var mangleRuleID, routeID, killSwitchRuleID string

		// Step 1: Create mangle rule
		mangleRuleID, err := cr.createHopMangleRule(ctx, chain, input, i, hopOrder, routingMark, interfaceMap)
		if err != nil {
			return nil, err
		}
		cleanups = append(cleanups, cr.removeMangleCleanup(ctx, mangleRuleID))

		// Step 2: Create routing table
		if err := cr.createRoutingTable(ctx, routeTableName); err != nil {
			return nil, fmt.Errorf("failed to create routing table for hop %d: %w", hopOrder, err)
		}
		cleanups = append(cleanups, cr.removeRoutingTableCleanup(ctx, routeTableName))

		// Step 3: Create route
		routeID, err = cr.createHopRoute(ctx, iface, routeTableName, hopOrder)
		if err != nil {
			return nil, err
		}
		cleanups = append(cleanups, cr.removeRouteCleanup(ctx, routeID))

		// Step 4: Create kill switch filter rule (if enabled)
		if input.KillSwitchEnabled {
			killSwitchRuleID, err = cr.createHopKillSwitch(ctx, chain, input, hopOrder)
			if err != nil {
				return nil, err
			}
			cleanups = append(cleanups, cr.removeFilterCleanup(ctx, killSwitchRuleID))
		}

		// Create ChainHop record
		hopBuilder := cr.store.ChainHop.
			Create().
			SetChainID(chain.ID).
			SetHopOrder(hopOrder).
			SetInterfaceID(iface.ID).
			SetRoutingMark(routingMark).
			SetRouteTableName(routeTableName)

		if mangleRuleID != "" {
			hopBuilder.SetMangleRuleID(mangleRuleID)
		}
		if routeID != "" {
			hopBuilder.SetRouteID(routeID)
		}
		if killSwitchRuleID != "" {
			hopBuilder.SetKillSwitchRuleID(killSwitchRuleID)
		}

		_, err = hopBuilder.Save(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to create ChainHop record for hop %d: %w", hopOrder, err)
		}
	}

	// Success! Clear cleanups to prevent rollback
	cleanups = nil
	return chain, nil
}

// createHopMangleRule creates a mangle rule for a single hop.
func (cr *ChainRouter) createHopMangleRule(
	ctx context.Context,
	chain *ent.RoutingChain,
	input CreateRoutingChainInput,
	hopIndex, hopOrder int,
	routingMark string,
	interfaceMap map[string]*ent.VirtualInterface,
) (string, error) {
	var mangleCmd router.Command
	if hopOrder == 1 || hopIndex == 0 {
		// First hop: match by device MAC/IP
		mangleCmd = router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args:   make(map[string]string),
		}
		mangleCmd.Args["chain"] = "prerouting"
		mangleCmd.Args["action"] = "mark-routing"
		mangleCmd.Args["new-routing-mark"] = routingMark
		mangleCmd.Args["passthrough"] = "yes"
		mangleCmd.Args["place-before"] = "0"
		mangleCmd.Args["comment"] = fmt.Sprintf("nnc-chain-%s-hop%d", chain.ID, hopOrder)

		if input.RoutingMode == routingchain.RoutingModeMAC {
			mangleCmd.Args["src-mac-address"] = input.DeviceMAC
		} else {
			mangleCmd.Args["src-address"] = input.DeviceIP
		}
	} else {
		// Subsequent hops: match by previous hop's interface
		prevHopInput := input.Hops[hopIndex-1]
		prevIface := interfaceMap[prevHopInput.InterfaceID]

		mangleCmd = router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":            "prerouting",
				"in-interface":     prevIface.InterfaceName,
				"connection-state": "new",
				"action":           "mark-routing",
				"new-routing-mark": routingMark,
				"passthrough":      "yes",
				"place-before":     "0",
				"comment":          fmt.Sprintf("nnc-chain-%s-hop%d", chain.ID, hopOrder),
			},
		}
	}

	_, err := cr.router.ExecuteCommand(ctx, mangleCmd)
	if err != nil {
		return "", fmt.Errorf("failed to create mangle rule for hop %d: %w", hopOrder, err)
	}

	// Confirm: Query router to verify mangle rule exists and get its .id
	confirmCmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "print",
		Args: map[string]string{
			"?comment": fmt.Sprintf("nnc-chain-%s-hop%d", chain.ID, hopOrder),
		},
	}
	confirmResult, err := cr.router.ExecuteCommand(ctx, confirmCmd)
	if err != nil || len(confirmResult.Data) == 0 {
		return "", fmt.Errorf("failed to confirm mangle rule for hop %d", hopOrder)
	}
	return confirmResult.Data[0][".id"], nil
}

// createRoutingTable creates a routing table on the router.
func (cr *ChainRouter) createRoutingTable(ctx context.Context, tableName string) error {
	tableCmd := router.Command{
		Path:   "/routing/table",
		Action: "add",
		Args: map[string]string{
			"name": tableName,
			"fib":  "",
		},
	}
	_, err := cr.router.ExecuteCommand(ctx, tableCmd)
	return err
}

// createHopRoute creates a default route for a hop.
func (cr *ChainRouter) createHopRoute(
	ctx context.Context,
	iface *ent.VirtualInterface,
	routeTableName string,
	hopOrder int,
) (string, error) {
	gatewayIP := iface.IPAddress
	if idx := len(gatewayIP); idx > 0 {
		for j := 0; j < len(gatewayIP); j++ {
			if gatewayIP[j] == '/' {
				gatewayIP = gatewayIP[:j]
				break
			}
		}
	}

	routeCmd := router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args: map[string]string{
			"dst-address":   "0.0.0.0/0",
			"gateway":       gatewayIP,
			"routing-table": routeTableName,
		},
	}
	_, err := cr.router.ExecuteCommand(ctx, routeCmd)
	if err != nil {
		return "", fmt.Errorf("failed to create route for hop %d: %w", hopOrder, err)
	}

	confirmCmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Args: map[string]string{
			"?routing-table": routeTableName,
		},
	}
	confirmResult, err := cr.router.ExecuteCommand(ctx, confirmCmd)
	if err != nil || len(confirmResult.Data) == 0 {
		return "", fmt.Errorf("failed to confirm route for hop %d", hopOrder)
	}
	return confirmResult.Data[0][".id"], nil
}

// createHopKillSwitch creates a kill switch filter rule for a hop.
func (cr *ChainRouter) createHopKillSwitch(
	ctx context.Context,
	chain *ent.RoutingChain,
	input CreateRoutingChainInput,
	hopOrder int,
) (string, error) {
	killSwitchCmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args:   make(map[string]string),
	}
	killSwitchCmd.Args["chain"] = "forward"
	killSwitchCmd.Args["action"] = "drop"
	killSwitchCmd.Args["disabled"] = "yes"
	killSwitchCmd.Args["place-before"] = "0"
	killSwitchCmd.Args["comment"] = fmt.Sprintf("nnc-chainks-%s-hop%d", chain.ID, hopOrder)

	if input.RoutingMode == routingchain.RoutingModeMAC {
		killSwitchCmd.Args["src-mac-address"] = input.DeviceMAC
	} else {
		killSwitchCmd.Args["src-address"] = input.DeviceIP
	}

	_, err := cr.router.ExecuteCommand(ctx, killSwitchCmd)
	if err != nil {
		return "", fmt.Errorf("failed to create kill switch rule for hop %d: %w", hopOrder, err)
	}

	confirmCmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
		Args: map[string]string{
			"?comment": fmt.Sprintf("nnc-chainks-%s-hop%d", chain.ID, hopOrder),
		},
	}
	confirmResult, err := cr.router.ExecuteCommand(ctx, confirmCmd)
	if err != nil || len(confirmResult.Data) == 0 {
		return "", fmt.Errorf("failed to confirm kill switch rule for hop %d", hopOrder)
	}
	return confirmResult.Data[0][".id"], nil
}

// Cleanup helper factories for deferred rollback.

func (cr *ChainRouter) removeMangleCleanup(ctx context.Context, ruleID string) func() error {
	return func() error {
		cmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "remove",
			Args:   map[string]string{".id": ruleID},
		}
		_, err := cr.router.ExecuteCommand(ctx, cmd)
		return err
	}
}

func (cr *ChainRouter) removeRoutingTableCleanup(ctx context.Context, tableName string) func() error {
	return func() error {
		cmd := router.Command{
			Path:   "/routing/table",
			Action: "remove",
			Args:   map[string]string{"name": tableName},
		}
		_, err := cr.router.ExecuteCommand(ctx, cmd)
		return err
	}
}

func (cr *ChainRouter) removeRouteCleanup(ctx context.Context, routeID string) func() error {
	return func() error {
		cmd := router.Command{
			Path:   "/ip/route",
			Action: "remove",
			Args:   map[string]string{".id": routeID},
		}
		_, err := cr.router.ExecuteCommand(ctx, cmd)
		return err
	}
}

func (cr *ChainRouter) removeFilterCleanup(ctx context.Context, ruleID string) func() error {
	return func() error {
		cmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "remove",
			Args:   map[string]string{".id": ruleID},
		}
		_, err := cr.router.ExecuteCommand(ctx, cmd)
		return err
	}
}
