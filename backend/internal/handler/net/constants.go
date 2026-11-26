// Package net holds the net API group handlers.
package net

// Netwatch host type constants.
const (
	NetwatchHostTypeForeign  NetwatchHostType = "foreign"
	NetwatchHostTypeVPN      NetwatchHostType = "vpn"
	NetwatchHostTypeDomestic NetwatchHostType = "domestic"
)

// netwatchHostTypeOrder is the order GET /api/net/status returns the types in.
var netwatchHostTypeOrder = []NetwatchHostType{NetwatchHostTypeForeign, NetwatchHostTypeDomestic, NetwatchHostTypeVPN}

// netwatchComments maps a failover probe's comment to its type and its preference within the
// type: the lower the rank, the sooner it is picked when probes of a type are otherwise equal.
var netwatchComments = map[string]netwatchComment{
	"Failover Netwatch - Foreign Link":  {hostType: NetwatchHostTypeForeign, rank: 0},
	"Failover DNS probe Foreign":        {hostType: NetwatchHostTypeForeign, rank: 1},
	"Failover Netwatch - Domestic Link": {hostType: NetwatchHostTypeDomestic, rank: 0},
	"Failover DNS probe Domestic":       {hostType: NetwatchHostTypeDomestic, rank: 1},
	"Failover DNS probe Domestic-Alt":   {hostType: NetwatchHostTypeDomestic, rank: 2},
	"Failover DNS probe VPN-Primary":    {hostType: NetwatchHostTypeVPN, rank: 0},
	"Failover DNS probe VPN-Backup1":    {hostType: NetwatchHostTypeVPN, rank: 1},
	"Failover DNS probe VPN-Backup2":    {hostType: NetwatchHostTypeVPN, rank: 2},
}
