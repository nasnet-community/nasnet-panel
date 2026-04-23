package handler

import "nasnet-panel/pkg/routeros"

type DNSInfoResponse struct {
	Servers        []string `json:"servers"`
	DynamicServers []string `json:"dynamicServers"`
	DOHServer      string   `json:"dohServer"`
}

type UpdateDNSRequest struct {
	Servers   *string `json:"servers" description:"DNS server(s) - single IP or comma-separated list (e.g., '8.8.8.8' or '8.8.8.8,8.8.4.4'). Set to empty string to clear."`
	DOHServer *string `json:"dohServer" description:"DoH server URL (e.g., 'https://dns.google/dns-query'). Set to empty string to clear."`
}

func convertDNSInfoResponse(info *routeros.DNSInfo) *DNSInfoResponse {
	if info == nil {
		return nil
	}

	return &DNSInfoResponse{
		Servers:        info.Servers,
		DynamicServers: info.DynamicServers,
		DOHServer:      info.DOHServer,
	}
}
