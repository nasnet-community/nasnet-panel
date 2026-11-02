package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// DNSStaticEntry is a user defined static DNS record. RouterID is the entry's
// RouterOS .id and identifies it, so a rename or an address change updates the
// same row.
type DNSStaticEntry struct {
	RouterID string `db:"router_id"`
	Name     string `db:"name"`
	Address  string `db:"address"`
	Type     string `db:"type"`
	TTL      string `db:"ttl"`
	Comment  string `db:"comment"`
	Enabled  bool   `db:"enabled"`
}

// UpsertDNSStaticEntry stores the entry, replacing the stored one with the same router ID.
func UpsertDNSStaticEntry(ctx context.Context, conn *sqlx.DB, entry *DNSStaticEntry) error {
	if _, err := conn.ExecContext(ctx,
		`INSERT INTO dns_static_entries (router_id, name, address, type, ttl, comment, enabled)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(router_id) DO UPDATE SET
			name = excluded.name,
			address = excluded.address,
			type = excluded.type,
			ttl = excluded.ttl,
			comment = excluded.comment,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`,
		entry.RouterID, entry.Name, entry.Address, entry.Type, entry.TTL, entry.Comment, boolInt(entry.Enabled)); err != nil {
		return fmt.Errorf("failed to save static DNS entry %s: %w", entry.Name, err)
	}
	return nil
}

// DeleteDNSStaticEntry removes the stored entry with the given router ID, if there is one.
func DeleteDNSStaticEntry(ctx context.Context, conn *sqlx.DB, routerID string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM dns_static_entries WHERE router_id = ?`, routerID); err != nil {
		return fmt.Errorf("failed to delete static DNS entry %s: %w", routerID, err)
	}
	return nil
}

// ReplaceDNSStaticEntry stores the entry in place of the one with oldRouterID in a single transaction, so the
// stored entry is never missing when saving the replacement fails.
func ReplaceDNSStaticEntry(ctx context.Context, conn *sqlx.DB, oldRouterID string, entry *DNSStaticEntry) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM dns_static_entries WHERE router_id = ?`, oldRouterID); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to delete static DNS entry %s: %w", oldRouterID, err)
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO dns_static_entries (router_id, name, address, type, ttl, comment, enabled)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(router_id) DO UPDATE SET
			name = excluded.name,
			address = excluded.address,
			type = excluded.type,
			ttl = excluded.ttl,
			comment = excluded.comment,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`,
		entry.RouterID, entry.Name, entry.Address, entry.Type, entry.TTL, entry.Comment, boolInt(entry.Enabled)); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to save static DNS entry %s: %w", entry.Name, err)
	}

	return tx.Commit()
}
