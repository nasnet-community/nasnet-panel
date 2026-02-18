package mikrotik

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
)

// InitializeContainerIPs detects all IP addresses of the container. //nolint:nestif
func InitializeContainerIPs() {
	containerIPsMux.Lock()
	defer containerIPsMux.Unlock()

	if containerIPsInitialized {
		return
	}

	interfaces, err := net.Interfaces()
	if err != nil {
		fmt.Printf("[CONTAINER] Warning: Failed to enumerate network interfaces: %v\n", err)
		return
	}

	var detectedIPs []net.IP

	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		addresses, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addresses {
			var ip net.IP

			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			if ip != nil && ip.To4() != nil {
				detectedIPs = append(detectedIPs, ip)
				fmt.Printf("[CONTAINER] Detected container IP: %s (interface: %s)\n", ip.String(), iface.Name)
			}
		}
	}

	containerIPs = detectedIPs
	containerIPsInitialized = true

	if len(containerIPs) > 0 {
		fmt.Printf("[CONTAINER] Container IP detection completed: %d addresses found\n", len(containerIPs))
	} else {
		fmt.Printf("[CONTAINER] Warning: No container IPs detected - self-connection detection disabled\n")
	}
}

// IsSelfConnection checks if the requested IP is the container's own IP.
func IsSelfConnection(requestedIP string) bool {
	host, _, err := net.SplitHostPort(requestedIP)
	if err != nil {
		host = requestedIP
	}

	targetIP := net.ParseIP(host)
	if targetIP == nil {
		return false
	}

	if !containerIPsInitialized {
		InitializeContainerIPs()
	}

	containerIPsMux.RLock()
	defer containerIPsMux.RUnlock()

	for _, cIP := range containerIPs {
		if targetIP.Equal(cIP) {
			return true
		}
	}

	return false
}

// DetectDefaultGateway detects the default gateway IP address.
func DetectDefaultGateway() {
	gatewayIPMux.Lock()
	defer gatewayIPMux.Unlock()

	if gatewayIPInitialized {
		return
	}

	file, err := os.Open("/proc/net/route")
	if err != nil {
		detectGatewayAlternative()
		gatewayIPInitialized = true
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	scanner.Scan() // Skip header line

	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)

		if len(fields) >= 3 { //nolint:nestif // container field parsing
			if fields[1] == "00000000" {
				gatewayHex := fields[2]
				if len(gatewayHex) == 8 {
					ip := ParseHexIP(gatewayHex)
					if ip != nil {
						gatewayIP = ip
						fmt.Printf("[CONTAINER] Detected default gateway: %s\n", ip.String())
						break
					}
				}
			}
		}
	}

	gatewayIPInitialized = true

	if gatewayIP != nil {
		fmt.Printf("[CONTAINER] Gateway detection completed: %s\n", gatewayIP.String())
	} else {
		fmt.Printf("[CONTAINER] Warning: No default gateway detected\n")
	}
}

// detectGatewayAlternative attempts to detect gateway on non-Linux systems.
func detectGatewayAlternative() {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		fmt.Printf("[CONTAINER] Warning: Could not detect gateway IP: %v\n", err)
		return
	}
	defer conn.Close()

	localAddr, ok := conn.LocalAddr().(*net.UDPAddr)
	if !ok || localAddr.IP == nil {
		fmt.Printf("[CONTAINER] Warning: Could not assert UDP address type\n")
		return
	}
	if localAddr.IP != nil {
		ip := localAddr.IP.To4()
		if ip != nil {
			gateway := make(net.IP, 4)
			copy(gateway, ip)
			gateway[3] = 1
			gatewayIP = gateway
			fmt.Printf("[CONTAINER] Estimated gateway IP: %s (based on local IP: %s)\n",
				gateway.String(), localAddr.IP.String())
		}
	}
}

// ParseHexIP converts a hexadecimal IP address (little-endian) to net.IP.
func ParseHexIP(hexStr string) net.IP {
	if len(hexStr) != 8 {
		return nil
	}

	ip := make(net.IP, 4)
	for i := 0; i < 4; i++ {
		hex := hexStr[i*2 : i*2+2]
		val := 0
		for _, ch := range hex {
			val <<= 4
			switch {
			case ch >= '0' && ch <= '9':
				val += int(ch - '0')
			case ch >= 'A' && ch <= 'F':
				val += int(ch - 'A' + 10)
			case ch >= 'a' && ch <= 'f':
				val += int(ch - 'a' + 10)
			}
		}
		ip[3-i] = byte(val)
	}

	return ip
}

// IsHostRouterIP checks if the IP is the container's gateway (host router).
func IsHostRouterIP(requestedIP string) bool {
	if !gatewayIPInitialized {
		DetectDefaultGateway()
	}

	gatewayIPMux.RLock()
	defer gatewayIPMux.RUnlock()

	if gatewayIP == nil {
		return false
	}

	host, _, err := net.SplitHostPort(requestedIP)
	if err != nil {
		host = requestedIP
	}

	targetIP := net.ParseIP(host)
	if targetIP == nil {
		return false
	}

	return targetIP.Equal(gatewayIP)
}
