package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// AddDomesticAddress stores an address a user added to the router's domestic address list, doing
// nothing when the address is already stored.
func AddDomesticAddress(ctx context.Context, conn *sqlx.DB, address string) error {
	if _, err := conn.ExecContext(ctx,
		`INSERT INTO domestic_addresses (address) VALUES (?) ON CONFLICT(address) DO NOTHING`,
		address); err != nil {
		return fmt.Errorf("failed to save domestic address %s: %w", address, err)
	}
	return nil
}

// ReplaceDomesticAddress stores newAddress in place of oldAddress, adding it when oldAddress was not stored.
func ReplaceDomesticAddress(ctx context.Context, conn *sqlx.DB, oldAddress, newAddress string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM domestic_addresses WHERE address = ?`, oldAddress); err != nil {
		return fmt.Errorf("failed to delete domestic address %s: %w", oldAddress, err)
	}
	return AddDomesticAddress(ctx, conn, newAddress)
}

// DeleteDomesticAddress removes the stored address, if there is one.
func DeleteDomesticAddress(ctx context.Context, conn *sqlx.DB, address string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM domestic_addresses WHERE address = ?`, address); err != nil {
		return fmt.Errorf("failed to delete domestic address %s: %w", address, err)
	}
	return nil
}
