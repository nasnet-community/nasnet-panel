package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// WAN is a WAN link chosen in the wizard. Type is "domestic" or "foreign" and
// InterfaceType is "ether" or "wifi". IP is the static address with its prefix, such as
// "192.168.1.50/24", and Gateway its gateway; both are empty when the link uses DHCP.
type WAN struct {
	Type          string `db:"type"`
	InterfaceType string `db:"interface_type"`
	Interface     string `db:"interface"`
	IP            string `db:"ip"`
	Gateway       string `db:"gateway"`
}

// UpsertWAN stores the WAN, replacing the stored one of the same type.
func UpsertWAN(ctx context.Context, conn *sqlx.DB, wan *WAN) error {
	return upsertWANImpl(ctx, conn, wan)
}

func upsertWANImpl(ctx context.Context, ext sqlx.ExtContext, wan *WAN) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO wans (type, interface_type, interface, ip, gateway) VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(type) DO UPDATE SET
			interface_type = excluded.interface_type,
			interface = excluded.interface,
			ip = excluded.ip,
			gateway = excluded.gateway,
			updated_at = CURRENT_TIMESTAMP`,
		wan.Type, wan.InterfaceType, wan.Interface, wan.IP, wan.Gateway); err != nil {
		return fmt.Errorf("failed to save %s WAN: %w", wan.Type, err)
	}
	return nil
}
