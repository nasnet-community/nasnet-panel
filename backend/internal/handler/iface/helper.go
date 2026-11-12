package iface

import (
	"context"
	"errors"
	"fmt"
	"net/netip"
	"strings"
	"time"

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
