package dhcp

import (
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// ToDHCPLeaseResponse converts a RouterOS DHCP lease info to an API response.
func ToDHCPLeaseResponse(dl *routeros.DHCPLeaseInfo) *DHCPLeaseResponse {
	if dl == nil {
		return nil
	}

	return &DHCPLeaseResponse{
		ID:           dl.ID,
		Address:      dl.Address,
		MAC:          dl.MacAddress,
		ClientID:     dl.ClientID,
		HostName:     dl.HostName,
		ServerName:   dl.ServerName,
		Status:       dl.Status,
		ExpiresAfter: utils.FormatRouterOSDuration(dl.ExpiresAfter),
		LastSeen:     utils.FormatRouterOSDuration(dl.LastSeen),
		BridgePort:   dl.BridgePort,
		Comment:      dl.Comment,
		Dynamic:      dl.Dynamic,
	}
}

// ToDHCPLeasesResponse converts a list of DHCP lease infos to API responses.
func ToDHCPLeasesResponse(leases []routeros.DHCPLeaseInfo) []DHCPLeaseResponse {
	var responses []DHCPLeaseResponse
	for i := range leases {
		if resp := ToDHCPLeaseResponse(&leases[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

// ToDHCPClientResponse converts RouterOS data to its API response form.
func ToDHCPClientResponse(dc *routeros.DHCPClientInfo) *DHCPClientResponse {
	if dc == nil {
		return nil
	}

	return &DHCPClientResponse{
		ID:           dc.ID,
		Interface:    dc.Interface,
		Status:       dc.Status,
		Address:      dc.Address,
		Gateway:      dc.Gateway,
		PrimaryDNS:   dc.PrimaryDNS,
		SecondaryDNS: dc.SecondaryDNS,
		Name:         dc.Name,
		UsePeerDNS:   dc.UsePeerDNS,
		UsePeerNTP:   dc.UsePeerNTP,
		ExpiresAfter: utils.FormatRouterOSDuration(dc.ExpiresAfter),
		Disabled:     dc.Disabled,
		Comment:      dc.Comment,
	}
}

// ToDHCPClientsResponse converts RouterOS data to its API response form.
func ToDHCPClientsResponse(clients []routeros.DHCPClientInfo) []DHCPClientResponse {
	var responses []DHCPClientResponse
	for i := range clients {
		if resp := ToDHCPClientResponse(&clients[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}
