package routeros

import (
	"fmt"
	"strconv"
)

type InterfaceInfo struct {
	ID       string
	Name     string
	Type     string
	Running  bool
	Mac      string
	MTU      int
	Disabled bool
	Comment  string
}

type EthernetConfig struct {
	Name     string
	Disabled bool
	MTU      int
	L2MTU    int
	Comment  string
}

type BridgeConfig struct {
	Name                 string
	Disabled             bool
	MacAddress           string
	Priority             int
	PathCost             int
	HelloTime            int
	MaxMessageAge        int
	ForwardDelay         int
	TransmitHoldCount    int
	AgingTime            int
	ProtocolMode         string // rstp, mstp, pim
	FailureDetection     bool
	ForceProtocolVersion string
	Comment              string
}

type VLANConfig struct {
	Name        string
	Interface   string // parent interface
	VLANId      int
	MTU         int
	Disabled    bool
	LoopProtect bool
	Comment     string
}

type PPPConfig struct {
	Name             string
	Interface        string
	Username         string
	Password         string
	Service          string // pppoe, pptp, l2tp
	Disabled         bool
	KeepAliveTimeout int
	Comment          string
}

type VirtualInterfaceConfig struct {
	Name     string
	Type     string // veth, vlan, bridge
	Link     string
	Disabled bool
	Comment  string
}

func (c *Client) ListInterfaces() ([]InterfaceInfo, error) {
	results, err := c.GetAll("/interface")
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	interfaces := make([]InterfaceInfo, 0)
	for _, result := range results {
		mtu, _ := strconv.Atoi(result["mtu"])
		interfaces = append(interfaces, InterfaceInfo{
			ID:       result[".id"],
			Name:     result["name"],
			Type:     result["type"],
			Running:  result["running"] == "true",
			Mac:      result["mac-address"],
			MTU:      mtu,
			Disabled: result["disabled"] == "true",
			Comment:  result["comment"],
		})
	}

	return interfaces, nil
}

func (c *Client) GetInterface(name string) (*InterfaceInfo, error) {
	result, err := c.GetFirst("/interface", "?=.id="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get interface %s: %w", name, err)
	}

	mtu, _ := strconv.Atoi(result["mtu"])
	return &InterfaceInfo{
		ID:       result[".id"],
		Name:     result["name"],
		Type:     result["type"],
		Running:  result["running"] == "true",
		Mac:      result["mac-address"],
		MTU:      mtu,
		Disabled: result["disabled"] == "true",
		Comment:  result["comment"],
	}, nil
}

func (c *Client) AddEthernetInterface(config EthernetConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
	}

	if config.MTU > 0 {
		args = append(args, "mtu="+strconv.Itoa(config.MTU))
	}
	if config.L2MTU > 0 {
		args = append(args, "l2mtu="+strconv.Itoa(config.L2MTU))
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/interface/ethernet", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add Ethernet interface: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) AddBridgeInterface(config BridgeConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
	}

	if config.MacAddress != "" {
		args = append(args, "mac-address="+config.MacAddress)
	}
	if config.Priority > 0 {
		args = append(args, "priority="+strconv.Itoa(config.Priority))
	}
	if config.PathCost > 0 {
		args = append(args, "path-cost="+strconv.Itoa(config.PathCost))
	}
	if config.HelloTime > 0 {
		args = append(args, "hello-time="+strconv.Itoa(config.HelloTime))
	}
	if config.MaxMessageAge > 0 {
		args = append(args, "max-message-age="+strconv.Itoa(config.MaxMessageAge))
	}
	if config.ForwardDelay > 0 {
		args = append(args, "forward-delay="+strconv.Itoa(config.ForwardDelay))
	}
	if config.TransmitHoldCount > 0 {
		args = append(args, "transmit-hold-count="+strconv.Itoa(config.TransmitHoldCount))
	}
	if config.AgingTime > 0 {
		args = append(args, "aging-time="+strconv.Itoa(config.AgingTime))
	}
	if config.ProtocolMode != "" {
		args = append(args, "protocol-mode="+config.ProtocolMode)
	}
	if config.FailureDetection {
		args = append(args, "failure-detection=yes")
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/interface/bridge", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add bridge interface: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) AddVLANInterface(config VLANConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
		"interface=" + config.Interface,
		"vlan-id=" + strconv.Itoa(config.VLANId),
	}

	if config.MTU > 0 {
		args = append(args, "mtu="+strconv.Itoa(config.MTU))
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.LoopProtect {
		args = append(args, "loop-protect=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/interface/vlan", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add VLAN interface: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) AddBridgeMember(bridge string, member string, comment string) error {
	args := []string{
		"bridge=" + bridge,
		"interface=" + member,
	}

	if comment != "" {
		args = append(args, "comment="+comment)
	}

	_, err := c.Add("/interface/bridge/port", args...)
	if err != nil {
		return fmt.Errorf("failed to add bridge member: %w", err)
	}

	return nil
}

func (c *Client) RemoveBridgeMember(bridge string, member string) error {
	results, err := c.GetAll("/interface/bridge/port", "?=.id="+bridge)
	if err != nil {
		return fmt.Errorf("failed to find bridge members: %w", err)
	}

	for _, result := range results {
		if result["interface"] == member {
			_, err := c.Remove("/interface/bridge/port", "=.id="+result[".id"])
			if err != nil {
				return fmt.Errorf("failed to remove bridge member: %w", err)
			}
			return nil
		}
	}

	return fmt.Errorf("member %s not found in bridge %s", member, bridge)
}

func (c *Client) SetInterfaceDisabled(name string, disabled bool) error {
	value := "no"
	if disabled {
		value = "yes"
	}

	_, err := c.Set("/interface", "=.id="+name, "disabled="+value)
	if err != nil {
		return fmt.Errorf("failed to set interface disabled: %w", err)
	}

	return nil
}

func (c *Client) SetInterfaceMTU(name string, mtu int) error {
	_, err := c.Set("/interface", "=.id="+name, "mtu="+strconv.Itoa(mtu))
	if err != nil {
		return fmt.Errorf("failed to set interface MTU: %w", err)
	}

	return nil
}

func (c *Client) RemoveInterface(name string) error {
	_, err := c.Remove("/interface", "=.id="+name)
	if err != nil {
		return fmt.Errorf("failed to remove interface: %w", err)
	}

	return nil
}
