package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// WAN is a WAN link chosen in the wizard. Type is "domestic" or "foreign" and
// InterfaceType is "ether" or "wifi".
type WAN struct {
	Type          string
	InterfaceType string
	Interface     string
}

// UpsertWAN stores the WAN, replacing the stored one of the same type.
func UpsertWAN(ctx context.Context, conn *sqlx.DB, wan *WAN) error {
	return upsertWANImpl(ctx, conn, wan)
}

func upsertWANImpl(ctx context.Context, ext sqlx.ExtContext, wan *WAN) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO wans (type, interface_type, interface) VALUES (?, ?, ?)
		ON CONFLICT(type) DO UPDATE SET
			interface_type = excluded.interface_type,
			interface = excluded.interface,
			updated_at = CURRENT_TIMESTAMP`,
		wan.Type, wan.InterfaceType, wan.Interface); err != nil {
		return fmt.Errorf("failed to save %s WAN: %w", wan.Type, err)
	}
	return nil
}
