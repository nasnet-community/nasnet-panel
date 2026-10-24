package handler

import (
	"errors"
	"net/http"
	"strings"
	"sync"

	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

const (
	directForeignRulePrefix  = "Direct-Foreign-Bypass"
	directForeignTable       = "to-Foreign"
	directForeignRoutingMark = "to-Foreign"

	directForeignNetwatchComment = "Failover Netwatch - VPN-Client"
	directForeignRestoreCommand  = "/ip firewall mangle disable [find where comment~\"" + directForeignRulePrefix + "\"]"
	directForeignRestoreScript   = "\n" + directForeignRestoreCommand + "\n"
	directForeignLegacyCommand   = "/routing rule disable [find where comment~\"" + directForeignRulePrefix + "\"]"
)

type directForeignRule struct {
	comment        string
	anchor         string
	srcAddressList string
	dstAddressList string
}

var errDirectForeignNoVPNRules = errors.New("no VPN routing rules found; run the setup wizard first")

var (
	directForeignMu sync.Mutex

	directForeignRules = []directForeignRule{
		{comment: directForeignRulePrefix + ": Split-!DOM", anchor: "Split-!DOM", srcAddressList: "Split-LAN", dstAddressList: "!DOMAddList"},
		{comment: directForeignRulePrefix + ": Split-VPN", anchor: "Split-VPN", srcAddressList: "Split-LAN", dstAddressList: "SplitVPNAddList"},
		{comment: directForeignRulePrefix + ": VPN Routing", anchor: "VPN Routing", srcAddressList: "VPN-LAN"},
		{comment: directForeignRulePrefix + ": VPN-Client Routing", anchor: "VPN-L2TP-Client Routing", srcAddressList: "VPN-L2TP-Client-LAN"},
	}

	directForeignResetLists   = []string{"VPN-LAN", "VPN-L2TP-Client-LAN", "Split-LAN"}
	directForeignKeepDstLists = []string{"DOMAddList", "SplitDOMAddList"}
)

// HandleGetDirectForeign godoc
// @Summary Get the direct foreign mode status
// @Description Reports whether VPN-bound traffic is sent directly through the foreign link, bypassing
// @Description the VPN (enabled is true only when every routing rule is enabled). Any mangle rule that
// @Description doesn't exist yet is created in the disabled state first, and reported in addedRules.
// @Tags Route
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=DirectForeignResponse} "Direct foreign mode status"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/route/direct-foreign [get].
func HandleGetDirectForeign(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rules, added, err := ensureDirectForeignRules(client)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read direct foreign rules", err)
	}

	ready, err := directForeignRouteReady(client)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the foreign routing table", err)
	}

	return SuccessResponse(c, http.StatusOK, "Direct foreign mode status retrieved", toDirectForeignResponse(rules, added, ready, 0))
}

// HandleSetDirectForeign godoc
// @Summary Send VPN-bound traffic directly through the foreign link
// @Description Emergency switch for when the VPN is unusable. Enabling it (enabled=true) turns on the
// @Description mangle rules that mark every client normally routed through the VPN (the VPN LAN, the
// @Description VPN client LAN and the non-domestic traffic of the Split LAN) with the foreign routing
// @Description mark instead, so traffic leaves the foreign link directly with no VPN in the path and
// @Description the foreign public IP is exposed. Disabling it restores the normal VPN routing, where
// @Description traffic is blackholed while the VPN is down. Enabling requires acknowledge=true, and the
// @Description response reports foreignRouteReady, false when the foreign routing table has no default
// @Description route yet. Tracked connections of the affected
// @Description clients are reset so they pick up the new path. Returns 409 when every rule is already
// @Description in the requested state.
// @Tags Route
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body SetDirectForeignRequest true "Direct foreign mode setting"
// @Success 200 {object} Response{data=DirectForeignResponse} "Direct foreign mode applied"
// @Failure 400 {object} Response "Bad request"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 409 {object} Response "Already in the requested state"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/route/direct-foreign [put].
func HandleSetDirectForeign(c echo.Context) error {
	var req SetDirectForeignRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if req.Enabled == nil {
		return ErrorResponse(c, http.StatusBadRequest, "enabled is required", nil)
	}
	if *req.Enabled && !req.Acknowledge {
		return ErrorResponse(c, http.StatusBadRequest, "acknowledge must be true to send VPN traffic directly through the foreign link", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rules, added, err := ensureDirectForeignRules(client)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read direct foreign rules", err)
	}

	ready, err := directForeignRouteReady(client)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the foreign routing table", err)
	}

	if directForeignRulesMatch(rules, *req.Enabled) {
		state := "disabled"
		if *req.Enabled {
			state = "enabled"
		}
		persistDirectForeignSetting(c, client, *req.Enabled)
		return ErrorResponse(c, http.StatusConflict, "Direct foreign mode is already "+state, nil)
	}

	if err := setDirectForeignRules(client, rules, *req.Enabled); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update direct foreign rules", err)
	}

	reset, err := client.RemoveFirewallConnections(directForeignResetLists, directForeignKeepDstLists)
	if err != nil {
		c.Logger().Errorf("Failed to reset connections after changing direct foreign mode: %v", err)
	}

	persistDirectForeignSetting(c, client, *req.Enabled)

	return SuccessResponse(c, http.StatusOK, "Direct foreign mode applied", toDirectForeignResponse(rules, added, ready, reset))
}

func ensureDirectForeignRules(client *routeros.Client) ([]routeros.MangleRule, int, error) {
	directForeignMu.Lock()
	defer directForeignMu.Unlock()

	if err := removeLegacyDirectForeignRoutingRules(client); err != nil {
		return nil, 0, err
	}
	if err := ensureDirectForeignAutoRestore(client); err != nil {
		return nil, 0, err
	}

	all, err := client.ListMangleRules()
	if err != nil {
		return nil, 0, err
	}

	existing := make(map[string]bool)
	anchors := make(map[string]string)
	duplicates := false
	for i := range all {
		if strings.HasPrefix(all[i].Comment, directForeignRulePrefix) {
			if existing[all[i].Comment] {
				if err := client.RemoveMangleRule(all[i].ID); err != nil {
					return nil, 0, err
				}
				duplicates = true
			}
			existing[all[i].Comment] = true
		} else if _, seen := anchors[all[i].Comment]; !seen && all[i].Chain == "prerouting" && all[i].Action == "mark-routing" {
			anchors[all[i].Comment] = all[i].ID
		}
	}

	added := 0
	for _, desired := range directForeignRules {
		anchor, ok := anchors[desired.anchor]
		if existing[desired.comment] || !ok {
			continue
		}
		if _, err := client.AddMangleRule(routeros.MangleRuleConfig{
			Chain:          "prerouting",
			Action:         "mark-routing",
			NewRoutingMark: directForeignRoutingMark,
			SrcAddressList: desired.srcAddressList,
			DstAddressList: desired.dstAddressList,
			PlaceBefore:    anchor,
			Disabled:       true,
			Comment:        desired.comment,
		}); err != nil {
			return nil, added, err
		}
		added++
	}

	if added > 0 || duplicates {
		if all, err = client.ListMangleRules(); err != nil {
			return nil, added, err
		}
	}

	rules := make([]routeros.MangleRule, 0, len(directForeignRules))
	for i := range all {
		if strings.HasPrefix(all[i].Comment, directForeignRulePrefix) {
			rules = append(rules, all[i])
		}
	}
	if len(rules) == 0 {
		return nil, added, errDirectForeignNoVPNRules
	}

	return rules, added, nil
}

// removeLegacyDirectForeignRoutingRules deletes the routing rules an earlier version used. RouterOS
// routes a packet with a routing mark straight to the mark's table, so a routing rule can't override it.
func removeLegacyDirectForeignRoutingRules(client *routeros.Client) error {
	rules, err := client.ListRoutingRules()
	if err != nil {
		return err
	}
	for i := range rules {
		if strings.HasPrefix(rules[i].Comment, directForeignRulePrefix) {
			if err := client.RemoveRoutingRule(rules[i].ID); err != nil {
				return err
			}
		}
	}

	return nil
}

// ensureDirectForeignAutoRestore makes the VPN netwatch probe switch the direct foreign mode off again
// as soon as the VPN comes back up, so the real foreign IP is never left exposed by accident.
func ensureDirectForeignAutoRestore(client *routeros.Client) error {
	comment := directForeignNetwatchComment
	probes, err := client.ListNetwatch(routeros.NetwatchFilter{Comment: &comment})
	if err != nil {
		return err
	}

	for i := range probes {
		script := strings.ReplaceAll(probes[i].UpScript, directForeignLegacyCommand, "")
		hasRestore := strings.Contains(script, directForeignRestoreCommand)
		if hasRestore && script == probes[i].UpScript {
			continue
		}
		if !hasRestore {
			script = strings.TrimRight(script, " \t\r\n") + directForeignRestoreScript
		}
		if _, err := client.UpdateNetwatch(probes[i].ID, routeros.UpdateNetwatchParams{UpScript: &script}); err != nil {
			return err
		}
	}

	return nil
}

func directForeignRouteReady(client *routeros.Client) (bool, error) {
	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{RoutingTable: directForeignTable})
	if err != nil {
		return false, err
	}
	for i := range routes {
		if routes[i].DstAddress == "0.0.0.0/0" && routes[i].Gateway != "" && !routes[i].Disabled {
			return true, nil
		}
	}

	return false, nil
}

func directForeignRulesMatch(rules []routeros.MangleRule, enabled bool) bool {
	for i := range rules {
		if rules[i].Disabled == enabled {
			return false
		}
	}

	return true
}

func setDirectForeignRules(client *routeros.Client, rules []routeros.MangleRule, enabled bool) error {
	changed := make([]string, 0, len(rules))
	for i := range rules {
		if rules[i].Disabled != enabled {
			continue
		}
		if err := client.SetMangleRulesDisabled([]string{rules[i].ID}, !enabled); err != nil {
			_ = client.SetMangleRulesDisabled(changed, enabled)
			return err
		}
		changed = append(changed, rules[i].ID)
		rules[i].Disabled = !enabled
	}

	return nil
}

func toDirectForeignResponse(rules []routeros.MangleRule, added int, ready bool, reset int) DirectForeignResponse {
	response := DirectForeignResponse{
		Enabled:           directForeignRulesMatch(rules, true),
		ForeignRouteReady: ready,
		Rules:             make([]DirectForeignRuleResponse, 0, len(rules)),
		AddedRules:        added,
		ConnectionsReset:  reset,
	}
	for i := range rules {
		response.Rules = append(response.Rules, DirectForeignRuleResponse{
			ID:       rules[i].ID,
			Comment:  rules[i].Comment,
			Disabled: rules[i].Disabled,
		})
	}

	return response
}
