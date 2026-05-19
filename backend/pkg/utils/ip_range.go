package utils

import (
	"strconv"
	"strings"
)

// ipToInteger converts an IP address string to a 32-bit integer.
func ipToInteger(ip string) uint32 {
	parts := strings.Split(ip, ".")
	if len(parts) != 4 {
		return 0
	}

	var result uint32
	for _, part := range parts {
		num, _ := strconv.Atoi(part)
		if num < 0 || num > 255 {
			return 0
		}
		result = result*256 + uint32(num)
	}
	return result
}

// extractThirdOctet extracts the third octet from an IP address integer.
func extractThirdOctet(ipInt uint32) int {
	return int((ipInt >> 8) & 0xFF)
}

// FindFirstAvailableRange finds the first available third octet digit (0-9) for a given base IP prefix.
// PoolsData: list of existing IP pools as maps from GetAll results.
// BaseIP: the IP prefix to search for (e.g., "192.168.12" for 192.168.120-129).
// Returns the available digit x (0-9) to append to the prefix.
func FindFirstAvailableRange(poolsData []map[string]string, baseIP string) int {
	usedThirdOctets := make(map[int]bool)
	baseIPParts := strings.Split(baseIP, ".")
	if len(baseIPParts) != 3 {
		return 0
	}

	baseThirdOctet, _ := strconv.Atoi(baseIPParts[2])

	for _, pool := range poolsData {
		if ranges, ok := pool["ranges"]; ok {
			if strings.Contains(ranges, baseIP) {
				parts := strings.Split(ranges, "-")
				if len(parts) >= 1 {
					startIP := strings.TrimSpace(parts[0])
					startIPInt := ipToInteger(startIP)
					thirdOctet := extractThirdOctet(startIPInt)

					if thirdOctet >= baseThirdOctet*10 && thirdOctet < (baseThirdOctet+1)*10 {
						digit := thirdOctet % 10
						usedThirdOctets[digit] = true
					}
				}
			}
		}
	}

	for x := 0; x <= 9; x++ {
		if !usedThirdOctets[x] {
			return x
		}
	}

	return 0
}
