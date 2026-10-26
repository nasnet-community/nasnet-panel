package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// VPNUser is a VPN user that any VPN server can use. It is not tied to one
// server. Profile is the name of the PPP profile the user is assigned.
type VPNUser struct {
	Username string
	Password string
	Profile  string
}

func upsertVPNUserImpl(ctx context.Context, ext sqlx.ExtContext, user *VPNUser) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO vpn_users (username, password, profile) VALUES (?, ?, ?)
		ON CONFLICT(username) DO UPDATE SET
			password = excluded.password,
			profile = excluded.profile,
			updated_at = CURRENT_TIMESTAMP`,
		user.Username, user.Password, user.Profile); err != nil {
		return fmt.Errorf("failed to save VPN user %s: %w", user.Username, err)
	}
	return nil
}

// UpsertVPNUser stores the user, replacing the password of the stored one with the same username.
func UpsertVPNUser(ctx context.Context, conn *sqlx.DB, user *VPNUser) error {
	return upsertVPNUserImpl(ctx, conn, user)
}

// ReplaceVPNUser stores the user. When oldUsername is not empty and differs from
// the user's username, the row stored under oldUsername is renamed in place, so
// it keeps its id; if there is no such row the user is simply inserted. A stale row
// already stored under the new username is removed first, since the router does not
// allow two users with the same name. Everything runs in one transaction.
func ReplaceVPNUser(ctx context.Context, conn *sqlx.DB, oldUsername string, user *VPNUser) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	if err := renameVPNUser(ctx, tx, oldUsername, user); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

func renameVPNUser(ctx context.Context, tx *sqlx.Tx, oldUsername string, user *VPNUser) error {
	if oldUsername == "" || oldUsername == user.Username {
		return upsertVPNUserImpl(ctx, tx, user)
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM vpn_users WHERE username = ?`, user.Username); err != nil {
		return fmt.Errorf("failed to clear VPN user %s: %w", user.Username, err)
	}

	result, err := tx.ExecContext(ctx,
		`UPDATE vpn_users SET username = ?, password = ?, profile = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?`,
		user.Username, user.Password, user.Profile, oldUsername)
	if err != nil {
		return fmt.Errorf("failed to rename VPN user %s: %w", oldUsername, err)
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return upsertVPNUserImpl(ctx, tx, user)
	}

	return nil
}

// DeleteVPNUser removes the stored user with the given username, if there is one.
func DeleteVPNUser(ctx context.Context, conn *sqlx.DB, username string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM vpn_users WHERE username = ?`, username); err != nil {
		return fmt.Errorf("failed to delete VPN user %s: %w", username, err)
	}
	return nil
}
