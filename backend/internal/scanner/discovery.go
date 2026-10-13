package scanner

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"
)

// RouterOSInfo represents what the scanner learned about a RouterOS device from its open service ports.
type RouterOSInfo struct {
	Version      string
	Architecture string
	BoardName    string
	Confidence   int
	IsValid      bool
}

// CheckNativeRouterOSAPI checks if a RouterOS native API is running on the given address.
func CheckNativeRouterOSAPI(_ context.Context, ip string, port int, timeout time.Duration) *RouterOSInfo {
	address := net.JoinHostPort(ip, fmt.Sprintf("%d", port))
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return nil
	}
	defer func() {
		_ = conn.Close()
	}()

	confidenceScore := 40
	if port == 8729 {
		confidenceScore = 45
	}

	return &RouterOSInfo{
		IsValid:    true,
		Confidence: confidenceScore,
	}
}

// CheckWinBoxAPI checks if a WinBox API is running on the given address.
func CheckWinBoxAPI(_ context.Context, ip string, port int, timeout time.Duration) *RouterOSInfo {
	address := net.JoinHostPort(ip, fmt.Sprintf("%d", port))
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return nil
	}
	defer func() {
		_ = conn.Close()
	}()

	return &RouterOSInfo{
		IsValid:    true,
		Confidence: 50,
	}
}

func CalculateNativeAPIConfidence(openPorts []int) int {
	has8728 := ContainsPort(openPorts, 8728)
	has8729 := ContainsPort(openPorts, 8729)
	has8291 := ContainsPort(openPorts, 8291)

	if has8728 && has8729 && has8291 {
		return 95
	}
	if (has8728 || has8729) && has8291 {
		return 85
	}
	if has8728 && has8729 {
		return 80
	}
	if has8729 {
		return 50
	}
	if has8291 {
		return 50
	}
	if has8728 {
		return 40
	}
	return 0
}

func ScanGatewayIP(ctx context.Context, ip string, ports []int, timeout time.Duration) *Device {
	var openPorts []int
	var services []string
	var routerOSInfo *RouterOSInfo

	for _, port := range ports {
		select {
		case <-ctx.Done():
			return nil
		default:
			if IsPortOpen(ctx, ip, port, timeout) {
				openPorts = append(openPorts, port)
				services = append(services, GetServiceName(port))

				if routerOSInfo == nil {
					if port == 8728 || port == 8729 {
						if info := CheckNativeRouterOSAPI(ctx, ip, port, timeout); info != nil {
							routerOSInfo = info
						}
					} else if port == 8291 {
						if info := CheckWinBoxAPI(ctx, ip, port, timeout); info != nil {
							routerOSInfo = info
						}
					}
				}
			}
		}
	}

	if routerOSInfo != nil && routerOSInfo.IsValid {
		confidence := CalculateNativeAPIConfidence(openPorts)
		if confidence > 0 {
			routerOSInfo.Confidence = confidence
		}

		hostname := ""
		resolver := &net.Resolver{}
		if names, err := resolver.LookupAddr(ctx, ip); err == nil && len(names) > 0 {
			hostname = names[0]
		}

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

		return &Device{
			IP:       ip,
			Hostname: hostname,
			Ports:    openPorts,
			Type:     "router",
			Vendor:   "MikroTik",
			Services: mikrotikServices,
		}
	}

	return nil
}

// GenerateGatewayIPs generates all 192.168.x.1 addresses (256 total).
func GenerateGatewayIPs() []string {
	var ips []string
	for i := 0; i <= 255; i++ {
		ip := fmt.Sprintf("192.168.%d.1", i)
		ips = append(ips, ip)
	}
	return ips
}

// ProcessGatewayScan executes automatic gateway scanning for 192.168.0-255.1.
func ProcessGatewayScan(ctx context.Context, cfg Config, resultFn func(Device)) {
	ips := GenerateGatewayIPs()
	totalIPs := len(ips)
	if totalIPs == 0 {
		return
	}

	jobs := make(chan string, cfg.MaxWorkers)
	results := make(chan Device, cfg.MaxWorkers)

	var wg sync.WaitGroup
	for i := 0; i < cfg.MaxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					if device := ScanGatewayIP(ctx, ip, MikrotikServicePorts, cfg.Timeout); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	go func() {
		for device := range results {
			if resultFn != nil {
				resultFn(device)
			}
		}
	}()

	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
			}
		}
	}()

	wg.Wait()
}
