// Package failover reads, changes, stores and restores the failover routes of the VPN clients.
package failover

import "errors"

const (
	routingTable  = "to-VPN"
	probeScope    = "10"
	targetScope   = 11
	guardScope    = 30
	guardDistance = 254
	standbyLabel  = "Standby"
)

var (
	roleNames  = [...]string{"primary", "backup1", "backup2"}
	roleLabels = [...]string{"Primary", "Backup1", "Backup2"}

	resolverRoutes = [...]string{"1.0.0.1/32", "9.9.9.9/32", "8.8.8.8/32"}

	// ProbePool lists the probe addresses a failover client can be given. The first three
	// belong to the wizard's clients, in failover order.
	ProbePool = [...]string{
		"208.67.222.222", "94.140.14.14", "185.228.168.9",
		"208.67.220.220", "94.140.15.15", "185.228.169.9",
	}

	// ErrNoFreeProbe means every probe address already belongs to a failover client.
	ErrNoFreeProbe = errors.New("no free failover probe address is left")
)
