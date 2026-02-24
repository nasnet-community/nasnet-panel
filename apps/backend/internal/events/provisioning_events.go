package events

import (
	"encoding/json"
	"time"
)

// Event type constants are defined in classification.go

// ProvisioningSessionAppliedEvent is emitted when a provisioning session is fully applied.
type ProvisioningSessionAppliedEvent struct {
	BaseEvent
	SessionID     string   `json:"sessionId"`
	RouterID      string   `json:"routerId"`
	ResourceCount int      `json:"resourceCount"`
	ResourceIDs   []string `json:"resourceIds"`
	Duration      int      `json:"duration"` // milliseconds
	AppliedBy     string   `json:"appliedBy,omitempty"`
}

func (e *ProvisioningSessionAppliedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewProvisioningSessionAppliedEvent(sessionID, routerID string, resourceCount int, resourceIDs []string, durationMs int, source string) *ProvisioningSessionAppliedEvent {
	return &ProvisioningSessionAppliedEvent{
		BaseEvent:     NewBaseEvent(EventTypeProvisioningSessionApplied, PriorityNormal, source),
		SessionID:     sessionID,
		RouterID:      routerID,
		ResourceCount: resourceCount,
		ResourceIDs:   resourceIDs,
		Duration:      durationMs,
	}
}

// ProvisioningSessionFailedEvent is emitted when a provisioning session fails.
type ProvisioningSessionFailedEvent struct {
	BaseEvent
	SessionID    string `json:"sessionId"`
	RouterID     string `json:"routerId"`
	FailedPhase  string `json:"failedPhase"`
	ErrorMessage string `json:"errorMessage"`
	RolledBack   bool   `json:"rolledBack"`
}

func (e *ProvisioningSessionFailedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewProvisioningSessionFailedEvent(sessionID, routerID, failedPhase, errorMessage string, rolledBack bool, source string) *ProvisioningSessionFailedEvent {
	return &ProvisioningSessionFailedEvent{
		BaseEvent:    NewBaseEvent(EventTypeProvisioningSessionFailed, PriorityCritical, source),
		SessionID:    sessionID,
		RouterID:     routerID,
		FailedPhase:  failedPhase,
		ErrorMessage: errorMessage,
		RolledBack:   rolledBack,
	}
}

// WireGuardClientAppliedEvent is emitted when a WireGuard client is provisioned.
type WireGuardClientAppliedEvent struct {
	BaseEvent
	RouterID      string `json:"routerId"`
	ResourceID    string `json:"resourceId"`
	InterfaceName string `json:"interfaceName"`
	PeerEndpoint  string `json:"peerEndpoint"`
	PublicKey     string `json:"publicKey,omitempty"`
	WANType       string `json:"wanType,omitempty"`
}

func (e *WireGuardClientAppliedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewWireGuardClientAppliedEvent(routerID, resourceID, interfaceName, peerEndpoint, publicKey, wanType, source string) *WireGuardClientAppliedEvent {
	return &WireGuardClientAppliedEvent{
		BaseEvent:     NewBaseEvent(EventTypeWireGuardClientApplied, PriorityNormal, source),
		RouterID:      routerID,
		ResourceID:    resourceID,
		InterfaceName: interfaceName,
		PeerEndpoint:  peerEndpoint,
		PublicKey:     publicKey,
		WANType:       wanType,
	}
}

// WANLinkAppliedEvent is emitted when a WAN link is provisioned.
type WANLinkAppliedEvent struct {
	BaseEvent
	RouterID       string    `json:"routerId"`
	ResourceID     string    `json:"resourceId"`
	InterfaceName  string    `json:"interfaceName"`
	ConnectionType string    `json:"connectionType"`
	WANType        string    `json:"wanType"`
	AppliedAt      time.Time `json:"appliedAt"`
}

func (e *WANLinkAppliedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewWANLinkAppliedEvent(routerID, resourceID, interfaceName, connectionType, wanType, source string) *WANLinkAppliedEvent {
	return &WANLinkAppliedEvent{
		BaseEvent:      NewBaseEvent(EventTypeWANLinkApplied, PriorityNormal, source),
		RouterID:       routerID,
		ResourceID:     resourceID,
		InterfaceName:  interfaceName,
		ConnectionType: connectionType,
		WANType:        wanType,
		AppliedAt:      time.Now(),
	}
}

// TunnelAppliedEvent is emitted when a tunnel is provisioned.
type TunnelAppliedEvent struct {
	BaseEvent
	RouterID      string    `json:"routerId"`
	ResourceID    string    `json:"resourceId"`
	TunnelType    string    `json:"tunnelType"`
	InterfaceName string    `json:"interfaceName"`
	LocalAddress  string    `json:"localAddress"`
	RemoteAddress string    `json:"remoteAddress"`
	AppliedAt     time.Time `json:"appliedAt"`
}

func (e *TunnelAppliedEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewTunnelAppliedEvent(routerID, resourceID, tunnelType, interfaceName, localAddress, remoteAddress, source string) *TunnelAppliedEvent {
	return &TunnelAppliedEvent{
		BaseEvent:     NewBaseEvent(EventTypeTunnelApplied, PriorityNormal, source),
		RouterID:      routerID,
		ResourceID:    resourceID,
		TunnelType:    tunnelType,
		InterfaceName: interfaceName,
		LocalAddress:  localAddress,
		RemoteAddress: remoteAddress,
		AppliedAt:     time.Now(),
	}
}
