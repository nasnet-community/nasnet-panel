package handler

import "nasnet-panel/pkg/routeros"

type DHCPLeaseResponse struct {
	ID           string `json:"id"`
	Address      string `json:"address"`
	MAC          string `json:"macAddress"`
	ClientID     string `json:"clientId,omitempty"`
	HostName     string `json:"hostName,omitempty"`
	ServerName   string `json:"serverName,omitempty"`
	Status       string `json:"status"`
	ExpiresAfter string `json:"expiresAfter,omitempty"`
	LastSeen     string `json:"lastSeen,omitempty"`
	Comment      string `json:"comment,omitempty"`
	Dynamic      bool   `json:"dynamic"`
}

type DHCPClientResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name,omitempty"`
	Interface    string `json:"interface"`
	Status       string `json:"status"`
	Address      string `json:"address"`
	Gateway      string `json:"gateway,omitempty"`
	PrimaryDNS   string `json:"primaryDns,omitempty"`
	SecondaryDNS string `json:"secondaryDns,omitempty"`
	UsePeerDNS   bool   `json:"usePeerDns"`
	UsePeerNTP   bool   `json:"usePeerNtp"`
	ExpiresAfter string `json:"expiresAfter,omitempty"`
	Disabled     bool   `json:"disabled"`
	Comment      string `json:"comment,omitempty"`
}

type DHCPServerResponse struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Interface    string   `json:"interface"`
	AddressPool  string   `json:"addressPool"`
	Ranges       []string `json:"ranges"`
	Gateway      string   `json:"gateway,omitempty"`
	DNSServers   string   `json:"dnsServers,omitempty"`
	LeaseTime    string   `json:"leaseTime,omitempty"`
	Disabled     bool     `json:"disabled"`
	Comment      string   `json:"comment,omitempty"`
	LocalAddress string   `json:"localAddress,omitempty"`
}

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
		ExpiresAfter: dl.ExpiresAfter,
		LastSeen:     dl.LastSeen,
		Comment:      dl.Comment,
		Dynamic:      dl.Dynamic,
	}
}

func ToDHCPLeasesResponse(leases []routeros.DHCPLeaseInfo) []DHCPLeaseResponse {
	var responses []DHCPLeaseResponse
	for i := range leases {
		if resp := ToDHCPLeaseResponse(&leases[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

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
		ExpiresAfter: dc.ExpiresAfter,
		Disabled:     dc.Disabled,
		Comment:      dc.Comment,
	}
}

func ToDHCPClientsResponse(clients []routeros.DHCPClientInfo) []DHCPClientResponse {
	var responses []DHCPClientResponse
	for i := range clients {
		if resp := ToDHCPClientResponse(&clients[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}
