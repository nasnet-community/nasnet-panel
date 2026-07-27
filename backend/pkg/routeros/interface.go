package routeros

import (
	"fmt"
	"strconv"
	"strings"
)

// InterfaceType represents a RouterOS interface type.
type InterfaceType string

// InterfaceType values map to RouterOS /interface type field values.
const (
	InterfaceTypeEther     InterfaceType = "ether"
	InterfaceTypeBonding   InterfaceType = "bonding"
	InterfaceTypeBridge    InterfaceType = "bridge"
	InterfaceTypeVLAN      InterfaceType = "vlan"
	InterfaceTypeMacvlan   InterfaceType = "macvlan"
	InterfaceTypeVRRP      InterfaceType = "vrrp"
	InterfaceTypeVeth      InterfaceType = "veth"
	InterfaceTypeEOIP      InterfaceType = "eoip"
	InterfaceTypeGRE       InterfaceType = "gre"
	InterfaceTypeIPIP      InterfaceType = "ipip"
	InterfaceTypeSIT       InterfaceType = "sit"
	InterfaceTypeVXLAN     InterfaceType = "vxlan"
	InterfaceTypeWireGuard InterfaceType = "wg"
	InterfaceTypeWiFi      InterfaceType = "wifi"
	InterfaceTypeWireless  InterfaceType = "wireless"
	InterfaceTypeLTE       InterfaceType = "lte"
	InterfaceTypeWLAN      InterfaceType = "wlan"
	InterfaceTypeW60G      InterfaceType = "w60g"
	InterfaceTypePPPoEIn   InterfaceType = "pppoe-in"
	InterfaceTypePPPoEOut  InterfaceType = "pppoe-out"
	InterfaceTypePPTPIn    InterfaceType = "pptp-in"
	InterfaceTypePPTPOut   InterfaceType = "pptp-out"
	InterfaceTypeL2TPIn    InterfaceType = "l2tp-in"
	InterfaceTypeL2TPOut   InterfaceType = "l2tp-out"
	InterfaceTypeSSTPIn    InterfaceType = "sstp-in"
	InterfaceTypeSSTPOut   InterfaceType = "sstp-out"
	InterfaceTypeOVPNIn    InterfaceType = "ovpn-in"
	InterfaceTypeOVPNOut   InterfaceType = "ovpn-out"
	InterfaceType6to4      InterfaceType = "6to4"
	InterfaceType6in4      InterfaceType = "6in4"
	InterfaceTypeLoopback  InterfaceType = "loopback"
	InterfaceTypePPPOut    InterfaceType = "ppp-out"
)

// AllInterfaceTypes contains all interface types accepted by interface type filtering.
var AllInterfaceTypes = []InterfaceType{
	InterfaceTypeEther,
	InterfaceTypeBonding,
	InterfaceTypeBridge,
	InterfaceTypeVLAN,
	InterfaceTypeMacvlan,
	InterfaceTypeVRRP,
	InterfaceTypeVeth,
	InterfaceTypeEOIP,
	InterfaceTypeGRE,
	InterfaceTypeIPIP,
	InterfaceTypeSIT,
	InterfaceTypeVXLAN,
	InterfaceTypeWireGuard,
	InterfaceTypeWiFi,
	InterfaceTypeWireless,
	InterfaceTypeLTE,
	InterfaceTypeWLAN,
	InterfaceTypeW60G,
	InterfaceTypePPPoEIn,
	InterfaceTypePPPoEOut,
	InterfaceTypePPTPIn,
	InterfaceTypePPTPOut,
	InterfaceTypeL2TPIn,
	InterfaceTypeL2TPOut,
	InterfaceTypeSSTPIn,
	InterfaceTypeSSTPOut,
	InterfaceTypeOVPNIn,
	InterfaceTypeOVPNOut,
	InterfaceType6to4,
	InterfaceType6in4,
	InterfaceTypeLoopback,
	InterfaceTypePPPOut,
}

// IsSupportedInterfaceType returns true when interfaceType is present in AllInterfaceTypes.
func IsSupportedInterfaceType(interfaceType string) bool {
	for _, t := range AllInterfaceTypes {
		if string(t) == interfaceType {
			return true
		}
	}

	return false
}

// SupportedInterfaceTypes returns all supported interface types as plain strings.
func SupportedInterfaceTypes() []string {
	types := make([]string, 0, len(AllInterfaceTypes))
	for _, t := range AllInterfaceTypes {
		types = append(types, string(t))
	}

	return types
}

type InterfaceInfo struct {
	ID               string
	Name             string
	DefaultName      *string
	Type             string
	MTU              *string
	ActualMTU        *int64
	L2MTU            *int64
	MaxL2MTU         *int64
	VRF              *string
	MACAddress       *string
	LastLinkUpTime   *string
	LastLinkDownTime *string
	LinkDowns        *int64
	RxByte           *int64
	TxByte           *int64
	RxPacket         *int64
	TxPacket         *int64
	RxDrop           *int64
	TxDrop           *int64
	TxQueueDrop      *int64
	RxError          *int64
	TxError          *int64
	FPRxByte         *int64
	FPTxByte         *int64
	FPRxPacket       *int64
	FPTxPacket       *int64
	FPRpsDrop        *int64
	Running          *bool
	Inactive         *bool
	Slave            *bool
	Dynamic          *bool
	Disabled         *bool
	Comment          *string
}

// EthernetMonitor represents real-time monitoring data from /interface/ethernet/monitor.
type EthernetMonitor struct {
	Status          *string
	AutoNegotiation *string
	Rate            *string
	FullDuplex      *bool
	TxFlowControl   *bool
	RxFlowControl   *bool
	Supported       []string
	Advertising     []string
	LinkPartnerAdv  []string
}

// EthernetInfo represents detailed information about an ethernet interface from /interface/ethernet and monitor.
type EthernetInfo struct {
	ID                      string
	Name                    string
	DefaultName             *string
	MTU                     *int64
	L2MTU                   *int64
	MACAddress              *string
	OrigMACAddress          *string
	ARP                     *string
	ARPTimeout              *string
	LoopProtect             *string
	LoopProtectStatus       *string
	LoopProtectSendInterval *string
	LoopProtectDisableTime  *string
	AutoNegotiation         *bool
	Advertise               *string
	TxFlowControl           *string
	RxFlowControl           *string
	Bandwidth               *string
	Switch                  *string
	PoEOut                  *string
	PoEPriority             *int64
	PowerCyclePingEnabled   *bool
	PowerCycleInterval      *string
	Disabled                *bool
	Running                 *bool
	Comment                 *string
	Monitor                 *EthernetMonitor
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

// MacvlanConfig represents configuration for creating or updating a MACVLAN interface.
type MacvlanConfig struct {
	Name                    string
	Interface               string // parent interface (required)
	MacAddress              string // optional MAC address, randomly generated if not specified
	MTU                     int    // default 1500
	Disabled                bool
	Comment                 string
	ARP                     string // disabled, enabled, local-proxy-arp, proxy-arp, reply-only
	Mode                    string // private or bridge (default: bridge)
	LoopProtect             string // on, off, default
	LoopProtectDisableTime  string // time interval or 0
	LoopProtectSendInterval string // time interval
}

// MacvlanInfo represents a MACVLAN interface.
type MacvlanInfo struct {
	ID                      string
	Name                    string
	Interface               string
	MacAddress              *string
	MTU                     *int64
	Running                 *bool
	Disabled                *bool
	Comment                 *string
	ARP                     *string
	Mode                    *string
	LoopProtect             *string
	LoopProtectDisableTime  *string
	LoopProtectSendInterval *string
}

// WiFiRadio represents a RouterOS WiFi radio with band information.
func (c *Client) ListInterfaces() ([]InterfaceInfo, error) {
	return c.ListInterfacesByType(nil, false)
}

// GetEthernetInterfaces retrieves all ethernet interfaces from RouterOS /interface/ethernet.
func (c *Client) GetEthernetInterfaces() ([]InterfaceInfo, error) {
	results, err := c.GetAll("/interface/ethernet")
	if err != nil {
		return nil, fmt.Errorf("failed to list ethernet interfaces: %w", err)
	}

	interfaces := make([]InterfaceInfo, 0, len(results))
	for _, result := range results {
		interfaces = append(interfaces, parseInterfaceInfo(result))
	}

	return interfaces, nil
}

// ListInterfacesByType lists interfaces and optionally filters by RouterOS interface types.
func (c *Client) ListInterfacesByType(interfaceTypes []string, includeSFP bool) ([]InterfaceInfo, error) {
	results, err := c.GetAll("/interface")
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	interfaces := make([]InterfaceInfo, 0)
	for _, result := range results {
		if len(interfaceTypes) > 0 || includeSFP {
			if !matchesInterfaceTypeFilter(interfaceTypes, includeSFP, result) {
				continue
			}
		}
		interfaces = append(interfaces, parseInterfaceInfo(result))
	}

	return interfaces, nil
}

func matchesInterfaceTypeFilter(interfaceTypes []string, includeSFP bool, result map[string]string) bool {
	if containsInterfaceType(interfaceTypes, result["type"]) {
		return true
	}

	if includeSFP && result["type"] == "ether" {
		defaultName := strings.ToLower(strings.TrimSpace(result["default-name"]))
		if strings.Contains(defaultName, "sfp") {
			return true
		}
	}

	return false
}

func containsInterfaceType(interfaceTypes []string, interfaceType string) bool {
	for _, t := range interfaceTypes {
		if t == interfaceType {
			return true
		}
	}

	return false
}

func (c *Client) GetInterface(name string) (*InterfaceInfo, error) {
	result, err := c.GetFirst("/interface", "?=name="+name)
	if err != nil {
		result, err = c.GetFirst("/interface", "?=default-name="+name)
		if err != nil {
			return nil, fmt.Errorf("failed to get interface %s: %w", name, err)
		}
	}

	parsed := parseInterfaceInfo(result)
	return &parsed, nil
}

func parseInterfaceInfo(result map[string]string) InterfaceInfo {
	return InterfaceInfo{
		ID:               result[".id"],
		Name:             result["name"],
		DefaultName:      getStringPtr(result, "default-name"),
		Type:             result["type"],
		MTU:              getStringPtr(result, "mtu"),
		ActualMTU:        getInt64Ptr(result, "actual-mtu"),
		L2MTU:            getInt64Ptr(result, "l2mtu"),
		MaxL2MTU:         getInt64Ptr(result, "max-l2mtu"),
		VRF:              getStringPtr(result, "vrf"),
		MACAddress:       getStringPtr(result, "mac-address"),
		LastLinkUpTime:   getStringPtr(result, "last-link-up-time"),
		LastLinkDownTime: getStringPtr(result, "last-link-down-time"),
		LinkDowns:        getInt64Ptr(result, "link-downs"),
		RxByte:           getInt64Ptr(result, "rx-byte"),
		TxByte:           getInt64Ptr(result, "tx-byte"),
		RxPacket:         getInt64Ptr(result, "rx-packet"),
		TxPacket:         getInt64Ptr(result, "tx-packet"),
		RxDrop:           getInt64Ptr(result, "rx-drop"),
		TxDrop:           getInt64Ptr(result, "tx-drop"),
		TxQueueDrop:      getInt64Ptr(result, "tx-queue-drop"),
		RxError:          getInt64Ptr(result, "rx-error"),
		TxError:          getInt64Ptr(result, "tx-error"),
		FPRxByte:         getInt64Ptr(result, "fp-rx-byte"),
		FPTxByte:         getInt64Ptr(result, "fp-tx-byte"),
		FPRxPacket:       getInt64Ptr(result, "fp-rx-packet"),
		FPTxPacket:       getInt64Ptr(result, "fp-tx-packet"),
		FPRpsDrop:        getInt64Ptr(result, "fp-rps-drop"),
		Running:          getBoolPtr(result, "running"),
		Inactive:         getBoolPtr(result, "inactive"),
		Slave:            getBoolPtr(result, "slave"),
		Dynamic:          getBoolPtr(result, "dynamic"),
		Disabled:         getBoolPtr(result, "disabled"),
		Comment:          getStringPtr(result, "comment"),
	}
}

func getStringPtr(result map[string]string, key string) *string {
	value, ok := result[key]
	if !ok || value == "" {
		return nil
	}

	return &value
}

func getInt64Ptr(result map[string]string, key string) *int64 {
	value, ok := result[key]
	if !ok || value == "" {
		return nil
	}

	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return nil
	}

	return &parsed
}

func getBoolPtr(result map[string]string, key string) *bool {
	value, ok := result[key]
	if !ok || value == "" {
		return nil
	}

	switch strings.ToLower(value) {
	case "true", "yes":
		v := true
		return &v
	case "false", "no":
		v := false
		return &v
	default:
		return nil
	}
}

func (c *Client) AddEthernetInterface(config EthernetConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
	}

	if config.MTU > 0 {
		args = append(args, "=mtu="+strconv.Itoa(config.MTU))
	}
	if config.L2MTU > 0 {
		args = append(args, "=l2mtu="+strconv.Itoa(config.L2MTU))
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/interface/ethernet", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add Ethernet interface: %w", err)
	}

	return id, nil
}

func (c *Client) AddBridgeInterface(config BridgeConfig) (string, error) {
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
		return "", fmt.Errorf("failed to add bridge interface: %w", err)
	}

	return id, nil
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
		args = append(args, "=disabled=yes")
	}
	if config.LoopProtect {
		args = append(args, "=loop-protect=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/interface/vlan", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add VLAN interface: %w", err)
	}

	return id, nil
}

func (c *Client) AddBridgeMember(bridge string, member string, comment string) error {
	args := []string{
		"bridge=" + bridge,
		"interface=" + member,
	}

	if comment != "" {
		args = append(args, "=comment="+comment)
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

// SetInterfaceComment updates the comment of an interface.
//
//nolint:gocritic // false positive on parameter shadowing
func (c *Client) SetInterfaceComment(id string, comment string) error {
	_, err := c.Set("/interface", "=.id="+id, "=comment="+comment)
	if err != nil {
		return fmt.Errorf("failed to set interface comment: %w", err)
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

// ListMacvlanInterfaces lists all MACVLAN interfaces.
func (c *Client) ListMacvlanInterfaces() ([]MacvlanInfo, error) {
	results, err := c.GetAll("/interface/macvlan")
	if err != nil {
		return nil, fmt.Errorf("failed to list MACVLAN interfaces: %w", err)
	}

	macvlans := make([]MacvlanInfo, 0, len(results))
	for _, result := range results {
		macvlans = append(macvlans, parseMacvlanInfo(result))
	}

	return macvlans, nil
}

// GetMacvlanInterface retrieves a specific MACVLAN interface by name.
func (c *Client) GetMacvlanInterface(name string) (*MacvlanInfo, error) {
	result, err := c.GetFirst("/interface/macvlan", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get MACVLAN interface %s: %w", name, err)
	}

	parsed := parseMacvlanInfo(result)
	return &parsed, nil
}

// AddMacvlanInterface creates a new MACVLAN interface.
func (c *Client) AddMacvlanInterface(config MacvlanConfig) (string, error) {
	args := []string{
		"=name=" + config.Name,
		"=interface=" + config.Interface,
	}

	if config.MacAddress != "" {
		args = append(args, "=mac-address="+config.MacAddress)
	}
	if config.MTU > 0 {
		args = append(args, "=mtu="+strconv.Itoa(config.MTU))
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}
	if config.ARP != "" {
		args = append(args, "=arp="+config.ARP)
	}
	if config.Mode != "" {
		args = append(args, "=mode="+config.Mode)
	}
	if config.LoopProtect != "" {
		args = append(args, "=loop-protect="+config.LoopProtect)
	}
	if config.LoopProtectDisableTime != "" {
		args = append(args, "=loop-protect-disable-time="+config.LoopProtectDisableTime)
	}
	if config.LoopProtectSendInterval != "" {
		args = append(args, "=loop-protect-send-interval="+config.LoopProtectSendInterval)
	}

	id, err := c.Add("/interface/macvlan", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add MACVLAN interface: %w", err)
	}

	return id, nil
}

// UpdateMacvlanInterface updates an existing MACVLAN interface.
func (c *Client) UpdateMacvlanInterface(id string, config MacvlanConfig) error {
	args := []string{
		"=.id=" + id,
	}

	if config.Name != "" {
		args = append(args, "=name="+config.Name)
	}
	if config.Interface != "" {
		args = append(args, "=interface="+config.Interface)
	}
	if config.MacAddress != "" {
		args = append(args, "=mac-address="+config.MacAddress)
	}
	if config.MTU > 0 {
		args = append(args, "=mtu="+strconv.Itoa(config.MTU))
	}
	args = append(args, "=disabled="+func() string {
		if config.Disabled {
			return "yes"
		}
		return "no"
	}())
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}
	if config.ARP != "" {
		args = append(args, "=arp="+config.ARP)
	}
	if config.Mode != "" {
		args = append(args, "=mode="+config.Mode)
	}
	if config.LoopProtect != "" {
		args = append(args, "=loop-protect="+config.LoopProtect)
	}
	if config.LoopProtectDisableTime != "" {
		args = append(args, "=loop-protect-disable-time="+config.LoopProtectDisableTime)
	}
	if config.LoopProtectSendInterval != "" {
		args = append(args, "=loop-protect-send-interval="+config.LoopProtectSendInterval)
	}

	_, err := c.Set("/interface/macvlan", args...)
	if err != nil {
		return fmt.Errorf("failed to update MACVLAN interface: %w", err)
	}

	return nil
}

// RemoveMacvlanInterface deletes a MACVLAN interface.
func (c *Client) RemoveMacvlanInterface(id string) error {
	_, err := c.Remove("/interface/macvlan", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove MACVLAN interface: %w", err)
	}

	return nil
}

func parseMacvlanInfo(result map[string]string) MacvlanInfo {
	return MacvlanInfo{
		ID:                      result[".id"],
		Name:                    result["name"],
		Interface:               result["interface"],
		MacAddress:              getStringPtr(result, "mac-address"),
		MTU:                     getInt64Ptr(result, "mtu"),
		Running:                 getBoolPtr(result, "running"),
		Disabled:                getBoolPtr(result, "disabled"),
		Comment:                 getStringPtr(result, "comment"),
		ARP:                     getStringPtr(result, "arp"),
		Mode:                    getStringPtr(result, "mode"),
		LoopProtect:             getStringPtr(result, "loop-protect"),
		LoopProtectDisableTime:  getStringPtr(result, "loop-protect-disable-time"),
		LoopProtectSendInterval: getStringPtr(result, "loop-protect-send-interval"),
	}
}

// InterfaceListConfig represents configuration for creating or updating an interface list.
type InterfaceListConfig struct {
	Name    string
	Include string // comma-separated list names to include
	Exclude string // comma-separated list names to exclude
	Comment string
}

// InterfaceList represents an interface list.
type InterfaceList struct {
	ID      string
	Name    string
	Include *string
	Exclude *string
	Comment *string
}

// ListInterfaceLists retrieves all interface lists.
func (c *Client) ListInterfaceLists() ([]InterfaceList, error) {
	results, err := c.GetAll("/interface/list")
	if err != nil {
		return nil, fmt.Errorf("failed to list interface lists: %w", err)
	}

	lists := make([]InterfaceList, 0, len(results))
	for _, result := range results {
		lists = append(lists, InterfaceList{
			ID:      result[".id"],
			Name:    result["name"],
			Include: getStringPtr(result, "include"),
			Exclude: getStringPtr(result, "exclude"),
			Comment: getStringPtr(result, "comment"),
		})
	}

	return lists, nil
}

// GetInterfaceList retrieves a specific interface list by name.
func (c *Client) GetInterfaceList(name string) (*InterfaceList, error) {
	result, err := c.GetFirst("/interface/list", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get interface list %s: %w", name, err)
	}

	list := &InterfaceList{
		ID:      result[".id"],
		Name:    result["name"],
		Include: getStringPtr(result, "include"),
		Exclude: getStringPtr(result, "exclude"),
		Comment: getStringPtr(result, "comment"),
	}
	return list, nil
}

// AddInterfaceList creates a new interface list.
func (c *Client) AddInterfaceList(config InterfaceListConfig) (string, error) {
	args := []string{
		"=name=" + config.Name,
	}

	if config.Include != "" {
		args = append(args, "=include="+config.Include)
	}
	if config.Exclude != "" {
		args = append(args, "=exclude="+config.Exclude)
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	id, err := c.Add("/interface/list", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add interface list: %w", err)
	}

	return id, nil
}

// UpdateInterfaceList updates an existing interface list.
func (c *Client) UpdateInterfaceList(id string, config InterfaceListConfig) error {
	args := []string{
		"=.id=" + id,
	}

	if config.Name != "" {
		args = append(args, "=name="+config.Name)
	}
	if config.Include != "" {
		args = append(args, "=include="+config.Include)
	}
	if config.Exclude != "" {
		args = append(args, "=exclude="+config.Exclude)
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}

	_, err := c.Set("/interface/list", args...)
	if err != nil {
		return fmt.Errorf("failed to update interface list: %w", err)
	}

	return nil
}

// RemoveInterfaceList deletes an interface list.
func (c *Client) RemoveInterfaceList(id string) error {
	_, err := c.Remove("/interface/list", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove interface list: %w", err)
	}

	return nil
}

// GetEthernetInterfaceDetailed retrieves detailed information for a single ethernet interface from /interface/ethernet and monitor.
// Supports lookup by interface name or by ID (IDs start with "*").
func (c *Client) GetEthernetInterfaceDetailed(nameOrID string) (*EthernetInfo, error) {
	if nameOrID == "" {
		return nil, fmt.Errorf("interface name or ID is required")
	}

	var result map[string]string
	var err error

	if strings.HasPrefix(nameOrID, "*") {
		result, err = c.GetFirst("/interface/ethernet", "?=.id="+nameOrID)
	} else {
		result, err = c.GetFirst("/interface/ethernet", "?=name="+nameOrID)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get ethernet interface %s: %w", nameOrID, err)
	}

	ethInfo := parseEthernetInfo(result)
	monitor, err := c.GetEthernetMonitor(ethInfo.Name)
	if err == nil && monitor != nil {
		ethInfo.Monitor = monitor
	}

	return &ethInfo, nil
}

// GetEthernetInterfacesDetailed retrieves detailed information for all ethernet interfaces from /interface/ethernet and monitor.
func (c *Client) GetEthernetInterfacesDetailed() ([]EthernetInfo, error) {
	results, err := c.GetAll("/interface/ethernet")
	if err != nil {
		return nil, fmt.Errorf("failed to list ethernet interfaces: %w", err)
	}

	interfaces := make([]EthernetInfo, 0, len(results))
	for _, result := range results {
		ethInfo := parseEthernetInfo(result)
		monitor, err := c.GetEthernetMonitor(ethInfo.Name)
		if err == nil && monitor != nil {
			ethInfo.Monitor = monitor
		}
		interfaces = append(interfaces, ethInfo)
	}

	return interfaces, nil
}

// GetEthernetMonitor retrieves real-time monitoring data for an ethernet interface.
func (c *Client) GetEthernetMonitor(interfaceName string) (*EthernetMonitor, error) {
	if interfaceName == "" {
		return nil, fmt.Errorf("interface name is required")
	}

	reply, err := c.Execute("/interface/ethernet/monitor", "=numbers="+interfaceName, "=once=yes")
	if err != nil {
		return nil, fmt.Errorf("failed to monitor ethernet interface %s: %w", interfaceName, err)
	}

	if len(reply.Re) == 0 {
		return nil, fmt.Errorf("no monitor data returned for interface %s", interfaceName)
	}

	return parseEthernetMonitor(reply.Re[0].Map), nil
}

func parseEthernetMonitor(result map[string]string) *EthernetMonitor {
	return &EthernetMonitor{
		Status:          getStringPtr(result, "status"),
		AutoNegotiation: getStringPtr(result, "auto-negotiation"),
		Rate:            getStringPtr(result, "rate"),
		FullDuplex:      getBoolPtr(result, "full-duplex"),
		TxFlowControl:   getBoolPtr(result, "tx-flow-control"),
		RxFlowControl:   getBoolPtr(result, "rx-flow-control"),
		Supported:       parseSpeedList(result["supported"]),
		Advertising:     parseSpeedList(result["advertising"]),
		LinkPartnerAdv:  parseSpeedList(result["link-partner-advertising"]),
	}
}

func parseSpeedList(speedStr string) []string {
	if speedStr == "" {
		return nil
	}
	speeds := strings.Split(speedStr, ",")
	result := make([]string, 0, len(speeds))
	for _, s := range speeds {
		trimmed := strings.TrimSpace(s)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func parseEthernetInfo(result map[string]string) EthernetInfo {
	return EthernetInfo{
		ID:                      result[".id"],
		Name:                    result["name"],
		DefaultName:             getStringPtr(result, "default-name"),
		MTU:                     getInt64Ptr(result, "mtu"),
		L2MTU:                   getInt64Ptr(result, "l2mtu"),
		MACAddress:              getStringPtr(result, "mac-address"),
		OrigMACAddress:          getStringPtr(result, "orig-mac-address"),
		ARP:                     getStringPtr(result, "arp"),
		ARPTimeout:              getStringPtr(result, "arp-timeout"),
		LoopProtect:             getStringPtr(result, "loop-protect"),
		LoopProtectStatus:       getStringPtr(result, "loop-protect-status"),
		LoopProtectSendInterval: getStringPtr(result, "loop-protect-send-interval"),
		LoopProtectDisableTime:  getStringPtr(result, "loop-protect-disable-time"),
		AutoNegotiation:         getBoolPtr(result, "auto-negotiation"),
		Advertise:               getStringPtr(result, "advertise"),
		TxFlowControl:           getStringPtr(result, "tx-flow-control"),
		RxFlowControl:           getStringPtr(result, "rx-flow-control"),
		Bandwidth:               getStringPtr(result, "bandwidth"),
		Switch:                  getStringPtr(result, "switch"),
		PoEOut:                  getStringPtr(result, "poe-out"),
		PoEPriority:             getInt64Ptr(result, "poe-priority"),
		PowerCyclePingEnabled:   getBoolPtr(result, "power-cycle-ping-enabled"),
		PowerCycleInterval:      getStringPtr(result, "power-cycle-interval"),
		Disabled:                getBoolPtr(result, "disabled"),
		Running:                 getBoolPtr(result, "running"),
		Comment:                 getStringPtr(result, "comment"),
	}
}
