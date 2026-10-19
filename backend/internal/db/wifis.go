package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// WiFi is a WiFi interface configured by the wizard. DefaultName is the
// interface's factory name, empty for a virtual WiFi. Mode is one of ap,
// station, station-bridge or station-pseudobridge. A virtual WiFi has Master set
// to the default name of the physical interface it is created on. Bridge is the
// bridge the interface is a port of, if any. AuthTypes is the comma separated
// list of authentication types.
type WiFi struct {
	Name        string
	DefaultName string
	SSID        string
	Password    string
	Enabled     bool
	Mode        string
	IsVirtual   bool
	Master      string
	Bridge      string
	AuthTypes   string
}

// UpsertWiFi stores the WiFi, replacing the stored one with the same name.
func UpsertWiFi(ctx context.Context, conn *sqlx.DB, wifi *WiFi) error {
	return upsertWiFiImpl(ctx, conn, wifi)
}

func upsertWiFiImpl(ctx context.Context, ext sqlx.ExtContext, wifi *WiFi) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO wifis (name, default_name, ssid, password, enabled, mode, is_virtual, master, bridge, auth_types)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			default_name = excluded.default_name,
			ssid = excluded.ssid,
			password = excluded.password,
			enabled = excluded.enabled,
			mode = excluded.mode,
			is_virtual = excluded.is_virtual,
			master = excluded.master,
			bridge = excluded.bridge,
			auth_types = excluded.auth_types,
			updated_at = CURRENT_TIMESTAMP`,
		wifi.Name, wifi.DefaultName, wifi.SSID, wifi.Password, boolInt(wifi.Enabled), wifi.Mode, boolInt(wifi.IsVirtual),
		wifi.Master, wifi.Bridge, wifi.AuthTypes); err != nil {
		return fmt.Errorf("failed to save WiFi %s: %w", wifi.Name, err)
	}
	return nil
}

// UpdateWiFiBridge sets the bridge of the stored WiFi with the given name, if there is one.
func UpdateWiFiBridge(ctx context.Context, conn *sqlx.DB, name, bridge string) error {
	if _, err := conn.ExecContext(ctx,
		`UPDATE wifis SET bridge = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?`, bridge, name); err != nil {
		return fmt.Errorf("failed to update the bridge of WiFi %s: %w", name, err)
	}
	return nil
}
