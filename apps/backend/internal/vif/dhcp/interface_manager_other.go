//go:build !linux

package dhcp

import "fmt"

// CreateVLANInterface is not supported on non-Linux platforms.
func (m *InterfaceManager) CreateVLANInterface(vlanID int) (string, error) {
	return "", fmt.Errorf("VLAN interface creation requires Linux (netlink)")
}

// AssignIP is not supported on non-Linux platforms.
func (m *InterfaceManager) AssignIP(ifaceName, cidr string) error {
	return fmt.Errorf("IP assignment requires Linux (netlink)")
}

// RemoveVLANInterface is not supported on non-Linux platforms.
func (m *InterfaceManager) RemoveVLANInterface(vlanID int) error {
	return fmt.Errorf("VLAN interface removal requires Linux (netlink)")
}

// ListVLANInterfaces is not supported on non-Linux platforms.
func (m *InterfaceManager) ListVLANInterfaces() ([]string, error) {
	return nil, fmt.Errorf("VLAN interface listing requires Linux (netlink)")
}

// EnableIPForwarding is not supported on non-Linux platforms.
func (m *InterfaceManager) EnableIPForwarding() error {
	return fmt.Errorf("IP forwarding requires Linux (/proc/sys)")
}

// GetInterfaceIP is not supported on non-Linux platforms.
func (m *InterfaceManager) GetInterfaceIP(ifaceName string) (string, error) {
	return "", fmt.Errorf("interface IP query requires Linux (netlink)")
}
