package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// Setting is one row of the settings table.
type Setting struct {
	Key       string `db:"key"`
	Value     string `db:"value"`
	UpdatedAt string `db:"updated_at"`
}

// ErrSettingNotFound is returned when no setting has the requested key.
var ErrSettingNotFound = errors.New("setting not found")

// ErrSettingExists is returned when creating a setting whose key is already taken.
var ErrSettingExists = errors.New("setting already exists")

// ListSettings returns every setting ordered by key.
func ListSettings(ctx context.Context, conn *sqlx.DB) ([]Setting, error) {
	settings := make([]Setting, 0)
	if err := conn.SelectContext(ctx, &settings, `SELECT key, value, updated_at FROM settings ORDER BY key`); err != nil {
		return nil, fmt.Errorf("failed to list settings: %w", err)
	}
	return settings, nil
}

// GetSetting returns the setting with the given key.
func GetSetting(ctx context.Context, conn *sqlx.DB, key string) (*Setting, error) {
	var setting Setting
	err := conn.GetContext(ctx, &setting, `SELECT key, value, updated_at FROM settings WHERE key = ?`, key)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("%w: %s", ErrSettingNotFound, key)
		}
		return nil, fmt.Errorf("failed to get setting %s: %w", key, err)
	}
	return &setting, nil
}

// CreateSetting inserts a new setting and fails with ErrSettingExists if the key is taken.
func CreateSetting(ctx context.Context, conn *sqlx.DB, key, value string) (*Setting, error) {
	result, err := conn.ExecContext(ctx, `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING`, key, value)
	if err != nil {
		return nil, fmt.Errorf("failed to create setting %s: %w", key, err)
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, fmt.Errorf("%w: %s", ErrSettingExists, key)
	}
	return GetSetting(ctx, conn, key)
}

// UpdateSetting changes the value of an existing setting and fails with ErrSettingNotFound if there is none.
func UpdateSetting(ctx context.Context, conn *sqlx.DB, key, value string) (*Setting, error) {
	result, err := conn.ExecContext(ctx, `UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`, value, key)
	if err != nil {
		return nil, fmt.Errorf("failed to update setting %s: %w", key, err)
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return nil, fmt.Errorf("%w: %s", ErrSettingNotFound, key)
	}
	return GetSetting(ctx, conn, key)
}

// DeleteSetting removes a setting and fails with ErrSettingNotFound if there is none.
func DeleteSetting(ctx context.Context, conn *sqlx.DB, key string) error {
	result, err := conn.ExecContext(ctx, `DELETE FROM settings WHERE key = ?`, key)
	if err != nil {
		return fmt.Errorf("failed to delete setting %s: %w", key, err)
	}
	if affected, err := result.RowsAffected(); err == nil && affected == 0 {
		return fmt.Errorf("%w: %s", ErrSettingNotFound, key)
	}
	return nil
}

// UpsertSetting stores the value under key, creating the setting or replacing its value.
func UpsertSetting(ctx context.Context, conn *sqlx.DB, key, value string) error {
	return upsertSettingImpl(ctx, conn, key, value)
}

func upsertSettingImpl(ctx context.Context, ext sqlx.ExtContext, key, value string) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO settings (key, value) VALUES (?, ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
		key, value); err != nil {
		return fmt.Errorf("failed to save setting %s: %w", key, err)
	}
	return nil
}
