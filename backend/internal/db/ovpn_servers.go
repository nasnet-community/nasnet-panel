package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// OvpnServer is one OpenVPN server entry on the router. Protocol is "tcp" or
// "udp". CertificateTimestamp is the Unix timestamp in the names of the
// server's certificates, 0 if unknown.
type OvpnServer struct {
	Name                      string
	CertificateTimestamp      int64
	Protocol                  string
	Port                      int
	ClientCertificatePassword string
	Enabled                   bool
}

func upsertOvpnServerImpl(ctx context.Context, ext sqlx.ExtContext, server *OvpnServer) error {
	if _, err := ext.ExecContext(ctx,
		`INSERT INTO ovpn_servers (name, certificate_timestamp, protocol, port, client_certificate_password, enabled)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			certificate_timestamp = excluded.certificate_timestamp,
			protocol = excluded.protocol,
			port = excluded.port,
			client_certificate_password = excluded.client_certificate_password,
			enabled = excluded.enabled,
			updated_at = CURRENT_TIMESTAMP`,
		server.Name, server.CertificateTimestamp, server.Protocol, server.Port, server.ClientCertificatePassword, boolInt(server.Enabled)); err != nil {
		return fmt.Errorf("failed to save OpenVPN server %s: %w", server.Name, err)
	}
	return nil
}

// UpsertOvpnServer stores the server, replacing the stored one with the same name.
func UpsertOvpnServer(ctx context.Context, conn *sqlx.DB, server *OvpnServer) error {
	return upsertOvpnServerImpl(ctx, conn, server)
}

// DeleteOvpnServers removes the stored servers with the given names, if there are any.
func DeleteOvpnServers(ctx context.Context, conn *sqlx.DB, names ...string) error {
	for _, name := range names {
		if _, err := conn.ExecContext(ctx, `DELETE FROM ovpn_servers WHERE name = ?`, name); err != nil {
			return fmt.Errorf("failed to delete OpenVPN server %s: %w", name, err)
		}
	}
	return nil
}
