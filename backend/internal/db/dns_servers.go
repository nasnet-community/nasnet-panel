package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// DNSServerType values tell the router's own DNS resolver settings from a named forwarder.
const (
	DNSServerTypeGlobal    = "global"
	DNSServerTypeForwarder = "forwarder"
)

// DNSServer is a set of DNS server values: either the router's global resolver
// settings or one named forwarder. DNSServers and DOHServers are comma separated lists.
type DNSServer struct {
	Name          string
	Type          string
	DNSServers    string
	DOHServers    string
	VerifyDOHCert bool
	Comment       string
}

func upsertDNSServerImpl(ctx context.Context, ext sqlx.ExtContext, server *DNSServer) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO dns_servers (name, type, dns_servers, doh_servers, verify_doh_cert, comment)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			type = excluded.type,
			dns_servers = excluded.dns_servers,
			doh_servers = excluded.doh_servers,
			verify_doh_cert = excluded.verify_doh_cert,
			comment = excluded.comment,
			updated_at = CURRENT_TIMESTAMP`,
		server.Name, server.Type, server.DNSServers, server.DOHServers, boolInt(server.VerifyDOHCert), server.Comment); err != nil {
		return fmt.Errorf("failed to save DNS server %s: %w", server.Name, err)
	}
	return nil
}

// SaveDNSServers makes the stored DNS server values match servers: existing rows are
// updated in place and rows no longer in servers are removed.
func SaveDNSServers(ctx context.Context, conn *sqlx.DB, servers []DNSServer) error {
	tx, err := conn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	names := make([]string, 0, len(servers))
	for i := range servers {
		if err := upsertDNSServerImpl(ctx, tx, &servers[i]); err != nil {
			_ = tx.Rollback()
			return err
		}
		names = append(names, servers[i].Name)
	}
	if err := deleteMissing(ctx, tx, "dns_servers", "name", names, ""); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}
