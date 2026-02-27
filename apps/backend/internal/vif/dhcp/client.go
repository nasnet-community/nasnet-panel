package dhcp

import (
	"context"
	"fmt"
	"sync"

	"go.uber.org/zap"
)

// Client manages udhcpc instances per Egress VLAN.
type Client struct {
	supervisor   ProcessSupervisor
	ifaceMgr     *InterfaceManager
	callbackPath string
	listenAddr   string
	clients      map[int]*ClientInstance
	statusCh     chan ClientStatus
	mu           sync.RWMutex
	logger       *zap.Logger
}

// ClientInstance represents a running udhcpc process.
type ClientInstance struct {
	VLANID    int
	Interface string
	PIDFile   string
	ProcessID string
	Status    ClientStatus
}

// NewClient creates a new DHCP Client manager.
func NewClient(supervisor ProcessSupervisor, ifaceMgr *InterfaceManager, logger *zap.Logger) *Client {
	return &Client{
		supervisor:   supervisor,
		ifaceMgr:     ifaceMgr,
		callbackPath: "/app/dhcp-callback.sh",
		listenAddr:   "127.0.0.1:8099",
		clients:      make(map[int]*ClientInstance),
		statusCh:     make(chan ClientStatus, 32),
		logger:       logger,
	}
}

// StartClient starts a udhcpc DHCP client on the egress VLAN sub-interface.
// It creates the VLAN interface, writes the callback script, and launches udhcpc
// via the process supervisor.
func (c *Client) StartClient(ctx context.Context, config EgressConfig) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.clients[config.VLANID]; exists {
		return fmt.Errorf("udhcpc already running for VLAN %d", config.VLANID)
	}

	// Create VLAN sub-interface
	ifaceName, err := c.ifaceMgr.CreateVLANInterface(config.VLANID)
	if err != nil {
		return fmt.Errorf("create VLAN interface: %w", err)
	}

	// Write callback script if not exists
	if err := WriteCallbackScript(c.callbackPath, c.listenAddr); err != nil {
		_ = c.ifaceMgr.RemoveVLANInterface(config.VLANID) //nolint:errcheck // best-effort cleanup
		return fmt.Errorf("write callback script: %w", err)
	}

	// Start udhcpc
	pidFile := fmt.Sprintf("/var/run/udhcpc-%d.pid", config.VLANID)
	processID := fmt.Sprintf("udhcpc-%d", config.VLANID)

	args := []string{
		"-i", ifaceName,
		"-s", c.callbackPath,
		"-f", // foreground for supervisor
		"-p", pidFile,
	}

	if err := c.supervisor.Start(processID, "udhcpc", args); err != nil {
		_ = c.ifaceMgr.RemoveVLANInterface(config.VLANID) //nolint:errcheck // best-effort cleanup
		return fmt.Errorf("start udhcpc: %w", err)
	}

	c.clients[config.VLANID] = &ClientInstance{
		VLANID:    config.VLANID,
		Interface: ifaceName,
		PIDFile:   pidFile,
		ProcessID: processID,
		Status: ClientStatus{
			VLANID:    config.VLANID,
			Interface: ifaceName,
			Status:    "obtaining",
		},
	}

	c.logger.Info("udhcpc started",
		zap.Int("vlan_id", config.VLANID),
		zap.String("interface", ifaceName),
	)

	return nil
}

// StopClient stops the udhcpc process for the given VLAN and removes the interface.
func (c *Client) StopClient(ctx context.Context, vlanID int) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	inst, exists := c.clients[vlanID]
	if !exists {
		return fmt.Errorf("no udhcpc running for VLAN %d", vlanID)
	}

	if err := c.supervisor.Stop(inst.ProcessID); err != nil {
		c.logger.Warn("failed to stop udhcpc", zap.Error(err), zap.Int("vlan_id", vlanID))
	}

	if err := c.ifaceMgr.RemoveVLANInterface(vlanID); err != nil {
		c.logger.Warn("failed to remove VLAN interface", zap.Error(err), zap.Int("vlan_id", vlanID))
	}

	delete(c.clients, vlanID)
	c.logger.Info("udhcpc stopped", zap.Int("vlan_id", vlanID))
	return nil
}

// GetStatus returns the current DHCP client status for a VLAN.
func (c *Client) GetStatus(vlanID int) (*ClientStatus, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	inst, exists := c.clients[vlanID]
	if !exists {
		return nil, fmt.Errorf("no udhcpc running for VLAN %d", vlanID)
	}
	return &inst.Status, nil
}

// OnLeaseObtained is called by the callback HTTP handler when udhcpc gets a lease.
// It updates the clients map and sends the status to statusCh.
func (c *Client) OnLeaseObtained(status ClientStatus) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if inst, exists := c.clients[status.VLANID]; exists {
		inst.Status = status
	}

	select {
	case c.statusCh <- status:
	default:
		c.logger.Warn("DHCP status channel full, dropping update",
			zap.Int("vlan_id", status.VLANID))
	}
}

// StatusChannel returns a read-only channel for lease updates.
func (c *Client) StatusChannel() <-chan ClientStatus {
	return c.statusCh
}
