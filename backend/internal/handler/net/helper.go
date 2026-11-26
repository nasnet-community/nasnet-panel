package net

import (
	"strings"

	"nasnet-panel/pkg/routeros"
)

// activeRouteTargets returns the addresses that have an active route in the main routing
// table, ignoring disabled routes and blackholes.
func activeRouteTargets(routes []routeros.IPRouteInfo) map[string]bool {
	targets := make(map[string]bool, len(routes))
	for i := range routes {
		route := &routes[i]
		if route.Active && !route.Disabled && route.Gateway != "" {
			targets[strings.TrimSuffix(route.DstAddress, "/32")] = true
		}
	}
	return targets
}

// netwatchTarget returns the address a probe checks.
func netwatchTarget(item *routeros.NetwatchItem) string {
	if item.Type == routeros.NetwatchTypeDNS && item.DNSServer != "" {
		return item.DNSServer
	}
	return item.Host
}

// pickNetwatchStatuses returns one probe per type: the one whose address has an active route,
// then the one that is up, then the one with the lowest rank. A type without probes is left out.
func pickNetwatchStatuses(items []routeros.NetwatchItem, routes []routeros.IPRouteInfo) []NetStatusResponse {
	activeTargets := activeRouteTargets(routes)

	best := make(map[NetwatchHostType]*netwatchCandidate, len(netwatchHostTypeOrder))
	for i := range items {
		item := &items[i]
		known, ok := netwatchComments[item.Comment]
		if !ok {
			continue
		}

		target := netwatchTarget(item)
		candidate := &netwatchCandidate{
			response: NetStatusResponse{
				Host:        target,
				Status:      string(item.Status),
				Since:       item.Since,
				Type:        known.hostType,
				RouteActive: activeTargets[target],
			},
			rank:        known.rank,
			routeActive: activeTargets[target],
			up:          item.Status == routeros.NetwatchStatusUp,
		}
		if current, exists := best[known.hostType]; !exists || betterNetwatchCandidate(candidate, current) {
			best[known.hostType] = candidate
		}
	}

	picked := make([]NetStatusResponse, 0, len(best))
	for _, hostType := range netwatchHostTypeOrder {
		if candidate, ok := best[hostType]; ok {
			picked = append(picked, candidate.response)
		}
	}
	return picked
}

func betterNetwatchCandidate(a, b *netwatchCandidate) bool {
	if a.routeActive != b.routeActive {
		return a.routeActive
	}
	if a.up != b.up {
		return a.up
	}
	return a.rank < b.rank
}
