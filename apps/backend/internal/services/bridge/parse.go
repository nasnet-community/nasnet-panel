package bridge

import (
	"fmt"
	"time"
)

// parseBridges parses multiple bridges from RouterOS response data.
func (s *BridgeService) parseBridges(data []map[string]string) ([]*BridgeData, error) {
	bridges := make([]*BridgeData, 0, len(data))
	for _, item := range data {
		bridge, err := s.parseBridgeFromMap(item)
		if err != nil {
			return nil, fmt.Errorf("failed to parse bridge: %w", err)
		}
		bridges = append(bridges, bridge)
	}
	return bridges, nil
}

// parseBridge parses a single bridge from the first element of response data.
func (s *BridgeService) parseBridge(data []map[string]string) (*BridgeData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no bridge data returned")
	}
	return s.parseBridgeFromMap(data[0])
}

// parseBridgeFromMap creates a BridgeData from a RouterOS response map.
func (s *BridgeService) parseBridgeFromMap(item map[string]string) (*BridgeData, error) {
	bridge := &BridgeData{
		UUID:       item[".id"],
		Name:       item["name"],
		Comment:    item["comment"],
		MacAddress: item["mac-address"],
		Protocol:   item["protocol"],
	}

	if disabled, ok := item["disabled"]; ok {
		bridge.Disabled = (disabled == "yes" || disabled == "true")
	}

	if running, ok := item["running"]; ok {
		bridge.Running = (running == "yes" || running == "true")
	} else {
		bridge.Running = !bridge.Disabled
	}

	if mtu, ok := item["mtu"]; ok {
		if val, err := ParseInt(mtu); err == nil {
			bridge.MTU = val
		}
	}

	if priority, ok := item["priority"]; ok {
		if val, err := ParseInt(priority); err == nil {
			bridge.Priority = val
		}
	}

	if vlanFiltering, ok := item["vlan-filtering"]; ok {
		bridge.VlanFiltering = (vlanFiltering == "yes" || vlanFiltering == "true")
	}

	if pvid, ok := item["pvid"]; ok {
		if val, err := ParseInt(pvid); err == nil {
			bridge.PVID = val
		}
	}

	bridge.Ports = make([]*BridgePortData, 0)
	bridge.Vlans = make([]*BridgeVlanData, 0)
	bridge.IPAddresses = make([]string, 0)

	return bridge, nil
}

// parseBridgePorts parses multiple bridge ports from RouterOS response data.
func (s *BridgeService) parseBridgePorts(data []map[string]string) ([]*BridgePortData, error) {
	ports := make([]*BridgePortData, 0, len(data))
	for _, item := range data {
		port, err := s.parseBridgePortFromMap(item)
		if err != nil {
			return nil, fmt.Errorf("failed to parse bridge port: %w", err)
		}
		ports = append(ports, port)
	}
	return ports, nil
}

// parseBridgePort parses a single bridge port from response data.
func (s *BridgeService) parseBridgePort(data []map[string]string) (*BridgePortData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no bridge port data returned")
	}
	return s.parseBridgePortFromMap(data[0])
}

// parseBridgePortFromMap creates a BridgePortData from a RouterOS response map.
func (s *BridgeService) parseBridgePortFromMap(item map[string]string) (*BridgePortData, error) {
	port := &BridgePortData{
		UUID:          item[".id"],
		BridgeID:      item["bridge"],
		InterfaceID:   item["interface"],
		InterfaceName: item["interface"],
		FrameTypes:    item["frame-types"],
		Role:          item["role"],
		State:         item["state"],
	}

	if pvid, ok := item["pvid"]; ok {
		if val, err := ParseInt(pvid); err == nil {
			port.PVID = val
		}
	}

	if ingressFiltering, ok := item["ingress-filtering"]; ok {
		port.IngressFiltering = (ingressFiltering == "yes" || ingressFiltering == "true")
	}

	if edge, ok := item["edge"]; ok {
		port.Edge = (edge == "yes" || edge == "true")
	}

	if pathCost, ok := item["path-cost"]; ok {
		if val, err := ParseInt(pathCost); err == nil {
			port.PathCost = val
		}
	}

	if tagged, ok := item["tagged"]; ok && tagged != "" {
		port.TaggedVlans = ParseIntList(tagged)
	} else {
		port.TaggedVlans = make([]int, 0)
	}

	if untagged, ok := item["untagged"]; ok && untagged != "" {
		port.UntaggedVlans = ParseIntList(untagged)
	} else {
		port.UntaggedVlans = make([]int, 0)
	}

	if port.FrameTypes == "" {
		port.FrameTypes = "admit-all"
	}
	if port.Role == "" {
		port.Role = "designated"
	}
	if port.State == "" {
		port.State = "forwarding"
	}

	return port, nil
}

// parseBridgeVlans parses multiple bridge VLANs from RouterOS response data.
func (s *BridgeService) parseBridgeVlans(data []map[string]string) ([]*BridgeVlanData, error) {
	vlans := make([]*BridgeVlanData, 0, len(data))
	for _, item := range data {
		vlan, err := s.parseBridgeVlanFromMap(item)
		if err != nil {
			return nil, fmt.Errorf("failed to parse bridge VLAN: %w", err)
		}
		vlans = append(vlans, vlan)
	}
	return vlans, nil
}

// parseBridgeVlan parses a single bridge VLAN from response data.
func (s *BridgeService) parseBridgeVlan(data []map[string]string) (*BridgeVlanData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no bridge VLAN data returned")
	}
	return s.parseBridgeVlanFromMap(data[0])
}

// parseBridgeVlanFromMap creates a BridgeVlanData from a RouterOS response map.
func (s *BridgeService) parseBridgeVlanFromMap(item map[string]string) (*BridgeVlanData, error) {
	vlan := &BridgeVlanData{
		UUID:     item[".id"],
		BridgeID: item["bridge"],
	}

	if vlanIds, ok := item["vlan-ids"]; ok {
		vlans := ParseIntList(vlanIds)
		if len(vlans) > 0 {
			vlan.VlanID = vlans[0]
		}
	}

	if tagged, ok := item["tagged"]; ok && tagged != "" {
		vlan.TaggedPortIDs = ParseStringList(tagged)
	} else {
		vlan.TaggedPortIDs = make([]string, 0)
	}

	if untagged, ok := item["untagged"]; ok && untagged != "" {
		vlan.UntaggedPortIDs = ParseStringList(untagged)
	} else {
		vlan.UntaggedPortIDs = make([]string, 0)
	}

	return vlan, nil
}

// parseStpStatus parses STP status from RouterOS response data.
func (s *BridgeService) parseStpStatus(data []map[string]string) (*BridgeStpStatusData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no STP status data returned")
	}

	item := data[0]
	status := &BridgeStpStatusData{
		RootBridgeID: item["root-bridge-id"],
		RootPort:     item["root-port"],
	}

	if rootBridge, ok := item["root-bridge"]; ok {
		status.RootBridge = (rootBridge == "yes" || rootBridge == "true")
	}

	if rootPathCost, ok := item["root-path-cost"]; ok {
		if val, err := ParseInt(rootPathCost); err == nil {
			status.RootPathCost = val
		}
	}

	if tcCount, ok := item["topology-change-count"]; ok {
		if val, err := ParseInt(tcCount); err == nil {
			status.TopologyChangeCount = val
		}
	}

	if lastChange, ok := item["last-topology-change"]; ok && lastChange != "" {
		if t, err := ParseRouterOSTime(lastChange); err == nil {
			status.LastTopologyChange = &t
		}
	}

	return status, nil
}

// ParseInt parses a string to int.
func ParseInt(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	var val int
	_, err := fmt.Sscanf(s, "%d", &val)
	return val, err
}

// ParseIntList parses a comma-separated string of ints.
func ParseIntList(s string) []int {
	if s == "" {
		return make([]int, 0)
	}
	parts := SplitComma(s)
	result := make([]int, 0, len(parts))
	for _, part := range parts {
		if val, err := ParseInt(part); err == nil {
			result = append(result, val)
		}
	}
	return result
}

// ParseStringList parses a comma-separated string.
func ParseStringList(s string) []string {
	if s == "" {
		return make([]string, 0)
	}
	parts := SplitComma(s)
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

// SplitComma splits a string by commas and trims spaces.
func SplitComma(s string) []string {
	parts := make([]string, 0)
	current := ""
	for _, ch := range s {
		if ch == ',' {
			if current != "" {
				parts = append(parts, TrimSpace(current))
				current = ""
			}
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		parts = append(parts, TrimSpace(current))
	}
	return parts
}

// TrimSpace trims leading and trailing whitespace.
func TrimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}

// ParseRouterOSTime parses RouterOS time/duration values.
func ParseRouterOSTime(s string) (time.Time, error) {
	if s == "" || s == "never" {
		return time.Time{}, fmt.Errorf("no time value")
	}

	formats := []string{
		"jan/02/2006 15:04:05",
		"Jan/02/2006 15:04:05",
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}

	if dur, err := ParseRouterOSDuration(s); err == nil {
		return time.Now().Add(-dur), nil
	}

	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}

// ParseRouterOSDuration parses RouterOS duration format (e.g., "1w2d3h4m5s").
func ParseRouterOSDuration(s string) (time.Duration, error) {
	var weeks, days, hours, minutes, seconds int

	current := ""
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if ch >= '0' && ch <= '9' {
			current += string(ch)
		} else {
			val := 0
			if current != "" {
				fmt.Sscanf(current, "%d", &val)
				current = ""
			}
			switch ch {
			case 'w':
				weeks = val
			case 'd':
				days = val
			case 'h':
				hours = val
			case 'm':
				minutes = val
			case 's':
				seconds = val
			}
		}
	}

	totalHours := weeks*24*7 + days*24 + hours
	totalMinutes := totalHours*60 + minutes
	totalSeconds := totalMinutes*60 + seconds

	return time.Duration(totalSeconds) * time.Second, nil
}
