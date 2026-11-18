package vpn

import (
	"encoding/binary"
	"fmt"
	"math"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

func startCleanupIfNeeded() {
	ovpnServerPool.cleanupStartedMu.Lock()
	defer ovpnServerPool.cleanupStartedMu.Unlock()

	if ovpnServerPool.cleanupStarted {
		return
	}
	ovpnServerPool.cleanupStarted = true
	go cleanupOvpnServerTasks()
}

func cleanupOvpnServerTasks() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		ovpnServerPool.mu.Lock()
		now := time.Now()
		for id, task := range ovpnServerPool.activeTasks {
			if task.Status == "completed" || task.Status == "error" {
				if now.Sub(task.CompletedTime) > 30*time.Minute {
					delete(ovpnServerPool.activeTasks, id)
				}
			}
		}
		ovpnServerPool.mu.Unlock()
	}
}

func startSstpCleanupIfNeeded() {
	sstpServerPool.cleanupStartedMu.Lock()
	defer sstpServerPool.cleanupStartedMu.Unlock()

	if sstpServerPool.cleanupStarted {
		return
	}
	sstpServerPool.cleanupStarted = true
	go cleanupSstpServerTasks()
}

// sstpServerTaskActive reports whether an SSTP server creation task is
// currently running. HandleDeleteSstpServer checks this before disabling so
// it can't race a concurrent HandleCreateSstpServer task: without it, a
// creation task's own SetSstpServer call could re-enable SSTP (and restore
// its firewall rule) after DELETE had already disabled it.
func sstpServerTaskActive() bool {
	sstpServerPool.mu.RLock()
	defer sstpServerPool.mu.RUnlock()

	for _, task := range sstpServerPool.activeTasks {
		task.mu.RLock()
		running := task.Status == "running"
		task.mu.RUnlock()
		if running {
			return true
		}
	}
	return false
}

func cleanupSstpServerTasks() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		sstpServerPool.mu.Lock()
		now := time.Now()
		for id, task := range sstpServerPool.activeTasks {
			if task.Status == "completed" || task.Status == "error" {
				if now.Sub(task.CompletedTime) > 30*time.Minute {
					delete(sstpServerPool.activeTasks, id)
				}
			}
		}
		sstpServerPool.mu.Unlock()
	}
}

// generateUniqueWireGuardInterfaceName generates a random two-word lowercase
// name with suffix appended (e.g. "-wg-client", "-server"), retrying against
// existing WireGuard interfaces until a non-colliding one is found or
// wireGuardNameGenerationAttempts is exhausted. A lookup failure other than
// "not found" (transport, timeout, authentication) aborts immediately rather
// than being treated as "name available".
func generateUniqueWireGuardInterfaceName(client *routeros.Client, suffix string) (string, error) {
	for i := 0; i < wireGuardNameGenerationAttempts; i++ {
		candidate := utils.GenerateName(2, "-", utils.LowerCase) + suffix
		exists, err := wireGuardInterfaceExists(client, candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("failed to generate a unique WireGuard interface name after %d attempts", wireGuardNameGenerationAttempts)
}

// isWireGuardNotFound reports whether err is the "no results found" signal
// GetWireGuard returns when no interface matches, as opposed to a transport,
// timeout, or authentication failure.
func isWireGuardNotFound(err error) bool {
	return err != nil && strings.Contains(err.Error(), "no results found")
}

// wireGuardInterfaceExists reports whether a WireGuard interface named name
// already exists. A non-nil error means the lookup itself failed and
// existence could not be determined.
func wireGuardInterfaceExists(client *routeros.Client, name string) (bool, error) {
	_, err := client.GetWireGuard(name)
	if err == nil {
		return true, nil
	}
	if isWireGuardNotFound(err) {
		return false, nil
	}
	return false, err
}

// wireGuardUsedClientAddresses collects every client address already in use
// across peers, as plain IPs (no CIDR suffix), so nextWireGuardClientAddress
// can avoid reassigning one. A peer's ClientAddress may itself hold more than
// one comma-separated value; each is split, trimmed, and reserved on its own,
// with empty entries ignored.
func wireGuardUsedClientAddresses(peers []routeros.WireGuardPeerInfo) map[string]struct{} {
	used := make(map[string]struct{}, len(peers))
	for i := range peers {
		for _, addr := range strings.Split(peers[i].ClientAddress, ",") {
			addr = strings.TrimSpace(addr)
			if addr == "" {
				continue
			}
			if parsedIP, _, err := net.ParseCIDR(addr); err == nil {
				addr = parsedIP.String()
			}
			used[addr] = struct{}{}
		}
	}
	return used
}

// wireGuardHasRecentHandshake reports whether any of the given peers has had
// a handshake within wireGuardRecentHandshakeThreshold, which is treated as
// evidence the WireGuard interface is actively running.
func wireGuardHasRecentHandshake(peers []routeros.WireGuardPeerInfo) bool {
	for i := range peers {
		if peers[i].Disabled {
			continue
		}
		if peers[i].LastHandshake == "" {
			continue
		}
		age := time.Duration(utils.RouterOSDurationSeconds(peers[i].LastHandshake)) * time.Second
		if age <= wireGuardRecentHandshakeThreshold {
			return true
		}
	}
	return false
}

// lockWireGuardInterfacePeers acquires the per-interface lock for
// interfaceName and returns a func that releases it.
func lockWireGuardInterfacePeers(interfaceName string) func() {
	lockAny, _ := wireGuardPeerCreationLocks.LoadOrStore(interfaceName, &sync.Mutex{})
	lock, ok := lockAny.(*sync.Mutex)
	if !ok {
		lock = &sync.Mutex{}
	}
	lock.Lock()
	return lock.Unlock
}

// nextWireGuardClientAddress returns the first unused IPv4 address after the
// WireGuard interface's own address (given as a CIDR, e.g. "10.0.0.1/24"),
// staying within that address's subnet. Used holds the addresses already
// assigned to existing peers (as plain IPs, no CIDR suffix); walking the
// range and skipping those already in use, rather than deriving an address
// solely from the peer count, keeps addresses correct even after peers in
// the middle of the range have been deleted. If used is empty, the result is
// simply the interface's own address + 1. Returns an error once the
// subnet's usable range (up to, but excluding, its broadcast address) is
// exhausted.
func nextWireGuardClientAddress(interfaceCIDR string, used map[string]struct{}) (string, error) {
	ip, ipNet, err := net.ParseCIDR(interfaceCIDR)
	if err != nil {
		return "", fmt.Errorf("invalid interface address %q: %w", interfaceCIDR, err)
	}
	ip4 := ip.To4()
	if ip4 == nil {
		return "", fmt.Errorf("interface address %q is not an IPv4 address", interfaceCIDR)
	}

	ones, _ := ipNet.Mask.Size() // guaranteed 0-32 by net.ParseCIDR
	networkAddr := binary.BigEndian.Uint32(ipNet.IP.To4())
	broadcastAddr := networkAddr | (^uint32(0) >> uint(ones)) //nolint:gosec // G115: ones is 0-32, guaranteed by net.ParseCIDR
	base := uint64(binary.BigEndian.Uint32(ip4))

	// Arithmetic is done in a wider type so a large offset can't silently
	// wrap uint32 and land back inside the subnet's valid range.
	for offset := uint64(1); ; offset++ {
		candidate64 := base + offset
		if candidate64 > uint64(math.MaxUint32) || candidate64 >= uint64(broadcastAddr) {
			return "", fmt.Errorf("no available client IP addresses left in the %s subnet", interfaceCIDR)
		}

		clientIP := make(net.IP, 4)
		binary.BigEndian.PutUint32(clientIP, uint32(candidate64))
		candidateAddr := clientIP.String()
		if _, taken := used[candidateAddr]; !taken {
			return candidateAddr, nil
		}
	}
}

// LaunchOpenVpnServerCreation launches an async OpenVPN server creation task and returns the task ID.
// This is used internally by handlers to create OpenVPN servers asynchronously.
func LaunchOpenVpnServerCreation(client *routeros.Client, req CreateOvpnServerRequest) string {
	startCleanupIfNeeded()

	taskID := fmt.Sprintf("%d", time.Now().Unix())
	task := &OvpnServerTask{
		ID:        taskID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
	}

	ovpnServerPool.mu.Lock()
	ovpnServerPool.activeTasks[taskID] = task
	ovpnServerPool.mu.Unlock()

	go processOvpnServerTask(client, task, req)

	return taskID
}

func processOvpnServerTask(client *routeros.Client, task *OvpnServerTask, req CreateOvpnServerRequest) {
	defer func() {
		if r := recover(); r != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Panic: %v", r)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
		}
	}()

	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	updateTask := func(progress int, step string) {
		task.mu.Lock()
		task.Progress = progress
		task.CurrentStep = step
		task.mu.Unlock()
	}

	rollback := func(serverBaseName, poolName, profileName string, certs []string) {
		if serverBaseName != "" {
			// Both protocol variants may exist by the time a later stage
			// fails; removing a variant that was never created is a no-op.
			_ = client.RemoveOvpnServer(serverBaseName + "-tcp")
			_ = client.RemoveOvpnServer(serverBaseName + "-udp")

			if rules, err := client.GetFirewallRulesByChain("input"); err == nil {
				for i := range rules {
					if strings.HasPrefix(rules[i].Comment, serverBaseName) {
						_ = client.RemoveFirewallRule(rules[i].ID)
					}
				}
			}

			_, _ = removeVpnServerMangleRules(client, serverBaseName, false)
		}
		if profileName != "" {
			secrets, err := client.GetPppSecretsByProfile(profileName)
			if err == nil {
				for _, secret := range secrets {
					if username, ok := secret["name"]; ok {
						_ = client.RemovePppSecret(username, "ovpn")
					}
				}
			}
			if profileName != "default" {
				_ = client.RemovePppProfile(profileName)
			}
		}
		if poolName != "" {
			_ = client.RemoveIPPool(poolName)
		}
		for _, certName := range certs {
			_ = client.RemoveCertificate(certName)
			_ = client.RemoveCertificateFiles(certName)
		}
	}

	setError := func(errMsg string, serverConfigName, profileName string, certs []string) {
		rollback(serverConfigName, "", profileName, certs)
		task.mu.Lock()
		task.Status = "error"
		task.Error = errMsg
		task.Progress = 0
		task.CompletedTime = time.Now()
		task.mu.Unlock()
	}

	caName := "ovpn-ca-" + timestamp
	serverName := "ovpn-server-" + timestamp
	clientName := "ovpn-client-" + timestamp

	updateTask(5, "Creating CA certificate")
	caCertParams := routeros.AddCertificateParams{
		Name:       caName,
		CommonName: caName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err := client.AddCertificate(caCertParams)
	if err != nil {
		setError("Failed to create CA certificate: "+err.Error(), "", "", []string{})
		return
	}

	updateTask(10, "Setting CA certificate key usage")
	if err := client.SetCertificateKeyUsage(caName, []string{
		routeros.KeyUsageKeyCertSign,
		routeros.KeyUsageCRLSign,
	}); err != nil {
		setError("Failed to set CA certificate key usage: "+err.Error(), "", "", []string{caName})
		return
	}

	updateTask(15, "Signing CA certificate")
	if err := client.SignCertificate(caName); err != nil {
		setError("Failed to sign CA certificate: "+err.Error(), "", "", []string{caName})
		return
	}

	updateTask(20, "Creating Server certificate")
	serverCertParams := routeros.AddCertificateParams{
		Name:       serverName,
		CommonName: serverName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err = client.AddCertificate(serverCertParams)
	if err != nil {
		setError("Failed to create Server certificate: "+err.Error(), "", "", []string{caName})
		return
	}

	updateTask(25, "Setting Server certificate key usage")
	if err := client.SetCertificateKeyUsage(serverName, []string{
		routeros.KeyUsageDigitalSignature,
		routeros.KeyUsageKeyEncipherment,
		routeros.KeyUsageTLSServer,
	}); err != nil {
		setError("Failed to set Server certificate key usage: "+err.Error(), "", "", []string{caName, serverName})
		return
	}

	updateTask(30, "Signing Server certificate")
	if err := client.SignCertificate(serverName, caName); err != nil {
		setError("Failed to sign Server certificate: "+err.Error(), "", "", []string{caName, serverName})
		return
	}

	updateTask(35, "Creating Client certificate")
	clientCertParams := routeros.AddCertificateParams{
		Name:       clientName,
		CommonName: clientName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err = client.AddCertificate(clientCertParams)
	if err != nil {
		setError("Failed to create Client certificate: "+err.Error(), "", "", []string{caName, serverName})
		return
	}

	updateTask(40, "Setting Client certificate key usage")
	if err := client.SetCertificateKeyUsage(clientName, []string{
		routeros.KeyUsageTLSClient,
	}); err != nil {
		setError("Failed to set Client certificate key usage: "+err.Error(), "", "", []string{caName, serverName, clientName})
		return
	}

	updateTask(45, "Signing Client certificate")
	if err := client.SignCertificate(clientName, caName); err != nil {
		setError("Failed to sign Client certificate: "+err.Error(), "", "", []string{caName, serverName, clientName})
		return
	}

	updateTask(50, "Exporting certificates")
	if err := client.ExportCertificate(caName, ""); err != nil {
		setError("Failed to export CA certificate: "+err.Error(), "", "", []string{caName, serverName, clientName})
		return
	}

	if err := client.ExportCertificate(serverName, req.ClientCertificatePassword); err != nil {
		setError("Failed to export Server certificate: "+err.Error(), "", "", []string{caName, serverName, clientName})
		return
	}

	if err := client.ExportCertificate(clientName, req.ClientCertificatePassword); err != nil {
		setError("Failed to export Client certificate: "+err.Error(), "", "", []string{caName, serverName, clientName})
		return
	}

	clientCertPasswordFile := routeros.NasnetCertificatePath(clientName + "-password.txt")
	if err := client.AddFile(clientCertPasswordFile, req.ClientCertificatePassword); err != nil {
		setError("Failed to save client certificate password: "+err.Error(), "", "", []string{caName, serverName, clientName})
		return
	}

	updateTask(75, "Creating PPP secrets")
	serverConfigName := "ovpn-server-" + timestamp
	defaultProfile := "VPN-VPN"
	createdUsers := make([]map[string]string, 0)
	for _, user := range req.Users {
		_, err = client.AddVpnSecret(user.Username, user.Password, defaultProfile, "any")
		if err != nil {
			setError("Failed to create PPP secret for user '"+user.Username+"': "+err.Error(), "", defaultProfile, []string{caName, serverName, clientName})
			return
		}
		createdUsers = append(createdUsers, map[string]string{
			"username": user.Username,
			"service":  "ovpn",
		})
	}

	updateTask(85, "Creating OpenVPN servers")
	tcpPort, err := client.FindNextAvailableOvpnPort(1194, "tcp")
	if err != nil {
		setError("Failed to find available TCP port: "+err.Error(), "", defaultProfile, []string{caName, serverName, clientName})
		return
	}

	udpPort, err := client.FindNextAvailableOvpnPort(1194, "udp")
	if err != nil {
		setError("Failed to find available UDP port: "+err.Error(), "", defaultProfile, []string{caName, serverName, clientName})
		return
	}

	ovpnServerComment := "Client Certificate Password: " + req.ClientCertificatePassword

	serverConfigNameTCP := serverConfigName + "-tcp"
	_, err = client.AddOvpnServer(routeros.AddOvpnServerConfig{
		Name:              serverConfigNameTCP,
		Port:              tcpPort,
		Mode:              "ip",
		Protocol:          "tcp",
		Certificate:       serverName,
		RequireClientCert: true,
		Auth:              "sha256",
		Cipher:            "aes256-cbc",
		DefaultProfile:    "default",
		RedirectGateway:   "def1",
		Comment:           ovpnServerComment,
	})
	if err != nil {
		setError("Failed to create OpenVPN TCP server: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	serverConfigNameUDP := serverConfigName + "-udp"
	_, err = client.AddOvpnServer(routeros.AddOvpnServerConfig{
		Name:              serverConfigNameUDP,
		Port:              udpPort,
		Mode:              "ip",
		Protocol:          "udp",
		Certificate:       serverName,
		RequireClientCert: true,
		Auth:              "sha256",
		Cipher:            "aes256-cbc",
		DefaultProfile:    "default",
		RedirectGateway:   "def1",
		Comment:           ovpnServerComment,
	})
	if err != nil {
		setError("Failed to create OpenVPN UDP server: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	updateTask(90, "Adding firewall rules")
	// Add firewall filter rule for TCP port
	tcpFwRuleConfig := routeros.FirewallRuleConfig{
		Chain:    "input",
		Action:   "accept",
		Protocol: "tcp",
		DstPort:  fmt.Sprintf("%d", tcpPort),
		Comment:  serverConfigNameTCP,
	}
	_, err = client.AddFirewallRule(tcpFwRuleConfig)
	if err != nil {
		setError("Failed to add firewall rule for OpenVPN TCP: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	// Add firewall filter rule for UDP port
	udpFwRuleConfig := routeros.FirewallRuleConfig{
		Chain:    "input",
		Action:   "accept",
		Protocol: "udp",
		DstPort:  fmt.Sprintf("%d", udpPort),
		Comment:  serverConfigNameUDP,
	}
	_, err = client.AddFirewallRule(udpFwRuleConfig)
	if err != nil {
		setError("Failed to add firewall rule for OpenVPN UDP: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	replyRoutingRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		setError("Failed to find reply routing mangle rule: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	tcpMangleRuleConfig := routeros.MangleRuleConfig{
		Chain:             "input",
		Action:            "mark-connection",
		Comment:           "Mark Inbound " + serverConfigNameTCP,
		ConnectionState:   "new",
		InIfaceList:       "Domestic-WAN",
		Protocol:          "tcp",
		DstPort:           fmt.Sprintf("%d", tcpPort),
		NewConnectionMark: "conn-vpn-server",
		PassThrough:       true,
		PlaceBefore:       replyRoutingRuleID,
	}
	if _, err := client.AddMangleRule(tcpMangleRuleConfig); err != nil {
		setError("Failed to add mangle rule for OpenVPN TCP: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	udpMangleRuleConfig := routeros.MangleRuleConfig{
		Chain:             "input",
		Action:            "mark-connection",
		Comment:           "Mark Inbound " + serverConfigNameUDP,
		ConnectionState:   "new",
		InIfaceList:       "Domestic-WAN",
		Protocol:          "udp",
		DstPort:           fmt.Sprintf("%d", udpPort),
		NewConnectionMark: "conn-vpn-server",
		PassThrough:       true,
		PlaceBefore:       replyRoutingRuleID,
	}
	if _, err := client.AddMangleRule(udpMangleRuleConfig); err != nil {
		setError("Failed to add mangle rule for OpenVPN UDP: "+err.Error(), serverConfigName, defaultProfile, []string{caName, serverName, clientName})
		return
	}

	updateTask(100, "Completed")

	certificateTimestamp, _ := strconv.ParseInt(timestamp, 10, 64)
	createdServers := []db.OvpnServer{
		{Name: serverConfigNameTCP, CertificateTimestamp: certificateTimestamp, Protocol: "tcp", Port: tcpPort, ClientCertificatePassword: req.ClientCertificatePassword, Enabled: true},
		{Name: serverConfigNameUDP, CertificateTimestamp: certificateTimestamp, Protocol: "udp", Port: udpPort, ClientCertificatePassword: req.ClientCertificatePassword, Enabled: true},
	}
	createdVPNUsers := make([]db.VPNUser, 0, len(req.Users))
	for i := range req.Users {
		createdVPNUsers = append(createdVPNUsers, db.VPNUser{Username: req.Users[i].Username, Password: req.Users[i].Password, Profile: defaultProfile})
	}
	persistCreatedOvpnServers(client, createdServers, createdVPNUsers)

	task.mu.Lock()
	task.Status = "completed"
	task.CompletedTime = time.Now()
	task.Result = map[string]interface{}{
		"certificates": map[string]string{
			"ca":     caName,
			"server": serverName,
			"client": clientName,
		},
		"clientCertificatePasswordFile": clientCertPasswordFile,
		"timestamp":                     timestamp,
		"secrets":                       createdUsers,
		"servers": []map[string]interface{}{
			{
				"name":                     serverConfigNameTCP,
				"port":                     tcpPort,
				"mode":                     "ip",
				"protocol":                 "tcp",
				"certificate":              serverName,
				"requireClientCertificate": true,
				"auth":                     "sha256",
				"cipher":                   "aes256-cbc",
			},
			{
				"name":                     serverConfigNameUDP,
				"port":                     udpPort,
				"mode":                     "ip",
				"protocol":                 "udp",
				"certificate":              serverName,
				"requireClientCertificate": true,
				"auth":                     "sha256",
				"cipher":                   "aes256-cbc",
			},
		},
	}
	task.mu.Unlock()
}

// LaunchSstpServerCreation launches an async SSTP server configuration task and
// returns the task ID. This is used internally by handlers to configure the
// SSTP server asynchronously.
func LaunchSstpServerCreation(client *routeros.Client) string {
	startSstpCleanupIfNeeded()

	taskID := fmt.Sprintf("%d", time.Now().Unix())
	task := &SstpServerTask{
		ID:        taskID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
	}

	sstpServerPool.mu.Lock()
	sstpServerPool.activeTasks[taskID] = task
	sstpServerPool.mu.Unlock()

	go processSstpServerTask(client, task)

	return taskID
}

func processSstpServerTask(client *routeros.Client, task *SstpServerTask) {
	defer func() {
		if r := recover(); r != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Panic: %v", r)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
		}
	}()

	updateTask := func(progress int, step string) {
		task.mu.Lock()
		task.Progress = progress
		task.CurrentStep = step
		task.mu.Unlock()
	}

	setError := func(errMsg string, certs []string) {
		for _, certName := range certs {
			_ = client.RemoveCertificate(certName)
		}
		task.mu.Lock()
		task.Status = "error"
		task.Error = errMsg
		task.Progress = 0
		task.CompletedTime = time.Now()
		task.mu.Unlock()
	}

	updateTask(5, "Checking for an existing SSTP server certificate")
	existingCert, err := findExistingSstpServerCertificate(client)
	if err != nil {
		setError("Failed to check existing certificates: "+err.Error(), []string{})
		return
	}

	var caName, serverName, serverCertificatePassword string
	if existingCert != "" {
		serverName = existingCert
		updateTask(60, "Reusing existing SSTP server certificate")
	} else {
		timestamp := fmt.Sprintf("%d", time.Now().Unix())
		caName = "sstp-ca-" + timestamp
		serverName = "sstp-server-" + timestamp
		serverCertificatePassword = utils.RandString(24)

		updateTask(10, "Creating CA certificate")
		caCertParams := routeros.AddCertificateParams{
			Name:       caName,
			CommonName: caName,
			KeySize:    2048,
			DaysValid:  3650,
		}
		if _, err := client.AddCertificate(caCertParams); err != nil {
			setError("Failed to create CA certificate: "+err.Error(), []string{})
			return
		}

		updateTask(20, "Setting CA certificate key usage")
		if err := client.SetCertificateKeyUsage(caName, []string{
			routeros.KeyUsageKeyCertSign,
			routeros.KeyUsageCRLSign,
		}); err != nil {
			setError("Failed to set CA certificate key usage: "+err.Error(), []string{caName})
			return
		}

		updateTask(30, "Signing CA certificate")
		if err := client.SignCertificate(caName); err != nil {
			setError("Failed to sign CA certificate: "+err.Error(), []string{caName})
			return
		}

		updateTask(40, "Creating Server certificate")
		serverCertParams := routeros.AddCertificateParams{
			Name:       serverName,
			CommonName: serverName,
			KeySize:    2048,
			DaysValid:  3650,
		}
		if _, err := client.AddCertificate(serverCertParams); err != nil {
			setError("Failed to create Server certificate: "+err.Error(), []string{caName})
			return
		}

		updateTask(50, "Setting Server certificate key usage")
		if err := client.SetCertificateKeyUsage(serverName, []string{
			routeros.KeyUsageDigitalSignature,
			routeros.KeyUsageKeyEncipherment,
			routeros.KeyUsageTLSServer,
		}); err != nil {
			setError("Failed to set Server certificate key usage: "+err.Error(), []string{caName, serverName})
			return
		}

		updateTask(60, "Signing Server certificate")
		if err := client.SignCertificate(serverName, caName); err != nil {
			setError("Failed to sign Server certificate: "+err.Error(), []string{caName, serverName})
			return
		}

		updateTask(65, "Exporting certificates")
		if err := client.ExportCertificate(caName, ""); err != nil {
			setError("Failed to export CA certificate: "+err.Error(), []string{caName, serverName})
			return
		}
		if err := client.ExportCertificate(serverName, serverCertificatePassword); err != nil {
			setError("Failed to export Server certificate: "+err.Error(), []string{caName, serverName})
			return
		}
	}

	// Only clean up certificates this run created itself; a reused
	// existing certificate predates this task and must not be deleted.
	createdCerts := []string{}
	if existingCert == "" {
		createdCerts = []string{caName, serverName}
	}

	updateTask(75, "Enabling SSTP server")
	sstpConfig := routeros.SstpServerConfig{
		Enabled:                 true,
		Port:                    4433,
		DefaultProfile:          "default",
		Authentication:          "pap,chap,mschap1,mschap2",
		Certificate:             serverName,
		VerifyClientCertificate: false,
		Ciphers:                 "aes256-sha,aes256-gcm-sha384",
	}
	if err := client.SetSstpServer(sstpConfig); err != nil {
		setError("Failed to enable SSTP server: "+err.Error(), createdCerts)
		return
	}

	updateTask(90, "Adding firewall rule")
	fwRuleConfig := routeros.FirewallRuleConfig{
		Chain:           "input",
		Action:          "accept",
		Protocol:        "tcp",
		DstPort:         fmt.Sprintf("%d", sstpConfig.Port),
		InInterfaceList: VpnServerAllowedInterfaceList,
		Comment:         serverName,
	}
	fwRuleID, err := client.AddFirewallRule(fwRuleConfig)
	if err != nil {
		setError("Failed to add firewall rule for SSTP: "+err.Error(), createdCerts)
		return
	}

	replyRoutingRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		_ = client.RemoveFirewallRule(fwRuleID)
		_ = client.DisableSstpServer(false)
		setError("Failed to find reply routing mangle rule: "+err.Error(), createdCerts)
		return
	}

	mangleRuleConfig := routeros.MangleRuleConfig{
		Chain:             "input",
		Action:            "mark-connection",
		Comment:           "Mark Inbound " + fwRuleConfig.Comment,
		ConnectionState:   "new",
		InIfaceList:       VpnServerAllowedInterfaceList,
		Protocol:          "tcp",
		DstPort:           fmt.Sprintf("%d", sstpConfig.Port),
		NewConnectionMark: "conn-vpn-server",
		PassThrough:       true,
		PlaceBefore:       replyRoutingRuleID,
	}
	if _, err := client.AddMangleRule(mangleRuleConfig); err != nil {
		_ = client.RemoveFirewallRule(fwRuleID)
		_ = client.DisableSstpServer(false)
		setError("Failed to add mangle rule for SSTP: "+err.Error(), createdCerts)
		return
	}

	updateTask(100, "Completed")

	persistCreatedSstpServer(client, &sstpConfig, serverCertificatePassword)

	task.mu.Lock()
	task.Status = "completed"
	task.CompletedTime = time.Now()
	task.Result = map[string]interface{}{
		"enabled": true,
		"certificates": map[string]string{
			"ca":     caName,
			"server": serverName,
		},
		"reusedExistingCertificate": existingCert != "",
		"port":                      sstpConfig.Port,
		"profile":                   sstpConfig.DefaultProfile,
		"authentication":            sstpConfig.Authentication,
		"verifyClientCertificate":   sstpConfig.VerifyClientCertificate,
		"ciphers":                   sstpConfig.Ciphers,
	}
	task.mu.Unlock()
}

// findExistingSstpServerCertificate returns the name of the first certificate
// whose name starts with "sstp-server-" (left over from an earlier SSTP
// server enable), or "" if none exists.
func findExistingSstpServerCertificate(client *routeros.Client) (string, error) {
	certs, err := client.ListCertificates()
	if err != nil {
		return "", err
	}
	for i := range certs {
		if strings.HasPrefix(certs[i].Name, "sstp-server-") {
			return certs[i].Name, nil
		}
	}
	return "", nil
}

// sstpCACertificateName derives the CA certificate name paired with an SSTP
// server certificate at creation time (see processSstpServerTask), e.g.
// "sstp-server-1700000000" -> "sstp-ca-1700000000". Returns "" if
// serverCertName doesn't match the expected "sstp-server-<timestamp>" naming.
func sstpCACertificateName(serverCertName string) string {
	timestamp, ok := strings.CutPrefix(serverCertName, "sstp-server-")
	if !ok {
		return ""
	}
	if _, err := strconv.Atoi(timestamp); err != nil {
		return ""
	}
	return "sstp-ca-" + timestamp
}

// removeVpnServerFirewallRules removes every /ip/firewall/filter input-chain
// rule whose comment starts with prefix (e.g. "sstp-", "l2tp-"), and returns
// the comment of each rule removed.
func removeVpnServerFirewallRules(client *routeros.Client, prefix string) ([]string, error) {
	rules, err := client.GetFirewallRulesByChain("input")
	if err != nil {
		return nil, err
	}

	removed := make([]string, 0)
	for i := range rules {
		if !strings.HasPrefix(rules[i].Comment, prefix) {
			continue
		}
		if err := client.RemoveFirewallRule(rules[i].ID); err != nil {
			return removed, err
		}
		removed = append(removed, rules[i].Comment)
	}
	return removed, nil
}

// removeVpnServerMangleRules removes mangle rules created for a VPN server,
// matched against "Mark Inbound "+serverName. When exact is true, only a rule
// whose comment equals that string is removed (for a single, specific
// server); when exact is false, any rule whose comment has it as a prefix is
// removed (for intentionally matching multiple related rules, e.g. a
// server's -tcp/-udp pair). Returns the removed comments.
func removeVpnServerMangleRules(client *routeros.Client, serverName string, exact bool) ([]string, error) {
	rules, err := client.ListMangleRules()
	if err != nil {
		return nil, err
	}

	target := "Mark Inbound " + serverName
	removed := make([]string, 0)
	for i := range rules {
		matches := rules[i].Comment == target
		if !exact {
			matches = strings.HasPrefix(rules[i].Comment, target)
		}
		if !matches {
			continue
		}
		if err := client.RemoveMangleRule(rules[i].ID); err != nil {
			return removed, err
		}
		removed = append(removed, rules[i].Comment)
	}
	return removed, nil
}

func toVPNUserResponse(s routeros.PPPSecret) VPNUserResponse {
	return VPNUserResponse{
		ID:            s.ID,
		Name:          s.Name,
		Service:       s.Service,
		Profile:       s.Profile,
		Password:      s.Password,
		Disabled:      s.Disabled,
		LimitBytesIn:  s.LimitBytesIn,
		LimitBytesOut: s.LimitBytesOut,
		CallerID:      s.CallerID,
		Routes:        s.Routes,
		Comment:       s.Comment,
	}
}

// ToSSTPClientResponse converts a RouterOS SSTPClientInfo to API SSTPClientResponse.
func ToSSTPClientResponse(sstp *routeros.SSTPClientInfo) SSTPClientResponse {
	return SSTPClientResponse{
		ID:                                 sstp.ID,
		Name:                               sstp.Name,
		Disabled:                           sstp.Disabled,
		Running:                            sstp.Running,
		ConnectTo:                          sstp.ConnectTo,
		Port:                               sstp.Port,
		User:                               sstp.User,
		Password:                           sstp.Password,
		Profile:                            sstp.Profile,
		KeepaliveTimeout:                   sstp.KeepaliveTimeout,
		TLSVersion:                         sstp.TLSVersion,
		VerifyServerCertificate:            sstp.VerifyServerCertificate,
		VerifyServerAddressFromCertificate: sstp.VerifyServerAddressFromCertificate,
		PFS:                                sstp.PFS,
		Ciphers:                            sstp.Ciphers,
		Authentication:                     sstp.Authentication,
		Comment:                            sstp.Comment,
		Status:                             sstp.Status,
		Uptime:                             sstp.Uptime,
		Encoding:                           sstp.Encoding,
		MTU:                                sstp.MTU,
		LocalAddress:                       sstp.LocalAddress,
		RemoteAddress:                      sstp.RemoteAddress,
	}
}

// ToWireGuardInterfaceResponse converts a RouterOS WireGuardInfo to API WireGuardInterfaceResponse.
func ToWireGuardInterfaceResponse(wg *routeros.WireGuardInfo) WireGuardInterfaceResponse {
	return WireGuardInterfaceResponse{
		ID:         wg.ID,
		Name:       wg.Name,
		Port:       wg.ListenPort,
		PrivateKey: wg.PrivateKey,
		PublicKey:  wg.PublicKey,
		Running:    wg.Running,
		Enabled:    !wg.Disabled,
	}
}

// ToWireGuardServerCreateResponse converts a RouterOS WireGuardInfo to API WireGuardServerCreateResponse.
func ToWireGuardServerCreateResponse(wg *routeros.WireGuardInfo) WireGuardServerCreateResponse {
	return WireGuardServerCreateResponse{
		ID:         wg.ID,
		Name:       wg.Name,
		MTU:        wg.MTU,
		ListenPort: wg.ListenPort,
		PublicKey:  wg.PublicKey,
		PrivateKey: wg.PrivateKey,
		Disabled:   wg.Disabled,
		Comment:    wg.Comment,
	}
}

// ToVPNClientResponse converts a RouterOS VPNClientInfo to API VPNClientResponse.
func ToVPNClientResponse(vpn *routeros.VPNClientInfo) VPNClientResponse {
	return VPNClientResponse{
		ID:           vpn.ID,
		Name:         vpn.Name,
		Type:         vpn.Type,
		Running:      vpn.Running,
		Disabled:     vpn.Disabled,
		MTU:          vpn.MTU,
		MacAddress:   vpn.MacAddress,
		RxByte:       vpn.RxByte,
		TxByte:       vpn.TxByte,
		Rx:           utils.BytesToSizeString(vpn.RxByte),
		Tx:           utils.BytesToSizeString(vpn.TxByte),
		RxPacket:     vpn.RxPacket,
		TxPacket:     vpn.TxPacket,
		LastLinkUp:   vpn.LastLinkUp,
		LastLinkDown: vpn.LastLinkDown,
		LinkDowns:    vpn.LinkDowns,
		Comment:      vpn.Comment,
		PingTime:     vpn.PingTime,
		PeerCount:    vpn.PeerCount,
	}
}

// ToVPNClientResponseList converts a list of RouterOS VPNClientInfo to API responses.
func ToVPNClientResponseList(vpns []routeros.VPNClientInfo) []VPNClientResponse {
	response := make([]VPNClientResponse, len(vpns))
	for i := range vpns {
		response[i] = ToVPNClientResponse(&vpns[i])
	}
	return response
}

// ToL2TPClientResponse converts a RouterOS L2TPClientInfo to API L2TPClientResponse.
func ToL2TPClientResponse(l2tp *routeros.L2TPClientInfo) L2TPClientResponse {
	return L2TPClientResponse{
		ID:                l2tp.ID,
		Name:              l2tp.Name,
		Disabled:          l2tp.Disabled,
		Running:           l2tp.Running,
		MaxMTU:            l2tp.MaxMTU,
		MaxMRU:            l2tp.MaxMRU,
		MRRU:              l2tp.MRRU,
		ConnectTo:         l2tp.ConnectTo,
		User:              l2tp.User,
		Password:          l2tp.Password,
		Profile:           l2tp.Profile,
		KeepaliveTimeout:  l2tp.KeepaliveTimeout,
		UsePeerDNS:        l2tp.UsePeerDNS,
		UseIPsec:          l2tp.UseIPsec,
		IPsecSecret:       l2tp.IPsecSecret,
		AllowFastPath:     l2tp.AllowFastPath,
		AddDefaultRoute:   l2tp.AddDefaultRoute,
		DialOnDemand:      l2tp.DialOnDemand,
		Allow:             l2tp.Allow,
		RandomSourcePort:  l2tp.RandomSourcePort,
		L2TPProtoVersion:  l2tp.L2TPProtoVersion,
		L2TPv3DigestHash:  l2tp.L2TPv3DigestHash,
		AddRoutes:         l2tp.AddRoutes,
		Comment:           l2tp.Comment,
		Status:            l2tp.Status,
		Uptime:            l2tp.Uptime,
		Encoding:          l2tp.Encoding,
		MTU:               l2tp.MTU,
		LocalAddress:      l2tp.LocalAddress,
		RemoteAddress:     l2tp.RemoteAddress,
		LocalIPv6Address:  l2tp.LocalIPv6Address,
		RemoteIPv6Address: l2tp.RemoteIPv6Address,
	}
}

// ToWireGuardPeerResponse converts a RouterOS WireGuardPeerInfo to API WireGuardPeerResponse.
func ToWireGuardPeerResponse(peer *routeros.WireGuardPeerInfo) WireGuardPeerResponse {
	persistentKeepalive := ""
	if strings.TrimSpace(peer.PersistentKeepalive) != "" {
		persistentKeepalive = strconv.FormatInt(utils.RouterOSDurationSeconds(peer.PersistentKeepalive), 10)
	}

	return WireGuardPeerResponse{
		ID:                     peer.ID,
		Name:                   peer.Name,
		InterfaceName:          peer.InterfaceName,
		PublicKey:              peer.PublicKey,
		PrivateKey:             peer.PrivateKey,
		EndpointAddress:        peer.EndpointAddress,
		EndpointPort:           peer.EndpointPort,
		CurrentEndpointAddress: peer.CurrentEndpointAddress,
		CurrentEndpointPort:    peer.CurrentEndpointPort,
		AllowedAddresses:       peer.AllowedAddresses,
		PreSharedKey:           peer.PreSharedKey,
		PersistentKeepalive:    persistentKeepalive,
		ClientEndpoint:         peer.ClientEndpoint,
		ClientAllowedAddress:   peer.ClientAllowedAddress,
		LastHandshake:          peer.LastHandshake,
		RxBytes:                peer.RxBytes,
		TxBytes:                peer.TxBytes,
		Rx:                     utils.BytesToSizeString(peer.RxBytes),
		Tx:                     utils.BytesToSizeString(peer.TxBytes),
		Dynamic:                peer.Dynamic,
		Disabled:               peer.Disabled,
	}
}

// ToWireGuardDetailedResponse converts a RouterOS WireGuardInfo and peers to API WireGuardDetailedResponse.
func ToWireGuardDetailedResponse(wg *routeros.WireGuardInfo, peers []routeros.WireGuardPeerInfo) WireGuardDetailedResponse {
	peerResponses := make([]WireGuardPeerResponse, len(peers))
	for i := range peers {
		peerResponses[i] = ToWireGuardPeerResponse(&peers[i])
	}

	return WireGuardDetailedResponse{
		ID:         wg.ID,
		Name:       wg.Name,
		Running:    wg.Running,
		Disabled:   wg.Disabled,
		MTU:        wg.MTU,
		MacAddress: wg.MacAddress,
		PublicKey:  wg.PublicKey,
		PrivateKey: wg.PrivateKey,
		ListenPort: wg.ListenPort,
		Comment:    wg.Comment,
		Peers:      peerResponses,
	}
}

// ToPPPActiveSessionResponse converts a RouterOS PPPActiveSessionInfo to API PPPActiveSessionResponse.
func ToPPPActiveSessionResponse(session *routeros.PPPActiveSessionInfo) PPPActiveSessionResponse {
	return PPPActiveSessionResponse{
		ID:        session.ID,
		Name:      session.Name,
		Service:   session.Service,
		Address:   session.Address,
		CallerID:  session.CallerID,
		Uptime:    session.Uptime,
		Encoding:  session.Encoding,
		SessionID: session.SessionID,
	}
}

// ToPPPActiveSessionResponseList converts a list of RouterOS PPPActiveSessionInfo to API responses.
func ToPPPActiveSessionResponseList(sessions []routeros.PPPActiveSessionInfo) []PPPActiveSessionResponse {
	response := make([]PPPActiveSessionResponse, len(sessions))
	for i := range sessions {
		response[i] = ToPPPActiveSessionResponse(&sessions[i])
	}
	return response
}

// ToActiveWireGuardPeerResponse converts a RouterOS WireGuardPeerInfo to API ActiveWireGuardPeerResponse.
func ToActiveWireGuardPeerResponse(peer *routeros.WireGuardPeerInfo) ActiveWireGuardPeerResponse {
	return ActiveWireGuardPeerResponse{
		ID:               peer.ID,
		Name:             peer.Name,
		InterfaceName:    peer.InterfaceName,
		PublicKey:        peer.PublicKey,
		AllowedAddresses: peer.AllowedAddresses,
		LastHandshake:    utils.FormatRouterOSDuration(peer.LastHandshake),
		RxBytes:          peer.RxBytes,
		TxBytes:          peer.TxBytes,
		Rx:               utils.BytesToSizeString(peer.RxBytes),
		Tx:               utils.BytesToSizeString(peer.TxBytes),
		Dynamic:          peer.Dynamic,
		Disabled:         peer.Disabled,
		ClientAddress:    peer.ClientAddress,
	}
}

// ToActiveVPNConnectionsResponse converts active PPP sessions and all
// WireGuard peers into an ActiveVPNConnectionsResponse. A WireGuard peer is
// included only if its interface name ends in "-server" (a server-side
// interface accepting incoming peers, matching the PPP side's "incoming
// connections only" semantics) and its last handshake is no older than
// activeWireGuardPeerHandshakeMaxAgeSeconds — a peer with no handshake yet,
// or whose handshake is stale, isn't actively connected right now.
func ToActiveVPNConnectionsResponse(sessions []routeros.PPPActiveSessionInfo, peers []routeros.WireGuardPeerInfo) ActiveVPNConnectionsResponse {
	activePeers := make([]ActiveWireGuardPeerResponse, 0, len(peers))
	for i := range peers {
		if !strings.HasSuffix(peers[i].InterfaceName, "-server") {
			continue
		}
		if peers[i].LastHandshake == "" {
			continue
		}
		if utils.RouterOSDurationSeconds(peers[i].LastHandshake) > activeWireGuardPeerHandshakeMaxAgeSeconds {
			continue
		}
		activePeers = append(activePeers, ToActiveWireGuardPeerResponse(&peers[i]))
	}

	return ActiveVPNConnectionsResponse{
		PPPSessions:    ToPPPActiveSessionResponseList(sessions),
		WireGuardPeers: activePeers,
	}
}
