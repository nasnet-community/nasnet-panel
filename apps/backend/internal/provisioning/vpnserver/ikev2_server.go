package vpnserver

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/provisioning/types"
	"backend/internal/router"
)

const authMethodPreSharedKey = "pre-shared-key"

// ProvisionIKEv2Server provisions an IKEv2 VPN server using IPsec RESPONDER mode.
// Creates 8 IPsec resources: ip/pool, profile, proposal, policy/group, peer, mode-config, identity, policy.
func (s *Service) ProvisionIKEv2Server(
	ctx context.Context, routerID, sessionID string, cfg types.Ike2ServerConfig,
) (*ProvisionResult, error) {

	result := &ProvisionResult{
		RouterResourceIDs: make(map[string]string),
		GeneratedFields:   make(map[string]string),
	}

	comment := "nnc-provisioned-" + sessionID

	// Derive a stable name prefix for all resources
	name := "ikev2-server"

	// Step 1: Create IP pool for client IPs
	poolName := fmt.Sprintf("%s-pool", name)
	if cfg.IPPool != nil && cfg.IPPool.Name != "" {
		poolName = cfg.IPPool.Name
	}
	poolID, err := s.createServerIPPool(ctx, poolName, cfg.IPPool, comment)
	if err != nil {
		s.logger.Errorw("failed to create IP pool for IKEv2 server", "error", err)
		return nil, fmt.Errorf("create ip pool: %w", err)
	}
	if poolID != "" {
		result.RouterResourceIDs["/ip/pool"] = poolID
	}

	// Step 2: Create IPsec profile (Phase 1)
	profileID, err := s.createServerIPSecProfile(ctx, name, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec profile for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create profile: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/profile"] = profileID

	// Step 3: Create IPsec proposal (Phase 2)
	proposalID, err := s.createServerIPSecProposal(ctx, name, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec proposal for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create proposal: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/proposal"] = proposalID

	// Step 4: Create IPsec policy group
	policyGroupID, err := s.createServerIPSecPolicyGroup(ctx, name, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec policy group for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create policy group: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/policy/group"] = policyGroupID

	// Step 5: Create IPsec peer (passive/responder mode, accept any address)
	peerID, err := s.createServerIPSecPeer(ctx, name, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec peer for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create peer: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/peer"] = peerID

	// Step 6: Create mode-config (responder=yes, assigns IPs from pool)
	modeConfigID, err := s.createServerIPSecModeConfig(ctx, name, poolName, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec mode-config for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create mode-config: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/mode-config"] = modeConfigID

	// Step 7: Create IPsec identity (with auth-method-specific fields)
	identityID, err := s.createServerIPSecIdentity(ctx, name, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec identity for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create identity: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/identity"] = identityID

	// Step 8: Create IPsec policy template
	policyID, err := s.createServerIPSecPolicy(ctx, name, cfg, comment)
	if err != nil {
		s.logger.Errorw("failed to create IPsec policy for IKEv2 server", "error", err)
		s.rollbackIKEv2Server(ctx, result)
		return nil, fmt.Errorf("create policy: %w", err)
	}
	result.RouterResourceIDs["/ip/ipsec/policy"] = policyID

	s.logger.Infow("IKEv2 VPN server provisioned successfully", "name", name)
	return result, nil
}

// createServerIPPool creates /ip/pool for assigning IPs to IKEv2 clients.
func (s *Service) createServerIPPool(
	ctx context.Context, poolName string, poolCfg *types.IpPoolConfig, comment string,
) (string, error) {

	if poolCfg == nil {
		// No pool config; skip creation (server may use existing pool or not need one)
		return "", nil
	}

	ranges := fmt.Sprintf("%s-%s", poolCfg.StartIP, poolCfg.EndIP)
	args := map[string]string{
		"name":    poolName,
		"ranges":  ranges,
		"comment": comment,
	}

	cmd := router.Command{Path: "/ip/pool", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create ip pool: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecProfile creates /ip/ipsec/profile for IKEv2 server.
func (s *Service) createServerIPSecProfile(
	ctx context.Context, name string, cfg types.Ike2ServerConfig, comment string,
) (string, error) {

	args := map[string]string{
		"name":    fmt.Sprintf("ike2-server-profile-%s", name),
		"comment": comment,
	}

	if cfg.EncryptionAlgorithm != nil && *cfg.EncryptionAlgorithm != "" {
		args["enc-algorithm"] = *cfg.EncryptionAlgorithm
	} else {
		args["enc-algorithm"] = "aes-256"
	}

	if cfg.IntegrityAlgorithm != nil && *cfg.IntegrityAlgorithm != "" {
		args["hash-algorithm"] = *cfg.IntegrityAlgorithm
	} else {
		args["hash-algorithm"] = "sha256"
	}

	if cfg.DHGroupIKE != nil && *cfg.DHGroupIKE != "" {
		args["dh-group"] = *cfg.DHGroupIKE
	} else {
		args["dh-group"] = "modp2048"
	}

	if cfg.IKELifetime != nil && *cfg.IKELifetime > 0 {
		hours := *cfg.IKELifetime / 3600
		if hours < 1 {
			hours = 1
		}
		args["lifetime"] = fmt.Sprintf("%dh", hours)
	} else {
		args["lifetime"] = "8h"
	}

	if cfg.DPDTimeout != nil && *cfg.DPDTimeout > 0 {
		args["dpd-interval"] = fmt.Sprintf("%ds", *cfg.DPDTimeout)
	} else {
		args["dpd-interval"] = "30s"
	}

	cmd := router.Command{Path: "/ip/ipsec/profile", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create profile: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecProposal creates /ip/ipsec/proposal for IKEv2 server (Phase 2 ESP).
func (s *Service) createServerIPSecProposal(
	ctx context.Context, name string, cfg types.Ike2ServerConfig, comment string,
) (string, error) {

	args := map[string]string{
		"name":    fmt.Sprintf("ike2-server-proposal-%s", name),
		"comment": comment,
	}

	encAlg := "aes-256-cbc"
	if cfg.EncryptionAlgorithm != nil && *cfg.EncryptionAlgorithm != "" {
		encAlg = serverPhase2EncAlgorithm(*cfg.EncryptionAlgorithm)
	}
	args["enc-algorithms"] = encAlg

	if cfg.IntegrityAlgorithm != nil && *cfg.IntegrityAlgorithm != "" {
		args["auth-algorithms"] = *cfg.IntegrityAlgorithm
	} else {
		args["auth-algorithms"] = "sha256"
	}

	if cfg.DHGroupESP != nil && *cfg.DHGroupESP != "" {
		args["pfs-group"] = *cfg.DHGroupESP
	} else {
		args["pfs-group"] = "modp2048"
	}

	if cfg.ChildSALifetime != nil && *cfg.ChildSALifetime > 0 {
		minutes := *cfg.ChildSALifetime / 60
		if minutes < 1 {
			minutes = 1
		}
		args["lifetime"] = fmt.Sprintf("%dm", minutes)
	} else {
		args["lifetime"] = "30m"
	}

	cmd := router.Command{Path: "/ip/ipsec/proposal", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create proposal: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecPolicyGroup creates /ip/ipsec/policy/group for server.
func (s *Service) createServerIPSecPolicyGroup(
	ctx context.Context, name string, comment string,
) (string, error) {

	args := map[string]string{
		"name":    fmt.Sprintf("ike2-%s-server", name),
		"comment": comment,
	}
	cmd := router.Command{Path: "/ip/ipsec/policy/group", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create policy group: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecPeer creates /ip/ipsec/peer in passive (responder) mode.
func (s *Service) createServerIPSecPeer(
	ctx context.Context, name string, cfg types.Ike2ServerConfig, comment string,
) (string, error) {

	args := map[string]string{
		"name":          fmt.Sprintf("ike2-server-peer-%s", name),
		"address":       "0.0.0.0/0", // Accept connections from any address
		"passive":       "yes",       // Server/responder mode
		"profile":       fmt.Sprintf("ike2-server-profile-%s", name),
		"exchange-mode": "ike2",
		"comment":       comment,
	}

	// Use configured listen port or default IKE port 500
	if cfg.ListenPort != nil && *cfg.ListenPort > 0 {
		args["port"] = fmt.Sprintf("%d", *cfg.ListenPort)
	}

	cmd := router.Command{Path: "/ip/ipsec/peer", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create peer: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecModeConfig creates /ip/ipsec/mode-config as responder with address pool.
func (s *Service) createServerIPSecModeConfig(
	ctx context.Context, name, poolName, comment string,
) (string, error) {

	args := map[string]string{
		"name":         fmt.Sprintf("ike2-server-modeconf-%s", name),
		"responder":    "yes",
		"address-pool": poolName,
		"comment":      comment,
	}
	cmd := router.Command{Path: "/ip/ipsec/mode-config", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create mode-config: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecIdentity creates /ip/ipsec/identity for the server.
// Handles PSK and digital-signature (certificate-based) auth methods.
func (s *Service) createServerIPSecIdentity(
	ctx context.Context, name string, cfg types.Ike2ServerConfig, comment string,
) (string, error) {

	args := map[string]string{
		"peer":                  fmt.Sprintf("ike2-server-peer-%s", name),
		"mode-config":           fmt.Sprintf("ike2-server-modeconf-%s", name),
		"generate-policy":       "port-strict",
		"policy-template-group": fmt.Sprintf("ike2-%s-server", name),
		"comment":               comment,
	}

	// Determine auth method from IPsecIdentity config or fall back to certificate presence
	switch {
	case cfg.IPsecIdentity != nil && cfg.IPsecIdentity.Type != "":
		switch cfg.IPsecIdentity.Type {
		case "psk", authMethodPreSharedKey:
			args["auth-method"] = authMethodPreSharedKey
			if cfg.IPsecIdentity.Content != "" {
				args["secret"] = cfg.IPsecIdentity.Content
			}
		default:
			// digital-signature (RSA/ECDSA/DSS)
			args["auth-method"] = "digital-signature"
			if cfg.Certificate.Name != "" {
				args["certificate"] = cfg.Certificate.Name
			}
		}
	case cfg.Certificate.Name != "":
		// Certificate present — use digital-signature
		args["auth-method"] = "digital-signature"
		args["certificate"] = cfg.Certificate.Name
	default:
		// Default to pre-shared-key; secret must be set separately
		args["auth-method"] = authMethodPreSharedKey
	}

	cmd := router.Command{Path: "/ip/ipsec/identity", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create identity: %w", result.Error)
	}
	return result.ID, nil
}

// createServerIPSecPolicy creates /ip/ipsec/policy template for IKEv2 server.
func (s *Service) createServerIPSecPolicy(
	ctx context.Context, name string, cfg types.Ike2ServerConfig, comment string,
) (string, error) {

	args := map[string]string{
		"group":           fmt.Sprintf("ike2-%s-server", name),
		"template":        "yes",
		"src-address":     "0.0.0.0/0",
		"dst-address":     "0.0.0.0/0",
		"protocol":        "255", // All protocols
		"action":          "encrypt",
		"level":           "require",
		"ipsec-protocols": "esp",
		"proposal":        fmt.Sprintf("ike2-server-proposal-%s", name),
		"comment":         comment,
	}

	// Override src/dst from policy template config if provided
	if cfg.IPsecPolicyTemplate != nil {
		if cfg.IPsecPolicyTemplate.SourceSubnet != nil && *cfg.IPsecPolicyTemplate.SourceSubnet != "" {
			args["src-address"] = *cfg.IPsecPolicyTemplate.SourceSubnet
		}
		if cfg.IPsecPolicyTemplate.DestSubnet != nil && *cfg.IPsecPolicyTemplate.DestSubnet != "" {
			args["dst-address"] = *cfg.IPsecPolicyTemplate.DestSubnet
		}
	}

	cmd := router.Command{Path: "/ip/ipsec/policy", Action: "add", Args: args}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", err
	}
	if !result.Success {
		return "", fmt.Errorf("failed to create policy: %w", result.Error)
	}
	return result.ID, nil
}

// rollbackIKEv2Server removes all IKEv2 server resources in reverse creation order.
func (s *Service) rollbackIKEv2Server(ctx context.Context, result *ProvisionResult) {
	removalOrder := []string{
		"/ip/ipsec/policy",
		"/ip/ipsec/identity",
		"/ip/ipsec/mode-config",
		"/ip/ipsec/peer",
		"/ip/ipsec/policy/group",
		"/ip/ipsec/proposal",
		"/ip/ipsec/profile",
		"/ip/pool",
	}
	for _, path := range removalOrder {
		id, ok := result.RouterResourceIDs[path]
		if !ok || id == "" {
			continue
		}
		cmd := router.Command{Path: path, Action: "remove", Args: map[string]string{".id": id}}
		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			s.logger.Warnw("failed to remove IKEv2 server resource during rollback",
				"path", path, "id", id, "error", err)
		}
	}
}

// serverPhase2EncAlgorithm converts a Phase 1 encryption algorithm name to Phase 2 (ESP) format.
func serverPhase2EncAlgorithm(enc string) string {
	if strings.HasSuffix(enc, "-cbc") || strings.HasSuffix(enc, "-gcm") {
		return enc
	}
	return enc + "-cbc"
}
