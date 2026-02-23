package dns

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"backend/internal/router"
)

// lookupViaRouterOS uses RouterOS /tool/dns-lookup for A/AAAA records.
// It returns records, an authoritative flag, and any error.
// The authoritative flag is true when RouterOS resolves the name from its own
// static DNS entries (type=static in the response), meaning the router itself
// is the authoritative source for this record rather than a forwarded answer.
func (s *Service) lookupViaRouterOS(ctx context.Context, input *LookupInput) ([]Record, bool, error) {
	// Build command for RouterOS
	cmd := router.Command{
		Path: "/tool/dns-lookup",
		Args: map[string]string{
			"name": input.Hostname,
			"type": input.RecordType,
		},
	}

	// Apply timeout if specified
	if input.Timeout != nil && *input.Timeout > 0 {
		timeout := time.Duration(*input.Timeout) * time.Second
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, timeout)
		defer cancel()
	}

	// Execute command
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, false, err
	}

	// Detect authoritative flag: RouterOS marks static DNS entries with "type=static"
	// in the dns-lookup response. A static entry means the router is the authoritative
	// source (it owns the record), as opposed to a cached forwarded answer.
	authoritative := strings.Contains(result.RawOutput, "type=static") ||
		strings.Contains(result.RawOutput, "type: static")

	// Parse RouterOS response
	records, err := parseRouterOSResponse(result.RawOutput, input.RecordType)
	if err != nil {
		return nil, false, err
	}

	return records, authoritative, nil
}

// lookupViaGoResolver uses Go's net package for non-A/AAAA record types
func (s *Service) lookupViaGoResolver(ctx context.Context, input *LookupInput, server string) ([]Record, error) {
	// Create custom resolver pointing to the specified DNS server
	resolver := &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{
				Timeout: time.Second * 5,
			}
			// Apply custom timeout if specified
			if input.Timeout != nil && *input.Timeout > 0 {
				d.Timeout = time.Duration(*input.Timeout) * time.Second
			}
			return d.DialContext(ctx, "udp", server+":53")
		},
	}

	// Route to the appropriate lookup method based on record type
	switch input.RecordType {
	case "A":
		return s.lookupA(ctx, resolver, input.Hostname)
	case "AAAA":
		return s.lookupAAAA(ctx, resolver, input.Hostname)
	case "MX":
		return s.lookupMX(ctx, resolver, input.Hostname)
	case "TXT":
		return s.lookupTXT(ctx, resolver, input.Hostname)
	case "CNAME":
		return s.lookupCNAME(ctx, resolver, input.Hostname)
	case "NS":
		return s.lookupNS(ctx, resolver, input.Hostname)
	case "PTR":
		return s.lookupPTR(ctx, resolver, input.Hostname)
	case "SRV":
		return s.lookupSRV(ctx, resolver, input.Hostname)
	case "SOA":
		return s.lookupSOA(ctx, resolver, input.Hostname)
	default:
		return nil, fmt.Errorf("unsupported record type: %s", input.RecordType)
	}
}

// lookupA looks up A (IPv4) records
func (s *Service) lookupA(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	ips, err := r.LookupIP(ctx, "ip4", hostname)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(ips))
	for i, ip := range ips {
		records[i] = Record{
			Name: hostname,
			Type: "A",
			TTL:  3600, // Default TTL (net.Resolver doesn't provide TTL)
			Data: ip.String(),
		}
	}
	return records, nil
}

// lookupAAAA looks up AAAA (IPv6) records
func (s *Service) lookupAAAA(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	ips, err := r.LookupIP(ctx, "ip6", hostname)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(ips))
	for i, ip := range ips {
		records[i] = Record{
			Name: hostname,
			Type: "AAAA",
			TTL:  3600,
			Data: ip.String(),
		}
	}
	return records, nil
}

// lookupMX looks up MX (mail exchange) records
func (s *Service) lookupMX(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	mxs, err := r.LookupMX(ctx, hostname)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(mxs))
	for i, mx := range mxs {
		priority := int(mx.Pref)
		records[i] = Record{
			Name:     hostname,
			Type:     "MX",
			TTL:      3600,
			Data:     mx.Host,
			Priority: &priority,
		}
	}
	return records, nil
}

// lookupTXT looks up TXT (text) records
func (s *Service) lookupTXT(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	txts, err := r.LookupTXT(ctx, hostname)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(txts))
	for i, txt := range txts {
		records[i] = Record{
			Name: hostname,
			Type: "TXT",
			TTL:  3600,
			Data: txt,
		}
	}
	return records, nil
}

// lookupCNAME looks up CNAME (canonical name) records
func (s *Service) lookupCNAME(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	cname, err := r.LookupCNAME(ctx, hostname)
	if err != nil {
		return nil, err
	}

	return []Record{{
		Name: hostname,
		Type: "CNAME",
		TTL:  3600,
		Data: cname,
	}}, nil
}

// lookupNS looks up NS (name server) records
func (s *Service) lookupNS(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	nss, err := r.LookupNS(ctx, hostname)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(nss))
	for i, ns := range nss {
		records[i] = Record{
			Name: hostname,
			Type: "NS",
			TTL:  3600,
			Data: ns.Host,
		}
	}
	return records, nil
}

// lookupPTR looks up PTR (pointer/reverse DNS) records
func (s *Service) lookupPTR(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	// For PTR lookups, hostname should be an IP address
	names, err := r.LookupAddr(ctx, hostname)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(names))
	for i, name := range names {
		records[i] = Record{
			Name: hostname,
			Type: "PTR",
			TTL:  3600,
			Data: name,
		}
	}
	return records, nil
}

// lookupSRV looks up SRV (service) records
func (s *Service) lookupSRV(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	// Parse hostname into service, proto, and name
	// Expected format: _service._proto.name (e.g., _http._tcp.example.com)
	parts := strings.SplitN(hostname, ".", 3)
	if len(parts) < 3 {
		return nil, fmt.Errorf("invalid SRV hostname format, expected: _service._proto.name")
	}

	service := strings.TrimPrefix(parts[0], "_")
	proto := strings.TrimPrefix(parts[1], "_")
	name := parts[2]

	_, srvs, err := r.LookupSRV(ctx, service, proto, name)
	if err != nil {
		return nil, err
	}

	records := make([]Record, len(srvs))
	for i, srv := range srvs {
		priority := int(srv.Priority)
		weight := int(srv.Weight)
		port := int(srv.Port)
		records[i] = Record{
			Name:     hostname,
			Type:     "SRV",
			TTL:      3600,
			Data:     srv.Target,
			Priority: &priority,
			Weight:   &weight,
			Port:     &port,
		}
	}
	return records, nil
}

// lookupSOA looks up SOA (start of authority) records
func (s *Service) lookupSOA(ctx context.Context, r *net.Resolver, hostname string) ([]Record, error) {
	// Go's net package doesn't have a direct LookupSOA method
	// We would need to use a DNS library like miekg/dns for SOA lookups
	// For now, return an error indicating it's not supported
	return nil, fmt.Errorf("SOA record lookup not yet implemented")
}
