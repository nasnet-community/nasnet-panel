package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// Config is everything the user entered in the wizard. A nil pointer means
// that part was not configured. Settings are stored in the settings table. Every SSTP,
// L2TP and IKEv2 server is disabled because the wizard configures none of them.
type Config struct {
	Settings    map[string]string
	WANs        []WAN
	WireGuard   *WireGuardInterface
	L2TP        *L2TPClient
	WiFis       []WiFi
	BridgePorts []BridgePort
	OvpnServers []OvpnServer
	VPNUsers    []VPNUser
	DNSServers  []DNSServer
}

// SaveConfig makes the router's stored configuration match cfg in one transaction. Rows that
// already exist are updated in place and keep their id; rows no longer in cfg are removed.
func SaveConfig(ctx context.Context, conn *sqlx.DB, cfg *Config) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	if err := saveConfigImpl(ctx, tx, cfg); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

func saveConfigImpl(ctx context.Context, tx *sqlx.Tx, cfg *Config) error {
	wanTypes := make([]string, 0, len(cfg.WANs))
	for i := range cfg.WANs {
		if err := upsertWANImpl(ctx, tx, &cfg.WANs[i]); err != nil {
			return err
		}
		wanTypes = append(wanTypes, cfg.WANs[i].Type)
	}
	if err := deleteMissing(ctx, tx, "wans", "type", wanTypes, ""); err != nil {
		return err
	}

	var wireGuardNames []string
	if cfg.WireGuard != nil {
		if err := saveWireGuardInterface(ctx, tx, cfg.WireGuard); err != nil {
			return err
		}
		wireGuardNames = append(wireGuardNames, cfg.WireGuard.Name)
	}
	if err := deleteMissing(ctx, tx, "wireguard_interfaces", "name", wireGuardNames, ""); err != nil {
		return err
	}

	var l2tpNames []string
	if cfg.L2TP != nil {
		if err := upsertL2TPClientImpl(ctx, tx, cfg.L2TP); err != nil {
			return err
		}
		l2tpNames = append(l2tpNames, cfg.L2TP.Name)
	}
	if err := deleteMissing(ctx, tx, "l2tp_clients", "name", l2tpNames, ""); err != nil {
		return err
	}

	wifiNames := make([]string, 0, len(cfg.WiFis))
	for i := range cfg.WiFis {
		if err := upsertWiFiImpl(ctx, tx, &cfg.WiFis[i]); err != nil {
			return err
		}
		wifiNames = append(wifiNames, cfg.WiFis[i].Name)
	}
	if err := deleteMissing(ctx, tx, "wifis", "name", wifiNames, ""); err != nil {
		return err
	}

	bridgeInterfaces := make([]string, 0, len(cfg.BridgePorts))
	for i := range cfg.BridgePorts {
		if err := upsertBridgePortImpl(ctx, tx, &cfg.BridgePorts[i]); err != nil {
			return err
		}
		bridgeInterfaces = append(bridgeInterfaces, cfg.BridgePorts[i].Interface)
	}
	if err := deleteMissing(ctx, tx, "bridge_ports", "interface", bridgeInterfaces, ""); err != nil {
		return err
	}

	ovpnNames := make([]string, 0, len(cfg.OvpnServers))
	for i := range cfg.OvpnServers {
		if err := upsertOvpnServerImpl(ctx, tx, &cfg.OvpnServers[i]); err != nil {
			return err
		}
		ovpnNames = append(ovpnNames, cfg.OvpnServers[i].Name)
	}
	if err := deleteMissing(ctx, tx, "ovpn_servers", "name", ovpnNames, ""); err != nil {
		return err
	}

	usernames := make([]string, 0, len(cfg.VPNUsers))
	for i := range cfg.VPNUsers {
		if err := upsertVPNUserImpl(ctx, tx, &cfg.VPNUsers[i]); err != nil {
			return err
		}
		usernames = append(usernames, cfg.VPNUsers[i].Username)
	}

	if err := deleteMissing(ctx, tx, "vpn_users", "username", usernames, ""); err != nil {
		return err
	}

	dnsNames := make([]string, 0, len(cfg.DNSServers))
	for i := range cfg.DNSServers {
		if err := upsertDNSServerImpl(ctx, tx, &cfg.DNSServers[i]); err != nil {
			return err
		}
		dnsNames = append(dnsNames, cfg.DNSServers[i].Name)
	}

	if err := deleteMissing(ctx, tx, "dns_servers", "name", dnsNames, ""); err != nil {
		return err
	}

	for key, value := range cfg.Settings {
		if err := upsertSettingImpl(ctx, tx, key, value); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, `UPDATE vpn_servers SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE enabled = 1`); err != nil {
		return fmt.Errorf("failed to disable the VPN servers: %w", err)
	}
	return nil
}
