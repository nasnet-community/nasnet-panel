package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// StoredConfig is everything kept in a router's database that a reconfiguration applies again.
type StoredConfig struct {
	WANs              []WAN
	WiFis             []WiFi
	BridgePorts       []BridgePort
	WireGuards        []WireGuardInterface
	L2TPClients       []L2TPClient
	SSTPClients       []SSTPClient
	OvpnServers       []OvpnServer
	VPNServers        []VPNServer
	VPNUsers          []VPNUser
	DNSStaticEntries  []DNSStaticEntry
	DomesticAddresses []string
	DNSServers        []DNSServer
	Settings          map[string]string
}

// LoadStoredConfig reads every table a reconfiguration needs from the router's database.
func LoadStoredConfig(ctx context.Context, conn *sqlx.DB) (*StoredConfig, error) {
	cfg := &StoredConfig{}

	queries := []struct {
		name  string
		dest  any
		query string
	}{
		{"WANs", &cfg.WANs, `SELECT type, interface_type, interface FROM wans ORDER BY id`},
		{"WiFi interfaces", &cfg.WiFis,
			`SELECT name, default_name, ssid, password, enabled, mode, is_virtual, master, bridge, auth_types FROM wifis ORDER BY id`},
		{"bridge ports", &cfg.BridgePorts,
			`SELECT bridge, interface, default_name, comment, enabled FROM bridge_ports ORDER BY id`},
		{"L2TP clients", &cfg.L2TPClients,
			`SELECT name, comment, connect_to, user, password, ipsec_secret, enabled FROM l2tp_clients ORDER BY id`},
		{"SSTP clients", &cfg.SSTPClients,
			`SELECT name, comment, connect_to, port, user, password, enabled FROM sstp_clients ORDER BY id`},
		{"OpenVPN servers", &cfg.OvpnServers,
			`SELECT name, certificate_timestamp, protocol, port, client_certificate_password, enabled FROM ovpn_servers ORDER BY id`},
		{"VPN servers", &cfg.VPNServers,
			`SELECT type, enabled, port, default_profile, authentication, certificate_timestamp, verify_client_certificate, ciphers, use_ipsec, ipsec_secret, certificate_password FROM vpn_servers ORDER BY id`},
		{"VPN users", &cfg.VPNUsers, `SELECT username, password, profile FROM vpn_users ORDER BY id`},
		{"DNS servers", &cfg.DNSServers,
			`SELECT name, type, dns_servers, doh_servers, verify_doh_cert, comment FROM dns_servers ORDER BY id`},
		{"static DNS entries", &cfg.DNSStaticEntries,
			`SELECT router_id, name, address, type, ttl, comment, enabled FROM dns_static_entries ORDER BY id`},
		{"domestic addresses", &cfg.DomesticAddresses, `SELECT address FROM domestic_addresses ORDER BY id`},
		{"WireGuard interfaces", &cfg.WireGuards,
			`SELECT name, comment, type, private_key, address, listen_port, enabled FROM wireguard_interfaces ORDER BY id`},
	}
	for _, q := range queries {
		if err := conn.SelectContext(ctx, q.dest, q.query); err != nil {
			return nil, fmt.Errorf("failed to read the stored %s: %w", q.name, err)
		}
	}

	settings, err := ListSettings(ctx, conn)
	if err != nil {
		return nil, fmt.Errorf("failed to read the stored settings: %w", err)
	}
	cfg.Settings = make(map[string]string, len(settings))
	for i := range settings {
		cfg.Settings[settings[i].Key] = settings[i].Value
	}

	for i := range cfg.WireGuards {
		err := conn.SelectContext(ctx, &cfg.WireGuards[i].Peers,
			`SELECT p.name, p.comment, p.public_key, p.private_key, p.preshared_key, p.endpoint_address,
			        p.endpoint_port, p.allowed_address, p.persistent_keepalive, p.enabled
			   FROM wireguard_peers p
			   JOIN wireguard_interfaces i ON i.id = p.interface_id
			  WHERE i.name = ?
			  ORDER BY p.id`, cfg.WireGuards[i].Name)
		if err != nil {
			return nil, fmt.Errorf("failed to read the stored peers of WireGuard interface %s: %w", cfg.WireGuards[i].Name, err)
		}
	}

	return cfg, nil
}
