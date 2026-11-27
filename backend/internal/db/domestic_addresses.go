package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

const sqliteTimestampLayout = "2006-01-02 15:04:05"

// DomesticAddress is an address a user added to the router's domestic address list. A TimeoutSeconds
// of 0 means the entry never expires; otherwise it expires TimeoutSeconds after CreatedAt.
type DomesticAddress struct {
	Address        string `db:"address"`
	TimeoutSeconds int64  `db:"timeout_seconds"`
	CreatedAt      string `db:"created_at"`
}

// Remaining returns how many whole seconds are left before the entry expires, and whether it has
// expired already. An entry without a timeout never expires and reports 0 seconds left.
func (a *DomesticAddress) Remaining(now time.Time) (seconds int64, expired bool) {
	if a.TimeoutSeconds <= 0 {
		return 0, false
	}
	created, err := time.Parse(sqliteTimestampLayout, a.CreatedAt)
	if err != nil {
		return a.TimeoutSeconds, false
	}
	left := int64(created.Add(time.Duration(a.TimeoutSeconds) * time.Second).Sub(now).Seconds())
	if left <= 0 {
		return 0, true
	}
	return left, false
}

// AddDomesticAddress stores an address a user added to the router's domestic address list with its
// timeout in seconds (0 for none). An address that is already stored gets the new timeout, counted from now.
func AddDomesticAddress(ctx context.Context, conn *sqlx.DB, address string, timeoutSeconds int64) error {
	if _, err := conn.ExecContext(ctx,
		`INSERT INTO domestic_addresses (address, timeout_seconds) VALUES (?, ?)
		ON CONFLICT(address) DO UPDATE SET
			timeout_seconds = excluded.timeout_seconds,
			created_at = CURRENT_TIMESTAMP`,
		address, timeoutSeconds); err != nil {
		return fmt.Errorf("failed to save domestic address %s: %w", address, err)
	}
	return nil
}

// ReplaceDomesticAddress stores newAddress in place of oldAddress, adding it when oldAddress was not stored.
func ReplaceDomesticAddress(ctx context.Context, conn *sqlx.DB, oldAddress, newAddress string, timeoutSeconds int64) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM domestic_addresses WHERE address = ?`, oldAddress); err != nil {
		return fmt.Errorf("failed to delete domestic address %s: %w", oldAddress, err)
	}
	return AddDomesticAddress(ctx, conn, newAddress, timeoutSeconds)
}

// DeleteDomesticAddress removes the stored address, if there is one.
func DeleteDomesticAddress(ctx context.Context, conn *sqlx.DB, address string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM domestic_addresses WHERE address = ?`, address); err != nil {
		return fmt.Errorf("failed to delete domestic address %s: %w", address, err)
	}
	return nil
}

// DeleteExpiredDomesticAddresses removes every stored address whose timeout has passed and returns how many.
func DeleteExpiredDomesticAddresses(ctx context.Context, conn *sqlx.DB) (int64, error) {
	result, err := conn.ExecContext(ctx,
		`DELETE FROM domestic_addresses
		WHERE timeout_seconds > 0
		AND datetime(created_at, '+' || timeout_seconds || ' seconds') <= datetime('now')`)
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired domestic addresses: %w", err)
	}
	return result.RowsAffected()
}
