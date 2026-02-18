package scanner

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	unknownVendor  = "unknown"
	mikrotikVendor = "MikroTik"
)

// Device represents a discovered device.
type Device struct {
	IP       string   `json:"ip"`
	Hostname string   `json:"hostname,omitempty"`
	Ports    []int    `json:"ports"`
	Type     string   `json:"type"`
	Vendor   string   `json:"vendor"`
	Services []string `json:"services"`
}

// Config holds scanner configuration.
type Config struct {
	MaxWorkers  int
	Timeout     time.Duration
	TargetPorts []int
}

// DefaultConfig returns the default scanner configuration.
func DefaultConfig() Config {
	return Config{
		MaxWorkers:  20,
		Timeout:     2 * time.Second,
		TargetPorts: []int{80, 443, 8728, 8729, 8291},
	}
}

// HTTPAPIPorts are ports used for automatic gateway scanning.
var HTTPAPIPorts = []int{80, 443}

// ScanIP scans a single IP for open ports and identifies MikroTik devices.
func ScanIP(ctx context.Context, ip string, ports []int, timeout time.Duration) *Device { //nolint:gocyclo // port scanning logic
	openPorts := make([]int, 0, len(ports))
	services := make([]string, 0, len(ports))

	portChan := make(chan int, len(ports))
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup

	for _, port := range ports {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			select {
			case <-ctx.Done():
				return
			default:
				if IsPortOpen(ctx, ip, p, timeout) {
					portChan <- p
				}
			}
		}(port)
	}

	go func() {
		wg.Wait()
		close(portChan)
	}()

	for port := range portChan {
		openPorts = append(openPorts, port)
		services = append(services, GetServiceName(port))
	}

	if len(openPorts) == 0 {
		return nil
	}

	hostname := ""
	if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
		hostname = names[0]
	}

	deviceType := unknownVendor
	vendor := unknownVendor

	if ContainsPort(openPorts, 8728) || ContainsPort(openPorts, 8729) || ContainsPort(openPorts, 8291) { //nolint:nestif // port detection logic
		deviceType = "router"
		vendor = mikrotikVendor
	} else if ContainsPort(openPorts, 80) || ContainsPort(openPorts, 443) {
		for _, port := range []int{80, 443} {
			if ContainsPort(openPorts, port) {
				if info := CheckRouterOSAPI(ctx, ip, port, timeout); info != nil && info.IsValid {
					deviceType = "router"
					vendor = mikrotikVendor
					break
				}
			}
		}
		if deviceType == unknownVendor {
			return nil
		}
	}

	if vendor == mikrotikVendor || ContainsPort(openPorts, 8728) || ContainsPort(openPorts, 8729) || ContainsPort(openPorts, 8291) {
		finalServices := services
		if vendor == mikrotikVendor {
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
			finalServices = mikrotikServices
		}

		return &Device{
			IP:       ip,
			Hostname: hostname,
			Ports:    openPorts,
			Type:     deviceType,
			Vendor:   vendor,
			Services: finalServices,
		}
	}

	return nil
}

// IsPortOpen checks if a specific port is open on an IP.
func IsPortOpen(ctx context.Context, ip string, port int, timeout time.Duration) bool {
	address := net.JoinHostPort(ip, strconv.Itoa(port))

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return false
	}
	_ = conn.Close()

	return true
}

// GetServiceName returns service name for common ports.
func GetServiceName(port int) string {
	services := map[int]string{
		80:   "http",
		443:  "https",
		8728: "mikrotik-api",
		8729: "mikrotik-api-ssl",
		8291: "mikrotik-winbox",
	}

	if name, exists := services[port]; exists {
		return name
	}
	return fmt.Sprintf("tcp/%d", port)
}

// ContainsPort checks if a port exists in the slice.
func ContainsPort(ports []int, port int) bool {
	for _, p := range ports {
		if p == port {
			return true
		}
	}
	return false
}

// ParseIPRange parses CIDR notation or IP range into individual IPs.
func ParseIPRange(subnet string) ([]string, error) {
	var ips []string

	switch {
	case strings.Contains(subnet, "/"):
		_, ipNet, err := net.ParseCIDR(subnet)
		if err != nil {
			return nil, err
		}

		for ip := ipNet.IP.Mask(ipNet.Mask); ipNet.Contains(ip); IncIP(ip) {
			ips = append(ips, ip.String())
			if len(ips) > 1000 {
				break
			}
		}
	case strings.Contains(subnet, "-"):
		parts := strings.Split(subnet, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid IP range format")
		}

		startIP := net.ParseIP(strings.TrimSpace(parts[0]))
		endIP := net.ParseIP(strings.TrimSpace(parts[1]))
		if startIP == nil || endIP == nil {
			return nil, fmt.Errorf("invalid IP addresses in range")
		}

		start := startIP.To4()
		end := endIP.To4()
		if start == nil || end == nil {
			return nil, fmt.Errorf("only IPv4 ranges supported")
		}

		for ip := make(net.IP, 4); ; IncIP(ip) {
			copy(ip, start)
			ips = append(ips, ip.String())
			if ip.Equal(end) || len(ips) > 1000 {
				break
			}
			IncIP(start)
		}
	default:
		if net.ParseIP(subnet) != nil {
			ips = append(ips, subnet)
		} else {
			return nil, fmt.Errorf("invalid IP format")
		}
	}

	return ips, nil
}

// IncIP increments an IP address.
func IncIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

// ErrorResponse sends a JSON error response.
func ErrorResponse(w http.ResponseWriter, statusCode int, errCode, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{ //nolint:errcheck,errchkjson // HTTP response already committed
		"error":   errCode,
		"message": message,
	})
}
