package multiwan

import (
	"context"
	"fmt"
	"sort"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// provisionFailover configures distance-based failover routing.
// Links are ordered by priority (lower priority number = preferred).
// Each link gets a route with increasing distance values.
// The router automatically fails over to the next link if the primary gateway becomes unreachable.
func (s *Service) provisionFailover(
	ctx context.Context,
	links []WANLink,
	config types.MultiLinkConfig,
	comment string,
) (*Result, error) {

	result := &Result{
		RouterResourceIDs: make(map[string][]string),
		Strategy:          types.StrategyFailover,
	}

	// Sort links by priority (lower priority number = higher priority)
	sortedLinks := make([]WANLink, len(links))
	copy(sortedLinks, links)
	sort.Slice(sortedLinks, func(i, j int) bool {
		return sortedLinks[i].Priority < sortedLinks[j].Priority
	})

	s.logger.Infow("provisioning failover strategy",
		"linkCount", len(sortedLinks),
		"hasFallbackConfig", config.FailoverConfig != nil,
	)

	// Create a default route for each link with increasing distance (lower distance = higher priority)
	for i, link := range sortedLinks {
		distance := i + 1 // Distance 1 for primary, 2 for secondary, etc.

		cmd := router.Command{
			Path:   "/ip/route",
			Action: "add",
			Args: map[string]string{
				"dst-address":   "0.0.0.0/0",
				"gateway":       link.Gateway,
				"distance":      strconv.Itoa(distance),
				"check-gateway": "ping", // Automatically fail over if gateway is unreachable
				"comment":       comment,
			},
		}

		cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
		if err != nil {
			s.logger.Errorw("failed to add failover route",
				"link", link.Name,
				"distance", distance,
				"error", err,
			)
			return nil, fmt.Errorf("failover route creation failed for link %s: %w", link.Name, err)
		}

		if cmdResult.Success && cmdResult.ID != "" {
			s.appendResourceID(result, "/ip/route", cmdResult.ID)
			s.logger.Debugw("added failover route",
				"link", link.Name,
				"gateway", link.Gateway,
				"distance", distance,
				"resourceID", cmdResult.ID,
			)
		}
	}

	// Optionally create netwatch entries for active health monitoring
	if config.FailoverConfig != nil {
		s.addNetwatchMonitor(ctx, config.FailoverConfig, comment, result)
	}

	s.logger.Infow("failover strategy provisioned successfully",
		"routeCount", len(sortedLinks),
	)

	return result, nil
}

// addNetwatchMonitor creates a netwatch entry for active gateway health monitoring.
// This enables more aggressive failover detection compared to passive check-gateway.
func (s *Service) addNetwatchMonitor(
	ctx context.Context,
	cfg *types.FailoverConfig,
	comment string,
	result *Result,
) {

	checkInterval := 10 // Default 10 seconds
	if cfg.FailoverCheckInterval != nil {
		checkInterval = *cfg.FailoverCheckInterval
	}

	checkTimeout := 2 // Default 2 seconds
	if cfg.FailoverTimeout != nil {
		checkTimeout = *cfg.FailoverTimeout
	}

	cmd := router.Command{
		Path:   "/tool/netwatch",
		Action: "add",
		Args: map[string]string{
			"host":     "8.8.8.8", // Google DNS as default health check target
			"interval": strconv.Itoa(checkInterval) + "s",
			"timeout":  strconv.Itoa(checkTimeout) + "s",
			"comment":  comment,
		},
	}

	cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Warnw("failed to add netwatch health monitor", "error", err)
		// Don't fail the entire provisioning if netwatch creation fails
		return
	}

	if cmdResult.Success && cmdResult.ID != "" {
		s.appendResourceID(result, "/tool/netwatch", cmdResult.ID)
		s.logger.Debugw("added netwatch health monitor",
			"checkInterval", checkInterval,
			"checkTimeout", checkTimeout,
			"resourceID", cmdResult.ID,
		)
	}
}
