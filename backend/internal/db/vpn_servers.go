package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// VPNServerType values identify the VPN servers that have a single configuration on a router.
const (
	VPNServerTypeSSTP  = "sstp"
	VPNServerTypeL2TP  = "l2tp"
	VPNServerTypeIKEv2 = "ikev2"
)

// VPNServer is the configuration of a single-instance VPN server such as SSTP, L2TP or
// IKEv2. A field that does not apply to the server type stays at its zero value.
// CertificateTimestamp is the Unix timestamp in the names of the server's certificates.
type VPNServer struct {
	Type                    string
	Enabled                 bool
	Port                    int
	DefaultProfile          string
	Authentication          string
	CertificateTimestamp    int64
	VerifyClientCertificate bool
	Ciphers                 string
	UseIPsec                bool
	IPsecSecret             string
}

// UpsertVPNServer stores the server configuration, replacing the stored one of the same type.
func UpsertVPNServer(ctx context.Context, conn *sqlx.DB, server *VPNServer) error {
	if _, err := conn.ExecContext(ctx,
		`INSERT INTO vpn_servers (type, enabled, port, default_profile, authentication, certificate_timestamp, verify_client_certificate, ciphers, use_ipsec, ipsec_secret)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(type) DO UPDATE SET
			enabled = excluded.enabled,
			port = excluded.port,
			default_profile = excluded.default_profile,
			authentication = excluded.authentication,
			certificate_timestamp = excluded.certificate_timestamp,
			verify_client_certificate = excluded.verify_client_certificate,
			ciphers = excluded.ciphers,
			use_ipsec = excluded.use_ipsec,
			ipsec_secret = excluded.ipsec_secret,
			updated_at = CURRENT_TIMESTAMP`,
		server.Type, boolInt(server.Enabled), server.Port, server.DefaultProfile, server.Authentication, server.CertificateTimestamp,
		boolInt(server.VerifyClientCertificate), server.Ciphers, boolInt(server.UseIPsec), server.IPsecSecret); err != nil {
		return fmt.Errorf("failed to save %s server: %w", server.Type, err)
	}
	return nil
}

// DeleteVPNServer removes the stored configuration of the given server type, if there is one.
func DeleteVPNServer(ctx context.Context, conn *sqlx.DB, serverType string) error {
	if _, err := conn.ExecContext(ctx, `DELETE FROM vpn_servers WHERE type = ?`, serverType); err != nil {
		return fmt.Errorf("failed to delete %s server: %w", serverType, err)
	}
	return nil
}
