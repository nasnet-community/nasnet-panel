package utils

import (
	"encoding/binary"
	"fmt"
	"net"
	"sort"
	"strconv"
)

type IPSortable struct {
	IP      string
	Numeric uint32
}

func ParseIPToNumeric(ipStr string) uint32 {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return 0
	}
	ip = ip.To4()
	if ip == nil {
		return 0
	}
	return binary.BigEndian.Uint32(ip)
}

// ValidateIPPort reports an error unless value is a valid "ip:port" pair.
func ValidateIPPort(value string) error {
	host, portStr, err := net.SplitHostPort(value)
	if err != nil {
		return fmt.Errorf("invalid ip:port %q: %w", value, err)
	}
	if net.ParseIP(host) == nil {
		return fmt.Errorf("invalid IP address: %s", host)
	}
	port, err := strconv.Atoi(portStr)
	if err != nil || port < 1 || port > 65535 {
		return fmt.Errorf("invalid port: %s", portStr)
	}
	return nil
}

func SortIPsByNumeric(ips []string) []string {
	sortable := make([]IPSortable, len(ips))
	for i, ip := range ips {
		sortable[i] = IPSortable{
			IP:      ip,
			Numeric: ParseIPToNumeric(ip),
		}
	}

	sort.Slice(sortable, func(i, j int) bool {
		return sortable[i].Numeric < sortable[j].Numeric
	})

	result := make([]string, len(sortable))
	for i, item := range sortable {
		result[i] = item.IP
	}
	return result
}
