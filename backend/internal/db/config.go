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
	if err := saveWANs(ctx, tx, cfg.WANs); err != nil {
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

	if err := saveWiFis(ctx, tx, cfg.WiFis); err != nil {
		return err
	}

	if err := saveBridgePorts(ctx, tx, cfg.BridgePorts); err != nil {
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

// NetworkConfig is the WANs, WiFi interfaces and bridge ports of a router.
type NetworkConfig struct {
	WANs        []WAN
	WiFis       []WiFi
	BridgePorts []BridgePort
}

// SaveNetworkConfig makes the stored WANs, WiFis and bridge ports match cfg in one transaction.
// Rows no longer in cfg are removed.
func SaveNetworkConfig(ctx context.Context, conn *sqlx.DB, cfg *NetworkConfig) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	err = saveWANs(ctx, tx, cfg.WANs)
	if err == nil {
		err = saveWiFis(ctx, tx, cfg.WiFis)
	}
	if err == nil {
		err = saveBridgePorts(ctx, tx, cfg.BridgePorts)
	}
	if err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

func saveWANs(ctx context.Context, tx *sqlx.Tx, wans []WAN) error {
	wanTypes := make([]string, 0, len(wans))
	for i := range wans {
		if err := upsertWANImpl(ctx, tx, &wans[i]); err != nil {
			return err
		}
		wanTypes = append(wanTypes, wans[i].Type)
	}
	return deleteMissing(ctx, tx, "wans", "type", wanTypes, "")
}

func saveWiFis(ctx context.Context, tx *sqlx.Tx, wifis []WiFi) error {
	wifiNames := make([]string, 0, len(wifis))
	for i := range wifis {
		if err := upsertWiFiImpl(ctx, tx, &wifis[i]); err != nil {
			return err
		}
		wifiNames = append(wifiNames, wifis[i].Name)
	}
	return deleteMissing(ctx, tx, "wifis", "name", wifiNames, "")
}

func saveBridgePorts(ctx context.Context, tx *sqlx.Tx, ports []BridgePort) error {
	bridgeInterfaces := make([]string, 0, len(ports))
	for i := range ports {
		if err := upsertBridgePortImpl(ctx, tx, &ports[i]); err != nil {
			return err
		}
		bridgeInterfaces = append(bridgeInterfaces, ports[i].Interface)
	}
	return deleteMissing(ctx, tx, "bridge_ports", "interface", bridgeInterfaces, "")
}
