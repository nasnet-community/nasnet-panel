package vif

import (
	"fmt"
	"os/exec"
	"sync"

	"go.uber.org/zap"
)

// ContainerNetworkManager manages iptables rules and IP forwarding inside the
// NNC container for routing traffic between ingress and egress VLAN interfaces.
type ContainerNetworkManager struct {
	rules  map[string]*ForwardingRule // key: "ingressVLAN:egressVLAN"
	mu     sync.RWMutex
	logger *zap.Logger
}

// ForwardingRule represents an iptables forwarding rule set between an ingress
// and egress VLAN interface inside the container.
type ForwardingRule struct {
	IngressInterface string // e.g. "eth0.101"
	EgressInterface  string // e.g. "eth0.154"
	IngressSubnet    string // e.g. "10.99.101.0/24"
	Active           bool
}

// ServiceRoutingConfig defines how traffic flows through a service:
// from ingress VLAN → service process → egress VLAN.
type ServiceRoutingConfig struct {
	IngressVLANID    int    // Ingress VLAN ID (100-149)
	EgressVLANID     int    // Egress VLAN ID (150-199)
	IngressInterface string // Container interface (e.g. "eth0.101")
	EgressInterface  string // Container interface (e.g. "eth0.154")
	IngressSubnet    string // Ingress subnet CIDR (e.g. "10.99.101.0/24")
}

// NewContainerNetworkManager creates a new container network manager.
func NewContainerNetworkManager(logger *zap.Logger) *ContainerNetworkManager {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &ContainerNetworkManager{
		rules:  make(map[string]*ForwardingRule),
		logger: logger.Named("container_network"),
	}
}

// SetupServiceRouting configures iptables rules for forwarding traffic from an
// ingress VLAN interface to an egress VLAN interface.
//
// Rules created:
//   - NAT POSTROUTING: MASQUERADE outbound traffic from ingress subnet on egress interface
//   - FORWARD: Allow ingress → egress traffic
//   - FORWARD: Allow established/related egress → ingress traffic
func (m *ContainerNetworkManager) SetupServiceRouting(config ServiceRoutingConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := fmt.Sprintf("%d:%d", config.IngressVLANID, config.EgressVLANID)
	if _, exists := m.rules[key]; exists {
		return fmt.Errorf("forwarding rule already exists for %s", key)
	}

	// 1. NAT MASQUERADE: outbound traffic from ingress subnet on egress interface
	if err := m.runIPTables("-t", "nat", "-A", "POSTROUTING",
		"-s", config.IngressSubnet,
		"-o", config.EgressInterface,
		"-j", "MASQUERADE"); err != nil {
		return fmt.Errorf("add MASQUERADE rule: %w", err)
	}

	// 2. FORWARD: allow ingress → egress
	if err := m.runIPTables("-A", "FORWARD",
		"-i", config.IngressInterface,
		"-o", config.EgressInterface,
		"-j", "ACCEPT"); err != nil {
		// Rollback NAT rule
		_ = m.runIPTables("-t", "nat", "-D", "POSTROUTING", //nolint:errcheck // best-effort cleanup
			"-s", config.IngressSubnet,
			"-o", config.EgressInterface,
			"-j", "MASQUERADE")
		return fmt.Errorf("add FORWARD ingress→egress rule: %w", err)
	}

	// 3. FORWARD: allow established/related egress → ingress
	if err := m.runIPTables("-A", "FORWARD",
		"-i", config.EgressInterface,
		"-o", config.IngressInterface,
		"-m", "state", "--state", "RELATED,ESTABLISHED",
		"-j", "ACCEPT"); err != nil {
		// Rollback previous rules
		_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
			"-i", config.IngressInterface,
			"-o", config.EgressInterface,
			"-j", "ACCEPT")
		_ = m.runIPTables("-t", "nat", "-D", "POSTROUTING", //nolint:errcheck // best-effort cleanup
			"-s", config.IngressSubnet,
			"-o", config.EgressInterface,
			"-j", "MASQUERADE")
		return fmt.Errorf("add FORWARD egress→ingress rule: %w", err)
	}

	m.rules[key] = &ForwardingRule{
		IngressInterface: config.IngressInterface,
		EgressInterface:  config.EgressInterface,
		IngressSubnet:    config.IngressSubnet,
		Active:           true,
	}

	m.logger.Info("service routing configured",
		zap.Int("ingress_vlan", config.IngressVLANID),
		zap.Int("egress_vlan", config.EgressVLANID),
		zap.String("ingress_iface", config.IngressInterface),
		zap.String("egress_iface", config.EgressInterface),
	)

	return nil
}

// RemoveServiceRouting removes iptables forwarding rules for the given VLAN pair.
func (m *ContainerNetworkManager) RemoveServiceRouting(ingressVLANID, egressVLANID int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := fmt.Sprintf("%d:%d", ingressVLANID, egressVLANID)
	rule, exists := m.rules[key]
	if !exists {
		return fmt.Errorf("no forwarding rule for %s", key)
	}

	// Remove in reverse order
	_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
		"-i", rule.EgressInterface,
		"-o", rule.IngressInterface,
		"-m", "state", "--state", "RELATED,ESTABLISHED",
		"-j", "ACCEPT")

	_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
		"-i", rule.IngressInterface,
		"-o", rule.EgressInterface,
		"-j", "ACCEPT")

	_ = m.runIPTables("-t", "nat", "-D", "POSTROUTING", //nolint:errcheck // best-effort cleanup
		"-s", rule.IngressSubnet,
		"-o", rule.EgressInterface,
		"-j", "MASQUERADE")

	delete(m.rules, key)

	m.logger.Info("service routing removed",
		zap.Int("ingress_vlan", ingressVLANID),
		zap.Int("egress_vlan", egressVLANID),
	)

	return nil
}

// RemoveAllRouting removes all iptables forwarding rules managed by this manager.
func (m *ContainerNetworkManager) RemoveAllRouting() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for key, rule := range m.rules {
		_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
			"-i", rule.EgressInterface,
			"-o", rule.IngressInterface,
			"-m", "state", "--state", "RELATED,ESTABLISHED",
			"-j", "ACCEPT")

		_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
			"-i", rule.IngressInterface,
			"-o", rule.EgressInterface,
			"-j", "ACCEPT")

		_ = m.runIPTables("-t", "nat", "-D", "POSTROUTING", //nolint:errcheck // best-effort cleanup
			"-s", rule.IngressSubnet,
			"-o", rule.EgressInterface,
			"-j", "MASQUERADE")

		m.logger.Info("removed routing rule", zap.String("key", key))
	}

	m.rules = make(map[string]*ForwardingRule)
}

// TeardownServiceRouting removes all iptables rules associated with the given
// ingress interface. It iterates all tracked rules and removes those matching
// the ingress interface.
func (m *ContainerNetworkManager) TeardownServiceRouting(ingressIface string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for key, rule := range m.rules {
		if rule.IngressInterface != ingressIface {
			continue
		}

		// Remove in reverse order
		_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
			"-i", rule.EgressInterface,
			"-o", rule.IngressInterface,
			"-m", "state", "--state", "RELATED,ESTABLISHED",
			"-j", "ACCEPT")

		_ = m.runIPTables("-D", "FORWARD", //nolint:errcheck // best-effort cleanup
			"-i", rule.IngressInterface,
			"-o", rule.EgressInterface,
			"-j", "ACCEPT")

		_ = m.runIPTables("-t", "nat", "-D", "POSTROUTING", //nolint:errcheck // best-effort cleanup
			"-s", rule.IngressSubnet,
			"-o", rule.EgressInterface,
			"-j", "MASQUERADE")

		delete(m.rules, key)
	}

	// Remove any DNS redirect rules on this ingress interface
	_ = m.runIPTables("-t", "nat", "-D", "PREROUTING", //nolint:errcheck // best-effort cleanup
		"-i", ingressIface,
		"-p", "udp", "--dport", "53",
		"-j", "REDIRECT")
	_ = m.runIPTables("-t", "nat", "-D", "PREROUTING", //nolint:errcheck // best-effort cleanup
		"-i", ingressIface,
		"-p", "tcp", "--dport", "53",
		"-j", "REDIRECT")

	m.logger.Info("service routing torn down",
		zap.String("ingress", ingressIface))

	return nil
}

// SetupDNSRedirect redirects DNS traffic (port 53) arriving on the ingress
// interface to the specified local DNS service port (e.g. AdGuard Home).
func (m *ContainerNetworkManager) SetupDNSRedirect(ingressIface string, dnsPort int) error {
	portStr := fmt.Sprintf("%d", dnsPort)

	// Redirect UDP DNS
	if err := m.runIPTables("-t", "nat", "-A", "PREROUTING",
		"-i", ingressIface,
		"-p", "udp", "--dport", "53",
		"-j", "REDIRECT", "--to-port", portStr); err != nil {
		return fmt.Errorf("add UDP DNS redirect: %w", err)
	}

	// Redirect TCP DNS
	if err := m.runIPTables("-t", "nat", "-A", "PREROUTING",
		"-i", ingressIface,
		"-p", "tcp", "--dport", "53",
		"-j", "REDIRECT", "--to-port", portStr); err != nil {
		return fmt.Errorf("add TCP DNS redirect: %w", err)
	}

	m.logger.Info("DNS redirect configured",
		zap.String("ingress", ingressIface),
		zap.Int("dns_port", dnsPort))

	return nil
}

// ListRules returns all active forwarding rules.
func (m *ContainerNetworkManager) ListRules() []*ForwardingRule {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]*ForwardingRule, 0, len(m.rules))
	for _, rule := range m.rules {
		r := *rule // copy
		result = append(result, &r)
	}
	return result
}

// runIPTables executes an iptables command with the given arguments.
func (m *ContainerNetworkManager) runIPTables(args ...string) error {
	cmd := exec.Command("iptables", args...) //nolint:noctx // iptables commands are synchronous operations without context
	output, err := cmd.CombinedOutput()
	if err != nil {
		m.logger.Warn("iptables command failed",
			zap.Strings("args", args),
			zap.String("output", string(output)),
			zap.Error(err),
		)
		return fmt.Errorf("iptables %v: %s: %w", args, string(output), err)
	}
	return nil
}
