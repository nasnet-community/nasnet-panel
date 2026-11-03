package dbsync

import (
	"strconv"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// StorableWiFi reports whether the WiFi interface is one the database keeps.
func StorableWiFi(w *routeros.WifiInfo) bool {
	return w.Name != ManagementWifiName && w.SSID != "" && ValidWifiMode(w.Mode)
}

// WiFiRecord converts a router WiFi interface to its database record.
func WiFiRecord(w *routeros.WifiInfo, masterDefaultName, bridge string) *db.WiFi {
	record := &db.WiFi{
		Name:        w.Name,
		DefaultName: w.DefaultName,
		SSID:        w.SSID,
		Password:    w.Passphrase,
		Enabled:     !w.Disabled,
		Mode:        w.Mode,
		IsVirtual:   w.IsVirtual,
		Bridge:      bridge,
		AuthTypes:   w.SecurityType,
	}
	if w.IsVirtual {
		record.Master = masterDefaultName
	}
	return record
}

// InterfaceDefaultNames maps every interface name to its factory default name.
func InterfaceDefaultNames(client *routeros.Client) (map[string]string, error) {
	interfaces, err := client.ListInterfaces()
	if err != nil {
		return nil, err
	}

	names := make(map[string]string, len(interfaces))
	for i := range interfaces {
		if interfaces[i].DefaultName != nil {
			names[interfaces[i].Name] = *interfaces[i].DefaultName
		}
	}
	return names, nil
}

// BridgePortRecord converts a router bridge port to its database record.
func BridgePortRecord(port *routeros.BridgePort, defaultNames map[string]string) *db.BridgePort {
	record := &db.BridgePort{
		Bridge:      port.Bridge,
		Interface:   port.Interface,
		DefaultName: defaultNames[port.Interface],
		Enabled:     port.Disabled == nil || !*port.Disabled,
	}
	if port.Comment != nil {
		record.Comment = *port.Comment
	}
	return record
}

// DNSServerRecords converts the router DNS settings and forwarders to database records.
func DNSServerRecords(info *routeros.DNSInfo, forwarders []routeros.DNSForwarder) []db.DNSServer {
	servers := make([]db.DNSServer, 0, len(forwarders)+1)
	servers = append(servers, db.DNSServer{
		Name:       DNSGlobalServerName,
		Type:       db.DNSServerTypeGlobal,
		DNSServers: strings.Join(info.Servers, ","),
		DOHServers: info.DOHServer,
	})
	for i := range forwarders {
		forwarder := &forwarders[i]
		servers = append(servers, db.DNSServer{
			Name:          forwarder.Name,
			Type:          db.DNSServerTypeForwarder,
			DNSServers:    strings.Join(forwarder.DNSServers, ","),
			DOHServers:    strings.Join(forwarder.DOHServers, ","),
			VerifyDOHCert: forwarder.VerifyDOHCert,
			Comment:       forwarder.Comment,
		})
	}

	return servers
}

// DNSStaticEntryRecord converts a router static DNS entry to its database record.
func DNSStaticEntryRecord(entry *routeros.StaticDNSEntry) *db.DNSStaticEntry {
	return &db.DNSStaticEntry{
		RouterID: entry.ID,
		Name:     entry.Name,
		Address:  entry.Address,
		Type:     entry.Type,
		TTL:      entry.TTL,
		Comment:  entry.Comment,
		Enabled:  !entry.Disabled,
	}
}

// L2TPClientRecord converts a router L2TP client to its database record.
func L2TPClientRecord(info *routeros.L2TPClientInfo) *db.L2TPClient {
	return &db.L2TPClient{
		Name:        info.Name,
		Comment:     info.Comment,
		ConnectTo:   strings.TrimSuffix(info.ConnectTo, VPNClientVRFSuffix),
		User:        info.User,
		Password:    info.Password,
		IPsecSecret: info.IPsecSecret,
		Enabled:     !info.Disabled,
	}
}

// SSTPClientRecord converts a router SSTP client to its database record.
func SSTPClientRecord(info *routeros.SSTPClientInfo) *db.SSTPClient {
	return &db.SSTPClient{
		Name:      info.Name,
		Comment:   info.Comment,
		ConnectTo: strings.TrimSuffix(info.ConnectTo, VPNClientVRFSuffix),
		Port:      info.Port,
		User:      info.User,
		Password:  info.Password,
		Enabled:   !info.Disabled,
	}
}

// WireGuardInterfaceRecord reads a WireGuard interface and its peers from the router as a database record.
func WireGuardInterfaceRecord(client *routeros.Client, nameOrID string) (*db.WireGuardInterface, error) {
	wg, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return nil, err
	}
	wgType := WireGuardInterfaceType(wg.Name)
	if wgType == "" {
		return nil, nil
	}

	peers, err := client.GetWireGuardPeers(wg.Name)
	if err != nil {
		return nil, err
	}

	addresses, err := client.GetIPAddressesByInterface(wg.Name)
	if err != nil {
		return nil, err
	}
	address := ""
	if len(addresses) > 0 {
		address = addresses[0].Address
	}

	record := &db.WireGuardInterface{
		Name:       wg.Name,
		Comment:    wg.Comment,
		Type:       wgType,
		PrivateKey: wg.PrivateKey,
		Address:    address,
		ListenPort: wg.ListenPort,
		Enabled:    !wg.Disabled,
	}
	for i := range peers {
		peer := &peers[i]
		record.Peers = append(record.Peers, db.WireGuardPeer{
			Name:                peer.Name,
			Comment:             peer.Comment,
			Enabled:             !peer.Disabled,
			PublicKey:           peer.PublicKey,
			PrivateKey:          peer.PrivateKey,
			PresharedKey:        peer.PreSharedKey,
			EndpointAddress:     peer.EndpointAddress,
			EndpointPort:        peer.EndpointPort,
			AllowedAddress:      peer.AllowedAddresses,
			PersistentKeepalive: int(utils.RouterOSDurationSeconds(peer.PersistentKeepalive)),
		})
	}

	return record, nil
}

// OvpnServerRecord converts a router OpenVPN server to its database record.
func OvpnServerRecord(info *routeros.OvpnServerInfo) *db.OvpnServer {
	baseName := strings.TrimSuffix(strings.TrimSuffix(info.Name, "-tcp"), "-udp")
	timestamp, _ := strconv.ParseInt(ExtractOvpnServerTimestamp(baseName), 10, 64)
	password, _ := strings.CutPrefix(info.Comment, OvpnServerCommentPrefix)
	if password == info.Comment {
		password = ""
	}

	return &db.OvpnServer{
		Name:                      info.Name,
		CertificateTimestamp:      timestamp,
		Protocol:                  info.ProtocolVersion,
		Port:                      info.Port,
		ClientCertificatePassword: password,
		Enabled:                   !info.Disabled,
	}
}

// L2TPServerRecord converts the router L2TP server to its database record.
func L2TPServerRecord(info *routeros.L2tpServerInfo) *db.VPNServer {
	return &db.VPNServer{
		Type:           db.VPNServerTypeL2TP,
		Enabled:        info.Enabled,
		DefaultProfile: info.DefaultProfile,
		Authentication: info.Authentication,
		UseIPsec:       info.UseIPsec == "yes" || info.UseIPsec == "required",
		IPsecSecret:    info.IPsecSecret,
	}
}

// SSTPServerRecord converts the router SSTP server to its database record.
func SSTPServerRecord(info *routeros.SstpServerInfo) *db.VPNServer {
	return &db.VPNServer{
		Type:                    db.VPNServerTypeSSTP,
		Enabled:                 info.Enabled,
		Port:                    info.Port,
		DefaultProfile:          info.DefaultProfile,
		Authentication:          info.Authentication,
		CertificateTimestamp:    SSTPCertificateTimestamp(info.Certificate),
		VerifyClientCertificate: info.VerifyClientCertificate,
		Ciphers:                 info.Ciphers,
	}
}

// SSTPCertificateTimestamp returns the timestamp in an SSTP server certificate name, 0 if there is none.
func SSTPCertificateTimestamp(serverCertName string) int64 {
	timestamp, ok := strings.CutPrefix(serverCertName, "sstp-server-")
	if !ok {
		return 0
	}
	value, _ := strconv.ParseInt(timestamp, 10, 64)
	return value
}

// DomesticBlockRulesMatch reports whether every rule is in the state block asks for.
func DomesticBlockRulesMatch(rules []routeros.FirewallFilterRule, block bool) bool {
	for i := range rules {
		if rules[i].Disabled == block {
			return false
		}
	}
	return true
}

// ExtractOvpnServerTimestamp returns the timestamp in an OpenVPN server name, empty if there is none.
func ExtractOvpnServerTimestamp(name string) string {
	rest, ok := strings.CutPrefix(name, "ovpn-server-")
	if !ok {
		return ""
	}
	if _, err := strconv.Atoi(rest); err != nil {
		return ""
	}
	return rest
}

// WANTypeFromComment returns the WAN type a link comment marks, if it marks one.
func WANTypeFromComment(comment *string) (string, bool) {
	if comment == nil {
		return "", false
	}
	switch *comment {
	case WANForeignComment:
		return "foreign", true
	case WANDomesticComment:
		return "domestic", true
	}
	return "", false
}

// RouterNetworkConfig reads the WANs, WiFi interfaces and LAN bridge ports from the router.
func RouterNetworkConfig(client *routeros.Client) (*db.NetworkConfig, error) {
	cfg := &db.NetworkConfig{}

	ethernets, err := client.GetEthernetInterfaces()
	if err != nil {
		return nil, err
	}
	for i := range ethernets {
		wanType, ok := WANTypeFromComment(ethernets[i].Comment)
		if !ok {
			continue
		}
		name := ethernets[i].Name
		if ethernets[i].DefaultName != nil && *ethernets[i].DefaultName != "" {
			name = *ethernets[i].DefaultName
		}
		cfg.WANs = append(cfg.WANs, db.WAN{Type: wanType, InterfaceType: string(routeros.InterfaceTypeEther), Interface: name})
	}

	wifis, err := client.ListWifiInterfaces()
	if err != nil && !strings.Contains(err.Error(), "no WiFi package") {
		return nil, err
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		return nil, err
	}
	defaultNames, err := InterfaceDefaultNames(client)
	if err != nil {
		return nil, err
	}
	bridges := make(map[string]string)
	for i := range ports {
		if !strings.HasPrefix(ports[i].Bridge, LANBridgeNamePrefix) {
			continue
		}
		cfg.BridgePorts = append(cfg.BridgePorts, *BridgePortRecord(&ports[i], defaultNames))
		bridges[ports[i].Interface] = ports[i].Bridge
	}

	masters := make(map[string]string, len(wifis))
	for i := range wifis {
		masters[wifis[i].Name] = wifis[i].DefaultName
	}

	for i := range wifis {
		w := &wifis[i]
		comment := w.Comment
		if wanType, ok := WANTypeFromComment(&comment); ok {
			cfg.WANs = append(cfg.WANs, db.WAN{Type: wanType, InterfaceType: string(routeros.InterfaceTypeWiFi), Interface: w.DefaultName})
		}
		if !StorableWiFi(w) {
			continue
		}

		cfg.WiFis = append(cfg.WiFis, *WiFiRecord(w, masters[w.Interface], bridges[w.Name]))
	}

	return cfg, nil
}

// ValidWifiMode reports whether mode is a WiFi mode the database stores.
func ValidWifiMode(mode string) bool {
	switch mode {
	case "ap", "station", "station-bridge", "station-pseudobridge":
		return true
	}
	return false
}

// WireGuardInterfaceType returns the database type of a WireGuard interface from its name, empty if it is neither.
func WireGuardInterfaceType(name string) string {
	switch {
	case strings.HasSuffix(name, wireGuardClientSuffix):
		return db.WireGuardTypeClient
	case strings.HasSuffix(name, wireGuardServerSuffix):
		return db.WireGuardTypeServer
	}
	return ""
}
