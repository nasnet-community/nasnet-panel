package iface

import (
	"context"
	"errors"
	"fmt"
	"net/netip"
	"strings"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

func parseInterfaceTypes(raw string) (interfaceTypes []string, includeSFP bool, invalidTypes []string) {
	if raw == "" {
		return nil, false, nil
	}

	parts := strings.Split(raw, ",")
	interfaceTypes = make([]string, 0, len(parts))
	invalidTypes = make([]string, 0)
	includeSFP = false

	for _, part := range parts {
		interfaceType := strings.TrimSpace(part)
		if interfaceType == "" {
			invalidTypes = append(invalidTypes, "<empty>")
			continue
		}

		if strings.EqualFold(interfaceType, "sfp") {
			includeSFP = true
			continue
		}

		if !routeros.IsSupportedInterfaceType(interfaceType) {
			invalidTypes = append(invalidTypes, interfaceType)
			continue
		}

		interfaceTypes = append(interfaceTypes, interfaceType)
	}

	return interfaceTypes, includeSFP, invalidTypes
}

func oldWANWiFiNames(client *routeros.Client, wanType string) map[string]string {
	names := make(map[string]string)

	wifis, err := client.ListWifiInterfaces()
	if err != nil {
		return names
	}
	radios, err := client.GetWiFiRadios()
	if err != nil {
		return names
	}

	for i := range wifis {
		comment := wifis[i].Comment
		if t, ok := dbsync.WANTypeFromComment(&comment); !ok || t != wanType || wifis[i].DefaultName == "" {
			continue
		}
		if band := common.GetWifiBandFromRadios(radios, wifis[i].Name); band != "" {
			names[wifis[i].DefaultName] = fmt.Sprintf("wifi-%sGhz", band)
		}
	}

	return names
}

// BridgePortMoveScript builds the RouterOS script that moves a port to a bridge.
func BridgePortMoveScript(iface, bridge, comment string) string {
	return fmt.Sprintf(
		"/interface bridge port set [find interface=\"%s\"] bridge=\"%s\" comment=\"%s\"\n"+
			"/interface set [find name=\"%s\"] comment=\"%s\"\n"+
			"/interface disable [find name=\"%s\"]\n"+
			":delay 100ms\n"+
			"/interface enable [find name=\"%s\"]",
		utils.EscapeQuotes(iface),
		utils.EscapeQuotes(bridge),
		utils.EscapeQuotes(comment),
		utils.EscapeQuotes(iface),
		utils.EscapeQuotes(comment),
		utils.EscapeQuotes(iface),
		utils.EscapeQuotes(iface),
	)
}

func waitForScriptDone(ctx context.Context, client *routeros.Client, variable, token string) bool {
	ticker := time.NewTicker(scriptDonePollEvery)
	defer ticker.Stop()

	for {
		if value, err := client.GetEnvironmentVariable(variable); err == nil && value == token {
			return true
		}
		select {
		case <-ctx.Done():
			return false
		case <-ticker.C:
		}
	}
}

func toBridgeResponse(bridge *routeros.BridgeInfo) BridgeResponse {
	return BridgeResponse{
		ID:       bridge.ID,
		Name:     bridge.Name,
		Disabled: bridge.Disabled,
		Comment:  bridge.Comment,
	}
}

func toBridgePortResponse(port *routeros.BridgePort) BridgePortResponse {
	return BridgePortResponse{
		ID:        port.ID,
		Bridge:    port.Bridge,
		Interface: port.Interface,
		Disabled:  port.Disabled,
		Edge:      port.Edge,
		PathCost:  port.PathCost,
		Comment:   port.Comment,
	}
}

func toInterfaceResponse(iface *routeros.InterfaceInfo) *InterfaceResponse {
	if iface == nil {
		return nil
	}

	return &InterfaceResponse{
		ID:               iface.ID,
		Name:             iface.Name,
		DefaultName:      iface.DefaultName,
		Type:             iface.Type,
		MTU:              iface.MTU,
		ActualMTU:        iface.ActualMTU,
		L2MTU:            iface.L2MTU,
		MaxL2MTU:         iface.MaxL2MTU,
		VRF:              iface.VRF,
		MACAddress:       iface.MACAddress,
		LastLinkUpTime:   iface.LastLinkUpTime,
		LastLinkDownTime: iface.LastLinkDownTime,
		LinkDowns:        iface.LinkDowns,
		RxByte:           iface.RxByte,
		Rx:               formatBytesPtr(iface.RxByte),
		TxByte:           iface.TxByte,
		Tx:               formatBytesPtr(iface.TxByte),
		RxPacket:         iface.RxPacket,
		TxPacket:         iface.TxPacket,
		RxDrop:           iface.RxDrop,
		TxDrop:           iface.TxDrop,
		TxQueueDrop:      iface.TxQueueDrop,
		RxError:          iface.RxError,
		TxError:          iface.TxError,
		FPRxByte:         iface.FPRxByte,
		FPRx:             formatBytesPtr(iface.FPRxByte),
		FPTxByte:         iface.FPTxByte,
		FPTx:             formatBytesPtr(iface.FPTxByte),
		FPRxPacket:       iface.FPRxPacket,
		FPTxPacket:       iface.FPTxPacket,
		FPRpsDrop:        iface.FPRpsDrop,
		Running:          iface.Running,
		Inactive:         iface.Inactive,
		Slave:            iface.Slave,
		Dynamic:          iface.Dynamic,
		Disabled:         iface.Disabled,
		Comment:          iface.Comment,
	}
}

func toInterfacesResponse(interfaces []routeros.InterfaceInfo) []InterfaceResponse {
	response := make([]InterfaceResponse, 0, len(interfaces))
	for i := range interfaces {
		if converted := toInterfaceResponse(&interfaces[i]); converted != nil {
			response = append(response, *converted)
		}
	}

	return response
}

func formatBytesPtr(value *int64) *string {
	if value == nil {
		return nil
	}

	formatted := utils.BytesToSizeString(*value)
	return &formatted
}

func toCableTestResponse(result *routeros.CableTestResult) *CableTestResponse {
	if result == nil {
		return nil
	}
	return &CableTestResponse{
		Name:       result.Name,
		Status:     result.Status,
		CablePairs: result.CablePairs,
	}
}

func toEthernetResponse(iface *routeros.EthernetInfo) *EthernetResponse {
	if iface == nil {
		return nil
	}

	resp := &EthernetResponse{
		ID:                      iface.ID,
		Name:                    iface.Name,
		DefaultName:             iface.DefaultName,
		MTU:                     iface.MTU,
		L2MTU:                   iface.L2MTU,
		MACAddress:              iface.MACAddress,
		OrigMACAddress:          iface.OrigMACAddress,
		ARP:                     iface.ARP,
		ARPTimeout:              iface.ARPTimeout,
		LoopProtect:             iface.LoopProtect,
		LoopProtectStatus:       iface.LoopProtectStatus,
		LoopProtectSendInterval: iface.LoopProtectSendInterval,
		LoopProtectDisableTime:  iface.LoopProtectDisableTime,
		AutoNegotiation:         iface.AutoNegotiation,
		Advertise:               iface.Advertise,
		TxFlowControl:           iface.TxFlowControl,
		RxFlowControl:           iface.RxFlowControl,
		Bandwidth:               iface.Bandwidth,
		Switch:                  iface.Switch,
		PoEOut:                  iface.PoEOut,
		PoEPriority:             iface.PoEPriority,
		PowerCyclePingEnabled:   iface.PowerCyclePingEnabled,
		PowerCycleInterval:      iface.PowerCycleInterval,
		Disabled:                iface.Disabled,
		Running:                 iface.Running,
		Comment:                 iface.Comment,
	}

	if iface.Monitor != nil {
		resp.MonitorStatus = iface.Monitor.Status
		resp.MonitorAutoNegotiation = iface.Monitor.AutoNegotiation
		resp.MonitorRate = iface.Monitor.Rate
		resp.MonitorFullDuplex = iface.Monitor.FullDuplex
		resp.MonitorTxFlowControl = iface.Monitor.TxFlowControl
		resp.MonitorRxFlowControl = iface.Monitor.RxFlowControl
		resp.MonitorSupported = iface.Monitor.Supported
		resp.MonitorAdvertising = iface.Monitor.Advertising
		resp.MonitorLinkPartnerAdv = iface.Monitor.LinkPartnerAdv
	}

	return resp
}

func toEthernetResponses(interfaces []routeros.EthernetInfo) []EthernetResponse {
	response := make([]EthernetResponse, 0, len(interfaces))
	for i := range interfaces {
		if converted := toEthernetResponse(&interfaces[i]); converted != nil {
			response = append(response, *converted)
		}
	}
	return response
}

func (r UpdateWANInterfaceRequest) escaped() UpdateWANInterfaceRequest {
	r.SSID = utils.EscapeRouterOSString(r.SSID)
	r.Password = utils.EscapeRouterOSString(r.Password)
	return r
}

// ParseWANStaticIP parses the ip field of a WAN request. It returns an empty address when DHCP is
// requested, otherwise the IPv4 address and its prefix length, using defaultPrefix when none is given.
func ParseWANStaticIP(raw string, defaultPrefix int) (address string, prefix int, err error) {
	value := strings.TrimSpace(raw)
	if value == "" || strings.EqualFold(value, wanIPModeDHCP) {
		return "", 0, nil
	}

	invalid := fmt.Errorf("ip must be empty, %q, an IPv4 address or an IPv4 address with prefix", wanIPModeDHCP)

	var addr netip.Addr
	prefix = defaultPrefix
	if strings.Contains(value, "/") {
		parsed, parseErr := netip.ParsePrefix(value)
		if parseErr != nil {
			return "", 0, invalid
		}
		addr, prefix = parsed.Addr(), parsed.Bits()
	} else {
		parsed, parseErr := netip.ParseAddr(value)
		if parseErr != nil {
			return "", 0, invalid
		}
		addr = parsed
	}

	if !addr.Is4() {
		return "", 0, invalid
	}
	if prefix < 1 || prefix > wanMaxPrefix {
		return "", 0, fmt.Errorf("ip prefix must be between 1 and %d", wanMaxPrefix)
	}

	return addr.String(), prefix, nil
}

// ResolveWANGateway returns the gateway of a static WAN address: raw when given, otherwise the
// first address of the network.
func ResolveWANGateway(address string, prefix int, raw string) (string, error) {
	addr, err := netip.ParseAddr(address)
	if err != nil {
		return "", err
	}
	network := netip.PrefixFrom(addr, prefix).Masked()

	value := strings.TrimSpace(raw)
	if value == "" {
		gateway := network.Addr().Next()
		if gateway == addr {
			return "", errors.New("gateway is required when ip is the first address of its network")
		}
		return gateway.String(), nil
	}

	gateway, err := netip.ParseAddr(value)
	if err != nil || !gateway.Is4() {
		return "", errors.New("gateway must be an IPv4 address")
	}
	if !network.Contains(gateway) {
		return "", errors.New("gateway must be inside the network of ip")
	}
	if gateway == addr {
		return "", errors.New("gateway must differ from ip")
	}

	return gateway.String(), nil
}

func wanIPResponse(staticIP string, prefix int) string {
	if staticIP == "" {
		return wanIPModeDHCP
	}
	return fmt.Sprintf("%s/%d", staticIP, prefix)
}

func wanWiFiRecord(req *UpdateWANInterfaceRequest) *db.WiFi {
	link := strings.ToUpper(req.Type[:1]) + req.Type[1:]
	authTypes := ""
	if req.Type == "domestic" {
		authTypes = wanWiFiAuthTypes
	}
	return &db.WiFi{
		Name:        req.Interface + "-" + link + "-WAN",
		DefaultName: req.Interface,
		SSID:        req.SSID,
		Password:    req.Password,
		Enabled:     true,
		Mode:        wanWiFiMode,
		AuthTypes:   authTypes,
	}
}

func loadWANData(client *routeros.Client) (*wanData, error) {
	data := &wanData{}
	var err error

	if data.wifis, err = client.ListWifiInterfaces(); err != nil && !strings.Contains(err.Error(), "no WiFi package") {
		return nil, err
	}
	if data.macvlans, err = client.ListMacvlanInterfaces(); err != nil {
		return nil, err
	}
	if data.dhcpClients, err = client.ListDHCPClients(); err != nil {
		return nil, err
	}
	if data.addresses, err = client.ListIPAddresses(); err != nil {
		return nil, err
	}
	if data.routes, err = client.ListIPRoutes(); err != nil {
		return nil, err
	}

	return data, nil
}

func listWANs(client *routeros.Client) ([]WANResponse, error) {
	interfaces, err := client.ListInterfaces()
	if err != nil {
		return nil, err
	}
	data, err := loadWANData(client)
	if err != nil {
		return nil, err
	}

	wans := make([]WANResponse, 0, 2)
	for i := range interfaces {
		if wanType, ok := dbsync.WANTypeFromComment(interfaces[i].Comment); ok {
			wans = append(wans, buildWAN(&interfaces[i], wanType, data))
		}
	}

	return wans, nil
}

func getWAN(client *routeros.Client, name string) (*WANResponse, error) {
	iface, err := client.GetInterface(name)
	if err != nil {
		return nil, errWANNotFound
	}
	if iface.Comment == nil || !strings.HasPrefix(*iface.Comment, wanCommentPrefix) {
		return nil, errWANNotFound
	}
	wanType, _, _ := strings.Cut(strings.ToLower(strings.TrimSpace(strings.TrimPrefix(*iface.Comment, wanCommentPrefix))), " ")
	if wanType == "" {
		return nil, errWANNotFound
	}

	data, err := loadWANData(client)
	if err != nil {
		return nil, err
	}

	wan := buildWAN(iface, wanType, data)
	return &wan, nil
}

func buildWAN(iface *routeros.InterfaceInfo, wanType string, data *wanData) WANResponse {
	wan := newWANResponse(iface, wanType)
	if iface.Type == string(routeros.InterfaceTypeWiFi) {
		for i := range data.wifis {
			if data.wifis[i].Name == iface.Name {
				ssid, password := data.wifis[i].SSID, data.wifis[i].Passphrase
				wan.SSID, wan.Password = &ssid, &password
				break
			}
		}
	}
	fillWANAddress(&wan, data.macvlans, data.dhcpClients, data.addresses, data.routes)
	return wan
}

func newWANResponse(iface *routeros.InterfaceInfo, wanType string) WANResponse {
	wan := WANResponse{
		WANType:       wanType,
		Interface:     iface.Name,
		InterfaceType: iface.Type,
		Enabled:       iface.Disabled == nil || !*iface.Disabled,
	}
	if iface.Comment != nil {
		wan.Comment = *iface.Comment
	}
	return wan
}

func fillWANAddress(wan *WANResponse, macvlans []routeros.MacvlanInfo, dhcpClients []routeros.DHCPClientInfo,
	addresses []routeros.IPAddressInfo, routes []routeros.IPRouteInfo,
) {
	link := strings.ToUpper(wan.WANType[:1]) + wan.WANType[1:]

	macvlan := ""
	for i := range macvlans {
		if macvlans[i].Interface != wan.Interface {
			continue
		}
		if macvlan == "" || strings.HasSuffix(macvlans[i].Name, "-"+link+" Link") {
			macvlan = macvlans[i].Name
		}
	}
	if macvlan == "" {
		return
	}
	wan.Macvlan = macvlan

	for i := range dhcpClients {
		if dhcpClients[i].Interface == macvlan {
			wan.AddressType = wanIPModeDHCP
			wan.IP = stripPrefix(dhcpClients[i].Address)
			break
		}
	}
	if wan.AddressType == "" {
		for i := range addresses {
			if addresses[i].Interface == macvlan && !addresses[i].Dynamic {
				wan.AddressType = wanAddressTypeStatic
				wan.IP = stripPrefix(addresses[i].Address)
				break
			}
		}
	}

	routeComment := "Route-to-" + link + "-" + link + " Link"
	for i := range routes {
		if routes[i].Comment == routeComment && routes[i].DstAddress == "0.0.0.0/0" && !routes[i].Dynamic {
			wan.Gateway, _, _ = strings.Cut(routes[i].Gateway, "%")
			break
		}
	}
}

func stripPrefix(address string) string {
	ip, _, _ := strings.Cut(address, "/")
	return ip
}
