package vpnserver

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

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

// ProvisionPPTPServer enables the PPTP server and creates associated PPP profile and secrets.
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

	profileID, err := s.createPPPProfile(ctx, profileName, cfg.BaseVPNServerConfig, comment)
	if err != nil {
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
		"enabled": "yes",
	}

	if cfg.Authentication != "" {
		setArgs["authentication"] = string(cfg.Authentication)
	}
	if cfg.Encryption != nil {
		setArgs["encryption"] = *cfg.Encryption
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

// ProvisionL2TPServer enables the L2TP server and creates associated PPP profile and secrets.
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
		"enabled": "yes",
	}

	if cfg.Authentication != "" {
		setArgs["authentication"] = string(cfg.Authentication)
	}
	if cfg.UseIPsec != nil && *cfg.UseIPsec {
		setArgs["use-ipsec"] = "yes"
	}
	if cfg.IPsecSecret != nil {
		setArgs["ipsec-secret"] = *cfg.IPsecSecret
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

// ProvisionSSTServer enables the SSTP server and creates associated PPP profile and secrets.
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
		"enabled":     "yes",
		"certificate": cfg.Certificate,
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

// ProvisionOpenVPNServer enables the OpenVPN server and creates associated PPP profile and secrets.
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

	// Enable OpenVPN server using 'set'
	setArgs := map[string]string{
		"enabled":     "yes",
		"protocol":    string(cfg.Protocol),
		"certificate": cfg.Certificates.Cert,
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

// rollbackPPPResources removes PPP profile and secret resources on failure.
func (s *Service) rollbackPPPResources(
	ctx context.Context,
	result *ProvisionResult,
) {

	// Remove PPP secret first, then profile
	for _, path := range []string{"/ppp/secret", "/ppp/profile"} {
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
