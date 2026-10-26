package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// WireGuardPeer is one peer of the WireGuard client interface.
type WireGuardPeer struct {
	Name                string
	Comment             string
	PublicKey           string
	PrivateKey          string
	PresharedKey        string
	EndpointAddress     string
	EndpointPort        int
	AllowedAddress      string
	PersistentKeepalive int
	Enabled             bool
}

func insertWireGuardPeer(ctx context.Context, tx *sqlx.Tx, interfaceID int64, peer *WireGuardPeer) error {
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO wireguard_peers (interface_id, name, comment, public_key, private_key, preshared_key, endpoint_address, endpoint_port, allowed_address, persistent_keepalive, enabled)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(interface_id, public_key) DO UPDATE SET
			name = excluded.name,
			comment = excluded.comment,
			private_key = excluded.private_key,
			preshared_key = excluded.preshared_key,
			endpoint_address = excluded.endpoint_address,
			endpoint_port = excluded.endpoint_port,
			allowed_address = excluded.allowed_address,
			persistent_keepalive = excluded.persistent_keepalive,
			enabled = excluded.enabled`,
		interfaceID, peer.Name, peer.Comment, peer.PublicKey, peer.PrivateKey, peer.PresharedKey, peer.EndpointAddress, peer.EndpointPort, peer.AllowedAddress, peer.PersistentKeepalive, boolInt(peer.Enabled)); err != nil {
		return fmt.Errorf("failed to save WireGuard peer: %w", err)
	}
	return nil
}

// RenameWireGuardPeerKey changes the public key of a stored peer in place, so the row keeps its id.
// A stale row already stored under the new key is removed first.
func RenameWireGuardPeerKey(ctx context.Context, conn *sqlx.DB, interfaceName, oldKey, newKey string) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	const interfaceIDQuery = `(SELECT id FROM wireguard_interfaces WHERE name = ?)`
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM wireguard_peers WHERE public_key = ? AND interface_id = `+interfaceIDQuery,
		newKey, interfaceName); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to clear WireGuard peer key %s: %w", newKey, err)
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE wireguard_peers SET public_key = ? WHERE public_key = ? AND interface_id = `+interfaceIDQuery,
		newKey, oldKey, interfaceName); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to rename WireGuard peer key %s: %w", oldKey, err)
	}

	return tx.Commit()
}
