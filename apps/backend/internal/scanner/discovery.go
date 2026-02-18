package scanner

import (
	"context"
	"net"
	"sync"
)

// =============================================================================
// Device Discovery
// =============================================================================
// Implements device scanning, port checking, and RouterOS verification.

const (
	unknownDeviceType  = "unknown"
	routerDeviceType   = "router"
	mikrotikVendor     = "MikroTik"
	httpProtocol       = "http"
	httpsProtocol      = "https"
	mikrotikRestAPI    = "mikrotik-rest"
	mikrotikRestAPISSL = "mikrotik-rest-ssl"
)

//nolint:gocyclo // scanner complexity
func (s *ScannerService) scanIP(ctx context.Context, ip string) *DiscoveredDevice {
	openPorts := make([]int, 0, 5)
	services := make([]string, 0, 5)
	var routerOSInfo *RouterOSInfo

	// Channel for port scan results
	portChan := make(chan int, len(TargetPorts))

	// Limit concurrent port scans per IP
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup

	for _, port := range TargetPorts {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			select {
			case <-ctx.Done():
				return
			default:
				if IsPortOpen(ctx, ip, p, s.config.HTTPTimeout) {
					portChan <- p
				}
			}
		}(port)
	}

	go func() {
		wg.Wait()
		close(portChan)
	}()

	// Collect open ports
	for port := range portChan {
		openPorts = append(openPorts, port)
		services = append(services, GetServiceName(port))
	}

	if len(openPorts) == 0 {
		return nil
	}

	// Identify device type
	deviceType := unknownDeviceType
	vendor := unknownDeviceType

	// Check for MikroTik-specific ports first
	if containsPort(openPorts, 8728) || containsPort(openPorts, 8729) || containsPort(openPorts, 8291) { //nolint:nestif // scanner detection logic
		deviceType = routerDeviceType
		vendor = mikrotikVendor
	} else if containsPort(openPorts, 80) || containsPort(openPorts, 443) {
		// Verify RouterOS API
		for _, port := range HTTPAPIPorts {
			if containsPort(openPorts, port) {
				if info := CheckRouterOSAPI(ctx, ip, port, s.config.HTTPTimeout); info != nil && info.IsValid {
					deviceType = routerDeviceType
					vendor = mikrotikVendor
					routerOSInfo = info
					break
				}
			}
		}
		if deviceType == unknownDeviceType {
			return nil // Not a MikroTik device
		}
	}

	// Only return MikroTik devices
	if vendor != mikrotikVendor {
		return nil
	}

	// Resolve hostname
	hostname := ""
	if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
		hostname = names[0]
	}

	// Update service names for MikroTik
	mikrotikServices := make([]string, len(services))
	for i, service := range services {
		switch service {
		case "http":
			mikrotikServices[i] = "mikrotik-rest"
		case "https":
			mikrotikServices[i] = "mikrotik-rest-ssl"
		default:
			mikrotikServices[i] = service
		}
	}

	confidence := 80
	if routerOSInfo != nil {
		confidence = routerOSInfo.Confidence
	}

	return &DiscoveredDevice{
		IP:           ip,
		Hostname:     hostname,
		Ports:        openPorts,
		DeviceType:   deviceType,
		Vendor:       vendor,
		Services:     mikrotikServices,
		RouterOSInfo: routerOSInfo,
		Confidence:   confidence,
	}
}

// scanGatewayIP scans a gateway IP specifically for RouterOS REST API.
func (s *ScannerService) scanGatewayIP(ctx context.Context, ip string) *DiscoveredDevice {
	openPorts := make([]int, 0, 2)
	services := make([]string, 0, 2)
	var routerOSInfo *RouterOSInfo

	// Check HTTP API ports first
	for _, port := range HTTPAPIPorts {
		select {
		case <-ctx.Done():
			return nil
		default:
			if IsPortOpen(ctx, ip, port, s.config.HTTPTimeout) {
				openPorts = append(openPorts, port)
				services = append(services, GetServiceName(port))

				// Verify RouterOS API
				if info := CheckRouterOSAPI(ctx, ip, port, s.config.HTTPTimeout); info != nil && info.IsValid {
					routerOSInfo = info
					break
				}
			}
		}
	}

	// Only return verified RouterOS devices
	if routerOSInfo == nil || !routerOSInfo.IsValid {
		return nil
	}

	// Resolve hostname
	hostname := ""
	if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
		hostname = names[0]
	}

	// Update service names
	mikrotikServices := make([]string, len(services))
	for i, service := range services {
		switch service {
		case httpProtocol:
			mikrotikServices[i] = mikrotikRestAPI
		case httpsProtocol:
			mikrotikServices[i] = mikrotikRestAPISSL
		default:
			mikrotikServices[i] = service
		}
	}

	return &DiscoveredDevice{
		IP:           ip,
		Hostname:     hostname,
		Ports:        openPorts,
		DeviceType:   routerDeviceType,
		Vendor:       mikrotikVendor,
		Services:     mikrotikServices,
		RouterOSInfo: routerOSInfo,
		Confidence:   routerOSInfo.Confidence,
	}
}
