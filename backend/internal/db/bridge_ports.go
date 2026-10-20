package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// BridgePort is an interface that is a port of a LAN bridge. An interface can be a port of
// one bridge only, so Interface identifies the row and a move to another bridge updates it.
// DefaultName is the interface's factory name, empty when it has none.
type BridgePort struct {
	Bridge      string
	Interface   string
	DefaultName string
	Comment     string
	Enabled     bool
}

// UpsertBridgePort stores the port, replacing the stored one of the same interface.
func UpsertBridgePort(ctx context.Context, conn *sqlx.DB, port *BridgePort) error {
	return upsertBridgePortImpl(ctx, conn, port)
}

func upsertBridgePortImpl(ctx context.Context, ext sqlx.ExtContext, port *BridgePort) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO bridge_ports (bridge, interface, default_name, comment, enabled) VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(interface) DO UPDATE SET
			bridge = excluded.bridge,
			default_name = excluded.default_name,
			comment = excluded.comment,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`,
		port.Bridge, port.Interface, port.DefaultName, port.Comment, boolInt(port.Enabled)); err != nil {
		return fmt.Errorf("failed to save bridge port %s: %w", port.Interface, err)
	}
	return nil
}
