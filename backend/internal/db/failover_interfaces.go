package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// FailoverInterface is a VPN client interface that takes part in the failover. ProbeIP is
// the address its failover routes point at, and Distance orders it: the lowest distance is
// the primary, the next ones are the backups.
type FailoverInterface struct {
	Interface string `db:"interface"`
	ProbeIP   string `db:"probe_ip"`
	Distance  int    `db:"distance"`
}

func saveFailoverInterfacesImpl(ctx context.Context, ext sqlx.ExtContext, rows []FailoverInterface) error {
	if _, err := ext.ExecContext(ctx, `DELETE FROM failover_interfaces`); err != nil {
		return fmt.Errorf("failed to clear the failover interfaces: %w", err)
	}
	for i := range rows {
		if _, err := ext.ExecContext(ctx,
			`INSERT INTO failover_interfaces (interface, probe_ip, distance) VALUES (?, ?, ?)`,
			rows[i].Interface, rows[i].ProbeIP, rows[i].Distance); err != nil {
			return fmt.Errorf("failed to save failover interface %s: %w", rows[i].Interface, err)
		}
	}
	return nil
}

// ReplaceFailoverInterfaces makes the stored failover interfaces match rows in one transaction.
func ReplaceFailoverInterfaces(ctx context.Context, conn *sqlx.DB, rows []FailoverInterface) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	if err := saveFailoverInterfacesImpl(ctx, tx, rows); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}

// DeleteFailoverInterface removes the stored failover interface with the given name, if there is one.
func DeleteFailoverInterface(ctx context.Context, conn *sqlx.DB, name string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM failover_interfaces WHERE interface = ?`, name); err != nil {
		return fmt.Errorf("failed to delete failover interface %s: %w", name, err)
	}
	return nil
}
