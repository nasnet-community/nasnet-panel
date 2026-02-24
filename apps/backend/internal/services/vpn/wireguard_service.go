// Package vpn provides VPN client/server service layer with Apply-Confirm-Merge.
package vpn

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/provisioning/vpnclient"
	"backend/internal/router"
)

// WireGuardProvisionInput holds the input for provisioning a WireGuard client.
type WireGuardProvisionInput struct {
	RouterID  string
	SessionID string
	Config    types.WireguardClientConfig
}

// WireGuardProvisionOutput holds the output of a WireGuard client provisioning.
type WireGuardProvisionOutput struct {
	// InterfaceName is the created RouterOS interface name.
	InterfaceName string
	// PublicKey is the router-generated public key.
	PublicKey string
	// RouterResourceIDs maps RouterOS path to .id for resource tracking.
	RouterResourceIDs map[string]string
	// AppliedAt is when the provisioning was applied.
	AppliedAt time.Time
}

// WireGuardService provides WireGuard VPN client operations with
// Apply-Confirm-Merge pattern for safe router configuration.
type WireGuardService struct {
	vpnProvisioner *vpnclient.Service
	eventBus       events.EventBus
	publisher      *events.Publisher
	logger         *zap.SugaredLogger
}

// WireGuardServiceConfig holds configuration for WireGuardService.
type WireGuardServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewWireGuardService creates a new WireGuard service.
func NewWireGuardService(cfg WireGuardServiceConfig) *WireGuardService {
	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop().Sugar()
	}

	provisioner := vpnclient.NewService(vpnclient.ServiceConfig{
		RouterPort: cfg.RouterPort,
		EventBus:   cfg.EventBus,
		Logger:     logger.Named("vpn-provisioner"),
	})

	publisher := events.NewPublisher(cfg.EventBus, "wireguard-service")

	return &WireGuardService{
		vpnProvisioner: provisioner,
		eventBus:       cfg.EventBus,
		publisher:      publisher,
		logger:         logger,
	}
}

// ProvisionWireGuardClient provisions a WireGuard VPN client using
// the Apply-Confirm-Merge pattern:
//
//  1. Apply: Create RouterOS resources (interface, peer, IP, routing, address list)
//  2. Confirm: Read back router-generated fields (public key)
//  3. Merge: Emit domain event with provisioning result
//
// The caller (resolver/orchestrator) is responsible for persisting to the
// Resource entity via ent, since this service layer doesn't directly depend on ent.
func (s *WireGuardService) ProvisionWireGuardClient(
	ctx context.Context,
	input WireGuardProvisionInput,
) (*WireGuardProvisionOutput, error) {

	s.logger.Infow("provisioning WireGuard client",
		"routerID", input.RouterID,
		"sessionID", input.SessionID,
		"name", input.Config.Name,
	)

	// === APPLY ===
	// Execute the 6-step provisioning sequence on the router.
	result, err := s.vpnProvisioner.ProvisionWireGuard(
		ctx,
		input.RouterID,
		input.SessionID,
		input.Config,
	)
	if err != nil {
		s.emitFailedEvent(ctx, input, err)
		return nil, fmt.Errorf("apply failed: %w", err)
	}

	// === CONFIRM ===
	// The provisioner already read back the public key in result.GeneratedFields.
	output := &WireGuardProvisionOutput{
		InterfaceName:     result.InterfaceName,
		PublicKey:         result.GeneratedFields["publicKey"],
		RouterResourceIDs: result.RouterResourceIDs,
		AppliedAt:         time.Now(),
	}

	// === MERGE ===
	// Emit domain event so other systems (polling, monitoring) can react.
	s.emitAppliedEvent(ctx, input, output)

	s.logger.Infow("WireGuard client provisioned successfully",
		"routerID", input.RouterID,
		"name", input.Config.Name,
		"interface", output.InterfaceName,
		"publicKey", output.PublicKey,
	)

	return output, nil
}

// RemoveWireGuardClient removes a previously provisioned WireGuard client.
func (s *WireGuardService) RemoveWireGuardClient(
	ctx context.Context,
	routerID string,
	resourceIDs map[string]string,
) error {

	result := &vpnclient.ProvisionResult{
		RouterResourceIDs: resourceIDs,
	}

	if err := s.vpnProvisioner.RemoveVPNClient(ctx, result); err != nil {
		return fmt.Errorf("failed to remove WireGuard client: %w", err)
	}

	return nil
}

// emitAppliedEvent emits a domain event when WireGuard client is successfully provisioned.
func (s *WireGuardService) emitAppliedEvent(
	ctx context.Context,
	input WireGuardProvisionInput,
	output *WireGuardProvisionOutput,
) {

	if s.publisher == nil {
		return
	}

	event := events.NewBaseEvent(
		"vpn.wireguard.client.applied",
		events.PriorityNormal,
		"wireguard-service",
	)

	payload := map[string]interface{}{
		"routerID":      input.RouterID,
		"sessionID":     input.SessionID,
		"name":          input.Config.Name,
		"interfaceName": output.InterfaceName,
		"publicKey":     output.PublicKey,
		"appliedAt":     output.AppliedAt,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		s.logger.Warnw("failed to marshal applied event payload", "error", err)
		return
	}
	if event.Metadata.Extra == nil {
		event.Metadata.Extra = make(map[string]string)
	}
	event.Metadata.Extra["payload"] = string(payloadBytes)

	if err := s.publisher.Publish(ctx, &event); err != nil {
		s.logger.Warnw("failed to emit applied event", "error", err)
	}
}

// emitFailedEvent emits a domain event when WireGuard client provisioning fails.
func (s *WireGuardService) emitFailedEvent(
	ctx context.Context,
	input WireGuardProvisionInput,
	provisionErr error,
) {

	if s.publisher == nil {
		return
	}

	event := events.NewBaseEvent(
		"vpn.wireguard.client.failed",
		events.PriorityCritical,
		"wireguard-service",
	)

	payload := map[string]interface{}{
		"routerID":  input.RouterID,
		"sessionID": input.SessionID,
		"name":      input.Config.Name,
		"error":     provisionErr.Error(),
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		s.logger.Warnw("failed to marshal failed event payload", "error", err)
		return
	}
	if event.Metadata.Extra == nil {
		event.Metadata.Extra = make(map[string]string)
	}
	event.Metadata.Extra["payload"] = string(payloadBytes)

	if err := s.publisher.Publish(ctx, &event); err != nil {
		s.logger.Warnw("failed to emit failed event", "error", err)
	}
}
