package dhcp

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"go.uber.org/zap"
)

// ProcessSupervisor manages process lifecycle.
type ProcessSupervisor interface {
	Start(id string, cmd string, args []string) error
	Stop(id string) error
	IsRunning(id string) bool
}

// Server manages udhcpd instances per Ingress VLAN.
type Server struct {
	supervisor ProcessSupervisor
	ifaceMgr   *InterfaceManager
	configDir  string // /etc/
	leaseDir   string // /var/lib/dhcp/
	servers    map[int]*ServerInstance
	mu         sync.RWMutex
	logger     *zap.Logger
}

// ServerInstance represents a running udhcpd process.
type ServerInstance struct {
	VLANID     int
	Interface  string
	ConfigPath string
	PIDFile    string
	LeaseFile  string
	ProcessID  string
	Config     IngressConfig
}

func NewServer(supervisor ProcessSupervisor, ifaceMgr *InterfaceManager, logger *zap.Logger) *Server {
	return &Server{
		supervisor: supervisor,
		ifaceMgr:   ifaceMgr,
		configDir:  "/etc",
		leaseDir:   "/var/lib/dhcp",
		servers:    make(map[int]*ServerInstance),
		logger:     logger,
	}
}

func (s *Server) StartServer(ctx context.Context, config IngressConfig) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.servers[config.VLANID]; exists {
		return fmt.Errorf("udhcpd already running for VLAN %d", config.VLANID)
	}

	// Create VLAN sub-interface
	ifaceName, err := s.ifaceMgr.CreateVLANInterface(config.VLANID)
	if err != nil {
		return fmt.Errorf("create VLAN interface: %w", err)
	}

	// Assign IP
	if err := s.ifaceMgr.AssignIP(ifaceName, config.IPAddress); err != nil {
		_ = s.ifaceMgr.RemoveVLANInterface(config.VLANID) //nolint:errcheck // best-effort cleanup
		return fmt.Errorf("assign IP: %w", err)
	}

	// Ensure lease directory exists
	if err := os.MkdirAll(s.leaseDir, 0o755); err != nil {
		return fmt.Errorf("create lease dir: %w", err)
	}

	// Generate config
	configPath := filepath.Join(s.configDir, fmt.Sprintf("udhcpd-%d.conf", config.VLANID))
	leaseFile := filepath.Join(s.leaseDir, fmt.Sprintf("udhcpd-%d.leases", config.VLANID))
	pidFile := fmt.Sprintf("/var/run/udhcpd-%d.pid", config.VLANID)

	configContent := s.generateConfig(config, ifaceName, leaseFile, pidFile)
	if err := os.WriteFile(configPath, []byte(configContent), 0o644); err != nil {
		return fmt.Errorf("write config: %w", err)
	}

	// Create empty lease file
	if err := os.WriteFile(leaseFile, []byte{}, 0o644); err != nil {
		return fmt.Errorf("create lease file: %w", err)
	}

	// Start udhcpd
	processID := fmt.Sprintf("udhcpd-%d", config.VLANID)
	if err := s.supervisor.Start(processID, "udhcpd", []string{"-f", configPath}); err != nil {
		// Cleanup config and lease files on start failure
		_ = os.Remove(configPath)
		_ = os.Remove(leaseFile)
		_ = s.ifaceMgr.RemoveVLANInterface(config.VLANID) //nolint:errcheck // best-effort cleanup
		return fmt.Errorf("start udhcpd: %w", err)
	}

	s.servers[config.VLANID] = &ServerInstance{
		VLANID:     config.VLANID,
		Interface:  ifaceName,
		ConfigPath: configPath,
		PIDFile:    pidFile,
		LeaseFile:  leaseFile,
		ProcessID:  processID,
		Config:     config,
	}

	s.logger.Info("udhcpd started",
		zap.Int("vlan_id", config.VLANID),
		zap.String("interface", ifaceName),
	)

	return nil
}

func (s *Server) StopServer(ctx context.Context, vlanID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	inst, exists := s.servers[vlanID]
	if !exists {
		return fmt.Errorf("no udhcpd running for VLAN %d", vlanID)
	}

	// Stop process
	if err := s.supervisor.Stop(inst.ProcessID); err != nil {
		s.logger.Warn("failed to stop udhcpd", zap.Error(err), zap.Int("vlan_id", vlanID))
	}

	// Remove VLAN interface
	if err := s.ifaceMgr.RemoveVLANInterface(vlanID); err != nil {
		s.logger.Warn("failed to remove VLAN interface", zap.Error(err), zap.Int("vlan_id", vlanID))
	}

	// Cleanup config and lease files
	_ = os.Remove(inst.ConfigPath)
	_ = os.Remove(inst.LeaseFile)

	delete(s.servers, vlanID)

	s.logger.Info("udhcpd stopped", zap.Int("vlan_id", vlanID))
	return nil
}

func (s *Server) GetLeases(vlanID int) ([]LeaseEntry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	inst, exists := s.servers[vlanID]
	if !exists {
		return nil, fmt.Errorf("no udhcpd running for VLAN %d", vlanID)
	}

	return ParseLeaseFile(inst.LeaseFile)
}

func (s *Server) generateConfig(config IngressConfig, ifaceName, leaseFile, pidFile string) string {
	// Strip CIDR from IP for router/dns options
	ip := config.IPAddress
	if idx := strings.IndexByte(ip, '/'); idx != -1 {
		ip = ip[:idx]
	}

	dns := config.DNS
	if dns == "" {
		dns = ip
	}

	leaseTime := config.LeaseTime
	if leaseTime <= 0 {
		leaseTime = 3600
	}

	var b strings.Builder
	fmt.Fprintf(&b, "start %s\n", config.DHCPStart)
	fmt.Fprintf(&b, "end %s\n", config.DHCPEnd)
	fmt.Fprintf(&b, "interface %s\n", ifaceName)
	fmt.Fprintf(&b, "opt dns %s\n", dns)
	fmt.Fprintf(&b, "opt router %s\n", ip)
	fmt.Fprintf(&b, "opt subnet 255.255.255.0\n")
	fmt.Fprintf(&b, "opt lease %d\n", leaseTime)
	fmt.Fprintf(&b, "lease_file %s\n", leaseFile)
	fmt.Fprintf(&b, "pidfile %s\n", pidFile)
	return b.String()
}
