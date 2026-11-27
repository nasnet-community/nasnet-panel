package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// DNSStaticEntry is a user defined static DNS record. Its name and address identify it, so a
// rename or an address change replaces the stored row.
type DNSStaticEntry struct {
	Name    string `db:"name"`
	Address string `db:"address"`
	Type    string `db:"type"`
	TTL     string `db:"ttl"`
	Enabled bool   `db:"enabled"`
}

const upsertDNSStaticEntryQuery = `INSERT INTO dns_static_entries (name, address, type, ttl, enabled)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(name, address) DO UPDATE SET
			type = excluded.type,
			ttl = excluded.ttl,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`

// UpsertDNSStaticEntry stores the entry, replacing the stored one with the same name and address.
func UpsertDNSStaticEntry(ctx context.Context, conn *sqlx.DB, entry *DNSStaticEntry) error {
	if _, err := conn.ExecContext(ctx, upsertDNSStaticEntryQuery,
		entry.Name, entry.Address, entry.Type, entry.TTL, boolInt(entry.Enabled)); err != nil {
		return fmt.Errorf("failed to save static DNS entry %s: %w", entry.Name, err)
	}
	return nil
}

// DeleteDNSStaticEntry removes the stored entry with the given name and address, if there is one.
func DeleteDNSStaticEntry(ctx context.Context, conn *sqlx.DB, name, address string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM dns_static_entries WHERE name = ? AND address = ?`, name, address); err != nil {
		return fmt.Errorf("failed to delete static DNS entry %s: %w", name, err)
	}
	return nil
}

// ReplaceDNSStaticEntry stores the entry in place of the one with oldName and oldAddress in a single
// transaction, so the stored entry is never missing when saving the replacement fails.
func ReplaceDNSStaticEntry(ctx context.Context, conn *sqlx.DB, oldName, oldAddress string, entry *DNSStaticEntry) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM dns_static_entries WHERE name = ? AND address = ?`, oldName, oldAddress); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to delete static DNS entry %s: %w", oldName, err)
	}
	if _, err := tx.ExecContext(ctx, upsertDNSStaticEntryQuery,
		entry.Name, entry.Address, entry.Type, entry.TTL, boolInt(entry.Enabled)); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to save static DNS entry %s: %w", entry.Name, err)
	}

	return tx.Commit()
}
