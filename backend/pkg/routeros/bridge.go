package routeros

import (
	"fmt"
	"strconv"
)

// BridgeHost represents a bridge host entry with MAC and interface information.
type BridgeHost struct {
	MacAddress  string
	OnInterface string
}

// BridgePortConfig represents configuration for adding or updating a bridge port.
type BridgePortConfig struct {
	Bridge    string // bridge name or ID
	Interface string // interface to add as port
	Disabled  bool
	Edge      string // auto, no, no-discover, yes, yes-discover
	PathCost  int
	Comment   string
}

// BridgePort represents a bridge port with its properties.
type BridgePort struct {
	ID        string
	Bridge    string
	Interface string
	Disabled  *bool
	Edge      *string
	PathCost  *int64
	Comment   *string
}

// BridgeInfo represents a bridge interface with its properties.
type BridgeInfo struct {
	ID                   string
	Name                 string
	Disabled             *bool
	MacAddress           *string
	CurrentMacAddress    *string
	Priority             *int64
	PathCost             *int64
	HelloTime            *int64
	MaxMessageAge        *int64
	ForwardDelay         *int64
	TransmitHoldCount    *int64
	AgingTime            *int64
	ProtocolMode         *string
	FailureDetection     *bool
	ForceProtocolVersion *string
	Comment              *string
}

// GetAllBridgeHosts retrieves all bridge host entries from RouterOS.
func (c *Client) GetAllBridgeHosts() ([]BridgeHost, error) {
	results, err := c.GetAll("/interface/bridge/host")
	if err != nil {
		return nil, fmt.Errorf("failed to query bridge hosts: %w", err)
	}

	hosts := make([]BridgeHost, 0, len(results))
	for _, result := range results {
		macAddr, macExists := result["mac-address"]
		onIface, ifaceExists := result["on-interface"]

		if macExists && ifaceExists {
			hosts = append(hosts, BridgeHost{
				MacAddress:  macAddr,
				OnInterface: onIface,
			})
		}
	}

	return hosts, nil
}

// GetBridgePortByMAC retrieves the bridge port (on-interface) for a given MAC address.
func (c *Client) GetBridgePortByMAC(macAddress string) (string, error) {
	results, err := c.GetAll("/interface/bridge/host", fmt.Sprintf("?=mac-address=%s", macAddress))
	if err != nil {
		return "", fmt.Errorf("failed to query bridge hosts: %w", err)
	}

	if len(results) == 0 {
		return "", fmt.Errorf("MAC address %s not found in bridge", macAddress)
	}

	onInterface, exists := results[0]["on-interface"]
	if !exists {
		return "", fmt.Errorf("on-interface property not found for MAC %s", macAddress)
	}

	return onInterface, nil
}

// RemoveBridgeMemberByName removes an interface from any bridge it's a member of by interface name.
func (c *Client) RemoveBridgeMemberByName(ifName string) error {
	results, err := c.GetAll("/interface/bridge/port")
	if err != nil {
		return fmt.Errorf("failed to list bridge members: %w", err)
	}

	for _, result := range results {
		if result["interface"] == ifName {
			_, err := c.Remove("/interface/bridge/port", "=.id="+result[".id"])
			if err != nil {
				return fmt.Errorf("failed to remove bridge member %s: %w", ifName, err)
			}
			return nil
		}
	}

	return nil
}

// ListBridges retrieves all bridge interfaces.
func (c *Client) ListBridges() ([]BridgeInfo, error) {
	results, err := c.GetAll("/interface/bridge")
	if err != nil {
		return nil, fmt.Errorf("failed to list bridges: %w", err)
	}

	bridges := make([]BridgeInfo, 0, len(results))
	for _, result := range results {
		bridges = append(bridges, parseBridgeInfo(result))
	}

	return bridges, nil
}

// GetBridge retrieves a specific bridge by name.
func (c *Client) GetBridge(name string) (*BridgeInfo, error) {
	result, err := c.GetFirst("/interface/bridge", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get bridge %s: %w", name, err)
	}

	bridge := parseBridgeInfo(result)
	return &bridge, nil
}

// AddBridge creates a new bridge interface.
func (c *Client) AddBridge(config BridgeConfig) (string, error) {
	args := []string{
		"=name=" + config.Name,
	}

	if config.MacAddress != "" {
		args = append(args, "=mac-address="+config.MacAddress)
	}
	if config.Priority > 0 {
		args = append(args, "=priority="+strconv.Itoa(config.Priority))
	}
	if config.PathCost > 0 {
		args = append(args, "=path-cost="+strconv.Itoa(config.PathCost))
	}
	if config.HelloTime > 0 {
		args = append(args, "=hello-time="+strconv.Itoa(config.HelloTime))
	}
	if config.MaxMessageAge > 0 {
		args = append(args, "=max-message-age="+strconv.Itoa(config.MaxMessageAge))
	}
	if config.ForwardDelay > 0 {
		args = append(args, "=forward-delay="+strconv.Itoa(config.ForwardDelay))
	}
	if config.TransmitHoldCount > 0 {
		args = append(args, "=transmit-hold-count="+strconv.Itoa(config.TransmitHoldCount))
	}
	if config.AgingTime > 0 {
		args = append(args, "=aging-time="+strconv.Itoa(config.AgingTime))
	}
	if config.ProtocolMode != "" {
		args = append(args, "=protocol-mode="+config.ProtocolMode)
	}
	if config.FailureDetection {
		args = append(args, "=failure-detection=yes")
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/interface/bridge", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add bridge: %w", err)
	}

	return id, nil
}

// UpdateBridge updates an existing bridge interface.
func (c *Client) UpdateBridge(id string, config BridgeConfig) error {
	args := []string{
		"=.id=" + id,
	}

	if config.Name != "" {
		args = append(args, "=name="+config.Name)
	}
	if config.MacAddress != "" {
		args = append(args, "=mac-address="+config.MacAddress)
	}
	if config.Priority > 0 {
		args = append(args, "=priority="+strconv.Itoa(config.Priority))
	}
	if config.PathCost > 0 {
		args = append(args, "=path-cost="+strconv.Itoa(config.PathCost))
	}
	if config.HelloTime > 0 {
		args = append(args, "=hello-time="+strconv.Itoa(config.HelloTime))
	}
	if config.MaxMessageAge > 0 {
		args = append(args, "=max-message-age="+strconv.Itoa(config.MaxMessageAge))
	}
	if config.ForwardDelay > 0 {
		args = append(args, "=forward-delay="+strconv.Itoa(config.ForwardDelay))
	}
	if config.TransmitHoldCount > 0 {
		args = append(args, "=transmit-hold-count="+strconv.Itoa(config.TransmitHoldCount))
	}
	if config.AgingTime > 0 {
		args = append(args, "=aging-time="+strconv.Itoa(config.AgingTime))
	}
	if config.ProtocolMode != "" {
		args = append(args, "=protocol-mode="+config.ProtocolMode)
	}

	failureDetection := "no"
	if config.FailureDetection {
		failureDetection = "yes"
	}
	args = append(args, "=failure-detection="+failureDetection)

	disabled := "no"
	if config.Disabled {
		disabled = "yes"
	}
	args = append(args, "=disabled="+disabled)

	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	_, err := c.Set("/interface/bridge", args...)
	if err != nil {
		return fmt.Errorf("failed to update bridge: %w", err)
	}

	return nil
}

// RemoveBridge deletes a bridge interface.
func (c *Client) RemoveBridge(id string) error {
	_, err := c.Remove("/interface/bridge", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove bridge: %w", err)
	}

	return nil
}

// ListBridgePorts retrieves all ports of a specific bridge.
func (c *Client) ListBridgePorts(bridge string) ([]BridgePort, error) {
	results, err := c.GetAll("/interface/bridge/port", "?=bridge="+bridge)
	if err != nil {
		return nil, fmt.Errorf("failed to list bridge ports: %w", err)
	}

	ports := make([]BridgePort, 0, len(results))
	for _, result := range results {
		ports = append(ports, parseBridgePort(result))
	}

	return ports, nil
}

// GetBridgePort retrieves a specific bridge port.
//
//nolint:gocritic // false positive on parameter shadowing
func (c *Client) GetBridgePort(bridge string, iface string) (*BridgePort, error) {
	results, err := c.GetAll("/interface/bridge/port", "?=bridge="+bridge)
	if err != nil {
		return nil, fmt.Errorf("failed to get bridge port: %w", err)
	}

	for _, result := range results {
		if result["interface"] == iface {
			port := parseBridgePort(result)
			return &port, nil
		}
	}

	return nil, fmt.Errorf("bridge port not found for bridge %s and interface %s", bridge, iface)
}

// AddBridgePort adds an interface as a port to a bridge.
func (c *Client) AddBridgePort(config BridgePortConfig) (string, error) {
	args := []string{
		"=bridge=" + config.Bridge,
		"=interface=" + config.Interface,
	}

	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Edge != "" {
		args = append(args, "=edge="+config.Edge)
	}
	if config.PathCost > 0 {
		args = append(args, "=path-cost="+strconv.Itoa(config.PathCost))
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/interface/bridge/port", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add bridge port: %w", err)
	}

	return id, nil
}

// UpdateBridgePort updates an existing bridge port.
func (c *Client) UpdateBridgePort(id string, config BridgePortConfig) error {
	args := []string{
		"=.id=" + id,
	}

	disabled := "no"
	if config.Disabled {
		disabled = "yes"
	}
	args = append(args, "=disabled="+disabled)

	if config.Edge != "" {
		args = append(args, "=edge="+config.Edge)
	}
	if config.PathCost > 0 {
		args = append(args, "=path-cost="+strconv.Itoa(config.PathCost))
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	_, err := c.Set("/interface/bridge/port", args...)
	if err != nil {
		return fmt.Errorf("failed to update bridge port: %w", err)
	}

	return nil
}

// RemoveBridgePort removes an interface from a bridge.
//
//nolint:gocritic // false positive on parameter shadowing
func (c *Client) RemoveBridgePort(bridge string, iface string) error {
	results, err := c.GetAll("/interface/bridge/port", "?=bridge="+bridge)
	if err != nil {
		return fmt.Errorf("failed to find bridge port: %w", err)
	}

	for _, result := range results {
		if result["interface"] == iface {
			_, err := c.Remove("/interface/bridge/port", "=.id="+result[".id"])
			if err != nil {
				return fmt.Errorf("failed to remove bridge port: %w", err)
			}
			return nil
		}
	}

	return fmt.Errorf("bridge port not found for bridge %s and interface %s", bridge, iface)
}

func parseBridgePort(result map[string]string) BridgePort {
	return BridgePort{
		ID:        result[".id"],
		Bridge:    result["bridge"],
		Interface: result["interface"],
		Disabled:  getBoolPtr(result, "disabled"),
		Edge:      getStringPtr(result, "edge"),
		PathCost:  getInt64Ptr(result, "path-cost"),
		Comment:   getStringPtr(result, "comment"),
	}
}

func parseBridgeInfo(result map[string]string) BridgeInfo {
	return BridgeInfo{
		ID:                   result[".id"],
		Name:                 result["name"],
		Disabled:             getBoolPtr(result, "disabled"),
		MacAddress:           getStringPtr(result, "mac-address"),
		CurrentMacAddress:    getStringPtr(result, "current-mac-address"),
		Priority:             getInt64Ptr(result, "priority"),
		PathCost:             getInt64Ptr(result, "path-cost"),
		HelloTime:            getInt64Ptr(result, "hello-time"),
		MaxMessageAge:        getInt64Ptr(result, "max-message-age"),
		ForwardDelay:         getInt64Ptr(result, "forward-delay"),
		TransmitHoldCount:    getInt64Ptr(result, "transmit-hold-count"),
		AgingTime:            getInt64Ptr(result, "aging-time"),
		ProtocolMode:         getStringPtr(result, "protocol-mode"),
		FailureDetection:     getBoolPtr(result, "failure-detection"),
		ForceProtocolVersion: getStringPtr(result, "force-protocol-version"),
		Comment:              getStringPtr(result, "comment"),
	}
}
