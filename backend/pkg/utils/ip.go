package utils

import (
	"encoding/binary"
	"net"
	"sort"
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
