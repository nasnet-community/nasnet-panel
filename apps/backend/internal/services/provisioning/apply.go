package provisioning

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/internal/events"
	certpkg "backend/internal/provisioning/certificate"
	domesticipspkg "backend/internal/provisioning/domesticips"
	multiwanpkg "backend/internal/provisioning/multiwan"
	networkpkg "backend/internal/provisioning/network"
	"backend/internal/provisioning/orchestrator"
	provtypes "backend/internal/provisioning/types"
	wanpkg "backend/internal/provisioning/wan"
	wifipkg "backend/internal/provisioning/wifi"
)

// ValidationIssue describes a single problem found during session validation.
type ValidationIssue struct {
	ResourceID string
	Field      string
	Message    string
	Severity   string // "error" or "warning"
}

// ValidateSession checks all resources in a draft session for configuration problems.
// Transitions the session to Validated status if no blocking errors are found.
// Returns all issues (warnings included) even on success.
func (s *Service) ValidateSession(ctx context.Context, sessionID string) ([]ValidationIssue, error) {
	session, err := s.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.Status != SessionStatusDraft {
		return nil, fmt.Errorf("session %q must be in draft status to validate (current: %s)", sessionID, session.Status)
	}

	var issues []ValidationIssue
	for _, resource := range session.Resources {
		issues = append(issues, validateResource(resource)...)
	}

	hasErrors := false
	for _, issue := range issues {
		if issue.Severity == "error" {
			hasErrors = true
			break
		}
	}
	if !hasErrors {
		s.mu.Lock()
		if sess, ok := s.sessions[sessionID]; ok {
			sess.Status = SessionStatusValidated
		}
		s.mu.Unlock()
	}

	return issues, nil
}

// validateResource performs basic structural checks on a session resource.
func validateResource(resource SessionResource) []ValidationIssue {
	var issues []ValidationIssue

	if resource.ResourceType == "" {
		issues = append(issues, ValidationIssue{
			ResourceID: resource.ID,
			Field:      "resourceType",
			Message:    "resource type must not be empty",
			Severity:   "error",
		})
	}

	if resource.Configuration == nil {
		issues = append(issues, ValidationIssue{
			ResourceID: resource.ID,
			Field:      "configuration",
			Message:    "resource configuration must not be nil",
			Severity:   "error",
		})
		return issues
	}

	// Resources with a "name" field in the config must have a non-empty value.
	requiresName := strings.HasPrefix(resource.ResourceType, "wan.link.") ||
		strings.HasPrefix(resource.ResourceType, "vpn.")
	if requiresName {
		if name, ok := resource.Configuration["name"]; !ok || name == "" {
			issues = append(issues, ValidationIssue{
				ResourceID: resource.ID,
				Field:      "name",
				Message:    "resource must have a non-empty name",
				Severity:   "error",
			})
		}
	}

	return issues
}

// ApplySession provisions all resources in a validated session via the orchestrator.
// Transitions: Validated → Applying → Applied | Failed.
// Emits ProvisioningSessionAppliedEvent on success or ProvisioningSessionFailedEvent on failure.
func (s *Service) ApplySession(ctx context.Context, sessionID string) error { //nolint:gocyclo // complex provisioning dispatch logic
	session, err := s.GetSession(ctx, sessionID)
	if err != nil {
		return err
	}
	if session.Status != SessionStatusValidated {
		return fmt.Errorf("session %q must be validated before applying (current: %s)", sessionID, session.Status)
	}

	s.mu.Lock()
	if sess, ok := s.sessions[sessionID]; ok {
		sess.Status = SessionStatusApplying
	}
	s.mu.Unlock()

	startedAt := time.Now()

	// Split resources: complex types are dispatched to typed sub-services;
	// remaining simple resources go through the flat orchestrator path.
	var simpleResources []SessionResource
	var applyErr error

	for _, resource := range session.Resources {
		var dispatchErr error
		switch {
		case strings.HasPrefix(resource.ResourceType, "wan.link."):
			dispatchErr = s.dispatchWANLink(ctx, session.RouterID, sessionID, resource)
		case resource.ResourceType == "vpn.wireguard.client":
			dispatchErr = s.dispatchVPNClient(ctx, session.RouterID, sessionID, resource)
		case strings.HasPrefix(resource.ResourceType, "vpn.") && strings.HasSuffix(resource.ResourceType, ".client"):
			dispatchErr = s.dispatchVPNClient(ctx, session.RouterID, sessionID, resource)
		case strings.HasPrefix(resource.ResourceType, "vpn.") && strings.HasSuffix(resource.ResourceType, ".server"):
			dispatchErr = s.dispatchVPNServer(ctx, session.RouterID, sessionID, resource)
		case strings.HasPrefix(resource.ResourceType, "wan.multilink."):
			dispatchErr = s.dispatchMultiWAN(ctx, session.RouterID, sessionID, resource, session)
		case resource.ResourceType == "system.baseconfig":
			dispatchErr = s.dispatchBaseConfig(ctx, sessionID)
		case resource.ResourceType == "system.security":
			dispatchErr = s.dispatchSecurity(ctx, sessionID)
		case resource.ResourceType == "system.certificate":
			dispatchErr = s.dispatchCertificate(ctx, session.RouterID, sessionID, resource)
		case resource.ResourceType == "system.domesticips":
			dispatchErr = s.dispatchDomesticIPs(ctx, sessionID, resource)
		case strings.HasPrefix(resource.ResourceType, "system.wireless."):
			dispatchErr = s.dispatchWifi(ctx, session.RouterID, sessionID, resource)
		case strings.HasPrefix(resource.ResourceType, "lan.network."):
			dispatchErr = s.dispatchNetwork(ctx, session.RouterID, sessionID, resource)
		default:
			simpleResources = append(simpleResources, resource)
		}
		if dispatchErr != nil {
			applyErr = dispatchErr
			break
		}
	}

	// Provision remaining simple resources via the flat orchestrator.
	if applyErr == nil && len(simpleResources) > 0 {
		provResources := sessionResourcesToProvisioningResources(simpleResources)
		_, applyErr = s.orchestrator.Provision(ctx, session.RouterID, sessionID, provResources)
	}

	durationMs := int(time.Since(startedAt).Milliseconds())

	if applyErr != nil {
		s.mu.Lock()
		if sess, ok := s.sessions[sessionID]; ok {
			sess.Status = SessionStatusFailed
			sess.ErrorMessage = applyErr.Error()
		}
		s.mu.Unlock()

		_ = s.publisher.Publish(ctx, events.NewProvisioningSessionFailedEvent( //nolint:errcheck // type assertion with zero-value fallback // fire-and-forget event
			sessionID, session.RouterID, "apply", applyErr.Error(), false, "provisioning-service",
		))
		return fmt.Errorf("applying session %q: %w", sessionID, applyErr)
	}

	resourceIDs := make([]string, 0, len(session.Resources))
	for _, r := range session.Resources {
		resourceIDs = append(resourceIDs, r.ID)
	}

	s.mu.Lock()
	if sess, ok := s.sessions[sessionID]; ok {
		sess.Status = SessionStatusApplied
	}
	s.mu.Unlock()

	_ = s.publisher.Publish(ctx, events.NewProvisioningSessionAppliedEvent( //nolint:errcheck // type assertion with zero-value fallback // fire-and-forget event
		sessionID, session.RouterID, len(resourceIDs), resourceIDs, durationMs, "provisioning-service",
	))
	return nil
}

// dispatchWANLink routes a WAN link resource to the WAN sub-service.
// Type-asserts the stored typed configs back from the in-memory session Configuration map.
func (s *Service) dispatchWANLink(ctx context.Context, routerID, sessionID string, resource SessionResource) error {
	s.logger.Infow("dispatching WAN link resource", "resourceType", resource.ResourceType, "sessionID", sessionID, "routerID", routerID)
	if s.wanSvc == nil {
		s.logger.Warnw("WAN service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	linkConfig := rebuildWANLinkConfig(resource.Configuration)
	networkType := strings.TrimPrefix(resource.ResourceType, "wan.link.")

	_, err := s.wanSvc.ProvisionWANLink(ctx, routerID, sessionID, linkConfig, networkType)
	if err != nil {
		return fmt.Errorf("WAN link provisioning failed for %s: %w", linkConfig.Name, err)
	}
	return nil
}

// dispatchVPNClient routes a VPN client resource to the protocol-specific VPN client provisioner.
// The full typed config struct is stored under the "config" key during decompose.
func (s *Service) dispatchVPNClient(ctx context.Context, routerID, sessionID string, resource SessionResource) error { //nolint:gocyclo // multiple VPN protocol cases
	s.logger.Infow("dispatching VPN client resource", "resourceType", resource.ResourceType, "sessionID", sessionID, "routerID", routerID)
	if s.vpnClientSvc == nil {
		s.logger.Warnw("VPN client service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	protocol := extractVPNProtocol(resource.ResourceType)
	cfgRaw := resource.Configuration["config"]

	switch protocol {
	case "wireguard":
		cfg, ok := cfgRaw.(provtypes.WireguardClientConfig)
		if !ok {
			return fmt.Errorf("invalid wireguard client config type assertion")
		}
		_, err := s.vpnClientSvc.ProvisionWireGuard(ctx, routerID, sessionID, cfg)
		if err != nil {
			return fmt.Errorf("wireguard client provisioning failed: %w", err)
		}
	case "openvpn":
		cfg, ok := cfgRaw.(provtypes.OpenVpnClientConfig)
		if !ok {
			return fmt.Errorf("invalid openvpn client config type assertion")
		}
		_, err := s.vpnClientSvc.ProvisionOpenVPN(ctx, routerID, sessionID, cfg)
		if err != nil {
			return fmt.Errorf("openvpn client provisioning failed: %w", err)
		}
	case "pptp":
		cfg, ok := cfgRaw.(provtypes.PptpClientConfig)
		if !ok {
			return fmt.Errorf("invalid pptp client config type assertion")
		}
		_, err := s.vpnClientSvc.ProvisionPPTP(ctx, routerID, sessionID, cfg)
		if err != nil {
			return fmt.Errorf("pptp client provisioning failed: %w", err)
		}
	case "l2tp":
		cfg, ok := cfgRaw.(provtypes.L2tpClientConfig)
		if !ok {
			return fmt.Errorf("invalid l2tp client config type assertion")
		}
		_, err := s.vpnClientSvc.ProvisionL2TP(ctx, routerID, sessionID, cfg)
		if err != nil {
			return fmt.Errorf("l2tp client provisioning failed: %w", err)
		}
	case "sstp":
		cfg, ok := cfgRaw.(provtypes.SstpClientConfig)
		if !ok {
			return fmt.Errorf("invalid sstp client config type assertion")
		}
		_, err := s.vpnClientSvc.ProvisionSSTP(ctx, routerID, sessionID, cfg)
		if err != nil {
			return fmt.Errorf("sstp client provisioning failed: %w", err)
		}
	case "ikev2":
		cfg, ok := cfgRaw.(provtypes.Ike2ClientConfig)
		if !ok {
			return fmt.Errorf("invalid ikev2 client config type assertion")
		}
		_, err := s.vpnClientSvc.ProvisionIKEv2(ctx, routerID, sessionID, cfg)
		if err != nil {
			return fmt.Errorf("ikev2 client provisioning failed: %w", err)
		}
	default:
		return fmt.Errorf("unsupported VPN client protocol: %s", protocol)
	}
	return nil
}

// dispatchVPNServer routes a VPN server resource to the protocol-specific VPN server provisioner.
// Typed configs are stored during decompose: WireGuard uses "interface"/"peers"/"name",
// PPP-based servers use "server"/"users", others use "server" alone.
func (s *Service) dispatchVPNServer(ctx context.Context, routerID, sessionID string, resource SessionResource) error { //nolint:gocyclo // multiple VPN server protocol cases
	s.logger.Infow("dispatching VPN server resource", "resourceType", resource.ResourceType, "sessionID", sessionID, "routerID", routerID)
	if s.vpnServerSvc == nil {
		s.logger.Warnw("VPN server service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	protocol := extractVPNProtocol(resource.ResourceType)
	cfg := resource.Configuration

	switch protocol {
	case "wireguard":
		name, _ := cfg["name"].(string)                                   //nolint:errcheck // type assertion with zero-value fallback
		iface, _ := cfg["interface"].(provtypes.WireguardInterfaceConfig) //nolint:errcheck // type assertion with zero-value fallback
		peers, _ := cfg["peers"].([]provtypes.WireguardPeerConfig)        //nolint:errcheck // type assertion with zero-value fallback
		wgCfg := provtypes.WireguardServerConfig{
			Name:      name,
			Interface: iface,
			Peers:     peers,
		}
		_, err := s.vpnServerSvc.ProvisionWireGuardServer(ctx, routerID, sessionID, wgCfg)
		if err != nil {
			return fmt.Errorf("wireguard server provisioning failed: %w", err)
		}
	case "pptp":
		server, _ := cfg["server"].(*provtypes.PptpServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		users, _ := cfg["users"].([]provtypes.VSCredentials)     //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing PPTP server config")
		}
		_, err := s.vpnServerSvc.ProvisionPPTPServer(ctx, routerID, sessionID, *server, users)
		if err != nil {
			return fmt.Errorf("pptp server provisioning failed: %w", err)
		}
	case "l2tp":
		server, _ := cfg["server"].(*provtypes.L2tpServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		users, _ := cfg["users"].([]provtypes.VSCredentials)     //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing L2TP server config")
		}
		_, err := s.vpnServerSvc.ProvisionL2TPServer(ctx, routerID, sessionID, *server, users)
		if err != nil {
			return fmt.Errorf("l2tp server provisioning failed: %w", err)
		}
	case "sstp":
		server, _ := cfg["server"].(*provtypes.SstpServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		users, _ := cfg["users"].([]provtypes.VSCredentials)     //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing SSTP server config")
		}
		_, err := s.vpnServerSvc.ProvisionSSTServer(ctx, routerID, sessionID, *server, users)
		if err != nil {
			return fmt.Errorf("sstp server provisioning failed: %w", err)
		}
	case "openvpn":
		server, _ := cfg["server"].(*provtypes.OpenVpnServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		users, _ := cfg["users"].([]provtypes.VSCredentials)        //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing OpenVPN server config")
		}
		_, err := s.vpnServerSvc.ProvisionOpenVPNServer(ctx, routerID, sessionID, *server, users)
		if err != nil {
			return fmt.Errorf("openvpn server provisioning failed: %w", err)
		}
	case "ikev2":
		server, _ := cfg["server"].(*provtypes.Ike2ServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing IKEv2 server config")
		}
		_, err := s.vpnServerSvc.ProvisionIKEv2Server(ctx, routerID, sessionID, *server)
		if err != nil {
			return fmt.Errorf("ikev2 server provisioning failed: %w", err)
		}
	case "socks5":
		server, _ := cfg["server"].(*provtypes.Socks5ServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing SOCKS5 server config")
		}
		_, err := s.vpnServerSvc.ProvisionSocks5Server(ctx, routerID, sessionID, *server)
		if err != nil {
			return fmt.Errorf("socks5 server provisioning failed: %w", err)
		}
	case "ssh":
		server, _ := cfg["server"].(*provtypes.SSHServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing SSH server config")
		}
		_, err := s.vpnServerSvc.ProvisionSSHServer(ctx, routerID, sessionID, *server)
		if err != nil {
			return fmt.Errorf("ssh server provisioning failed: %w", err)
		}
	case "httpproxy":
		server, _ := cfg["server"].(*provtypes.HTTPProxyServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing HTTP proxy server config")
		}
		_, err := s.vpnServerSvc.ProvisionHTTPProxyServer(ctx, routerID, sessionID, *server)
		if err != nil {
			return fmt.Errorf("http proxy server provisioning failed: %w", err)
		}
	case "backtohome":
		server, _ := cfg["server"].(*provtypes.BackToHomeServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing back-to-home server config")
		}
		_, err := s.vpnServerSvc.ProvisionBackToHomeServer(ctx, routerID, sessionID, *server)
		if err != nil {
			return fmt.Errorf("back-to-home server provisioning failed: %w", err)
		}
	case "zerotier":
		server, _ := cfg["server"].(*provtypes.ZeroTierServerConfig) //nolint:errcheck // type assertion with zero-value fallback
		if server == nil {
			return fmt.Errorf("missing ZeroTier server config")
		}
		_, err := s.vpnServerSvc.ProvisionZeroTierServer(ctx, routerID, sessionID, *server)
		if err != nil {
			return fmt.Errorf("zerotier server provisioning failed: %w", err)
		}
	default:
		return fmt.Errorf("unsupported VPN server protocol: %s", protocol)
	}
	return nil
}

// dispatchMultiWAN routes a multi-WAN resource to the multi-WAN sub-service.
// Scans the session for matching wan.link.* resources to build the WANLink slice
// that the multi-WAN strategy provisioner requires.
func (s *Service) dispatchMultiWAN(ctx context.Context, routerID, sessionID string, resource SessionResource, session *Session) error {
	s.logger.Infow("dispatching multi-WAN resource", "resourceType", resource.ResourceType, "sessionID", sessionID, "routerID", routerID)
	if s.multiWANSvc == nil {
		s.logger.Warnw("multi-WAN service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	multiLinkCfg, ok := resource.Configuration["multiLinkConfig"].(*provtypes.MultiLinkConfig)
	if !ok || multiLinkCfg == nil {
		return fmt.Errorf("missing or invalid multiLinkConfig in multi-WAN resource")
	}

	// Derive the link type from the resource type: "wan.multilink.domestic" -> "domestic"
	linkType := strings.TrimPrefix(resource.ResourceType, "wan.multilink.")
	wanLinkResType := "wan.link." + linkType

	// Scan session resources for matching WAN link resources to build the WANLink slice.
	var wanLinks []multiwanpkg.WANLink
	for _, r := range session.Resources {
		if r.ResourceType != wanLinkResType {
			continue
		}
		linkCfg := rebuildWANLinkConfig(r.Configuration)
		wanLinks = append(wanLinks, multiwanpkg.WANLink{
			Name:          linkCfg.Name,
			InterfaceName: wanpkg.GetWANInterface(linkCfg),
			Gateway:       resolveGateway(linkCfg),
			RoutingTable:  "to-" + linkCfg.Name,
			Priority:      derefIntOr(linkCfg.Priority, 0),
			Weight:        derefIntOr(linkCfg.Weight, 0),
		})
	}

	comment := "nnc-provisioned-" + sessionID
	_, err := s.multiWANSvc.ProvisionMultiWAN(ctx, wanLinks, *multiLinkCfg, comment)
	if err != nil {
		return fmt.Errorf("multi-WAN provisioning failed: %w", err)
	}
	return nil
}

// dispatchBaseConfig routes a base config resource to the baseconfig sub-service.
func (s *Service) dispatchBaseConfig(ctx context.Context, sessionID string) error {
	s.logger.Infow("dispatching base config resource", "sessionID", sessionID)
	if s.baseConfigSvc == nil {
		s.logger.Warnw("baseconfig service not wired, skipping", "sessionID", sessionID)
		return nil
	}
	_, err := s.baseConfigSvc.Provision(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("baseconfig provisioning failed: %w", err)
	}
	return nil
}

// dispatchSecurity routes a security resource to the security sub-service.
func (s *Service) dispatchSecurity(ctx context.Context, sessionID string) error {
	s.logger.Infow("dispatching security resource", "sessionID", sessionID)
	if s.securitySvc == nil {
		s.logger.Warnw("security service not wired, skipping", "sessionID", sessionID)
		return nil
	}
	_, err := s.securitySvc.Provision(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("security provisioning failed: %w", err)
	}
	return nil
}

// dispatchCertificate routes a certificate resource to the certificate sub-service.
// The certificate provider is read from the resource configuration.
func (s *Service) dispatchCertificate(ctx context.Context, routerID, sessionID string, resource SessionResource) error {
	s.logger.Infow("dispatching certificate resource", "sessionID", sessionID, "routerID", routerID)
	if s.certSvc == nil {
		s.logger.Warnw("certificate service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	// Check whether the resource requests Let's Encrypt or a self-signed cert.
	cfg := resource.Configuration
	letsEncryptRaw := cfg["letsEncrypt"]
	letsEncrypt, _ := letsEncryptRaw.(bool) //nolint:errcheck // type assertion with zero-value fallback

	if letsEncrypt {
		_, err := s.certSvc.ProvisionLetsEncrypt(ctx, sessionID)
		if err != nil {
			return fmt.Errorf("let's encrypt provisioning failed: %w", err)
		}
		return nil
	}

	// Default: self-signed certificate.
	commonName := sessionID // sensible default if not provided
	if cn, ok := cfg["commonName"]; ok {
		if cnStr, ok2 := cn.(string); ok2 && cnStr != "" {
			commonName = cnStr
		}
	}
	_, err := s.certSvc.ProvisionSelfSigned(ctx, sessionID, certpkg.SelfSignedConfig{
		Name:       "nnc-cert-" + sessionID,
		CommonName: commonName,
	})
	if err != nil {
		return fmt.Errorf("self-signed cert provisioning failed: %w", err)
	}
	return nil
}

// dispatchDomesticIPs routes a domestic IPs resource to the domesticips sub-service.
func (s *Service) dispatchDomesticIPs(ctx context.Context, sessionID string, resource SessionResource) error {
	s.logger.Infow("dispatching domestic IPs resource", "resourceType", resource.ResourceType, "sessionID", sessionID)
	if s.domesticIPSvc == nil {
		s.logger.Warnw("domesticips service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	cfg := resource.Configuration
	sourceAddr, _ := cfg["sourceAddress"].(string) //nolint:errcheck // type assertion with zero-value fallback
	schedTime, _ := cfg["time"].(string)           //nolint:errcheck // type assertion with zero-value fallback
	intervalRaw, _ := cfg["interval"].(string)     //nolint:errcheck // type assertion with zero-value fallback

	interval := domesticipspkg.FrequencyDaily
	switch intervalRaw {
	case "Weekly":
		interval = domesticipspkg.FrequencyWeekly
	case "Monthly":
		interval = domesticipspkg.FrequencyMonthly
	}

	_, err := s.domesticIPSvc.Provision(ctx, sessionID, domesticipspkg.Config{
		SourceAddress: sourceAddr,
		Time:          schedTime,
		Interval:      interval,
	})
	if err != nil {
		return fmt.Errorf("domesticips provisioning failed: %w", err)
	}
	return nil
}

// dispatchWifi routes a WiFi resource to the wifi sub-service.
// Detects available bands and provisions the master AP configuration.
func (s *Service) dispatchWifi(ctx context.Context, routerID, sessionID string, resource SessionResource) error {
	s.logger.Infow("dispatching WiFi resource", "resourceType", resource.ResourceType, "sessionID", sessionID, "routerID", routerID)
	if s.wifiSvc == nil {
		s.logger.Warnw("wifi service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	cfg := resource.Configuration
	ssid, _ := cfg["ssid"].(string)         //nolint:errcheck // type assertion with zero-value fallback
	password, _ := cfg["password"].(string) //nolint:errcheck // type assertion with zero-value fallback
	band, _ := cfg["band"].(string)         //nolint:errcheck // type assertion with zero-value fallback
	if band == "" {
		band = "2.4"
	}

	// Detect bands from the router.
	bands, err := s.wifiSvc.DetectBands(ctx)
	if err != nil || bands == nil {
		s.logger.Warnw("failed to detect WiFi bands, using defaults", "error", err)
		bands = &wifipkg.AvailableBands{Has2_4: true}
	}

	wifiCfg := provtypes.WirelessConfig{
		SSID:     ssid,
		Password: password,
	}
	_, err = s.wifiSvc.ProvisionMasterAP(ctx, sessionID, band, wifiCfg, bands)
	if err != nil {
		return fmt.Errorf("wifi provisioning failed: %w", err)
	}
	return nil
}

// dispatchNetwork routes a LAN network resource to the network sub-service.
func (s *Service) dispatchNetwork(ctx context.Context, routerID, sessionID string, resource SessionResource) error {
	s.logger.Infow("dispatching LAN network resource", "resourceType", resource.ResourceType, "sessionID", sessionID, "routerID", routerID)
	if s.networkSvc == nil {
		s.logger.Warnw("network service not wired, skipping", "sessionID", sessionID)
		return nil
	}

	cfg := resource.Configuration

	// Determine the network type from the resource type suffix.
	networkType := provtypes.NetworkDomestic
	switch {
	case strings.HasSuffix(resource.ResourceType, ".foreign"):
		networkType = provtypes.NetworkForeign
	case strings.HasSuffix(resource.ResourceType, ".vpn"):
		networkType = provtypes.NetworkVPN
	case strings.HasSuffix(resource.ResourceType, ".split"):
		networkType = provtypes.NetworkSplit
	}

	bridgeName, _ := cfg["bridgeName"].(string)         //nolint:errcheck // type assertion with zero-value fallback
	subnet, _ := cfg["subnet"].(string)                 //nolint:errcheck // type assertion with zero-value fallback
	gateway, _ := cfg["gateway"].(string)               //nolint:errcheck // type assertion with zero-value fallback
	poolName, _ := cfg["poolName"].(string)             //nolint:errcheck // type assertion with zero-value fallback
	poolRange, _ := cfg["poolRange"].(string)           //nolint:errcheck // type assertion with zero-value fallback
	dhcpServerName, _ := cfg["dhcpServerName"].(string) //nolint:errcheck // type assertion with zero-value fallback
	routingTable, _ := cfg["routingTable"].(string)     //nolint:errcheck // type assertion with zero-value fallback
	leaseTime, _ := cfg["leaseTime"].(string)           //nolint:errcheck // type assertion with zero-value fallback
	if leaseTime == "" {
		leaseTime = "1d"
	}

	var dnsServers []string
	if dns, ok := cfg["dnsServers"].(string); ok && dns != "" {
		dnsServers = strings.Split(dns, ",")
	}

	var interfaces []string
	if ifaces, ok := cfg["interfaces"].(string); ok && ifaces != "" {
		interfaces = strings.Split(ifaces, ",")
	}

	_, err := s.networkSvc.ProvisionNetwork(ctx, sessionID, networkType, networkpkg.Config{
		BridgeName:     bridgeName,
		PoolName:       poolName,
		DHCPServerName: dhcpServerName,
		RoutingTable:   routingTable,
		Subnet:         subnet,
		Gateway:        gateway,
		DNSServers:     dnsServers,
		LeaseTime:      leaseTime,
		PoolRange:      poolRange,
		Interfaces:     interfaces,
	})
	if err != nil {
		return fmt.Errorf("network provisioning failed: %w", err)
	}
	return nil
}

// sessionResourcesToProvisioningResources converts session resources to orchestrator inputs.
// String-formats all configuration values for the RouterOS command API.
func sessionResourcesToProvisioningResources(resources []SessionResource) []orchestrator.ProvisioningResource {
	result := make([]orchestrator.ProvisioningResource, 0, len(resources))
	for _, r := range resources {
		args := make(map[string]string, len(r.Configuration))
		for k, v := range r.Configuration {
			if v != nil {
				args[k] = fmt.Sprintf("%v", v)
			}
		}
		result = append(result, orchestrator.ProvisioningResource{
			Path:   resourceTypeToRouterOSPath(r.ResourceType),
			Action: "add",
			Args:   args,
		})
	}
	return result
}

// resourceTypeToRouterOSPath maps a session resource type to its RouterOS API path.
func resourceTypeToRouterOSPath(resourceType string) string {
	paths := map[string]string{
		"vpn.wireguard.client":   "/interface/wireguard",
		"vpn.openvpn.client":     "/interface/ovpn-client",
		"vpn.pptp.client":        "/interface/pptp-client",
		"vpn.l2tp.client":        "/interface/l2tp-client",
		"vpn.sstp.client":        "/interface/sstp-client",
		"vpn.ikev2.client":       "/ip/ipsec/peer",
		"vpn.wireguard.server":   "/interface/wireguard",
		"vpn.pptp.server":        "/interface/pptp-server",
		"vpn.l2tp.server":        "/interface/l2tp-server",
		"vpn.sstp.server":        "/interface/sstp-server",
		"vpn.openvpn.server":     "/interface/ovpn-server",
		"vpn.ikev2.server":       "/ip/ipsec/profile",
		"tunnel.ipip":            "/interface/ipip",
		"tunnel.eoip":            "/interface/eoip",
		"tunnel.gre":             "/interface/gre",
		"tunnel.vxlan":           "/interface/vxlan",
		"system.identity":        "/system/identity",
		"system.ntp":             "/system/ntp/client",
		"system.services":        "/ip/service",
		"system.ddns":            "/ip/cloud",
		"system.dns":             "/ip/dns",
		"system.rui":             "/ip/service",
		"wan.link.domestic":      "/ip/dhcp-client",
		"wan.link.foreign":       "/ip/dhcp-client",
		"wan.multilink.domestic": "/routing/table",
		"wan.multilink.foreign":  "/routing/table",
	}
	if path, ok := paths[resourceType]; ok {
		return path
	}
	return "/" + strings.ReplaceAll(resourceType, ".", "/")
}

// --- Dispatch helper functions ---

// extractVPNProtocol extracts the protocol from "vpn.{protocol}.client" or "vpn.{protocol}.server".
func extractVPNProtocol(resourceType string) string {
	parts := strings.Split(resourceType, ".")
	if len(parts) >= 3 {
		return parts[1]
	}
	return ""
}

// rebuildWANLinkConfig reconstructs a WANLinkConfig from a session resource Configuration map.
// The typed structs are stored directly during import (in-memory sessions, no serialization).
func rebuildWANLinkConfig(cfg map[string]interface{}) provtypes.WANLinkConfig {
	name, _ := cfg["name"].(string)                                              //nolint:errcheck // type assertion with zero-value fallback
	interfaceConfig, _ := cfg["interfaceConfig"].(provtypes.InterfaceConfig)     //nolint:errcheck // type assertion with zero-value fallback
	connectionConfig, _ := cfg["connectionConfig"].(*provtypes.ConnectionConfig) //nolint:errcheck // type assertion with zero-value fallback
	priority, _ := cfg["priority"].(*int)                                        //nolint:errcheck // type assertion with zero-value fallback
	weight, _ := cfg["weight"].(*int)                                            //nolint:errcheck // type assertion with zero-value fallback
	return provtypes.WANLinkConfig{
		Name:             name,
		InterfaceConfig:  interfaceConfig,
		ConnectionConfig: connectionConfig,
		Priority:         priority,
		Weight:           weight,
	}
}

// resolveGateway returns the appropriate gateway for a WAN link.
// For static connections, uses the configured gateway IP.
// For DHCP/PPPoE/LTE, uses the interface name (RouterOS resolves it dynamically).
func resolveGateway(link provtypes.WANLinkConfig) string {
	if link.ConnectionConfig != nil && link.ConnectionConfig.Static != nil {
		return link.ConnectionConfig.Static.Gateway
	}
	return wanpkg.GetWANInterface(link)
}

// derefIntOr returns *p if non-nil, otherwise defaultVal.
func derefIntOr(p *int, defaultVal int) int {
	if p != nil {
		return *p
	}
	return defaultVal
}
