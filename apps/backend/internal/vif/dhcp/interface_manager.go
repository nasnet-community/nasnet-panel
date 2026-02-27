package dhcp

import (
	"net"

	"go.uber.org/zap"
)

// InterfaceManager manages VLAN sub-interfaces inside the container using netlink.
// It creates, configures, and removes VLAN sub-interfaces on a parent interface (e.g. "eth0").
type InterfaceManager struct {
	parentInterface string
	logger          *zap.Logger
}

// NewInterfaceManager creates a new InterfaceManager for the given parent interface.
func NewInterfaceManager(parentInterface string, logger *zap.Logger) *InterfaceManager {
	return &InterfaceManager{
		parentInterface: parentInterface,
		logger:          logger,
	}
}

// InterfaceExists checks whether a network interface with the given name exists.
func (m *InterfaceManager) InterfaceExists(ifaceName string) bool {
	_, err := net.InterfaceByName(ifaceName)
	return err == nil
}
