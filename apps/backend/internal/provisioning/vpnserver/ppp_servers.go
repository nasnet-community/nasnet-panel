package vpnserver

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// Enabled constant for RouterOS API calls.
const enabled = "yes"

// createPPPProfile creates a PPP profile on the router.
// Returns the created profile's .id.
func (s *Service) createPPPProfile(
	ctx context.Context,
	profileName string,
	cfg types.BaseVPNServerConfig,
	comment string,
) (string, error) {

	args := map[string]string{
		"name":    profileName,
		"comment": comment,
	}

	if cfg.KeepaliveTimeout != nil {
		args["keepalive-timeout"] = strconv.Itoa(*cfg.KeepaliveTimeout)
	}

	cmd := router.Command{
		Path:   "/ppp/profile",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create PPP profile: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("PPP profile creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// createPPPSecrets creates /ppp/secret entries for each user credential.
// Returns the .id of the last created secret (multiple secrets share one path key).
func (s *Service) createPPPSecrets(
	ctx context.Context,
	users []types.VSCredentials,
	service string,
	profile string,
	comment string,
) ([]string, error) {

	ids := make([]string, 0, len(users))

	for _, user := range users {
		args := map[string]string{
			"name":     user.Username,
			"password": user.Password,
			"service":  service,
			"profile":  profile,
			"comment":  comment,
		}

		cmd := router.Command{
			Path:   "/ppp/secret",
			Action: "add",
			Args:   args,
		}

		result, err := s.routerPort.ExecuteCommand(ctx, cmd)
		if err != nil {
			return ids, fmt.Errorf("failed to create PPP secret for user %s: %w", user.Username, err)
		}
		if !result.Success {
			return ids, fmt.Errorf("PPP secret creation failed for user %s: %w", user.Username, result.Error)
		}

		ids = append(ids, result.ID)
	}

	return ids, nil
}

// ProvisionPPTPServer enables the PPTP server and creates associated IP pool, PPP profile and secrets.
//
//nolint:gocyclo // multiple provisioning steps with error handling
func (s *Service) ProvisionPPTPServer(
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.PptpServerConfig,
	users []types.VSCredentials,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Create PPP profile
	profileName := "nnc-pptp-" + sessionID
	if cfg.DefaultProfile != nil && *cfg.DefaultProfile != "" {
		profileName = *cfg.DefaultProfile
	}

	// Create IP pool for PPTP clients (matching TS PptpServer which generates /ip pool)
	poolName := "pptp-pool-" + sessionID
	if cfg.Network != nil && cfg.Network.Subnet != "" {
		poolID, poolErr := s.createPPPIPPool(ctx, poolName, cfg.Network.Subnet, comment)
		if poolErr != nil {
			// Non-critical: log and continue without IP pool
			s.logger.Warnw("failed to create PPTP IP pool, continuing", "error", poolErr)
		} else if poolID != "" {
			result.RouterResourceIDs["/ip/pool"] = poolID
		}
	}

	profileID, err := s.createPPPProfile(ctx, profileName, cfg.BaseVPNServerConfig, comment)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to create PPTP PPP profile: %w", err)
	}
	result.RouterResourceIDs["/ppp/profile"] = profileID

	// Create PPP secrets for each user
	secretIDs, err := s.createPPPSecrets(ctx, users, "pptp", profileName, comment)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to create PPTP PPP secrets: %w", err)
	}
	if len(secretIDs) > 0 {
		// Store the last secret ID; all secrets share this path key
		result.RouterResourceIDs["/ppp/secret"] = secretIDs[len(secretIDs)-1]
	}

	// Enable PPTP server using 'set' (server already exists, just configure it)
	setArgs := map[string]string{
		"enabled":         enabled,
		"default-profile": profileName,
	}

	if cfg.Authentication != "" {
		setArgs["authentication"] = string(cfg.Authentication)
	}
	if cfg.Encryption != nil {
		setArgs["encryption"] = *cfg.Encryption
	}
	if cfg.KeepaliveTimeout != nil {
		setArgs["keepalive-timeout"] = strconv.Itoa(*cfg.KeepaliveTimeout)
	}
	if cfg.MaxMtu != nil {
		setArgs["max-mtu"] = strconv.Itoa(*cfg.MaxMtu)
	}
	if cfg.MaxMru != nil {
		setArgs["max-mru"] = strconv.Itoa(*cfg.MaxMru)
	}

	setCmd := router.Command{
		Path:   "/interface/pptp-server/server",
		Action: "set",
		Args:   setArgs,
	}

	setResult, err := s.routerPort.ExecuteCommand(ctx, setCmd)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to enable PPTP server: %w", err)
	}
	if !setResult.Success {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("PPTP server enable failed: %w", setResult.Error)
	}

	s.logger.Infow("PPTP server provisioned successfully",
		"users", len(users),
		"profile", profileName,
	)

	return result, nil
}

// ProvisionL2TPServer enables the L2TP server and creates associated IP pool, PPP profile and secrets.
//
//nolint:gocyclo // extensive L2TP-specific configuration with multiple conditionals
func (s *Service) ProvisionL2TPServer(
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.L2tpServerConfig,
	users []types.VSCredentials,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Create PPP profile
	profileName := "nnc-l2tp-" + sessionID
	if cfg.DefaultProfile != nil && *cfg.DefaultProfile != "" {
		profileName = *cfg.DefaultProfile
	}

	// Create IP pool for L2TP clients (matching TS L2tpServer which generates /ip pool)
	if cfg.Network != nil && cfg.Network.Subnet != "" {
		poolName := "l2tp-pool-" + sessionID
		poolID, poolErr := s.createPPPIPPool(ctx, poolName, cfg.Network.Subnet, comment)
		if poolErr != nil {
			// Non-critical: log and continue without IP pool
			s.logger.Warnw("failed to create L2TP IP pool, continuing", "error", poolErr)
		} else if poolID != "" {
			result.RouterResourceIDs["/ip/pool"] = poolID
		}
	}

	profileID, err := s.createPPPProfile(ctx, profileName, cfg.BaseVPNServerConfig, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create L2TP PPP profile: %w", err)
	}
	result.RouterResourceIDs["/ppp/profile"] = profileID

	// Create PPP secrets for each user
	secretIDs, err := s.createPPPSecrets(ctx, users, "l2tp", profileName, comment)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to create L2TP PPP secrets: %w", err)
	}
	if len(secretIDs) > 0 {
		result.RouterResourceIDs["/ppp/secret"] = secretIDs[len(secretIDs)-1]
	}

	// Enable L2TP server using 'set'
	setArgs := map[string]string{
		"enabled":         enabled,
		"default-profile": profileName,
	}

	if cfg.Authentication != "" {
		setArgs["authentication"] = string(cfg.Authentication)
	}
	if cfg.UseIPsec != nil && *cfg.UseIPsec {
		setArgs["use-ipsec"] = enabled
	}
	if cfg.IPsecSecret != nil {
		setArgs["ipsec-secret"] = *cfg.IPsecSecret
	}
	if cfg.KeepaliveTimeout != nil {
		setArgs["keepalive-timeout"] = strconv.Itoa(*cfg.KeepaliveTimeout)
	}
	if cfg.MaxMtu != nil {
		setArgs["max-mtu"] = strconv.Itoa(*cfg.MaxMtu)
	}
	if cfg.MaxMru != nil {
		setArgs["max-mru"] = strconv.Itoa(*cfg.MaxMru)
	}
	// L2TP-specific server settings (matching TS L2tpServer)
	if cfg.AllowFastPath != nil {
		switch *cfg.AllowFastPath {
		case true:
			setArgs["allow-fast-path"] = enabled
		case false:
			setArgs["allow-fast-path"] = "no"
		}
	}
	if cfg.MaxSessions != nil {
		setArgs["max-sessions"] = strconv.Itoa(*cfg.MaxSessions)
	}
	if cfg.OneSessionPerHost != nil {
		switch *cfg.OneSessionPerHost {
		case true:
			setArgs["one-session-per-host"] = enabled
		case false:
			setArgs["one-session-per-host"] = "no"
		}
	}
	if cfg.AcceptProtoVersion != nil && *cfg.AcceptProtoVersion != "" {
		setArgs["accept-proto-version"] = *cfg.AcceptProtoVersion
	}
	if cfg.CallerIdType != nil && *cfg.CallerIdType != "" {
		setArgs["caller-id-type"] = *cfg.CallerIdType
	}
	// L2TPv3 settings
	if cfg.L2TPV3Config != nil {
		if cfg.L2TPV3Config.CookieLength != nil {
			setArgs["l2tpv3-cookie-length"] = strconv.Itoa(*cfg.L2TPV3Config.CookieLength)
		}
	}

	setCmd := router.Command{
		Path:   "/interface/l2tp-server/server",
		Action: "set",
		Args:   setArgs,
	}

	setResult, err := s.routerPort.ExecuteCommand(ctx, setCmd)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to enable L2TP server: %w", err)
	}
	if !setResult.Success {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("L2TP server enable failed: %w", setResult.Error)
	}

	s.logger.Infow("L2TP server provisioned successfully",
		"users", len(users),
		"profile", profileName,
	)

	return result, nil
}

// ProvisionSSTServer enables the SSTP server and creates associated IP pool, PPP profile and secrets.
//
//nolint:gocyclo // multiple provisioning steps with error handling
func (s *Service) ProvisionSSTServer(
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.SstpServerConfig,
	users []types.VSCredentials,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Create PPP profile
	profileName := "nnc-sstp-" + sessionID
	if cfg.DefaultProfile != nil && *cfg.DefaultProfile != "" {
		profileName = *cfg.DefaultProfile
	}

	// Create IP pool for SSTP clients (matching TS SstpServer which generates /ip pool)
	if cfg.Network != nil && cfg.Network.Subnet != "" {
		poolName := "sstp-pool-" + sessionID
		poolID, poolErr := s.createPPPIPPool(ctx, poolName, cfg.Network.Subnet, comment)
		if poolErr != nil {
			// Non-critical: log and continue without IP pool
			s.logger.Warnw("failed to create SSTP IP pool, continuing", "error", poolErr)
		} else if poolID != "" {
			result.RouterResourceIDs["/ip/pool"] = poolID
		}
	}

	profileID, err := s.createPPPProfile(ctx, profileName, cfg.BaseVPNServerConfig, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create SSTP PPP profile: %w", err)
	}
	result.RouterResourceIDs["/ppp/profile"] = profileID

	// Create PPP secrets for each user
	secretIDs, err := s.createPPPSecrets(ctx, users, "sstp", profileName, comment)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to create SSTP PPP secrets: %w", err)
	}
	if len(secretIDs) > 0 {
		result.RouterResourceIDs["/ppp/secret"] = secretIDs[len(secretIDs)-1]
	}

	// Enable SSTP server using 'set'
	setArgs := map[string]string{
		"enabled":         enabled,
		"certificate":     cfg.Certificate,
		"default-profile": profileName,
	}

	if cfg.TLSVersion != nil {
		setArgs["tls-version"] = string(*cfg.TLSVersion)
	}
	if cfg.Ciphers != nil {
		setArgs["ciphers"] = *cfg.Ciphers
	}
	if cfg.ListenPort != nil {
		setArgs["port"] = strconv.Itoa(*cfg.ListenPort)
	}
	if cfg.KeepaliveTimeout != nil {
		setArgs["keepalive-timeout"] = strconv.Itoa(*cfg.KeepaliveTimeout)
	}
	if cfg.Authentication != "" {
		setArgs["authentication"] = string(cfg.Authentication)
	}
	if cfg.MaxMtu != nil {
		setArgs["max-mtu"] = strconv.Itoa(*cfg.MaxMtu)
	}
	if cfg.MaxMru != nil {
		setArgs["max-mru"] = strconv.Itoa(*cfg.MaxMru)
	}

	setCmd := router.Command{
		Path:   "/interface/sstp-server/server",
		Action: "set",
		Args:   setArgs,
	}

	setResult, err := s.routerPort.ExecuteCommand(ctx, setCmd)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to enable SSTP server: %w", err)
	}
	if !setResult.Success {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("SSTP server enable failed: %w", setResult.Error)
	}

	s.logger.Infow("SSTP server provisioned successfully",
		"users", len(users),
		"profile", profileName,
	)

	return result, nil
}

// ProvisionOpenVPNServer enables the OpenVPN server and creates associated IP pool, PPP profile and secrets.
//
//nolint:gocyclo // extensive OpenVPN-specific configuration
func (s *Service) ProvisionOpenVPNServer(
	ctx context.Context,
	routerID string,
	sessionID string,
	cfg types.OpenVpnServerConfig,
	users []types.VSCredentials,
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	// Create PPP profile
	profileName := "nnc-ovpn-" + sessionID
	if cfg.DefaultProfile != nil && *cfg.DefaultProfile != "" {
		profileName = *cfg.DefaultProfile
	}

	// Create IP pool for OpenVPN clients (matching TS OVPNServer which generates /ip pool)
	if cfg.Network != nil && cfg.Network.Subnet != "" {
		poolName := "ovpn-pool-" + sessionID
		poolID, poolErr := s.createPPPIPPool(ctx, poolName, cfg.Network.Subnet, comment)
		if poolErr != nil {
			// Non-critical: log and continue without IP pool
			s.logger.Warnw("failed to create OpenVPN IP pool, continuing", "error", poolErr)
		} else if poolID != "" {
			result.RouterResourceIDs["/ip/pool"] = poolID
		}
	}

	profileID, err := s.createPPPProfile(ctx, profileName, cfg.BaseVPNServerConfig, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create OpenVPN PPP profile: %w", err)
	}
	result.RouterResourceIDs["/ppp/profile"] = profileID

	// Create PPP secrets for each user
	secretIDs, err := s.createPPPSecrets(ctx, users, "ovpn", profileName, comment)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to create OpenVPN PPP secrets: %w", err)
	}
	if len(secretIDs) > 0 {
		result.RouterResourceIDs["/ppp/secret"] = secretIDs[len(secretIDs)-1]
	}

	// Enable OpenVPN server using 'add' (creates a new named instance, matching TS OVPNServer)
	setArgs := map[string]string{
		"enabled":         enabled,
		"protocol":        string(cfg.Protocol),
		"certificate":     cfg.Certificates.Cert,
		"default-profile": profileName,
	}

	if cfg.ListenPort != nil {
		setArgs["port"] = strconv.Itoa(*cfg.ListenPort)
	}
	if cfg.Cipher != nil {
		setArgs["cipher"] = string(*cfg.Cipher)
	}
	if cfg.Auth != nil {
		setArgs["auth"] = string(*cfg.Auth)
	}
	if cfg.TLSVersion != nil {
		setArgs["tls-version"] = string(*cfg.TLSVersion)
	}
	if cfg.KeepaliveTimeout != nil {
		setArgs["keepalive-timeout"] = strconv.Itoa(*cfg.KeepaliveTimeout)
	}
	if cfg.MaxMtu != nil {
		setArgs["max-mtu"] = strconv.Itoa(*cfg.MaxMtu)
	}
	// require-client-certificate (matching TS OVPNServer behavior)
	if cfg.RequireClientCertificate != nil {
		switch *cfg.RequireClientCertificate {
		case true:
			setArgs["require-client-certificate"] = enabled
		case false:
			setArgs["require-client-certificate"] = "no"
		}
	}

	setCmd := router.Command{
		Path:   "/interface/ovpn-server/server",
		Action: "set",
		Args:   setArgs,
	}

	setResult, err := s.routerPort.ExecuteCommand(ctx, setCmd)
	if err != nil {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("failed to enable OpenVPN server: %w", err)
	}
	if !setResult.Success {
		s.rollbackPPPResources(ctx, result)
		return nil, fmt.Errorf("OpenVPN server enable failed: %w", setResult.Error)
	}

	s.logger.Infow("OpenVPN server provisioned successfully",
		"users", len(users),
		"profile", profileName,
	)

	return result, nil
}

// createPPPIPPool creates an IP pool for PPP-based VPN servers (PPTP/L2TP/SSTP/OpenVPN).
// subnet should be in CIDR notation (e.g., "192.168.70.0/24"). The pool uses the
// second host address through the second-to-last address (e.g., .2-.254).
func (s *Service) createPPPIPPool(
	ctx context.Context,
	poolName string,
	subnet string,
	comment string,
) (string, error) {

	// Parse subnet into a host range for RouterOS /ip pool.
	// RouterOS expects "start-end" format (e.g., "192.168.70.2-192.168.70.254").
	ranges, err := subnetToPoolRange(subnet)
	if err != nil {
		return "", fmt.Errorf("failed to parse subnet %q for IP pool: %w", subnet, err)
	}

	args := map[string]string{
		"name":    poolName,
		"ranges":  ranges,
		"comment": comment,
	}

	cmd := router.Command{Path: "/ip/pool", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IP pool: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("IP pool creation failed: %w", result.Error)
	}
	return result.ID, nil
}

// subnetToPoolRange converts a CIDR subnet to a RouterOS pool range string.
// e.g., "192.168.70.0/24" → "192.168.70.2-192.168.70.254"
func subnetToPoolRange(subnet string) (string, error) {
	// Extract base IP and prefix length
	slashIdx := -1
	for i, c := range subnet {
		if c == '/' {
			slashIdx = i
			break
		}
	}
	if slashIdx < 0 {
		return "", fmt.Errorf("no prefix length in subnet %q", subnet)
	}

	baseIP := subnet[:slashIdx]
	prefixStr := subnet[slashIdx+1:]

	// Parse prefix length
	prefix := 0
	for _, c := range prefixStr {
		if c < '0' || c > '9' {
			return "", fmt.Errorf("invalid prefix length in subnet %q", subnet)
		}
		prefix = prefix*10 + int(c-'0')
	}

	// Parse base IP octets
	octets := [4]int{}
	octetIdx := 0
	cur := 0
	for _, c := range baseIP {
		switch {
		case c == '.':
			if octetIdx >= 3 {
				return "", fmt.Errorf("too many octets in IP %q", baseIP)
			}
			octets[octetIdx] = cur
			octetIdx++
			cur = 0
		case c >= '0' && c <= '9':
			cur = cur*10 + int(c-'0')
		default:
			return "", fmt.Errorf("invalid character in IP %q", baseIP)
		}
	}
	octets[octetIdx] = cur

	// Compute network address (zero out host bits)
	ipNum := (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]
	mask := ^((1 << (32 - prefix)) - 1)
	network := ipNum & mask
	broadcast := network | ^mask

	// Pool: network+2 to broadcast-1
	start := network + 2
	end := broadcast - 1

	if start >= end {
		// Subnet too small; use single address as pool
		start = network + 1
		end = start
	}

	format := func(n int) string {
		return fmt.Sprintf("%d.%d.%d.%d",
			(n>>24)&0xFF, (n>>16)&0xFF, (n>>8)&0xFF, n&0xFF)
	}

	return fmt.Sprintf("%s-%s", format(start), format(end)), nil
}

// rollbackPPPResources removes PPP profile, secret, and IP pool resources on failure.
func (s *Service) rollbackPPPResources(
	ctx context.Context,
	result *ProvisionResult,
) {

	// Remove in reverse creation order: secret, profile, then pool
	for _, path := range []string{"/ppp/secret", "/ppp/profile", "/ip/pool"} {
		id, ok := result.RouterResourceIDs[path]
		if !ok || id == "" {
			continue
		}

		cmd := router.Command{
			Path:   path,
			Action: "remove",
			Args:   map[string]string{".id": id},
		}

		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			s.logger.Warnw("failed to remove PPP resource during rollback",
				"path", path, "id", id, "error", err,
			)
		}
	}
}
