//go:build linux

package dhcp

import (
	"fmt"
	"os"

	"github.com/vishvananda/netlink"
	"go.uber.org/zap"
)

// CreateVLANInterface creates a VLAN sub-interface (e.g. eth0.101) on the parent
// interface and brings it up. Returns the created interface name.
func (m *InterfaceManager) CreateVLANInterface(vlanID int) (string, error) {
	ifaceName := fmt.Sprintf("%s.%d", m.parentInterface, vlanID)

	parent, err := netlink.LinkByName(m.parentInterface)
	if err != nil {
		return "", fmt.Errorf("parent interface %s not found: %w", m.parentInterface, err)
	}

	vlan := &netlink.Vlan{
		LinkAttrs: netlink.LinkAttrs{
			Name:        ifaceName,
			ParentIndex: parent.Attrs().Index,
		},
		VlanId: vlanID,
	}

	if err := netlink.LinkAdd(vlan); err != nil {
		return "", fmt.Errorf("failed to create VLAN interface %s: %w", ifaceName, err)
	}

	if err := netlink.LinkSetUp(vlan); err != nil {
		_ = netlink.LinkDel(vlan)
		return "", fmt.Errorf("failed to bring up VLAN interface %s: %w", ifaceName, err)
	}

	m.logger.Info("Created VLAN interface",
		zap.String("interface", ifaceName),
		zap.Int("vlan_id", vlanID),
		zap.String("parent", m.parentInterface),
	)

	return ifaceName, nil
}

// AssignIP assigns an IP address in CIDR notation (e.g. "10.99.101.1/24") to
// the specified interface.
func (m *InterfaceManager) AssignIP(ifaceName, cidr string) error {
	link, err := netlink.LinkByName(ifaceName)
	if err != nil {
		return fmt.Errorf("interface %s not found: %w", ifaceName, err)
	}

	addr, err := netlink.ParseAddr(cidr)
	if err != nil {
		return fmt.Errorf("invalid CIDR %s: %w", cidr, err)
	}

	if err := netlink.AddrAdd(link, addr); err != nil {
		return fmt.Errorf("failed to assign IP %s to %s: %w", cidr, ifaceName, err)
	}

	m.logger.Info("Assigned IP address",
		zap.String("interface", ifaceName),
		zap.String("cidr", cidr),
	)

	return nil
}

// RemoveVLANInterface removes the VLAN sub-interface for the given VLAN ID.
func (m *InterfaceManager) RemoveVLANInterface(vlanID int) error {
	ifaceName := fmt.Sprintf("%s.%d", m.parentInterface, vlanID)

	link, err := netlink.LinkByName(ifaceName)
	if err != nil {
		return fmt.Errorf("interface %s not found: %w", ifaceName, err)
	}

	if err := netlink.LinkDel(link); err != nil {
		return fmt.Errorf("failed to remove VLAN interface %s: %w", ifaceName, err)
	}

	m.logger.Info("Removed VLAN interface",
		zap.String("interface", ifaceName),
		zap.Int("vlan_id", vlanID),
	)

	return nil
}

// ListVLANInterfaces lists all VLAN sub-interfaces on the parent interface.
func (m *InterfaceManager) ListVLANInterfaces() ([]string, error) {
	parent, err := netlink.LinkByName(m.parentInterface)
	if err != nil {
		return nil, fmt.Errorf("parent interface %s not found: %w", m.parentInterface, err)
	}

	links, err := netlink.LinkList()
	if err != nil {
		return nil, fmt.Errorf("failed to list interfaces: %w", err)
	}

	parentIdx := parent.Attrs().Index
	var vlans []string
	for _, link := range links {
		vlan, ok := link.(*netlink.Vlan)
		if !ok {
			continue
		}
		if vlan.Attrs().ParentIndex == parentIdx {
			vlans = append(vlans, vlan.Attrs().Name)
		}
	}

	return vlans, nil
}

// EnableIPForwarding enables IPv4 packet forwarding by writing to /proc/sys/net/ipv4/ip_forward.
func (m *InterfaceManager) EnableIPForwarding() error {
	const procPath = "/proc/sys/net/ipv4/ip_forward"

	if err := os.WriteFile(procPath, []byte("1"), 0644); err != nil {
		return fmt.Errorf("failed to enable IP forwarding: %w", err)
	}

	m.logger.Info("Enabled IPv4 forwarding")
	return nil
}

// GetInterfaceIP returns the first IPv4 address assigned to the named interface,
// or an error if the interface has no addresses.
func (m *InterfaceManager) GetInterfaceIP(ifaceName string) (string, error) {
	link, err := netlink.LinkByName(ifaceName)
	if err != nil {
		return "", fmt.Errorf("interface %s not found: %w", ifaceName, err)
	}

	addrs, err := netlink.AddrList(link, netlink.FAMILY_V4)
	if err != nil {
		return "", fmt.Errorf("failed to list addresses on %s: %w", ifaceName, err)
	}

	if len(addrs) == 0 {
		return "", fmt.Errorf("no IPv4 address on %s", ifaceName)
	}

	return addrs[0].IPNet.String(), nil
}
