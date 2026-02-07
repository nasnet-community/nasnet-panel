package dns

import (
	"context"
	"backend/internal/router"
	"time"
)

// Service provides DNS lookup operations via RouterPort
type Service struct {
	routerPort router.RouterPort
}

// NewService creates a new DNS service instance
func NewService(rp router.RouterPort) *Service {
	return &Service{
		routerPort: rp,
	}
}

// PerformLookup executes a DNS lookup operation
func (s *Service) PerformLookup(ctx context.Context, input *DnsLookupInput) (*DnsLookupResult, error) {
	start := time.Now()

	// Determine which server to use
	server, err := s.resolveServer(ctx, input)
	if err != nil {
		return nil, err
	}

	// Route based on record type and server
	var records []DnsRecord
	var lookupErr error

	// Use RouterOS native lookup for A/AAAA records when using router's DNS
	if (input.RecordType == "A" || input.RecordType == "AAAA") && (input.Server == nil || *input.Server == "") {
		records, lookupErr = s.lookupViaRouterOS(ctx, input)
	} else {
		records, lookupErr = s.lookupViaGoResolver(ctx, input, server)
	}

	queryTime := int(time.Since(start).Milliseconds())

	// If lookup failed, return error result
	if lookupErr != nil {
		errorMsg := lookupErr.Error()
		return &DnsLookupResult{
			Hostname:      input.Hostname,
			RecordType:    input.RecordType,
			Status:        mapErrorToStatus(lookupErr),
			Records:       []DnsRecord{},
			Server:        server,
			QueryTime:     queryTime,
			Authoritative: false,
			Error:         &errorMsg,
			Timestamp:     time.Now().Format(time.RFC3339),
		}, nil
	}

	// Success - return result
	return &DnsLookupResult{
		Hostname:      input.Hostname,
		RecordType:    input.RecordType,
		Status:        "SUCCESS",
		Records:       records,
		Server:        server,
		QueryTime:     queryTime,
		Authoritative: false, // TODO: Detect from DNS response flags
		Timestamp:     time.Now().Format(time.RFC3339),
	}, nil
}

// GetConfiguredServers retrieves DNS servers configured on the router
func (s *Service) GetConfiguredServers(ctx context.Context, deviceId string) (*DnsServers, error) {
	// Execute /ip/dns/print command
	cmd := router.Command{
		Path:   "/ip/dns",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	// Parse RouterOS response
	return parseRouterOSDnsServers(result.RawOutput), nil
}
