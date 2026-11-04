package firewall

import (
	"errors"
	"net"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/internal/dbsync"
	"nasnet-panel/pkg/routeros"
)

// EnsureDomesticBlockRules creates the domestic block filter rules when they are missing.
func EnsureDomesticBlockRules(client *routeros.Client) ([]routeros.FirewallFilterRule, int, error) {
	return client.EnsureFirewallFilterRulesByComment(dbsync.DomesticBlockRuleComment, []routeros.FirewallRuleConfig{
		{Chain: "forward", Action: "drop", DstAddressList: DomesticAddressList, OutInterfaceList: DomesticWANInterfaceList},
		{Chain: "output", Action: "drop", DstAddressList: DomesticAddressList, OutInterfaceList: DomesticWANInterfaceList},
	}, true)
}

func toDomesticBlockResponse(rules []routeros.FirewallFilterRule, added int) DomesticBlockResponse {
	response := DomesticBlockResponse{
		Block:      dbsync.DomesticBlockRulesMatch(rules, true),
		Rules:      make([]DomesticBlockRuleResponse, 0, len(rules)),
		AddedRules: added,
	}
	for i := range rules {
		response.Rules = append(response.Rules, DomesticBlockRuleResponse{
			ID:       rules[i].ID,
			Chain:    rules[i].Chain,
			Disabled: rules[i].Disabled,
		})
	}

	return response
}

func userAddedDomesticEntry(client *routeros.Client, id string) (*routeros.FirewallAddressListItem, error) {
	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ID:       id,
		ListName: DomesticAddressList,
		Comment:  DomesticUserEntryComment,
	})
	if err != nil || len(items) == 0 {
		return nil, err
	}
	return &items[0], nil
}

func toDomesticAddressItemResponse(item *routeros.FirewallAddressListItem) DomesticAddressItemResponse {
	return DomesticAddressItemResponse{
		ID:           item.ID,
		Address:      item.Address,
		Timeout:      item.Timeout,
		CreationTime: item.CreationTime,
	}
}

func validateIPv4OrCIDR(value string) error {
	if value == "" {
		return errors.New("address is required")
	}
	if strings.Contains(value, ":") {
		return errors.New("only IPv4 addresses are supported")
	}

	if strings.Contains(value, "/") {
		ip, network, err := net.ParseCIDR(value)
		if err != nil || ip.To4() == nil {
			return errors.New("must be an IPv4 address or an IPv4 CIDR range such as 203.0.113.0/24")
		}
		if ones, _ := network.Mask.Size(); ones == 0 {
			return errors.New("a /0 range would match every address")
		}
		return nil
	}

	if ip := net.ParseIP(value); ip == nil || ip.To4() == nil {
		return errors.New("must be an IPv4 address or an IPv4 CIDR range such as 203.0.113.0/24")
	}
	return nil
}

// ToFirewallRuleResponse converts a FirewallFilterRule to a FirewallRuleResponse.
func ToFirewallRuleResponse(fr *routeros.FirewallFilterRule) *FirewallRuleResponse {
	if fr == nil {
		return nil
	}

	return &FirewallRuleResponse{
		ID:       fr.ID,
		Chain:    fr.Chain,
		Action:   fr.Action,
		Protocol: fr.Protocol,
		SrcAddr:  fr.SrcAddr,
		DstAddr:  fr.DstAddr,
		SrcPort:  fr.SrcPort,
		DstPort:  fr.DstPort,
		InIface:  fr.InIface,
		OutIface: fr.OutIface,
		Disabled: fr.Disabled,
		Log:      fr.Log,
		Comment:  fr.Comment,
		Bytes:    fr.Bytes,
		Packets:  fr.Packets,
	}
}

// ToFirewallRulesResponse converts a slice of FirewallFilterRule to a slice of FirewallRuleResponse.
func ToFirewallRulesResponse(rules []routeros.FirewallFilterRule) []FirewallRuleResponse {
	var responses []FirewallRuleResponse
	for i := range rules {
		if resp := ToFirewallRuleResponse(&rules[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

// ToNATRuleResponse converts RouterOS data to its API response form.
func ToNATRuleResponse(nr *routeros.NATRule) *NATRuleResponse {
	if nr == nil {
		return nil
	}

	return &NATRuleResponse{
		ID:          nr.ID,
		Chain:       nr.Chain,
		Action:      nr.Action,
		Protocol:    nr.Protocol,
		SrcAddr:     nr.SrcAddr,
		DstAddr:     nr.DstAddr,
		SrcPort:     nr.SrcPort,
		DstPort:     nr.DstPort,
		ToAddresses: nr.ToAddresses,
		ToPorts:     nr.ToPorts,
		InIface:     nr.InIface,
		OutIface:    nr.OutIface,
		Disabled:    nr.Disabled,
		Log:         nr.Log,
		Comment:     nr.Comment,
	}
}

// ToNATRulesResponse converts RouterOS data to its API response form.
func ToNATRulesResponse(rules []routeros.NATRule) []NATRuleResponse {
	var responses []NATRuleResponse
	for i := range rules {
		if resp := ToNATRuleResponse(&rules[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

// ToMangleRuleResponse converts RouterOS data to its API response form.
func ToMangleRuleResponse(mr *routeros.MangleRule) *MangleRuleResponse {
	if mr == nil {
		return nil
	}

	return &MangleRuleResponse{
		ID:          mr.ID,
		Chain:       mr.Chain,
		Action:      mr.Action,
		Protocol:    mr.Protocol,
		SrcAddr:     mr.SrcAddr,
		DstAddr:     mr.DstAddr,
		SrcPort:     mr.SrcPort,
		DstPort:     mr.DstPort,
		PassThrough: mr.PassThrough,
		InIface:     mr.InIface,
		OutIface:    mr.OutIface,
		Disabled:    mr.Disabled,
		Log:         mr.Log,
		Comment:     mr.Comment,
	}
}

// ToMangleRulesResponse converts RouterOS data to its API response form.
func ToMangleRulesResponse(rules []routeros.MangleRule) []MangleRuleResponse {
	var responses []MangleRuleResponse
	for i := range rules {
		if resp := ToMangleRuleResponse(&rules[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

// ToDomesticAddressListUpdateStatusResponse builds the update status from the router's script environment variables.
func ToDomesticAddressListUpdateStatusResponse(vars map[string]string) DomesticAddressListUpdateStatusResponse {
	progress, _ := strconv.Atoi(vars[domesticUpdateProgressVar])
	if progress < 0 {
		progress = 0
	}
	if progress > 100 {
		progress = 100
	}

	resp := DomesticAddressListUpdateStatusResponse{
		Running:  vars[domesticUpdateRunningVar] == "true",
		Failed:   vars[domesticUpdateFailedVar] == "true",
		Progress: progress,
		Step:     vars[domesticUpdateStepVar],
		Message:  vars[domesticUpdateMessageVar],

		StartTime: routeros.FormatRouterOSTime(vars[domesticUpdateStartVar]),
		EndTime:   routeros.FormatRouterOSTime(vars[domesticUpdateEndVar]),
	}

	switch {
	case resp.Running:
		resp.Status = domesticUpdateStatusRunning
	case resp.Failed:
		resp.Status = domesticUpdateStatusFailed
	case progress == 100:
		resp.Status = domesticUpdateStatusCompleted
	case progress > 0:
		resp.Status = domesticUpdateStatusInterrupted
	default:
		resp.Status = domesticUpdateStatusIdle
	}

	return resp
}

func (r *domesticUpdateReservations) tryReserve(host string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	if startedAt, ok := r.startedAt[host]; ok && time.Since(startedAt) < domesticUpdateStartGrace {
		return false
	}
	r.startedAt[host] = time.Now()
	return true
}

func (r *domesticUpdateReservations) release(host string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.startedAt, host)
}
