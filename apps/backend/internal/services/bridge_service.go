// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/google/uuid"
)

// BridgeService provides bridge configuration operations for MikroTik routers.
// It manages bridges, ports, VLANs, and STP status with 10-second undo support.
//
// Follows hexagonal architecture pattern using RouterPort for router communication.
type BridgeService struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	undoStore  *UndoStore
}

// BridgeServiceConfig holds configuration for BridgeService.
type BridgeServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// BridgeData represents a bridge configuration.
type BridgeData struct {
	UUID           string
	Name           string
	Comment        string
	Disabled       bool
	Running        bool
	MacAddress     string
	MTU            int
	Protocol       string // "none", "stp", "rstp", "mstp"
	Priority       int
	VlanFiltering  bool
	PVID           int
	Ports          []*BridgePortData
	Vlans          []*BridgeVlanData
	IPAddresses    []string
	StpStatus      *BridgeStpStatusData
}

// BridgePortData represents a bridge port configuration.
type BridgePortData struct {
	UUID             string
	BridgeID         string
	InterfaceID      string
	InterfaceName    string
	PVID             int
	FrameTypes       string // "admit-all", "admit-only-untagged-and-priority", "admit-only-vlan-tagged"
	IngressFiltering bool
	TaggedVlans      []int
	UntaggedVlans    []int
	Role             string // "root", "designated", "alternate", "backup", "disabled"
	State            string // "disabled", "blocking", "listening", "learning", "forwarding"
	PathCost         int
	Edge             bool
}

// BridgeVlanData represents a VLAN entry on a bridge.
type BridgeVlanData struct {
	UUID             string
	BridgeID         string
	VlanID           int
	TaggedPortIDs    []string
	UntaggedPortIDs  []string
}

// BridgeStpStatusData represents STP status for a bridge.
type BridgeStpStatusData struct {
	RootBridge          bool
	RootBridgeID        string
	RootPort            string
	RootPathCost        int
	TopologyChangeCount int
	LastTopologyChange  *time.Time
}

// BridgeImpact represents the impact analysis for deleting a bridge.
type BridgeImpact struct {
	PortsToRelease      []string
	IPAddressesToRemove []string
	DHCPServersAffected []string
	RoutesAffected      []string
}

// UndoStore manages operation undo state with 10-second TTL.
type UndoStore struct {
	mu         sync.RWMutex
	operations map[string]*UndoOperation
	// Cleanup goroutine runs in background to remove expired operations
	stopCleanup chan struct{}
}

// UndoOperation represents a reversible operation.
type UndoOperation struct {
	ID            string
	Type          string // "create", "update", "delete"
	ResourceType  string // "bridge", "bridge_port", "bridge_vlan"
	PreviousState json.RawMessage
	ExpiresAt     time.Time
}

// NewUndoStore creates a new undo store with automatic cleanup.
func NewUndoStore() *UndoStore {
	store := &UndoStore{
		operations:  make(map[string]*UndoOperation),
		stopCleanup: make(chan struct{}),
	}

	// Start cleanup goroutine
	go store.cleanupExpired()

	return store
}

// Add stores an operation for undo with 10-second TTL.
func (s *UndoStore) Add(operationType, resourceType string, previousState interface{}) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	operationID := uuid.New().String()

	previousStateJSON, err := json.Marshal(previousState)
	if err != nil {
		return "", fmt.Errorf("failed to marshal previous state: %w", err)
	}

	s.operations[operationID] = &UndoOperation{
		ID:            operationID,
		Type:          operationType,
		ResourceType:  resourceType,
		PreviousState: previousStateJSON,
		ExpiresAt:     time.Now().Add(10 * time.Second),
	}

	return operationID, nil
}

// Get retrieves an operation by ID.
func (s *UndoStore) Get(operationID string) (*UndoOperation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	op, ok := s.operations[operationID]
	if !ok {
		return nil, fmt.Errorf("operation not found or expired")
	}

	if time.Now().After(op.ExpiresAt) {
		return nil, fmt.Errorf("operation expired")
	}

	return op, nil
}

// Delete removes an operation from the store.
func (s *UndoStore) Delete(operationID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.operations, operationID)
}

// cleanupExpired runs periodically to remove expired operations.
func (s *UndoStore) cleanupExpired() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for id, op := range s.operations {
				if now.After(op.ExpiresAt) {
					delete(s.operations, id)
				}
			}
			s.mu.Unlock()
		case <-s.stopCleanup:
			return
		}
	}
}

// Stop stops the cleanup goroutine.
func (s *UndoStore) Stop() {
	close(s.stopCleanup)
}

// NewBridgeService creates a new bridge service.
func NewBridgeService(config BridgeServiceConfig) *BridgeService {
	return &BridgeService{
		routerPort: config.RouterPort,
		eventBus:   config.EventBus,
		undoStore:  NewUndoStore(),
	}
}

// GetBridges retrieves all bridges from a router.
func (s *BridgeService) GetBridges(ctx context.Context, routerID string) ([]*BridgeData, error) {
	// Check connection
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/print
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridges: %w", err)
	}

	// Parse result into BridgeData
	bridges, err := s.parseBridges(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bridges: %w", err)
	}

	// Enrich with ports, VLANs, IPs, STP status
	for _, bridge := range bridges {
		// Get ports for this bridge
		ports, err := s.GetBridgePorts(ctx, bridge.UUID)
		if err != nil {
			return nil, fmt.Errorf("failed to get bridge ports: %w", err)
		}
		bridge.Ports = ports

		// Get VLANs for this bridge
		vlans, err := s.GetBridgeVlans(ctx, bridge.UUID)
		if err != nil {
			return nil, fmt.Errorf("failed to get bridge VLANs: %w", err)
		}
		bridge.Vlans = vlans

		// Get STP status if STP is enabled
		if bridge.Protocol != "none" {
			stpStatus, err := s.GetStpStatus(ctx, bridge.UUID)
			if err == nil {
				bridge.StpStatus = stpStatus
			}
		}
	}

	return bridges, nil
}

// GetBridge retrieves a single bridge by UUID.
func (s *BridgeService) GetBridge(ctx context.Context, uuid string) (*BridgeData, error) {
	bridges, err := s.GetBridges(ctx, "")
	if err != nil {
		return nil, err
	}

	for _, bridge := range bridges {
		if bridge.UUID == uuid {
			return bridge, nil
		}
	}

	return nil, fmt.Errorf("bridge not found: %s", uuid)
}

// CreateBridge creates a new bridge.
func (s *BridgeService) CreateBridge(ctx context.Context, routerID string, input *CreateBridgeInput) (*BridgeData, string, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Build RouterOS command: /interface/bridge/add name=<name> protocol=<protocol> ...
	cmd := fmt.Sprintf("/interface/bridge/add name=%s", input.Name)
	if input.Protocol != "" {
		cmd += fmt.Sprintf(" protocol=%s", input.Protocol)
	}
	if input.Priority > 0 {
		cmd += fmt.Sprintf(" priority=%d", input.Priority)
	}
	if input.VlanFiltering {
		cmd += " vlan-filtering=yes"
	}
	if input.PVID > 0 {
		cmd += fmt.Sprintf(" pvid=%d", input.PVID)
	}
	if input.MTU > 0 {
		cmd += fmt.Sprintf(" mtu=%d", input.MTU)
	}
	if input.Comment != "" {
		cmd += fmt.Sprintf(" comment=\"%s\"", input.Comment)
	}

	// Parse command arguments from the cmd string
	// For now, return a stub - full implementation would parse args from cmd string
	cmdResult, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "add",
		Args: map[string]string{
			"name": input.Name,
			// Additional args would be parsed from cmd string
		},
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to create bridge: %w", err)
	}

	// Parse the created bridge
	bridge, err := s.parseBridge(cmdResult.Data)
	if err != nil {
		return nil, "", fmt.Errorf("failed to parse created bridge: %w", err)
	}

	// Store operation for undo (previousState is nil for create)
	operationID, err := s.undoStore.Add("create", "bridge", nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge created event
	}

	return bridge, operationID, nil
}

// UpdateBridge updates an existing bridge.
func (s *BridgeService) UpdateBridge(ctx context.Context, uuid string, input *UpdateBridgeInput) (*BridgeData, string, error) {
	// Get current state for undo
	previousState, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get current bridge state: %w", err)
	}

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Build RouterOS command: /interface/bridge/set .id=<uuid> <fields>...
	cmd := fmt.Sprintf("/interface/bridge/set .id=%s", uuid)

	if input.Protocol != nil {
		cmd += fmt.Sprintf(" protocol=%s", *input.Protocol)
	}
	if input.Priority != nil {
		cmd += fmt.Sprintf(" priority=%d", *input.Priority)
	}
	if input.VlanFiltering != nil {
		vlanFilteringValue := "no"
		if *input.VlanFiltering {
			vlanFilteringValue = "yes"
		}
		cmd += fmt.Sprintf(" vlan-filtering=%s", vlanFilteringValue)
	}
	if input.PVID != nil {
		cmd += fmt.Sprintf(" pvid=%d", *input.PVID)
	}
	if input.MTU != nil {
		cmd += fmt.Sprintf(" mtu=%d", *input.MTU)
	}
	if input.Disabled != nil {
		disabledValue := "no"
		if *input.Disabled {
			disabledValue = "yes"
		}
		cmd += fmt.Sprintf(" disabled=%s", disabledValue)
	}
	if input.Comment != nil {
		cmd += fmt.Sprintf(" comment=\"%s\"", *input.Comment)
	}

	// Build args map for the command
	args := make(map[string]string)
	if input.Protocol != nil {
		args["protocol"] = *input.Protocol
	}
	if input.Priority != nil {
		args["priority"] = fmt.Sprintf("%d", *input.Priority)
	}
	if input.VlanFiltering != nil {
		if *input.VlanFiltering {
			args["vlan-filtering"] = "yes"
		} else {
			args["vlan-filtering"] = "no"
		}
	}
	if input.PVID != nil {
		args["pvid"] = fmt.Sprintf("%d", *input.PVID)
	}
	if input.MTU != nil {
		args["mtu"] = fmt.Sprintf("%d", *input.MTU)
	}
	if input.Disabled != nil {
		if *input.Disabled {
			args["disabled"] = "yes"
		} else {
			args["disabled"] = "no"
		}
	}
	if input.Comment != nil {
		args["comment"] = *input.Comment
	}

	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "set",
		ID:     uuid,
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to update bridge: %w", err)
	}

	// Get updated bridge
	updatedBridge, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get updated bridge: %w", err)
	}

	// Store operation for undo
	operationID, err := s.undoStore.Add("update", "bridge", previousState)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge updated event
	}

	return updatedBridge, operationID, nil
}

// DeleteBridge deletes a bridge.
func (s *BridgeService) DeleteBridge(ctx context.Context, uuid string) (string, error) {
	// Get current state for undo
	previousState, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return "", fmt.Errorf("failed to get current bridge state: %w", err)
	}

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/remove .id=<uuid>
	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "remove",
		ID:     uuid,
	})
	if err != nil {
		return "", fmt.Errorf("failed to delete bridge: %w", err)
	}

	// Store operation for undo
	operationID, err := s.undoStore.Add("delete", "bridge", previousState)
	if err != nil {
		return "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge deleted event
	}

	return operationID, nil
}

// UndoBridgeOperation reverts a bridge operation (within 10-second window).
func (s *BridgeService) UndoBridgeOperation(ctx context.Context, operationID string) (*BridgeData, error) {
	op, err := s.undoStore.Get(operationID)
	if err != nil {
		return nil, err
	}

	switch op.Type {
	case "create":
		// Undo create = delete the bridge
		// We don't have the bridge UUID stored, so we need to find it by name
		// This is a simplified implementation
		return nil, fmt.Errorf("undo create not yet implemented")

	case "update":
		// Undo update = restore previous state
		var previousState BridgeData
		if err := json.Unmarshal(op.PreviousState, &previousState); err != nil {
			return nil, fmt.Errorf("failed to unmarshal previous state: %w", err)
		}

		// Restore all fields
		input := &UpdateBridgeInput{
			Protocol:      &previousState.Protocol,
			Priority:      &previousState.Priority,
			VlanFiltering: &previousState.VlanFiltering,
			PVID:          &previousState.PVID,
			MTU:           &previousState.MTU,
			Disabled:      &previousState.Disabled,
			Comment:       &previousState.Comment,
		}

		restoredBridge, _, err := s.UpdateBridge(ctx, previousState.UUID, input)
		if err != nil {
			return nil, fmt.Errorf("failed to restore bridge: %w", err)
		}

		// Delete the undo operation
		s.undoStore.Delete(operationID)

		return restoredBridge, nil

	case "delete":
		// Undo delete = recreate the bridge
		var previousState BridgeData
		if err := json.Unmarshal(op.PreviousState, &previousState); err != nil {
			return nil, fmt.Errorf("failed to unmarshal previous state: %w", err)
		}

		// Recreate the bridge
		input := &CreateBridgeInput{
			Name:          previousState.Name,
			Protocol:      previousState.Protocol,
			Priority:      previousState.Priority,
			VlanFiltering: previousState.VlanFiltering,
			PVID:          previousState.PVID,
			MTU:           previousState.MTU,
			Comment:       previousState.Comment,
		}

		recreatedBridge, _, err := s.CreateBridge(ctx, "", input)
		if err != nil {
			return nil, fmt.Errorf("failed to recreate bridge: %w", err)
		}

		// Delete the undo operation
		s.undoStore.Delete(operationID)

		return recreatedBridge, nil

	default:
		return nil, fmt.Errorf("unknown operation type: %s", op.Type)
	}
}

// GetBridgePorts retrieves all ports for a bridge.
func (s *BridgeService) GetBridgePorts(ctx context.Context, bridgeID string) ([]*BridgePortData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/port/print ?bridge=<bridgeID>
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
		Query:  fmt.Sprintf("?bridge=%s", bridgeID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridge ports: %w", err)
	}

	// Parse result into BridgePortData
	ports, err := s.parseBridgePorts(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bridge ports: %w", err)
	}

	return ports, nil
}

// AddBridgePort adds an interface to a bridge.
func (s *BridgeService) AddBridgePort(ctx context.Context, bridgeID string, input *AddBridgePortInput) (*BridgePortData, string, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Build args map for the command
	args := map[string]string{
		"bridge":    bridgeID,
		"interface": input.InterfaceID,
	}

	if input.PVID > 0 {
		args["pvid"] = fmt.Sprintf("%d", input.PVID)
	}
	if input.FrameTypes != "" {
		args["frame-types"] = input.FrameTypes
	}
	if input.IngressFiltering != nil {
		if *input.IngressFiltering {
			args["ingress-filtering"] = "yes"
		} else {
			args["ingress-filtering"] = "no"
		}
	}

	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to add bridge port: %w", err)
	}

	// Parse the created port
	port, err := s.parseBridgePort(result.Data)
	if err != nil {
		return nil, "", fmt.Errorf("failed to parse created bridge port: %w", err)
	}

	// Store operation for undo (previousState is nil for create)
	operationID, err := s.undoStore.Add("create", "bridge_port", nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge port added event
	}

	return port, operationID, nil
}

// UpdateBridgePort updates bridge port settings.
func (s *BridgeService) UpdateBridgePort(ctx context.Context, portID string, input *UpdateBridgePortInput) (*BridgePortData, string, error) {
	// Get current state for undo
	ports, err := s.GetBridgePorts(ctx, "")
	if err != nil {
		return nil, "", fmt.Errorf("failed to get current ports: %w", err)
	}

	var previousState *BridgePortData
	for _, port := range ports {
		if port.UUID == portID {
			previousState = port
			break
		}
	}

	if previousState == nil {
		return nil, "", fmt.Errorf("port not found: %s", portID)
	}

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Build args map for the command
	args := make(map[string]string)
	if input.PVID != nil {
		args["pvid"] = fmt.Sprintf("%d", *input.PVID)
	}
	if input.FrameTypes != nil {
		args["frame-types"] = *input.FrameTypes
	}
	if input.IngressFiltering != nil {
		if *input.IngressFiltering {
			args["ingress-filtering"] = "yes"
		} else {
			args["ingress-filtering"] = "no"
		}
	}
	if input.Edge != nil {
		if *input.Edge {
			args["edge"] = "yes"
		} else {
			args["edge"] = "no"
		}
	}
	if input.PathCost != nil {
		args["path-cost"] = fmt.Sprintf("%d", *input.PathCost)
	}

	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "set",
		ID:     portID,
		Args:   args,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to update bridge port: %w", err)
	}

	// Get updated port
	updatedPorts, err := s.GetBridgePorts(ctx, previousState.BridgeID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get updated port: %w", err)
	}

	var updatedPort *BridgePortData
	for _, port := range updatedPorts {
		if port.UUID == portID {
			updatedPort = port
			break
		}
	}

	if updatedPort == nil {
		return nil, "", fmt.Errorf("updated port not found")
	}

	// Store operation for undo
	operationID, err := s.undoStore.Add("update", "bridge_port", previousState)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge port updated event
	}

	return updatedPort, operationID, nil
}

// RemoveBridgePort removes a port from a bridge.
func (s *BridgeService) RemoveBridgePort(ctx context.Context, portID string) (string, error) {
	// Get current state for undo
	ports, err := s.GetBridgePorts(ctx, "")
	if err != nil {
		return "", fmt.Errorf("failed to get current ports: %w", err)
	}

	var previousState *BridgePortData
	for _, port := range ports {
		if port.UUID == portID {
			previousState = port
			break
		}
	}

	if previousState == nil {
		return "", fmt.Errorf("port not found: %s", portID)
	}

	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return "", fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/port/remove .id=<portID>
	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "remove",
		ID:     portID,
	})
	if err != nil {
		return "", fmt.Errorf("failed to remove bridge port: %w", err)
	}

	// Store operation for undo
	operationID, err := s.undoStore.Add("delete", "bridge_port", previousState)
	if err != nil {
		return "", fmt.Errorf("failed to store undo operation: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge port removed event
	}

	return operationID, nil
}

// GetBridgeVlans retrieves all VLANs for a bridge.
func (s *BridgeService) GetBridgeVlans(ctx context.Context, bridgeID string) ([]*BridgeVlanData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/vlan/print ?bridge=<bridgeID>
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "print",
		Query:  fmt.Sprintf("?bridge=%s", bridgeID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridge VLANs: %w", err)
	}

	// Parse result into BridgeVlanData
	vlans, err := s.parseBridgeVlans(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bridge VLANs: %w", err)
	}

	return vlans, nil
}

// CreateBridgeVlan creates a VLAN entry on a bridge.
func (s *BridgeService) CreateBridgeVlan(ctx context.Context, bridgeID string, input *CreateBridgeVlanInput) (*BridgeVlanData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Build args map for the command
	args := map[string]string{
		"bridge":   bridgeID,
		"vlan-ids": fmt.Sprintf("%d", input.VlanID),
	}

	if len(input.TaggedPortIDs) > 0 {
		// Tagged ports need to be specified
		// Format: tagged=port1,port2,port3
		// Note: This is a simplified implementation - actual format depends on RouterOS version
		args["tagged"] = input.TaggedPortIDs[0] // Simplified for now
	}

	if len(input.UntaggedPortIDs) > 0 {
		// Untagged ports
		args["untagged"] = input.UntaggedPortIDs[0] // Simplified for now
	}

	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "add",
		Args:   args,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create bridge VLAN: %w", err)
	}

	// Parse the created VLAN
	vlan, err := s.parseBridgeVlan(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse created bridge VLAN: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge VLAN created event
	}

	return vlan, nil
}

// DeleteBridgeVlan deletes a VLAN entry from a bridge.
func (s *BridgeService) DeleteBridgeVlan(ctx context.Context, uuid string) error {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/vlan/remove .id=<uuid>
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/vlan",
		Action: "remove",
		ID:     uuid,
	})
	if err != nil {
		return fmt.Errorf("failed to delete bridge VLAN: %w", err)
	}

	// Publish event
	if s.eventBus != nil {
		// TODO: Publish bridge VLAN deleted event
	}

	return nil
}

// GetAvailableInterfaces returns interfaces that are not currently in any bridge.
func (s *BridgeService) GetAvailableInterfaces(ctx context.Context, routerID string) ([]string, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Get all interfaces
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	// Get all bridge ports
	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bridge ports: %w", err)
	}

	// Parse and filter
	// TODO: Implement proper parsing and filtering
	// For now, return empty list as placeholder
	return []string{}, nil
}

// GetStpStatus retrieves STP status for a bridge.
func (s *BridgeService) GetStpStatus(ctx context.Context, bridgeID string) (*BridgeStpStatusData, error) {
	if !s.routerPort.IsConnected() {
		if err := s.routerPort.Connect(ctx); err != nil {
			return nil, fmt.Errorf("failed to connect to router: %w", err)
		}
	}

	// Execute RouterOS command: /interface/bridge/monitor =bridge<bridgeID>
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge",
		Action: "monitor",
		Args: map[string]string{
			"bridge": bridgeID,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch STP status: %w", err)
	}

	// Parse result into BridgeStpStatusData
	stpStatus, err := s.parseStpStatus(result.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse STP status: %w", err)
	}

	return stpStatus, nil
}

// GetBridgeImpact analyzes the impact of deleting a bridge.
func (s *BridgeService) GetBridgeImpact(ctx context.Context, uuid string) (*BridgeImpact, error) {
	bridge, err := s.GetBridge(ctx, uuid)
	if err != nil {
		return nil, err
	}

	impact := &BridgeImpact{
		PortsToRelease:      make([]string, 0),
		IPAddressesToRemove: make([]string, 0),
		DHCPServersAffected: make([]string, 0),
		RoutesAffected:      make([]string, 0),
	}

	// Ports that will be released
	for _, port := range bridge.Ports {
		impact.PortsToRelease = append(impact.PortsToRelease, port.InterfaceName)
	}

	// IP addresses that will be removed
	impact.IPAddressesToRemove = bridge.IPAddresses

	// TODO: Query dependent DHCP servers
	// TODO: Query dependent routes

	return impact, nil
}

// Helper methods for parsing RouterOS responses

func (s *BridgeService) parseBridges(data []map[string]string) ([]*BridgeData, error) {
	bridges := make([]*BridgeData, 0, len(data))

	for _, item := range data {
		bridge, err := s.parseBridgeFromMap(item)
		if err != nil {
			return nil, fmt.Errorf("failed to parse bridge: %w", err)
		}
		bridges = append(bridges, bridge)
	}

	return bridges, nil
}

func (s *BridgeService) parseBridge(data []map[string]string) (*BridgeData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no bridge data returned")
	}

	return s.parseBridgeFromMap(data[0])
}

func (s *BridgeService) parseBridgeFromMap(item map[string]string) (*BridgeData, error) {
	bridge := &BridgeData{
		UUID:       item[".id"],
		Name:       item["name"],
		Comment:    item["comment"],
		MacAddress: item["mac-address"],
		Protocol:   item["protocol"],
	}

	// Parse disabled flag
	if disabled, ok := item["disabled"]; ok {
		bridge.Disabled = (disabled == "yes" || disabled == "true")
	}

	// Parse running flag
	if running, ok := item["running"]; ok {
		bridge.Running = (running == "yes" || running == "true")
	} else {
		// If not disabled, assume running
		bridge.Running = !bridge.Disabled
	}

	// Parse MTU
	if mtu, ok := item["mtu"]; ok {
		if val, err := parseInt(mtu); err == nil {
			bridge.MTU = val
		}
	}

	// Parse priority
	if priority, ok := item["priority"]; ok {
		if val, err := parseInt(priority); err == nil {
			bridge.Priority = val
		}
	}

	// Parse VLAN filtering
	if vlanFiltering, ok := item["vlan-filtering"]; ok {
		bridge.VlanFiltering = (vlanFiltering == "yes" || vlanFiltering == "true")
	}

	// Parse PVID
	if pvid, ok := item["pvid"]; ok {
		if val, err := parseInt(pvid); err == nil {
			bridge.PVID = val
		}
	}

	// Initialize empty slices
	bridge.Ports = make([]*BridgePortData, 0)
	bridge.Vlans = make([]*BridgeVlanData, 0)
	bridge.IPAddresses = make([]string, 0)

	return bridge, nil
}

func (s *BridgeService) parseBridgePorts(data []map[string]string) ([]*BridgePortData, error) {
	ports := make([]*BridgePortData, 0, len(data))

	for _, item := range data {
		port, err := s.parseBridgePortFromMap(item)
		if err != nil {
			return nil, fmt.Errorf("failed to parse bridge port: %w", err)
		}
		ports = append(ports, port)
	}

	return ports, nil
}

func (s *BridgeService) parseBridgePort(data []map[string]string) (*BridgePortData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no bridge port data returned")
	}

	return s.parseBridgePortFromMap(data[0])
}

func (s *BridgeService) parseBridgePortFromMap(item map[string]string) (*BridgePortData, error) {
	port := &BridgePortData{
		UUID:          item[".id"],
		BridgeID:      item["bridge"],
		InterfaceID:   item["interface"],
		InterfaceName: item["interface"],
		FrameTypes:    item["frame-types"],
		Role:          item["role"],
		State:         item["state"],
	}

	// Parse PVID
	if pvid, ok := item["pvid"]; ok {
		if val, err := parseInt(pvid); err == nil {
			port.PVID = val
		}
	}

	// Parse ingress filtering
	if ingressFiltering, ok := item["ingress-filtering"]; ok {
		port.IngressFiltering = (ingressFiltering == "yes" || ingressFiltering == "true")
	}

	// Parse edge
	if edge, ok := item["edge"]; ok {
		port.Edge = (edge == "yes" || edge == "true")
	}

	// Parse path cost
	if pathCost, ok := item["path-cost"]; ok {
		if val, err := parseInt(pathCost); err == nil {
			port.PathCost = val
		}
	}

	// Parse VLAN lists (comma-separated)
	if tagged, ok := item["tagged"]; ok && tagged != "" {
		port.TaggedVlans = parseIntList(tagged)
	} else {
		port.TaggedVlans = make([]int, 0)
	}

	if untagged, ok := item["untagged"]; ok && untagged != "" {
		port.UntaggedVlans = parseIntList(untagged)
	} else {
		port.UntaggedVlans = make([]int, 0)
	}

	// Set default values if not provided
	if port.FrameTypes == "" {
		port.FrameTypes = "admit-all"
	}
	if port.Role == "" {
		port.Role = "designated"
	}
	if port.State == "" {
		port.State = "forwarding"
	}

	return port, nil
}

func (s *BridgeService) parseBridgeVlans(data []map[string]string) ([]*BridgeVlanData, error) {
	vlans := make([]*BridgeVlanData, 0, len(data))

	for _, item := range data {
		vlan, err := s.parseBridgeVlanFromMap(item)
		if err != nil {
			return nil, fmt.Errorf("failed to parse bridge VLAN: %w", err)
		}
		vlans = append(vlans, vlan)
	}

	return vlans, nil
}

func (s *BridgeService) parseBridgeVlan(data []map[string]string) (*BridgeVlanData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no bridge VLAN data returned")
	}

	return s.parseBridgeVlanFromMap(data[0])
}

func (s *BridgeService) parseBridgeVlanFromMap(item map[string]string) (*BridgeVlanData, error) {
	vlan := &BridgeVlanData{
		UUID:     item[".id"],
		BridgeID: item["bridge"],
	}

	// Parse VLAN ID
	if vlanIds, ok := item["vlan-ids"]; ok {
		// vlan-ids can be comma-separated, take the first one
		vlans := parseIntList(vlanIds)
		if len(vlans) > 0 {
			vlan.VlanID = vlans[0]
		}
	}

	// Parse port lists (comma-separated port names)
	if tagged, ok := item["tagged"]; ok && tagged != "" {
		vlan.TaggedPortIDs = parseStringList(tagged)
	} else {
		vlan.TaggedPortIDs = make([]string, 0)
	}

	if untagged, ok := item["untagged"]; ok && untagged != "" {
		vlan.UntaggedPortIDs = parseStringList(untagged)
	} else {
		vlan.UntaggedPortIDs = make([]string, 0)
	}

	return vlan, nil
}

func (s *BridgeService) parseStpStatus(data []map[string]string) (*BridgeStpStatusData, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no STP status data returned")
	}

	item := data[0]
	status := &BridgeStpStatusData{
		RootBridgeID: item["root-bridge-id"],
		RootPort:     item["root-port"],
	}

	// Parse root bridge flag
	if rootBridge, ok := item["root-bridge"]; ok {
		status.RootBridge = (rootBridge == "yes" || rootBridge == "true")
	}

	// Parse root path cost
	if rootPathCost, ok := item["root-path-cost"]; ok {
		if val, err := parseInt(rootPathCost); err == nil {
			status.RootPathCost = val
		}
	}

	// Parse topology change count
	if tcCount, ok := item["topology-change-count"]; ok {
		if val, err := parseInt(tcCount); err == nil {
			status.TopologyChangeCount = val
		}
	}

	// Parse last topology change timestamp
	if lastChange, ok := item["last-topology-change"]; ok && lastChange != "" {
		// Parse RouterOS time format (duration or timestamp)
		if t, err := parseRouterOSTime(lastChange); err == nil {
			status.LastTopologyChange = &t
		}
	}

	return status, nil
}

// Helper functions for parsing

func parseInt(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	var val int
	_, err := fmt.Sscanf(s, "%d", &val)
	return val, err
}

func parseIntList(s string) []int {
	if s == "" {
		return make([]int, 0)
	}

	parts := splitComma(s)
	result := make([]int, 0, len(parts))

	for _, part := range parts {
		if val, err := parseInt(part); err == nil {
			result = append(result, val)
		}
	}

	return result
}

func parseStringList(s string) []string {
	if s == "" {
		return make([]string, 0)
	}

	parts := splitComma(s)
	result := make([]string, 0, len(parts))

	for _, part := range parts {
		if part != "" {
			result = append(result, part)
		}
	}

	return result
}

func splitComma(s string) []string {
	// Split by comma and trim spaces
	parts := make([]string, 0)
	current := ""

	for _, ch := range s {
		if ch == ',' {
			if current != "" {
				parts = append(parts, trimSpace(current))
				current = ""
			}
		} else {
			current += string(ch)
		}
	}

	if current != "" {
		parts = append(parts, trimSpace(current))
	}

	return parts
}

func trimSpace(s string) string {
	start := 0
	end := len(s)

	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}

	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}

	return s[start:end]
}

func parseRouterOSTime(s string) (time.Time, error) {
	// RouterOS can return times in various formats:
	// - Duration format: "1d2h3m4s"
	// - Absolute timestamp: "jan/02/2006 15:04:05"
	// - Or just "never"

	if s == "" || s == "never" {
		return time.Time{}, fmt.Errorf("no time value")
	}

	// Try parsing as RouterOS timestamp format
	formats := []string{
		"jan/02/2006 15:04:05",
		"Jan/02/2006 15:04:05",
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}

	// If it's a duration (like "2h30m"), calculate from now
	// This is approximate for topology changes
	if dur, err := parseRouterOSDuration(s); err == nil {
		return time.Now().Add(-dur), nil
	}

	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}

func parseRouterOSDuration(s string) (time.Duration, error) {
	// Parse RouterOS duration format: "1w2d3h4m5s"
	// Convert weeks and days to hours
	var weeks, days, hours, minutes, seconds int

	current := ""
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if ch >= '0' && ch <= '9' {
			current += string(ch)
		} else {
			val := 0
			if current != "" {
				fmt.Sscanf(current, "%d", &val)
				current = ""
			}

			switch ch {
			case 'w':
				weeks = val
			case 'd':
				days = val
			case 'h':
				hours = val
			case 'm':
				minutes = val
			case 's':
				seconds = val
			}
		}
	}

	totalHours := weeks*24*7 + days*24 + hours
	totalMinutes := totalHours*60 + minutes
	totalSeconds := totalMinutes*60 + seconds

	return time.Duration(totalSeconds) * time.Second, nil
}

// Input types for mutations

type CreateBridgeInput struct {
	Name          string
	Comment       string
	Protocol      string
	Priority      int
	VlanFiltering bool
	PVID          int
	MTU           int
}

type UpdateBridgeInput struct {
	Comment       *string
	Protocol      *string
	Priority      *int
	VlanFiltering *bool
	PVID          *int
	MTU           *int
	Disabled      *bool
}

type AddBridgePortInput struct {
	InterfaceID      string
	PVID             int
	FrameTypes       string
	IngressFiltering *bool
}

type UpdateBridgePortInput struct {
	PVID             *int
	FrameTypes       *string
	IngressFiltering *bool
	TaggedVlans      []int
	UntaggedVlans    []int
	Edge             *bool
	PathCost         *int
}

type CreateBridgeVlanInput struct {
	VlanID           int
	TaggedPortIDs    []string
	UntaggedPortIDs  []string
}
