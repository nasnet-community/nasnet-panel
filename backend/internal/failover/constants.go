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

	failoverCommentPrefix   = "Failover "
	probeCommentPrefix      = "Failover probe "
	probeGuardCommentPrefix = "Failover probe guard "

	segmentBridgePrefix = "LANBridge-"
	segmentTablePrefix  = "to-"
	segmentListSuffix   = "-LAN"
	segmentSubnetFormat = "192.168.6%d"
	segmentMaxIndex     = 9
)

// Default addresses of the VPN resolvers, which the VPN-Primary, VPN-Backup1 and VPN-Backup2
// DNS forwarders hold and which the failover routes through the active VPN client.
const (
	ResolverPrimaryIP = "1.0.0.1"
	ResolverBackup1IP = "9.9.9.9"
	ResolverBackup2IP = "8.8.8.8"
)

var (
	roleNames  = [...]string{"primary", "backup1", "backup2"}
	roleLabels = [...]string{"Primary", "Backup1", "Backup2"}

	// ResolverNames are the names of the DNS forwarders that hold the VPN resolvers, in failover order.
	ResolverNames = [...]string{"VPN-Primary", "VPN-Backup1", "VPN-Backup2"}

	defaultResolverIPs = [...]string{ResolverPrimaryIP, ResolverBackup1IP, ResolverBackup2IP}

	// ProbePool lists the probe addresses a failover client can be given. The first three
	// belong to the wizard's clients, in failover order.
	ProbePool = [...]string{
		"208.67.222.222", "94.140.14.14", "185.228.168.9",
		"208.67.220.220", "94.140.15.15", "185.228.169.9",
	}

	// ErrNoFreeProbe means every probe address already belongs to a failover client.
	ErrNoFreeProbe = errors.New("no free failover probe address is left")
)
