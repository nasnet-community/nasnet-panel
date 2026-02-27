// Package wan provides WAN interface configuration and monitoring for MikroTik routers.
package wan

import "time"

// WANInterfaceData represents enriched WAN interface information.
//
//nolint:revive // exported WAN type
type WANInterfaceData struct {
	ID             string
	InterfaceName  string
	ConnectionType string // "DHCP", "PPPOE", "STATIC", "LTE", "NONE"
	Status         string // "CONNECTED", "CONNECTING", "DISCONNECTED", "ERROR", "DISABLED"
	PublicIP       string
	Gateway        string
	PrimaryDNS     string
	SecondaryDNS   string
	Uptime         time.Duration
	LastConnected  time.Time
	IsDefaultRoute bool
	HealthStatus   string // "HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"
	HealthTarget   string
	HealthLatency  int
	HealthEnabled  bool
	DhcpClient     *DhcpClientData
	PppoeClient    *PppoeClientData
	StaticConfig   *StaticIPConfigData
	LteModem       *LteModemData
}

// DhcpClientData represents DHCP client configuration.
type DhcpClientData struct {
	ID              string
	Interface       string
	Disabled        bool
	AddDefaultRoute bool
	UsePeerDNS      bool
	UsePeerNTP      bool
	Status          string
	Address         string
	DhcpServer      string
	Gateway         string
	ExpiresAfter    time.Duration
	Comment         string
}

// PppoeClientData represents PPPoE client configuration.
type PppoeClientData struct {
	ID              string
	Name            string
	Interface       string
	Disabled        bool
	Username        string
	ServiceName     string
	AddDefaultRoute bool
	UsePeerDNS      bool
	Running         bool
	MTU             int
	MRU             int
	Comment         string
}

// StaticIPConfigData represents static IP WAN configuration.
type StaticIPConfigData struct {
	ID           string
	Interface    string
	Address      string
	Gateway      string
	PrimaryDNS   string
	SecondaryDNS string
	Comment      string
}

// LteModemData represents LTE modem configuration.
type LteModemData struct {
	ID             string
	Name           string
	APN            string
	SignalStrength int
	Running        bool
	Operator       string
	NetworkType    string
	PinConfigured  bool
	Comment        string
}

// ConnectionEventData represents a WAN connection history event.
type ConnectionEventData struct {
	ID             string
	WANInterfaceID string
	EventType      string // "CONNECTED", "DISCONNECTED", "AUTH_FAILED", "IP_CHANGED", etc.
	Timestamp      time.Time
	PublicIP       string
	Gateway        string
	Reason         string
	Duration       time.Duration
}

// DhcpClientInput holds input for configuring DHCP client.
type DhcpClientInput struct {
	Interface       string
	AddDefaultRoute bool
	UsePeerDNS      bool
	UsePeerNTP      bool
	Comment         string
}

// PppoeClientInput holds input for configuring PPPoE client.
type PppoeClientInput struct {
	Name            string
	Interface       string
	Username        string
	Password        string //nolint:gosec // G101: credential field required for PPPoE authentication
	ServiceName     string
	AddDefaultRoute bool
	UsePeerDNS      bool
	MTU             int
	MRU             int
	Comment         string
}

// StaticIPInput holds input for configuring static IP.
type StaticIPInput struct {
	Interface    string
	Address      string
	Gateway      string
	PrimaryDNS   string
	SecondaryDNS string
	Comment      string
}

// LteModemInput holds input for configuring LTE modem.
type LteModemInput struct {
	Interface      string
	APN            string
	Pin            string
	Username       string
	Password       string //nolint:gosec // G101: credential field required for LTE authentication
	AuthProtocol   string
	IsDefaultRoute bool
	Enabled        bool
	MTU            int
	ProfileNumber  int
	Comment        string
}

// HealthCheckInput holds input for configuring health checks.
type HealthCheckInput struct {
	Target   string
	Interval int
	Enabled  bool
}
