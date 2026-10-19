package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// WireGuardInterface is a WireGuard interface with its peers. Type is
// WireGuardTypeClient or WireGuardTypeServer.
type WireGuardInterface struct {
	Name       string
	Comment    string
	Type       string
	PrivateKey string
	Address    string
	Enabled    bool
	Peers      []WireGuardPeer
}

// WireGuardTypeClient and WireGuardTypeServer are the values WireGuardInterface.Type can take.
const (
	WireGuardTypeClient = "client"
	WireGuardTypeServer = "server"
)

func saveWireGuardInterface(ctx context.Context, tx *sqlx.Tx, wg *WireGuardInterface) error {
	var interfaceID int64
	err := sqlx.GetContext(ctx, tx, &interfaceID,
		`INSERT INTO wireguard_interfaces (name, comment, type, private_key, address, enabled)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			comment = excluded.comment,
			type = excluded.type,
			private_key = excluded.private_key,
			address = excluded.address,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id`,
		wg.Name, wg.Comment, wg.Type, wg.PrivateKey, wg.Address, boolInt(wg.Enabled))
	if err != nil {
		return fmt.Errorf("failed to save WireGuard interface %s: %w", wg.Name, err)
	}

	publicKeys := make([]string, 0, len(wg.Peers))
	for i := range wg.Peers {
		if err := insertWireGuardPeer(ctx, tx, interfaceID, &wg.Peers[i]); err != nil {
			return err
		}
		publicKeys = append(publicKeys, wg.Peers[i].PublicKey)
	}

	return deleteMissing(ctx, tx, "wireguard_peers", "public_key", publicKeys, "interface_id = ?", interfaceID)
}

// PersistWireGuardInterface stores the interface and replaces its stored peers with wg.Peers.
func PersistWireGuardInterface(ctx context.Context, conn *sqlx.DB, wg *WireGuardInterface) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	if err := saveWireGuardInterface(ctx, tx, wg); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

// DeleteWireGuardInterface removes the stored interface with the given name and its peers, if there is one.
func DeleteWireGuardInterface(ctx context.Context, conn *sqlx.DB, name string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM wireguard_interfaces WHERE name = ?`, name); err != nil {
		return fmt.Errorf("failed to delete WireGuard interface %s: %w", name, err)
	}
	return nil
}
