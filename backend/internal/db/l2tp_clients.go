package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// L2TPClient is an L2TP client. Name identifies it on the router.
type L2TPClient struct {
	Name        string
	Comment     string
	ConnectTo   string
	User        string
	Password    string
	IPsecSecret string
	Enabled     bool
}

func upsertL2TPClientImpl(ctx context.Context, ext sqlx.ExtContext, client *L2TPClient) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO l2tp_clients (name, comment, connect_to, user, password, ipsec_secret, enabled)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			comment = excluded.comment,
			connect_to = excluded.connect_to,
			user = excluded.user,
			password = excluded.password,
			ipsec_secret = excluded.ipsec_secret,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`,
		client.Name, client.Comment, client.ConnectTo, client.User, client.Password, client.IPsecSecret, boolInt(client.Enabled)); err != nil {
		return fmt.Errorf("failed to save L2TP client %s: %w", client.Name, err)
	}
	return nil
}

// UpsertL2TPClient stores the client, replacing the stored one with the same name.
func UpsertL2TPClient(ctx context.Context, conn *sqlx.DB, client *L2TPClient) error {
	return upsertL2TPClientImpl(ctx, conn, client)
}

// DeleteL2TPClient removes the stored client with the given name, if there is one.
func DeleteL2TPClient(ctx context.Context, conn *sqlx.DB, name string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM l2tp_clients WHERE name = ?`, name); err != nil {
		return fmt.Errorf("failed to delete L2TP client %s: %w", name, err)
	}
	return nil
}
