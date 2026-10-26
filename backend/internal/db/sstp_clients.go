package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// SSTPClient is an SSTP client. Name identifies it on the router.
type SSTPClient struct {
	Name      string
	Comment   string
	ConnectTo string
	Port      int
	User      string
	Password  string
	Enabled   bool
}

func upsertSSTPClientImpl(ctx context.Context, ext sqlx.ExtContext, client *SSTPClient) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO sstp_clients (name, comment, connect_to, port, user, password, enabled)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			comment = excluded.comment,
			connect_to = excluded.connect_to,
			port = excluded.port,
			user = excluded.user,
			password = excluded.password,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`,
		client.Name, client.Comment, client.ConnectTo, client.Port, client.User, client.Password, boolInt(client.Enabled)); err != nil {
		return fmt.Errorf("failed to save SSTP client %s: %w", client.Name, err)
	}
	return nil
}

// UpsertSSTPClient stores the client, replacing the stored one with the same name.
func UpsertSSTPClient(ctx context.Context, conn *sqlx.DB, client *SSTPClient) error {
	return upsertSSTPClientImpl(ctx, conn, client)
}

// DeleteSSTPClient removes the stored client with the given name, if there is one.
func DeleteSSTPClient(ctx context.Context, conn *sqlx.DB, name string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM sstp_clients WHERE name = ?`, name); err != nil {
		return fmt.Errorf("failed to delete SSTP client %s: %w", name, err)
	}
	return nil
}
