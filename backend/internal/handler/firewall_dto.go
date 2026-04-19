package handler

import "nasnet-panel/pkg/routeros"

type FirewallRuleResponse struct {
	ID       string `json:"id"`
	Chain    string `json:"chain"`
	Action   string `json:"action"`
	Protocol string `json:"protocol,omitempty"`
	SrcAddr  string `json:"srcAddress,omitempty"`
	DstAddr  string `json:"dstAddress,omitempty"`
	SrcPort  string `json:"srcPort,omitempty"`
	DstPort  string `json:"dstPort,omitempty"`
	InIface  string `json:"inInterface,omitempty"`
	OutIface string `json:"outInterface,omitempty"`
	Disabled bool   `json:"disabled"`
	Log      bool   `json:"log"`
	Comment  string `json:"comment,omitempty"`
	Bytes    string `json:"bytes,omitempty"`
	Packets  string `json:"packets,omitempty"`
}

type NATRuleResponse struct {
	ID          string `json:"id"`
	Chain       string `json:"chain"`
	Action      string `json:"action"`
	Protocol    string `json:"protocol,omitempty"`
	SrcAddr     string `json:"srcAddress,omitempty"`
	DstAddr     string `json:"dstAddress,omitempty"`
	SrcPort     string `json:"srcPort,omitempty"`
	DstPort     string `json:"dstPort,omitempty"`
	ToAddresses string `json:"toAddresses,omitempty"`
	ToPorts     string `json:"toPorts,omitempty"`
	InIface     string `json:"inInterface,omitempty"`
	OutIface    string `json:"outInterface,omitempty"`
	Disabled    bool   `json:"disabled"`
	Log         bool   `json:"log"`
	Comment     string `json:"comment,omitempty"`
}

type MangleRuleResponse struct {
	ID          string `json:"id"`
	Chain       string `json:"chain"`
	Action      string `json:"action"`
	Protocol    string `json:"protocol,omitempty"`
	SrcAddr     string `json:"srcAddress,omitempty"`
	DstAddr     string `json:"dstAddress,omitempty"`
	SrcPort     string `json:"srcPort,omitempty"`
	DstPort     string `json:"dstPort,omitempty"`
	PassThrough bool   `json:"passThrough"`
	InIface     string `json:"inInterface,omitempty"`
	OutIface    string `json:"outInterface,omitempty"`
	Disabled    bool   `json:"disabled"`
	Log         bool   `json:"log"`
	Comment     string `json:"comment,omitempty"`
}

func ToFirewallRuleResponse(fr *routeros.FirewallRule) *FirewallRuleResponse {
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

func ToFirewallRulesResponse(rules []routeros.FirewallRule) []FirewallRuleResponse {
	var responses []FirewallRuleResponse
	for i := range rules {
		if resp := ToFirewallRuleResponse(&rules[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

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

func ToNATRulesResponse(rules []routeros.NATRule) []NATRuleResponse {
	var responses []NATRuleResponse
	for i := range rules {
		if resp := ToNATRuleResponse(&rules[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

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

func ToMangleRulesResponse(rules []routeros.MangleRule) []MangleRuleResponse {
	var responses []MangleRuleResponse
	for i := range rules {
		if resp := ToMangleRuleResponse(&rules[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}
