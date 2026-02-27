package vpnclient

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// boolYes is the RouterOS boolean "yes" string used for enabling features.
const boolYes = "yes"

// ProvisionIKEv2 provisions an IKEv2 VPN client using RouterOS IPsec resources.
// IKEv2 uses 7 IPsec resources (policy group, profile, proposal, mode config, peer, identity, policy)
// instead of a single interface. No /interface/ is created; instead a logical name is generated.
func (s *Service) ProvisionIKEv2(
	ctx context.Context, routerID string, sessionID string, cfg types.Ike2ClientConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		InterfaceName:     fmt.Sprintf("ike2-client-%s", cfg.Name),
		GeneratedFields:   make(map[string]string),
	}

	comment := "nnc-provisioned-" + sessionID

	// Step 1: Create Policy Group
	policyGroupID, err := s.createIPSecPolicyGroup(ctx, cfg.Name, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec policy group", "name", cfg.Name, "error", err)
		return nil, fmt.Errorf("create policy group: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/policy/group"] = policyGroupID

	// Step 2: Create IPsec Profile (Phase 1)
	profileID, err := s.createIPSecProfile(ctx, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec profile", "name", cfg.Name, "error", err)
		s.rollbackIKEv2(ctx, result)
		return nil, fmt.Errorf("create profile: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/profile"] = profileID

	// Step 3: Create IPsec Proposal (Phase 2)
	proposalID, err := s.createIPSecProposal(ctx, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec proposal", "name", cfg.Name, "error", err)
		s.rollbackIKEv2(ctx, result)
		return nil, fmt.Errorf("create proposal: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/proposal"] = proposalID

	// Step 4: Create Mode Config
	modeConfigID, err := s.createIPSecModeConfig(ctx, cfg.Name, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec mode-config", "name", cfg.Name, "error", err)
		s.rollbackIKEv2(ctx, result)
		return nil, fmt.Errorf("create mode-config: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/mode-config"] = modeConfigID

	// Step 5: Create Peer
	peerID, err := s.createIPSecPeer(ctx, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec peer", "name", cfg.Name, "error", err)
		s.rollbackIKEv2(ctx, result)
		return nil, fmt.Errorf("create peer: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/peer"] = peerID

	// Step 6: Create Identity (with auth-method-specific fields)
	identityID, err := s.createIPSecIdentity(ctx, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec identity", "name", cfg.Name, "error", err)
		s.rollbackIKEv2(ctx, result)
		return nil, fmt.Errorf("create identity: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/identity"] = identityID

	// Step 7: Create Policy Template
	policyID, err := s.createIPSecPolicy(ctx, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec policy", "name", cfg.Name, "error", err)
		s.rollbackIKEv2(ctx, result)
		return nil, fmt.Errorf("create policy: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/policy"] = policyID

	// Add endpoint to VPNE address list (non-critical, ignore errors)
	_ = s.addToVPNEAddressList(ctx, cfg.Server.Address, fmt.Sprintf("IKEv2 endpoint for %s", cfg.Name)) //nolint:errcheck // best-effort VPNE address list addition

	s.logger.Infow("IKEv2 VPN client provisioned successfully", "name", cfg.Name, "logical_name", result.InterfaceName)
	return result, nil
}

// createIPSecPolicyGroup creates /ip/ipsec/policy/group
func (s *Service) createIPSecPolicyGroup(ctx context.Context, name, comment string) (string, error) {
	args := map[string]string{
		"name":    fmt.Sprintf("ike2-%s-client", name),
		"comment": comment,
	}
	cmd := router.Command{Path: "/ip/ipsec/policy/group", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec policy group: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create policy group: %w", result.Error)
	}
	return result.ID, nil
}

// createIPSecProfile creates /ip/ipsec/profile (Phase 1 IKE)
func (s *Service) createIPSecProfile(ctx context.Context, cfg types.Ike2ClientConfig, comment string) (string, error) {
	args := map[string]string{
		"name":          fmt.Sprintf("ike2-profile-%s", cfg.Name),
		"comment":       comment,
		"nat-traversal": boolYes,
	}

	// Encryption algorithm (Phase 1 format, e.g., "aes-256")
	if cfg.EncryptionAlgorithm != nil && *cfg.EncryptionAlgorithm != "" {
		args["enc-algorithm"] = *cfg.EncryptionAlgorithm
	} else {
		args["enc-algorithm"] = "aes-256"
	}

	// Integrity/hash algorithm
	if cfg.IntegrityAlgorithm != nil && *cfg.IntegrityAlgorithm != "" {
		args["hash-algorithm"] = *cfg.IntegrityAlgorithm
	} else {
		args["hash-algorithm"] = "sha256"
	}

	// DH Group for IKE (Phase 1)
	if cfg.DHGroupIKE != nil && *cfg.DHGroupIKE != "" {
		args["dh-group"] = *cfg.DHGroupIKE
	} else {
		args["dh-group"] = "modp2048"
	}

	// Lifetime (Phase 1, in seconds → convert to hours format "8h")
	if cfg.LifetimeIKE != nil && *cfg.LifetimeIKE > 0 {
		hours := *cfg.LifetimeIKE / 3600
		args["lifetime"] = fmt.Sprintf("%dh", hours)
	} else {
		args["lifetime"] = "8h"
	}

	// DPD Interval (in seconds → convert to "Xs" format)
	if cfg.DPDTimeout != nil && *cfg.DPDTimeout > 0 {
		args["dpd-interval"] = fmt.Sprintf("%ds", *cfg.DPDTimeout)
	} else {
		args["dpd-interval"] = "30s"
	}

	cmd := router.Command{Path: "/ip/ipsec/profile", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec profile: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create profile: %w", result.Error)
	}
	return result.ID, nil
}

// createIPSecProposal creates /ip/ipsec/proposal (Phase 2 ESP)
func (s *Service) createIPSecProposal(ctx context.Context, cfg types.Ike2ClientConfig, comment string) (string, error) {
	args := map[string]string{
		"name":    fmt.Sprintf("ike2-proposal-%s", cfg.Name),
		"comment": comment,
	}

	// Encryption algorithm (Phase 2: convert to CBC format, e.g., "aes-256-cbc")
	encAlg := "aes-256-cbc"
	if cfg.EncryptionAlgorithm != nil && *cfg.EncryptionAlgorithm != "" {
		encAlg = phase2EncAlgorithm(*cfg.EncryptionAlgorithm)
	}
	args["enc-algorithms"] = encAlg

	// Authentication algorithm
	if cfg.IntegrityAlgorithm != nil && *cfg.IntegrityAlgorithm != "" {
		args["auth-algorithms"] = *cfg.IntegrityAlgorithm
	} else {
		args["auth-algorithms"] = "sha256"
	}

	// PFS Group (DH Group for Phase 2)
	if cfg.DHGroupESP != nil && *cfg.DHGroupESP != "" {
		args["pfs-group"] = *cfg.DHGroupESP
	} else {
		args["pfs-group"] = "modp2048"
	}

	// Lifetime (Phase 2, in seconds → convert to minutes format "30m")
	if cfg.LifetimeESP != nil && *cfg.LifetimeESP > 0 {
		minutes := *cfg.LifetimeESP / 60
		args["lifetime"] = fmt.Sprintf("%dm", minutes)
	} else {
		args["lifetime"] = "30m"
	}

	cmd := router.Command{Path: "/ip/ipsec/proposal", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec proposal: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create proposal: %w", result.Error)
	}
	return result.ID, nil
}

// createIPSecModeConfig creates /ip/ipsec/mode-config
func (s *Service) createIPSecModeConfig(ctx context.Context, name, comment string) (string, error) {
	args := map[string]string{
		"name":      fmt.Sprintf("ike2-modeconf-%s", name),
		"responder": "no", // Client mode
		"comment":   comment,
	}
	cmd := router.Command{Path: "/ip/ipsec/mode-config", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec mode-config: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create mode-config: %w", result.Error)
	}
	return result.ID, nil
}

// createIPSecPeer creates /ip/ipsec/peer
func (s *Service) createIPSecPeer(ctx context.Context, cfg types.Ike2ClientConfig, comment string) (string, error) {
	args := map[string]string{
		"name":          fmt.Sprintf("ike2-peer-%s", cfg.Name),
		"address":       cfg.Server.Address,
		"profile":       fmt.Sprintf("ike2-profile-%s", cfg.Name),
		"exchange-mode": "ike2",
		"comment":       comment,
	}

	// Port (if non-zero, default to 500)
	port := 500
	if cfg.Server.Port != 0 {
		port = cfg.Server.Port
	}
	args["port"] = strconv.Itoa(port)

	// send-initial-contact (optional)
	if cfg.InitialContactEnabled != nil {
		if *cfg.InitialContactEnabled {
			args["send-initial-contact"] = boolYes
		} else {
			args["send-initial-contact"] = "no"
		}
	}

	cmd := router.Command{Path: "/ip/ipsec/peer", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec peer: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create peer: %w", result.Error)
	}
	return result.ID, nil
}

// setOptionalArg sets args[key] = value only when value is non-empty.
func setOptionalArg(args map[string]string, key, value string) {
	if value != "" {
		args[key] = value
	}
}

// createIPSecIdentity creates /ip/ipsec/identity with auth-method-specific fields
func (s *Service) createIPSecIdentity(ctx context.Context, cfg types.Ike2ClientConfig, comment string) (string, error) {
	args := map[string]string{
		"peer":                  fmt.Sprintf("ike2-peer-%s", cfg.Name),
		"mode-config":           fmt.Sprintf("ike2-modeconf-%s", cfg.Name),
		"generate-policy":       "port-strict",
		"policy-template-group": fmt.Sprintf("ike2-%s-client", cfg.Name),
		"comment":               comment,
	}

	// Auth-method-specific fields
	authMethod := cfg.AuthMethod
	if authMethod == "" {
		authMethod = types.IkeAuthPSK
	}

	s.applyIKEv2AuthArgs(args, authMethod, cfg)

	// Local identity (my-id)
	if cfg.LocalIdentity != nil {
		setOptionalArg(args, "my-id", *cfg.LocalIdentity)
	}

	// Remote identity
	if cfg.RemoteIdentity != nil {
		setOptionalArg(args, "remote-id", *cfg.RemoteIdentity)
	}

	cmd := router.Command{Path: "/ip/ipsec/identity", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec identity: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create identity: %w", result.Error)
	}
	return result.ID, nil
}

// applyIKEv2AuthArgs sets auth-method-specific fields into args based on the auth method.
func (s *Service) applyIKEv2AuthArgs(args map[string]string, authMethod types.IkeV2AuthMethod, cfg types.Ike2ClientConfig) {
	switch authMethod {
	case types.IkeAuthPSK:
		args["auth-method"] = "pre-shared-key"
		setOptionalArg(args, "secret", cfg.Credentials.Password)
	case types.IkeAuthRSA, types.IkeAuthDSS, types.IkeAuthECDSA:
		args["auth-method"] = "digital-signature"
		if cfg.Certificate != nil {
			setOptionalArg(args, "certificate", *cfg.Certificate)
		}
	case types.IkeAuthEAP:
		args["auth-method"] = "eap"
		args["eap-methods"] = "eap-mschapv2"
		setOptionalArg(args, "username", cfg.Credentials.Username)
		setOptionalArg(args, "password", cfg.Credentials.Password)
	case types.IkeAuthPSKFull:
		args["auth-method"] = "pre-shared-key"
		setOptionalArg(args, "secret", cfg.Credentials.Password)
	case types.IkeAuthDigitalSignature:
		args["auth-method"] = "digital-signature"
		if cfg.Certificate != nil {
			setOptionalArg(args, "certificate", *cfg.Certificate)
		}
	}
}

// createIPSecPolicy creates /ip/ipsec/policy (policy template)
func (s *Service) createIPSecPolicy(ctx context.Context, cfg types.Ike2ClientConfig, comment string) (string, error) {
	args := map[string]string{
		"group":       fmt.Sprintf("ike2-%s-client", cfg.Name),
		"template":    boolYes,
		"src-address": "0.0.0.0/0",
		"proposal":    fmt.Sprintf("ike2-proposal-%s", cfg.Name),
		"action":      "encrypt",
		"level":       "require",
		"comment":     comment,
	}

	// Destination address (allowed subnet)
	dstAddr := "0.0.0.0/0"
	if cfg.AllowedSubnet != nil && *cfg.AllowedSubnet != "" {
		dstAddr = *cfg.AllowedSubnet
	}
	args["dst-address"] = dstAddr

	cmd := router.Command{Path: "/ip/ipsec/policy", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create IPsec policy: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create policy: %w", result.Error)
	}
	return result.ID, nil
}

// addToVPNEAddressList adds the server endpoint to the VPNE address list (non-critical)
func (s *Service) addToVPNEAddressList(ctx context.Context, address, comment string) error {
	args := map[string]string{
		"list":    "VPNE",
		"address": address,
		"comment": comment,
	}
	cmd := router.Command{Path: "/ip/firewall/address-list", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Debugw("failed to add to VPNE address list (non-critical)", "address", address, "error", err)
		return fmt.Errorf("failed to add to VPNE address list: %w", err)
	}
	if !result.Success {
		s.logger.Debugw("failed to add to VPNE address list (non-critical)", "address", address, "error", result.Error)
		return fmt.Errorf("failed to add to VPNE list: %w", result.Error)
	}
	return nil
}

// rollbackIKEv2 removes all IKEv2 resources in reverse creation order
func (s *Service) rollbackIKEv2(ctx context.Context, result *ProvisionResult) {
	ipsecRemovalOrder := []string{
		"/ip/firewall/address-list",
		"/ip/ipsec/policy",
		"/ip/ipsec/identity",
		"/ip/ipsec/peer",
		"/ip/ipsec/mode-config",
		"/ip/ipsec/proposal",
		"/ip/ipsec/profile",
		"/ip/ipsec/policy/group",
	}
	for _, path := range ipsecRemovalOrder {
		id, ok := result.RouterResourceIDs[path]
		if !ok || id == "" {
			continue
		}
		cmd := router.Command{Path: path, Action: "remove", Args: map[string]string{".id": id}}
		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			s.logger.Warnw("failed to remove IPsec resource during rollback", "path", path, "id", id, "error", err)
		}
	}
}

// phase2EncAlgorithm converts Phase 1 encryption algorithm name to Phase 2 (ESP) format.
// Phase 1 uses names like "aes-256", Phase 2 (ESP) uses "aes-256-cbc".
func phase2EncAlgorithm(enc string) string {
	if strings.HasSuffix(enc, "-cbc") || strings.HasSuffix(enc, "-gcm") {
		return enc
	}
	return enc + "-cbc"
}
