package config

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/netip"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/internal/auth"
	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/failover"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/firewall"
	"nasnet-panel/internal/handler/iface"
	"nasnet-panel/internal/handler/plugin"
	"nasnet-panel/internal/handler/vpn"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/sftp"
	"nasnet-panel/pkg/utils"
	"nasnet-panel/pkg/wgcfg"

	"github.com/jmoiron/sqlx"
)

func startBaseConfigScript(client *routeros.Client, creds *auth.Credentials, rendered string) (string, error) {
	if err := client.SetEnvironmentVariable("BaseConfigProgress", "0"); err != nil {
		return "Failed to update wizard progress", err
	}
	if err := client.SetEnvironmentVariable("BaseConfigFailed", "false"); err != nil {
		return "Failed to reset the wizard failure flag", err
	}
	_ = client.DeleteFile(wizardSuccessFile)

	return uploadAndRunScript(client, creds, rendered, wizardScriptFile, "base_config")
}

func uploadAndRunScript(client *routeros.Client, creds *auth.Credentials, rendered, remotePath, scriptName string) (string, error) {
	if err := client.EnsureNasnetPanelDir(); err != nil {
		return "Failed to prepare " + common.NasnetPanelDir + " directory", err
	}

	sftpConfig := sftp.Config{
		Host:     creds.RouterOSHost,
		Username: creds.Username,
	}
	if creds.Password != "" {
		sftpConfig.Password = creds.Password
	}
	sftpClient := sftp.NewClient(sftpConfig)
	if err := sftpClient.Connect(); err != nil {
		return "Failed to connect to SFTP", err
	}
	defer func() { _ = sftpClient.Close() }()

	if err := sftpClient.UploadFromString(rendered, remotePath); err != nil {
		return "Failed to upload the " + scriptName + " script", err
	}

	_ = client.RemoveScript(scriptName)

	scriptConfig := routeros.ScriptConfig{
		Name:   scriptName,
		Source: fmt.Sprintf(":execute script={/import file-name=%q}", remotePath),
	}
	if _, err := client.AddScript(scriptConfig); err != nil {
		return "Failed to create the " + scriptName + " script", err
	}

	if err := client.RunScript(scriptName); err != nil {
		return "Failed to execute the " + scriptName + " script", err
	}

	return "", nil
}

func wizardWANWiFi(ifCfg *InterfaceConfig, link, authTypes string) db.WiFi {
	return db.WiFi{
		Name:        ifCfg.Interface + "-" + link + "-WAN",
		DefaultName: ifCfg.Interface,
		SSID:        ifCfg.SSID,
		Password:    ifCfg.Password,
		Enabled:     true,
		Mode:        wizardWifiModeWAN,
		AuthTypes:   authTypes,
	}
}

func wizardWAN(wanType string, ifCfg *InterfaceConfig) db.WAN {
	wan := db.WAN{Type: wanType, InterfaceType: ifCfg.Type, Interface: ifCfg.Interface}
	if ifCfg.StaticIP != "" {
		wan.IP = fmt.Sprintf("%s/%d", ifCfg.StaticIP, ifCfg.StaticPrefix)
		wan.Gateway = ifCfg.Gateway
	}
	return wan
}

func startReconfig(ctx context.Context, client *routeros.Client, creds *auth.Credentials) (*ReconfigStartResponse, error) {
	conn, err := common.DatabaseForClient(ctx, client)
	if err != nil {
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to open the router database", Err: err}
	}
	stored, err := db.LoadStoredConfig(ctx, conn)
	if err != nil {
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to read the stored configuration", Err: err}
	}

	plan, err := buildReconfigPlan(client, creds, stored)
	switch {
	case errors.Is(err, errReconfigNoConfig):
		return nil, &reconfigError{Status: http.StatusBadRequest, Message: err.Error()}
	case err != nil:
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to prepare the reconfiguration", Err: err}
	}

	rendered, err := utils.RenderTemplate("base_config.tmpl", escapeWizardTemplateData(plan.templateData))
	if err != nil {
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to render template", Err: err}
	}

	job, ok := beginReconfig(creds.RouterOSHost)
	if !ok {
		return nil, &reconfigError{Status: http.StatusConflict, Message: "A reconfiguration is already in progress on this router"}
	}
	go runReconfig(context.WithoutCancel(ctx), job, client, creds, rendered, plan, conn)

	response := &ReconfigStartResponse{}
	if plan.managementWifi.SSID != "" {
		response.ManagementWiFiSSID = plan.managementWifi.SSID
		response.ManagementWiFiPassword = plan.managementWifi.Password
	}
	return response, nil
}

func beginReconfig(host string) (*reconfigJob, bool) {
	reconfigGuard.Lock()
	defer reconfigGuard.Unlock()

	if value, ok := reconfigJobs.Load(host); ok {
		if existing, ok := value.(*reconfigJob); ok && existing.running() {
			return nil, false
		}
	}

	job := &reconfigJob{state: reconfigStateRunning, step: "Preparing the configuration"}
	reconfigJobs.Store(host, job)
	return job, true
}

func buildReconfigPlan(client *routeros.Client, creds *auth.Credentials, stored *db.StoredConfig) (*reconfigPlan, error) {
	var foreign, domestic *db.WAN
	for i := range stored.WANs {
		switch stored.WANs[i].Type {
		case "foreign":
			foreign = &stored.WANs[i]
		case "domestic":
			domestic = &stored.WANs[i]
		}
	}
	if foreign == nil {
		return nil, errReconfigNoConfig
	}
	domesticEnabled := domestic != nil

	wifiAPs := reconfigWifiAPs(stored.WiFis)
	managementWifi, err := reconfigManagementWifi(client, stored.WiFis)
	if err != nil {
		return nil, err
	}

	identity := ""
	if current, err := client.GetSystemIdentity(); err == nil {
		identity = current.Name
	}
	if identity == "" {
		identity = utils.GenerateName(3, "", utils.PascalCase)
	}

	randomUserID, err := common.RouterUserID(client)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	plan := &reconfigPlan{
		stored:         stored,
		livePorts:      reconfigLiveListenPorts(client),
		managementWifi: managementWifi,
	}

	templateData := map[string]any{
		"DomesticEnabled":  domesticEnabled,
		"ManagementWifi":   managementWifi,
		"ForeignInterface": reconfigInterface(foreign, stored.WiFis),
		"WifiAPs":          wifiAPs,
		"WifiSplit":        reconfigWifiSplit(wifiAPs),
		"BridgePorts":      reconfigBridgePorts(stored.BridgePorts, wifiAPs),
		"CurrentDate":      now.Format("Jan/02/2006"),
		"CurrentTimestamp": now.Unix(),
		"BackupTime":       now.Format("2006-01-02_15-04-05"),
		"Identity":         identity,
		"RouterUsername":   creds.Username,
		"RouterPassword":   creds.Password,
		"RandomUserID":     randomUserID,

		"DomesticUserEntryComment": firewall.DomesticUserEntryComment,
	}
	templateData["DomesticInterface"] = reconfigInterface(domestic, stored.WiFis)
	if clients := reconfigVPNClients(stored); len(clients) > 0 {
		templateData["VPNClients"] = clients
	}

	// the base configuration removes every routing rule, the containers' exit classes too
	templateData["ContainerExitClasses"] = plugin.ExitClassesScript(domesticEnabled)

	plan.templateData = templateData
	return plan, nil
}

func reconfigInterface(wan *db.WAN, wifis []db.WiFi) InterfaceConfig {
	if wan == nil {
		return InterfaceConfig{}
	}
	cfg := InterfaceConfig{Interface: wan.Interface, Type: wan.InterfaceType, Type2: wan.InterfaceType}
	if wan.InterfaceType == string(routeros.InterfaceTypeEther) {
		cfg.Type2 = "ethernet"
	}
	for i := range wifis {
		if wifis[i].Mode == wizardWifiModeWAN && wifis[i].DefaultName == wan.Interface {
			cfg.SSID = wifis[i].SSID
			cfg.Password = wifis[i].Password
			cfg.AuthType = wifis[i].AuthTypes
		}
	}
	if prefix, err := netip.ParsePrefix(wan.IP); err == nil && prefix.Addr().Is4() {
		cfg.StaticIP = prefix.Addr().String()
		cfg.StaticPrefix = prefix.Bits()
		cfg.Gateway = wan.Gateway
	}
	return cfg
}

func reconfigWifiAPs(wifis []db.WiFi) []WiFiAP {
	var aps []WiFiAP
	for i := range wifis {
		w := &wifis[i]
		if w.Mode != wizardWifiModeAP || w.IsVirtual || w.DefaultName == "" || !strings.HasPrefix(w.Bridge, dbsync.LANBridgeNamePrefix) {
			continue
		}
		aps = append(aps, WiFiAP{Name: w.Name, DefaultName: w.DefaultName, NameToSet: w.Name, SSID: w.SSID, Password: w.Password})
	}
	return aps
}

func reconfigWifiSplit(aps []WiFiAP) bool {
	ssids := make(map[string]bool, len(aps))
	for i := range aps {
		ssids[aps[i].SSID] = true
	}
	return len(ssids) > 1
}

func reconfigBridgePorts(ports []db.BridgePort, aps []WiFiAP) []BridgePort {
	var result []BridgePort
	for i := range ports {
		port := &ports[i]
		if !strings.HasPrefix(port.Bridge, dbsync.LANBridgeNamePrefix) || port.DefaultName == "" {
			continue
		}
		portType := "ethernet"
		for j := range aps {
			if aps[j].NameToSet == port.Interface {
				portType = "wifi"
			}
		}
		result = append(result, BridgePort{Name: port.Interface, DefaultName: port.DefaultName, Type: portType})
	}
	return result
}

func reconfigManagementWifi(client *routeros.Client, wifis []db.WiFi) (WiFiAP, error) {
	for i := range wifis {
		if wifis[i].Name == dbsync.ManagementWifiName && wifis[i].SSID != "" && wifis[i].Password != "" {
			return WiFiAP{SSID: wifis[i].SSID, Password: wifis[i].Password}, nil
		}
	}

	radios, err := client.GetWiFiRadios()
	if err != nil {
		return WiFiAP{}, fmt.Errorf("failed to retrieve WiFi radios: %w", err)
	}
	if len(radios) == 0 {
		return WiFiAP{}, nil
	}

	password, err := utils.GenerateRandomString(8, 20)
	if err != nil {
		return WiFiAP{}, err
	}
	return WiFiAP{SSID: utils.GenerateName(3, "", utils.PascalCase), Password: password}, nil
}

func runReconfig(ctx context.Context, job *reconfigJob, client *routeros.Client, creds *auth.Credentials, rendered string, plan *reconfigPlan, conn *sqlx.DB) {
	for _, warning := range plan.warnings {
		job.warn(warning)
	}
	job.update("Applying the base configuration", reconfigBaseStart)

	// Until the script is done, since it rewrites the exit classes.
	release := plugin.HoldExitClasses()
	if message, err := startBaseConfigScript(client, creds, rendered); err != nil {
		release()
		job.fail(message + ": " + err.Error())
		return
	}
	err := waitForBaseConfig(ctx, job, client)
	release()
	if err != nil {
		job.fail(err.Error())
		return
	}

	extras := reconfigExtras(ctx, client, conn, plan)
	for i := range extras {
		job.update(extras[i].step, reconfigBaseEnd+(reconfigExtrasEnd-reconfigBaseEnd)*i/len(extras))
		for _, err := range extras[i].run() {
			if err != nil {
				job.warn(err.Error())
			}
		}
	}

	job.complete()
}

func waitForBaseConfig(parent context.Context, job *reconfigJob, client *routeros.Client) error {
	ctx, cancel := context.WithTimeout(parent, wizardSaveTimeout)
	defer cancel()

	ticker := time.NewTicker(reconfigPollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return errors.New("the base configuration did not finish in time")
		case <-ticker.C:
		}

		message, _ := client.GetEnvironmentVariable("BaseConfigMessage")
		if failed, err := client.GetEnvironmentVariable("BaseConfigFailed"); err == nil && failed == "true" {
			if message == "" {
				message = "the base configuration failed"
			}
			return errors.New(message)
		}
		if exists, err := client.FileExists(wizardSuccessFile); err == nil && exists {
			return nil
		}

		if progress, err := client.GetEnvironmentVariable("BaseConfigProgress"); err == nil && progress != "" {
			if p, err := strconv.Atoi(progress); err == nil {
				job.update(message, reconfigBaseStart+p*(reconfigBaseEnd-reconfigBaseStart)/100)
			}
		}
	}
}

func reconfigExtras(ctx context.Context, client *routeros.Client, conn *sqlx.DB, plan *reconfigPlan) []reconfigExtra {
	stored := plan.stored
	return []reconfigExtra{
		{"Running the plugins' post-wizard scripts", func() []error { return plugin.RunPostWizard(client) }},
		{"Restoring domestic addresses", func() []error { return restoreDomesticAddresses(client, stored.DomesticAddresses) }},
		{"Restoring bridge ports and virtual WiFi interfaces", func() []error { return restoreBridgeAssignments(client, stored.WiFis, stored.BridgePorts) }},
		{"Restoring the domestic block setting", func() []error {
			return restoreDomesticBlock(client, stored.Settings[dbsync.SettingKeyDomesticBlockEnabled])
		}},
		{"Restoring DNS servers", func() []error { return restoreDNSServers(client, stored.DNSServers) }},
		{"Restoring the ad-block setting", func() []error { return restoreAdBlock(client, stored.Settings[dbsync.SettingKeyAdBlockEnabled]) }},
		{"Restoring static DNS entries", func() []error { return restoreStaticDNS(ctx, client, conn, stored.DNSStaticEntries) }},
		{"Restoring SSTP clients", func() []error { return restoreSSTPClients(client, stored.SSTPClients) }},
		{"Restoring L2TP clients", func() []error { return restoreL2TPClients(client, stored.L2TPClients) }},
		{"Restoring the SSTP server", func() []error { return restoreSSTPServer(client, stored.VPNServers) }},
		{"Restoring the L2TP server", func() []error { return restoreL2TPServer(client, stored.VPNServers) }},
		{"Restoring the OpenVPN servers", func() []error { return restoreOvpnServers(client, stored) }},
		{"Restoring the OpenVPN users", func() []error { return restoreOvpnUsers(client, stored.VPNUsers) }},
		{"Restoring VPN users", func() []error { return restoreVPNUsers(client, stored.VPNUsers) }},
		{"Restoring WireGuard interfaces", func() []error { return restoreWireGuardInterfaces(client, stored.WireGuards, plan.livePorts) }},
		{"Restoring failover routes", func() []error { return failover.Restore(client, stored.FailoverInterfaces) }},
	}
}

func restoreDomesticAddresses(client *routeros.Client, addresses []string) []error {
	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{ListName: firewall.DomesticAddressList})
	if err != nil {
		return []error{fmt.Errorf("failed to list %s: %w", firewall.DomesticAddressList, err)}
	}

	var errs []error
	for _, address := range addresses {
		covering, err := routeros.FilterAddressListByContainment(items, address)
		if err != nil {
			errs = append(errs, fmt.Errorf("domestic address %s: %w", address, err))
			continue
		}
		if len(covering) > 0 {
			continue
		}
		if _, err := client.AddFirewallAddressListItem(firewall.DomesticAddressList, address, false, firewall.DomesticUserEntryComment); err != nil {
			errs = append(errs, fmt.Errorf("domestic address %s: %w", address, err))
		}
	}
	return errs
}

func restoreStaticDNS(parent context.Context, client *routeros.Client, conn *sqlx.DB, entries []db.DNSStaticEntry) []error {
	var errs []error
	for i := range entries {
		entry := &entries[i]
		id, err := client.AddUserStaticDNS(entry.Name, entry.Address)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if !entry.Enabled {
			disabled := true
			if err := client.UpdateUserStaticDNS(id, routeros.UpdateStaticDNSParams{Disabled: &disabled}); err != nil {
				errs = append(errs, err)
			}
		}

		oldID := entry.RouterID
		entry.RouterID = id
		if err := replaceStoredStaticDNS(parent, conn, oldID, entry); err != nil {
			errs = append(errs, err)
		}
	}
	return errs
}

func reconfigLiveListenPorts(client *routeros.Client) map[string]int {
	ports := make(map[string]int)
	interfaces, err := client.ListWireGuards()
	if err != nil {
		return ports
	}
	for i := range interfaces {
		ports[interfaces[i].Name] = interfaces[i].ListenPort
	}
	return ports
}

func ensureOvpnCertificates(client *routeros.Client, server *db.OvpnServer) (string, error) {
	if server.CertificateTimestamp == 0 {
		return "ovpn-ca-0", nil
	}
	suffix := strconv.FormatInt(server.CertificateTimestamp, 10)
	certificates := []struct{ name, passphrase string }{
		{"ovpn-ca-" + suffix, ""},
		{"ovpn-server-" + suffix, server.ClientCertificatePassword},
		{"ovpn-client-" + suffix, server.ClientCertificatePassword},
	}
	for _, certificate := range certificates {
		ready, err := ensureCertificate(client, certificate.name, certificate.passphrase)
		if err != nil {
			return "", err
		}
		if !ready {
			return certificate.name, nil
		}
	}
	return "", nil
}

func ensureCertificate(client *routeros.Client, name, passphrase string) (bool, error) {
	exists, err := client.CertificateExists(name)
	if err != nil || exists {
		return exists, err
	}
	return client.ImportCertificateFiles(name, passphrase)
}

func restoreSSTPServer(client *routeros.Client, servers []db.VPNServer) []error {
	for i := range servers {
		server := &servers[i]
		if server.Type != "sstp" || !server.Enabled {
			continue
		}
		return restoreSSTPServerFrom(client, server)
	}
	return nil
}

func restoreSSTPServerFrom(client *routeros.Client, server *db.VPNServer) []error {
	if server.CertificateTimestamp == 0 {
		return []error{errors.New("the stored SSTP server has no certificate to use")}
	}
	suffix := strconv.FormatInt(server.CertificateTimestamp, 10)
	caName := "sstp-ca-" + suffix
	serverName := "sstp-server-" + suffix
	for _, certificate := range []struct{ name, passphrase string }{
		{caName, ""},
		{serverName, server.CertificatePassword},
	} {
		name := certificate.name
		ready, err := ensureCertificate(client, name, certificate.passphrase)
		if err != nil {
			return []error{err}
		}
		if !ready {
			return []error{fmt.Errorf("SSTP server certificate %s does not exist and there are no files to import it from", name)}
		}
	}

	port := server.Port
	if port == 0 {
		port = reconfigSSTPServerPort
	}
	profile := server.DefaultProfile
	if profile == "" {
		profile = "default"
	}
	err := client.SetSstpServer(routeros.SstpServerConfig{
		Enabled:                 true,
		Port:                    port,
		DefaultProfile:          profile,
		Authentication:          server.Authentication,
		Certificate:             serverName,
		VerifyClientCertificate: server.VerifyClientCertificate,
		Ciphers:                 server.Ciphers,
	})
	if err != nil {
		return []error{fmt.Errorf("failed to enable the SSTP server: %w", err)}
	}

	var errs []error
	dstPort := strconv.Itoa(port)
	placeBefore := ""
	if blocks, lookupErr := client.ListFirewallFilterRulesByComment(managementPortsBlockComment); lookupErr == nil && len(blocks) > 0 {
		placeBefore = blocks[0].ID
	}
	_, err = client.AddFirewallRule(routeros.FirewallRuleConfig{
		Chain: "input", Action: "accept", Protocol: "tcp", DstPort: dstPort,
		InInterfaceList: vpn.VpnServerAllowedInterfaceList, Comment: serverName, PlaceBefore: placeBefore,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("failed to add the SSTP firewall rule: %w", err))
	}

	replyRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		return append(errs, fmt.Errorf("failed to find the reply routing mangle rule: %w", err))
	}
	_, err = client.AddMangleRule(routeros.MangleRuleConfig{
		Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + serverName, ConnectionState: "new",
		InIfaceList: vpn.VpnServerAllowedInterfaceList, Protocol: "tcp", DstPort: dstPort,
		NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("failed to add the SSTP mangle rule: %w", err))
	}
	return errs
}

func restoreBridgeAssignments(client *routeros.Client, wifis []db.WiFi, ports []db.BridgePort) []error {
	interfaces, err := client.ListWifiInterfaces()
	if err != nil && !strings.Contains(err.Error(), "no WiFi package") {
		return []error{fmt.Errorf("failed to list WiFi interfaces: %w", err)}
	}
	present := make(map[string]bool, len(interfaces))
	masters := make(map[string]string, len(interfaces))
	for i := range interfaces {
		present[interfaces[i].Name] = true
		if !interfaces[i].IsVirtual {
			masters[interfaces[i].DefaultName] = interfaces[i].Name
		}
	}

	comments := make(map[string]string)
	bridgeComment := func(bridge string) (string, error) {
		if comment, ok := comments[bridge]; ok {
			return comment, nil
		}
		info, err := client.GetBridge(bridge)
		if err != nil {
			return "", fmt.Errorf("bridge %s: %w", bridge, err)
		}
		comments[bridge] = ""
		if info.Comment != nil {
			comments[bridge] = *info.Comment
		}
		return comments[bridge], nil
	}

	var errs []error
	for i := range wifis {
		w := &wifis[i]
		if !w.IsVirtual || present[w.Name] || !strings.HasPrefix(w.Bridge, dbsync.LANBridgeNamePrefix) {
			continue
		}
		if err := restoreVirtualWiFi(client, w, masters[w.Master], bridgeComment); err != nil {
			errs = append(errs, err)
		}
	}

	for i := range ports {
		port := &ports[i]
		if port.Bridge == wizardLANBridge || !strings.HasPrefix(port.Bridge, dbsync.LANBridgeNamePrefix) || port.DefaultName == "" {
			continue
		}
		comment, err := bridgeComment(port.Bridge)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		name := port.Interface
		if current, ok := masters[port.DefaultName]; ok {
			name = current
		}
		if err := client.ExecuteScriptString(iface.BridgePortMoveScript(name, port.Bridge, comment)); err != nil {
			errs = append(errs, fmt.Errorf("failed to move %s to bridge %s: %w", name, port.Bridge, err))
		}
	}
	return errs
}

func restoreVirtualWiFi(client *routeros.Client, w *db.WiFi, master string, bridgeComment func(string) (string, error)) error {
	if master == "" {
		return fmt.Errorf("virtual WiFi interface %s: master interface %s was not found", w.Name, w.Master)
	}
	comment, err := bridgeComment(w.Bridge)
	if err != nil {
		return fmt.Errorf("virtual WiFi interface %s: %w", w.Name, err)
	}

	config := routeros.WifiConfig{Name: w.Name, Interface: master, SSID: w.SSID, Mode: wizardWifiModeAP, Disabled: !w.Enabled, Comment: comment}
	if w.Password != "" {
		config.Security = routeros.WifiSecurity{Type: w.AuthTypes, Passphrase: w.Password}
		if config.Security.Type == "" {
			config.Security.Type = wizardWifiAuthTypes
		}
	}
	if _, err := client.AddWifiInterface(config); err != nil {
		return fmt.Errorf("virtual WiFi interface %s: %w", w.Name, err)
	}

	if _, err := client.AddBridgePort(routeros.BridgePortConfig{Bridge: w.Bridge, Interface: w.Name, Comment: comment}); err != nil {
		return fmt.Errorf("virtual WiFi interface %s bridge port: %w", w.Name, err)
	}
	return nil
}

func restoreDNSServers(client *routeros.Client, servers []db.DNSServer) []error {
	existing, err := client.ListDNSForwarders()
	if err != nil {
		return []error{fmt.Errorf("failed to list DNS forwarders: %w", err)}
	}
	ids := make(map[string]string, len(existing))
	for i := range existing {
		ids[existing[i].Name] = existing[i].ID
	}

	var errs []error
	for i := range servers {
		server := &servers[i]
		if server.DNSServers == "" {
			continue
		}

		if server.Type == db.DNSServerTypeGlobal {
			config := routeros.DNSUpdateConfig{Servers: &server.DNSServers}
			if server.DOHServers != "" {
				config.DOHServer = &server.DOHServers
			}
			if err := client.UpdateDNSConfig(config); err != nil {
				errs = append(errs, err)
			}
			continue
		}

		forwarder := &routeros.DNSForwarder{
			Name:          server.Name,
			DNSServers:    strings.Split(server.DNSServers, ","),
			VerifyDOHCert: server.VerifyDOHCert,
			Comment:       server.Comment,
		}
		if server.DOHServers != "" {
			forwarder.DOHServers = strings.Split(server.DOHServers, ",")
		}

		id, ok := ids[server.Name]
		if !ok {
			id, err = client.AddDNSForwarder(server.Name, server.DNSServers, server.VerifyDOHCert)
			if err != nil {
				errs = append(errs, err)
				continue
			}
		}
		if err := client.SetDNSForwarder(id, forwarder); err != nil {
			errs = append(errs, err)
		}
	}
	return errs
}

func restoreL2TPServer(client *routeros.Client, servers []db.VPNServer) []error {
	for i := range servers {
		server := &servers[i]
		if server.Type != "l2tp" || !server.Enabled {
			continue
		}
		return restoreL2TPServerFrom(client, server)
	}
	return nil
}

func restoreL2TPServerFrom(client *routeros.Client, server *db.VPNServer) []error {
	profile := server.DefaultProfile
	if profile == "" {
		profile = "default"
	}
	authentication := server.Authentication
	if authentication == "" {
		authentication = "pap,chap,mschap1,mschap2"
	}
	err := client.SetL2tpServer(routeros.L2tpServerConfig{
		Enabled:        true,
		DefaultProfile: profile,
		Authentication: authentication,
		UseIPsec:       server.UseIPsec,
		IPsecSecret:    server.IPsecSecret,
	})
	if err != nil {
		return []error{fmt.Errorf("failed to enable the L2TP server: %w", err)}
	}

	var errs []error
	for _, spec := range vpn.L2tpServerRuleSpecs {
		_, err := client.AddFirewallRule(routeros.FirewallRuleConfig{
			Chain: "input", Action: "accept", Protocol: spec.Protocol, DstPort: spec.DstPort,
			InInterfaceList: vpn.VpnServerAllowedInterfaceList, Comment: vpn.L2tpServerComment + spec.Suffix,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to add the L2TP firewall rule%s: %w", spec.Suffix, err))
		}
	}

	replyRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		return append(errs, fmt.Errorf("failed to find the reply routing mangle rule: %w", err))
	}
	for _, spec := range vpn.L2tpServerRuleSpecs {
		_, err := client.AddMangleRule(routeros.MangleRuleConfig{
			Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + vpn.L2tpServerComment + spec.Suffix,
			ConnectionState: "new", InIfaceList: vpn.VpnServerAllowedInterfaceList, Protocol: spec.Protocol, DstPort: spec.DstPort,
			NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to add the L2TP mangle rule%s: %w", spec.Suffix, err))
		}
	}
	return errs
}

func restoreAdBlock(client *routeros.Client, setting string) []error {
	enabled, err := strconv.ParseBool(setting)
	if err != nil {
		return nil
	}

	adLists, err := client.ListDNSAdLists()
	if err != nil {
		return []error{fmt.Errorf("failed to list DNS adlist entries: %w", err)}
	}
	var existing *routeros.DNSAdList
	for i := range adLists {
		if adLists[i].URL == dbsync.DNSAdBlockURL {
			existing = &adLists[i]
			break
		}
	}

	disabled := !enabled
	switch {
	case existing != nil:
		if existing.Disabled == disabled {
			return nil
		}
		if err := client.UpdateDNSAdList(existing.ID, routeros.DNSAdListUpdateConfig{Disabled: &disabled}); err != nil {
			return []error{fmt.Errorf("failed to update the ad-block adlist: %w", err)}
		}
	case enabled:
		sslVerify := false
		if _, err := client.AddDNSAdList(routeros.AddDNSAdListConfig{URL: dbsync.DNSAdBlockURL, SSLVerify: &sslVerify}); err != nil {
			return []error{fmt.Errorf("failed to create the ad-block adlist: %w", err)}
		}
	}
	return nil
}

func restoreDomesticBlock(client *routeros.Client, setting string) []error {
	block, err := strconv.ParseBool(setting)
	if err != nil {
		return nil
	}

	rules, _, err := firewall.EnsureDomesticBlockRules(client)
	if err != nil {
		return []error{fmt.Errorf("failed to read the domestic block rules: %w", err)}
	}
	if dbsync.DomesticBlockRulesMatch(rules, block) {
		return nil
	}

	ids := make([]string, 0, len(rules))
	for i := range rules {
		ids = append(ids, rules[i].ID)
	}
	if err := client.SetFirewallFilterRulesDisabled(ids, !block); err != nil {
		return []error{fmt.Errorf("failed to update the domestic block rules: %w", err)}
	}
	return nil
}

func restoreOvpnServers(client *routeros.Client, stored *db.StoredConfig) []error {
	if len(stored.OvpnServers) == 0 {
		return nil
	}
	if !hasDomesticWAN(stored.WANs) {
		return []error{errors.New("the OpenVPN servers were not restored because no domestic WAN is configured")}
	}

	replyRuleID, replyRuleErr := client.GetMangleRuleIDByComment(vpnReplyRoutingRule)

	var errs []error
	for i := range stored.OvpnServers {
		server := &stored.OvpnServers[i]

		missing, err := ensureOvpnCertificates(client, server)
		switch {
		case err != nil:
			errs = append(errs, err)
			continue
		case missing != "":
			errs = append(errs, fmt.Errorf(
				"OpenVPN server %s was not restored: certificate %s does not exist and there are no files to import it from",
				server.Name, missing))
			continue
		}

		errs = append(errs, restoreOvpnServer(client, server, replyRuleID, replyRuleErr)...)
	}
	return errs
}

func restoreOvpnUsers(client *routeros.Client, users []db.VPNUser) []error {
	var errs []error
	for i := range users {
		user := &users[i]
		if user.Profile != wizardVPNProfile {
			continue
		}
		_, err := client.CreatePppSecret(routeros.CreatePppSecretParams{
			Name: user.Username, Password: user.Password, Service: reconfigVPNUserSecret, Profile: wizardVPNProfile,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("OpenVPN user %s: %w", user.Username, err))
		}
	}
	return errs
}

func restoreOvpnServer(client *routeros.Client, server *db.OvpnServer, replyRuleID string, replyRuleErr error) []error {
	suffix := strconv.FormatInt(server.CertificateTimestamp, 10)
	_, err := client.AddOvpnServer(routeros.AddOvpnServerConfig{
		Name:              server.Name,
		Port:              server.Port,
		Mode:              "ip",
		Protocol:          server.Protocol,
		Certificate:       "ovpn-server-" + suffix,
		Disabled:          !server.Enabled,
		Auth:              ovpnServerAuth,
		Cipher:            ovpnServerCipher,
		RequireClientCert: true,
		KeepAliveTimeout:  ovpnServerKeepalive,
		RedirectGateway:   ovpnServerRedirectGateway,
		DefaultProfile:    "default",
		Comment:           dbsync.OvpnServerCommentPrefix + server.ClientCertificatePassword,
	})
	if err != nil {
		return []error{fmt.Errorf("OpenVPN server %s: %w", server.Name, err)}
	}

	var errs []error
	dstPort := strconv.Itoa(server.Port)
	_, err = client.AddFirewallRule(routeros.FirewallRuleConfig{
		Chain: "input", Action: "accept", Protocol: server.Protocol, DstPort: dstPort,
		InInterfaceList: vpn.VpnServerAllowedInterfaceList, Comment: server.Name,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("OpenVPN server %s firewall rule: %w", server.Name, err))
	}

	if replyRuleErr != nil {
		return append(errs, fmt.Errorf("OpenVPN server %s reply routing mangle rule: %w", server.Name, replyRuleErr))
	}
	_, err = client.AddMangleRule(routeros.MangleRuleConfig{
		Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + server.Name, ConnectionState: "new",
		InIfaceList: vpn.VpnServerAllowedInterfaceList, Protocol: server.Protocol, DstPort: dstPort,
		NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("OpenVPN server %s mangle rule: %w", server.Name, err))
	}
	return errs
}

func hasDomesticWAN(wans []db.WAN) bool {
	for i := range wans {
		if wans[i].Type == "domestic" {
			return true
		}
	}
	return false
}

// MarkReconfigPending records that a reconfiguration must run after the next update.
func MarkReconfigPending(client *routeros.Client, tag string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), reconfigSaveTimeout)
	defer cancel()

	conn, err := common.DatabaseForClient(ctx, client)
	if err == nil {
		err = db.UpsertSetting(ctx, conn, settingKeyPendingReconfig, tag)
	}
	if err != nil {
		log.Printf("[app-update] failed to schedule the reconfiguration after %s: %v", tag, err)
		return false
	}
	return true
}

// ClearReconfigPending removes the pending reconfiguration marker.
func ClearReconfigPending(client *routeros.Client) {
	ctx, cancel := context.WithTimeout(context.Background(), reconfigSaveTimeout)
	defer cancel()

	conn, err := common.DatabaseForClient(ctx, client)
	if err == nil {
		err = db.DeleteSetting(ctx, conn, settingKeyPendingReconfig)
	}
	if err != nil && !errors.Is(err, db.ErrSettingNotFound) {
		log.Printf("[app-update] failed to clear the scheduled reconfiguration: %v", err)
	}
}

func loadReconfigJob(host string) (*reconfigJob, bool) {
	value, ok := reconfigJobs.Load(host)
	if !ok {
		return nil, false
	}
	job, ok := value.(*reconfigJob)
	return job, ok
}

func runningVersionIs(tag string) bool {
	target, ok := common.ParseReleaseVersion(tag)
	if !ok {
		return false
	}
	current, ok := common.ParseReleaseVersion(buildinfo.Version)
	return ok && common.CompareReleaseVersions(target, current) == 0
}

// ReconfigStatusAfterUpdate returns the reconfiguration status and resumes it after an update when it is pending.
func ReconfigStatusAfterUpdate(ctx context.Context, client *routeros.Client, creds *auth.Credentials) *ReconfigStatusResponse {
	reconfigResumeMu.Lock()
	defer reconfigResumeMu.Unlock()

	if job, ok := loadReconfigJob(creds.RouterOSHost); ok {
		status := job.snapshot()
		return &status
	}

	conn, err := common.DatabaseForClient(ctx, client)
	if err != nil {
		return nil
	}
	setting, err := db.GetSetting(ctx, conn, settingKeyPendingReconfig)
	if err != nil {
		return nil
	}
	if !runningVersionIs(setting.Value) {
		return &ReconfigStatusResponse{State: reconfigStatePending, Step: "Waiting for the update to be applied"}
	}

	if err := db.DeleteSetting(ctx, conn, settingKeyPendingReconfig); err != nil {
		log.Printf("[app-update] failed to clear the scheduled reconfiguration: %v", err)
	}
	if _, err := startReconfig(ctx, client, creds); err != nil {
		if errors.Is(err, errReconfigNoConfig) {
			return &ReconfigStatusResponse{State: reconfigStateIdle}
		}
		if job, ok := beginReconfig(creds.RouterOSHost); ok {
			job.update("Starting the reconfiguration", 0)
			job.fail(err.Error())
		}
	}
	if job, ok := loadReconfigJob(creds.RouterOSHost); ok {
		status := job.snapshot()
		return &status
	}
	return nil
}

func (e *reconfigError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func (e *reconfigError) Unwrap() error {
	return e.Err
}

func (e *reconfigError) Is(target error) bool {
	return target == errReconfigNoConfig && e.Status == http.StatusBadRequest
}

func (j *reconfigJob) running() bool {
	j.mu.Lock()
	defer j.mu.Unlock()
	return j.state == reconfigStateRunning
}

func (j *reconfigJob) update(step string, progress int) {
	j.mu.Lock()
	defer j.mu.Unlock()
	if step != "" {
		j.step = step
	}
	if progress > j.progress {
		j.progress = progress
	}
}

func (j *reconfigJob) warn(message string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.warnings = append(j.warnings, message)
}

func (j *reconfigJob) fail(message string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.state = reconfigStateFailed
	j.err = message
}

func (j *reconfigJob) complete() {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.state = reconfigStateCompleted
	j.step = "Reconfiguration completed"
	j.progress = 100
}

func (j *reconfigJob) snapshot() ReconfigStatusResponse {
	j.mu.Lock()
	defer j.mu.Unlock()
	return ReconfigStatusResponse{
		State:    j.state,
		Step:     j.step,
		Progress: j.progress,
		Error:    j.err,
		Warnings: append([]string(nil), j.warnings...),
	}
}

// buildWireGuardClientTemplateData parses a wg-quick config into the shape
// base_config.tmpl expects.
func buildWireGuardClientTemplateData(rawConfig string) (*WireGuardClientTemplateData, error) {
	cfg, err := wgcfg.FromWgQuick(rawConfig, "import")
	if err != nil {
		return nil, err
	}

	data := &WireGuardClientTemplateData{
		InterfacePrivateKey: cfg.PrivateKey.String(),
	}
	if len(cfg.Addresses) > 0 {
		data.InterfaceAddress = cfg.Addresses[0].String()
	}

	for i := range cfg.Peers {
		peer := cfg.Peers[i]
		p := WireGuardPeerTemplateData{PublicKey: peer.PublicKey.Base64()}
		if len(peer.Endpoints) > 0 {
			p.EndpointAddress = peer.Endpoints[0].Host
			p.EndpointPort = fmt.Sprintf("%d", peer.Endpoints[0].Port)
		}
		if !peer.PresharedKey.IsZero() {
			p.PreSharedKey = peer.PresharedKey.Base64()
		}
		if len(peer.AllowedIPs) > 0 {
			p.AllowedAddress = peer.AllowedIPs[0].String()
		}
		if peer.PersistentKeepalive > 0 {
			p.PersistentKeepalive = fmt.Sprintf("%d", peer.PersistentKeepalive)
		}
		data.Peers = append(data.Peers, p)
	}

	return data, nil
}

func failoverClientName(prefix string, index int) string {
	return prefix + strconv.Itoa(index)
}

func failoverClientIndex(name string) (int, bool) {
	for _, prefix := range []string{failoverL2TPPrefix, failoverWireGuardPrefix} {
		if rest, ok := strings.CutPrefix(name, prefix); ok {
			index, err := strconv.Atoi(rest)
			if err == nil && index >= 1 && index <= failoverMaxClients {
				return index, true
			}
		}
	}
	return 0, false
}

func isFailoverClientName(name string) bool {
	_, ok := failoverClientIndex(name)
	return ok
}

func newVPNClient(index int, name string, l2tp *L2tpClientConfig, wg *WireGuardClientTemplateData) VPNClient {
	subnet := fmt.Sprintf(failoverSubnetFormat, index)
	return VPNClient{
		Index:     index,
		Name:      name,
		Role:      failoverRoles[index-1],
		ProbeIP:   failover.ProbePool[index-1],
		Bridge:    failoverBridgePrefix + name,
		ListName:  name + failoverListSuffix,
		Table:     failoverTablePrefix + name,
		Subnet:    subnet + ".0/24",
		Network:   subnet + ".0",
		Gateway:   subnet + ".1",
		Address:   subnet + ".1/24",
		PoolRange: subnet + ".2-" + subnet + ".254",
		L2tp:      l2tp,
		WireGuard: wg,
	}
}

func fetchVPNClients(ctx context.Context, userID string) []VPNClient {
	account, err := vpn.FetchAccount(ctx, userID)
	if err == nil {
		clients := accountVPNClients(account.Username, account.Password, []string{account.Primary, account.Fallback1, account.Fallback2})
		if strings.TrimSpace(account.Username) != "" && len(clients) > 0 {
			return clients
		}
		err = errInvalidVPNClient
	}

	log.Printf("NasNet VPN account unavailable, using the fallback account: %v", err)
	return accountVPNClients(failover.FallbackUser, failover.FallbackPassword, failover.FallbackServers[:])
}

func accountVPNClients(username, password string, servers []string) []VPNClient {
	clients := make([]VPNClient, 0, len(servers))
	for _, server := range servers {
		server = strings.TrimSpace(server)
		if server == "" {
			continue
		}
		index := len(clients) + 1
		clients = append(clients, newVPNClient(index, failoverClientName(failoverL2TPPrefix, index), &L2tpClientConfig{
			ConnectTo: server, User: username, Password: password,
		}, nil))
	}
	return clients
}

func reconfigVPNClients(stored *db.StoredConfig) []VPNClient {
	byIndex := make(map[int]VPNClient, failoverMaxClients)

	for i := range stored.L2TPClients {
		l2tp := &stored.L2TPClients[i]
		if !strings.HasPrefix(l2tp.Name, failoverL2TPPrefix) {
			continue
		}
		if index, ok := failoverClientIndex(l2tp.Name); ok {
			byIndex[index] = newVPNClient(index, l2tp.Name, &L2tpClientConfig{
				ConnectTo: l2tp.ConnectTo, User: l2tp.User, Password: l2tp.Password, IPsecSecret: l2tp.IPsecSecret,
			}, nil)
		}
	}

	for i := range stored.WireGuards {
		wg := &stored.WireGuards[i]
		if !strings.HasPrefix(wg.Name, failoverWireGuardPrefix) {
			continue
		}
		index, ok := failoverClientIndex(wg.Name)
		if !ok {
			continue
		}
		data := &WireGuardClientTemplateData{InterfacePrivateKey: wg.PrivateKey, InterfaceAddress: wg.Address}
		for j := range wg.Peers {
			peer := &wg.Peers[j]
			p := WireGuardPeerTemplateData{
				PublicKey: peer.PublicKey, EndpointAddress: peer.EndpointAddress, PreSharedKey: peer.PresharedKey,
				AllowedAddress: peer.AllowedAddress,
			}
			if peer.EndpointPort > 0 {
				p.EndpointPort = strconv.Itoa(peer.EndpointPort)
			}
			if peer.PersistentKeepalive > 0 {
				p.PersistentKeepalive = strconv.Itoa(peer.PersistentKeepalive)
			}
			data.Peers = append(data.Peers, p)
		}
		byIndex[index] = newVPNClient(index, wg.Name, nil, data)
	}

	clients := make([]VPNClient, 0, len(byIndex))
	for index := 1; index <= failoverMaxClients; index++ {
		if client, ok := byIndex[index]; ok {
			clients = append(clients, client)
		}
	}
	return clients
}

func escapeWiFiAP(ap WiFiAP) WiFiAP {
	ap.NameToSet = utils.EscapeRouterOSString(ap.NameToSet)
	ap.SSID = utils.EscapeRouterOSString(ap.SSID)
	ap.Password = utils.EscapeRouterOSString(ap.Password)
	return ap
}

func escapeVPNClient(client VPNClient) VPNClient {
	if client.L2tp != nil {
		client.L2tp = &L2tpClientConfig{
			ConnectTo:   utils.EscapeRouterOSString(client.L2tp.ConnectTo),
			User:        utils.EscapeRouterOSString(client.L2tp.User),
			Password:    utils.EscapeRouterOSString(client.L2tp.Password),
			IPsecSecret: utils.EscapeRouterOSString(client.L2tp.IPsecSecret),
		}
	}
	if client.WireGuard != nil {
		peers := make([]WireGuardPeerTemplateData, len(client.WireGuard.Peers))
		for i, peer := range client.WireGuard.Peers {
			peer.PublicKey = utils.EscapeRouterOSString(peer.PublicKey)
			peer.EndpointAddress = utils.EscapeRouterOSString(peer.EndpointAddress)
			peer.AllowedAddress = utils.EscapeRouterOSString(peer.AllowedAddress)
			peer.PreSharedKey = utils.EscapeRouterOSString(peer.PreSharedKey)
			peers[i] = peer
		}
		client.WireGuard = &WireGuardClientTemplateData{
			InterfacePrivateKey: utils.EscapeRouterOSString(client.WireGuard.InterfacePrivateKey),
			InterfaceAddress:    utils.EscapeRouterOSString(client.WireGuard.InterfaceAddress),
			Peers:               peers,
		}
	}
	return client
}

func escapeInterfaceConfig(cfg InterfaceConfig) InterfaceConfig {
	cfg.SSID = utils.EscapeRouterOSString(cfg.SSID)
	cfg.Password = utils.EscapeRouterOSString(cfg.Password)
	return cfg
}

// escapeWizardTemplateData returns a copy of the base_config.tmpl data in which every
// user-supplied string is escaped for a double-quoted RouterOS string, which is
// how the template writes them.
func escapeWizardTemplateData(data map[string]any) map[string]any {
	escaped := make(map[string]any, len(data))
	for key, value := range data {
		escaped[key] = value
	}

	if v, ok := data["ManagementWifi"].(WiFiAP); ok {
		escaped["ManagementWifi"] = escapeWiFiAP(v)
	}
	if v, ok := data["ForeignInterface"].(InterfaceConfig); ok {
		escaped["ForeignInterface"] = escapeInterfaceConfig(v)
	}
	if v, ok := data["DomesticInterface"].(InterfaceConfig); ok {
		escaped["DomesticInterface"] = escapeInterfaceConfig(v)
	}
	if v, ok := data["WifiAPs"].([]WiFiAP); ok {
		aps := make([]WiFiAP, len(v))
		for i := range v {
			aps[i] = escapeWiFiAP(v[i])
		}
		escaped["WifiAPs"] = aps
	}
	for _, key := range []string{"Identity", "RouterUsername", "RouterPassword"} {
		if v, ok := data[key].(string); ok {
			escaped[key] = utils.EscapeRouterOSString(v)
		}
	}
	if v, ok := data["OvpnServer"].(*OvpnServerConfig); ok && v != nil {
		users := make([]OvpnUser, len(v.Users))
		for i, user := range v.Users {
			users[i] = OvpnUser{
				Username: utils.EscapeRouterOSString(user.Username),
				Password: utils.EscapeRouterOSString(user.Password),
			}
		}
		escaped["OvpnServer"] = &OvpnServerConfig{
			ClientCertificatePassword: utils.EscapeRouterOSString(v.ClientCertificatePassword),
			Users:                     users,
		}
	}
	if v, ok := data["VPNClients"].([]VPNClient); ok {
		clients := make([]VPNClient, len(v))
		for i := range v {
			clients[i] = escapeVPNClient(v[i])
		}
		escaped["VPNClients"] = clients
	}

	return escaped
}

func restoreSSTPClients(client *routeros.Client, clients []db.SSTPClient) []error {
	existing, err := client.ListVPNClients()
	if err != nil {
		return []error{fmt.Errorf("failed to list VPN clients: %w", err)}
	}
	present := make(map[string]bool, len(existing))
	for i := range existing {
		present[existing[i].Name] = true
	}

	var errs []error
	for i := range clients {
		sstp := &clients[i]
		if !present[sstp.Name] {
			port := sstp.Port
			if port == 0 {
				port = reconfigSSTPDefault
			}
			err := client.AddSSTPClient(routeros.AddSSTPClientConfig{
				Name: sstp.Name, ConnectTo: sstp.ConnectTo, Port: port, User: sstp.User, Password: sstp.Password,
				Comment: sstp.Comment, Disabled: !sstp.Enabled,
			})
			if err != nil {
				errs = append(errs, err)
				continue
			}
		}
		errs = append(errs, addToTunnelInterfaceLists(client, sstp.Name)...)
	}
	return errs
}

func restoreL2TPClients(client *routeros.Client, clients []db.L2TPClient) []error {
	existing, err := client.ListVPNClients()
	if err != nil {
		return []error{fmt.Errorf("failed to list VPN clients: %w", err)}
	}
	present := make(map[string]bool, len(existing))
	for i := range existing {
		present[existing[i].Name] = true
	}

	var errs []error
	for i := range clients {
		l2tp := &clients[i]
		if isFailoverClientName(l2tp.Name) {
			continue
		}
		if !present[l2tp.Name] {
			err := client.AddL2TPClient(routeros.AddL2TPClientConfig{
				Name: l2tp.Name, ConnectTo: l2tp.ConnectTo, User: l2tp.User, Password: l2tp.Password, ProfileName: "default",
				IPsecSecret: l2tp.IPsecSecret, Comment: l2tp.Comment, UseIPsec: l2tp.IPsecSecret != "", Disabled: !l2tp.Enabled,
			})
			if err != nil {
				errs = append(errs, err)
				continue
			}
		}
		errs = append(errs, addToTunnelInterfaceLists(client, l2tp.Name)...)
	}
	return errs
}

func addToTunnelInterfaceLists(client *routeros.Client, name string) []error {
	var errs []error
	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, name)
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to check %s interface list membership of %s: %w", list, name, err))
			continue
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, name); err != nil {
			errs = append(errs, fmt.Errorf("failed to add %s to the %s interface list: %w", name, list, err))
		}
	}
	return errs
}

func restoreVPNUsers(client *routeros.Client, users []db.VPNUser) []error {
	profiles, err := client.ListPPPProfiles()
	if err != nil {
		return []error{fmt.Errorf("failed to list PPP profiles: %w", err)}
	}
	knownProfiles := make(map[string]bool, len(profiles))
	for i := range profiles {
		knownProfiles[profiles[i].Name] = true
	}

	var errs []error
	for i := range users {
		user := &users[i]
		if user.Profile == wizardVPNProfile {
			continue
		}
		profile := user.Profile
		if profile == "" {
			profile = "default"
		}
		if !knownProfiles[profile] {
			if err := client.CreateVPNProfile(profile); err != nil {
				errs = append(errs, err)
				continue
			}
			knownProfiles[profile] = true
		}
		_, err := client.CreatePppSecret(routeros.CreatePppSecretParams{
			Name: user.Username, Password: user.Password, Service: reconfigVPNUserSecret, Profile: profile,
		})
		if err != nil {
			errs = append(errs, err)
		}
	}
	return errs
}

func restoreWireGuardInterfaces(client *routeros.Client, interfaces []db.WireGuardInterface, livePorts map[string]int) []error {
	var errs []error
	for i := range interfaces {
		wg := &interfaces[i]
		if isFailoverClientName(wg.Name) {
			continue
		}

		disabled := !wg.Enabled
		config := routeros.WireGuardClientConfig{Name: wg.Name, PrivateKey: &wg.PrivateKey, Disabled: &disabled}
		port := wg.ListenPort
		if port == 0 {
			port = livePorts[wg.Name]
		}
		if port > 0 {
			config.ListenPort = &port
		}
		if wg.Comment != "" {
			config.Comment = &wg.Comment
		}
		if wg.Type == db.WireGuardTypeClient {
			vrf := reconfigTunnelVRF
			config.VRF = &vrf
		}
		created, err := client.CreateWireGuardInterface(config)
		if err != nil {
			errs = append(errs, err)
			continue
		}

		if wg.Address != "" {
			if _, err := client.AddIPAddress(routeros.IPAddressConfig{Interface: wg.Name, Address: wg.Address}); err != nil {
				errs = append(errs, fmt.Errorf("WireGuard interface %s address: %w", wg.Name, err))
			}
		}

		if wg.Type == db.WireGuardTypeClient {
			errs = append(errs, addToTunnelInterfaceLists(client, wg.Name)...)
		} else {
			errs = append(errs, restoreWireGuardServerRules(client, wg, created.ListenPort)...)
		}

		for j := range wg.Peers {
			if err := restoreWireGuardPeer(client, wg.Name, &wg.Peers[j]); err != nil {
				errs = append(errs, err)
			}
		}
	}
	return errs
}

func restoreWireGuardServerRules(client *routeros.Client, wg *db.WireGuardInterface, port int) []error {
	var errs []error
	comment := "wireguard-" + wg.Name
	dstPort := strconv.Itoa(port)

	_, err := client.AddFirewallRule(routeros.FirewallRuleConfig{
		Chain: "input", Action: "accept", Protocol: "udp", DstPort: dstPort,
		InInterfaceList: vpn.VpnServerAllowedInterfaceList, Comment: comment,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("WireGuard server %s firewall rule: %w", wg.Name, err))
	}

	replyRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		errs = append(errs, fmt.Errorf("WireGuard server %s reply routing mangle rule: %w", wg.Name, err))
	} else {
		_, err = client.AddMangleRule(routeros.MangleRuleConfig{
			Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + comment, ConnectionState: "new",
			InIfaceList: vpn.VpnServerAllowedInterfaceList, Protocol: "udp", DstPort: dstPort,
			NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("WireGuard server %s mangle rule: %w", wg.Name, err))
		}
	}

	if wg.Address != "" {
		if _, err := client.AddFirewallAddressListItem(vpn.VpnLANAddressList, wg.Address, false, "wg-server: "+wg.Name); err != nil {
			errs = append(errs, fmt.Errorf("WireGuard server %s %s entry: %w", wg.Name, vpn.VpnLANAddressList, err))
		}
	}
	return errs
}

func restoreWireGuardPeer(client *routeros.Client, interfaceName string, peer *db.WireGuardPeer) error {
	disabled := !peer.Enabled
	config := routeros.WireGuardPeerConfig{
		InterfaceName:   interfaceName,
		PeerName:        peer.Name,
		PublicKey:       &peer.PublicKey,
		EndpointAddress: peer.EndpointAddress,
		EndpointPort:    peer.EndpointPort,
		Disabled:        &disabled,
	}
	if peer.AllowedAddress != "" {
		config.AllowedAddresses = strings.Split(peer.AllowedAddress, ",")
	}
	if peer.PresharedKey != "" {
		config.PresharedKey = &peer.PresharedKey
	}
	if peer.PersistentKeepalive > 0 {
		config.PersistentKeepalive = &peer.PersistentKeepalive
	}
	if peer.Comment != "" {
		config.Comment = &peer.Comment
	}

	if _, err := client.AddWireGuardPeer(config); err != nil {
		return fmt.Errorf("WireGuard interface %s peer %s: %w", interfaceName, peer.PublicKey, err)
	}
	return nil
}
