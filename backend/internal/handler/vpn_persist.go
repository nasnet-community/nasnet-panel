package handler

import (
	"context"
	"log"
	"strconv"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const (
	vpnClientVRFSuffix      = "@VRF-TunnelEnds"
	wireGuardClientSuffix   = "-wg-client"
	wireGuardServerSuffix   = "-server"
	ovpnServerCommentPrefix = "Client Certificate Password: "
)

func persistInRouterDB(ctx context.Context, logf func(format string, args ...interface{}), client *routeros.Client, action string, fn func(ctx context.Context, conn *sqlx.DB) error) {
	conn, err := databaseForClient(ctx, client)
	if err == nil {
		err = fn(ctx, conn)
	}
	if err != nil {
		logf("Failed to %s in the database: %v", action, err)
	}
}

func withRouterDB(c echo.Context, client *routeros.Client, action string, fn func(ctx context.Context, conn *sqlx.DB) error) {
	persistInRouterDB(c.Request().Context(), c.Logger().Errorf, client, action, fn)
}

func l2tpClientRecord(info *routeros.L2TPClientInfo) *db.L2TPClient {
	return &db.L2TPClient{
		Name:        info.Name,
		Comment:     info.Comment,
		ConnectTo:   strings.TrimSuffix(info.ConnectTo, vpnClientVRFSuffix),
		User:        info.User,
		Password:    info.Password,
		IPsecSecret: info.IPsecSecret,
		Enabled:     !info.Disabled,
	}
}

func persistL2TPClient(c echo.Context, client *routeros.Client, nameOrID string) {
	info, err := client.GetL2TPClientInfo(nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read L2TP client %s for the database: %v", nameOrID, err)
		return
	}

	withRouterDB(c, client, "save L2TP client "+info.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertL2TPClient(ctx, conn, l2tpClientRecord(info))
	})
}

func removeL2TPClientFromDB(c echo.Context, client *routeros.Client, name string) {
	withRouterDB(c, client, "delete L2TP client "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteL2TPClient(ctx, conn, name)
	})
}

func sstpClientRecord(info *routeros.SSTPClientInfo) *db.SSTPClient {
	return &db.SSTPClient{
		Name:      info.Name,
		Comment:   info.Comment,
		ConnectTo: strings.TrimSuffix(info.ConnectTo, vpnClientVRFSuffix),
		Port:      info.Port,
		User:      info.User,
		Password:  info.Password,
		Enabled:   !info.Disabled,
	}
}

func persistSSTPClient(c echo.Context, client *routeros.Client, nameOrID string) {
	info, err := client.GetSSTPClientInfo(nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read SSTP client %s for the database: %v", nameOrID, err)
		return
	}

	withRouterDB(c, client, "save SSTP client "+info.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSSTPClient(ctx, conn, sstpClientRecord(info))
	})
}

func removeSSTPClientFromDB(c echo.Context, client *routeros.Client, name string) {
	withRouterDB(c, client, "delete SSTP client "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteSSTPClient(ctx, conn, name)
	})
}

func wireGuardInterfaceRecord(client *routeros.Client, nameOrID string) (*db.WireGuardInterface, error) {
	wg, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return nil, err
	}
	wgType := wireGuardInterfaceType(wg.Name)
	if wgType == "" {
		return nil, nil
	}

	peers, err := client.GetWireGuardPeers(wg.Name)
	if err != nil {
		return nil, err
	}

	address := ""
	if addresses, err := client.GetIPAddressesByInterface(wg.Name); err == nil && len(addresses) > 0 {
		address = addresses[0].Address
	}

	record := &db.WireGuardInterface{
		Name:       wg.Name,
		Comment:    wg.Comment,
		Type:       wgType,
		PrivateKey: wg.PrivateKey,
		Address:    address,
		Enabled:    !wg.Disabled,
	}
	for i := range peers {
		peer := &peers[i]
		record.Peers = append(record.Peers, db.WireGuardPeer{
			Name:                peer.Name,
			Comment:             peer.Comment,
			Enabled:             !peer.Disabled,
			PublicKey:           peer.PublicKey,
			PrivateKey:          peer.PrivateKey,
			PresharedKey:        peer.PreSharedKey,
			EndpointAddress:     peer.EndpointAddress,
			EndpointPort:        peer.EndpointPort,
			AllowedAddress:      peer.AllowedAddresses,
			PersistentKeepalive: int(utils.RouterOSDurationSeconds(peer.PersistentKeepalive)),
		})
	}

	return record, nil
}

func persistWireGuardInterface(c echo.Context, client *routeros.Client, nameOrID string) {
	record, err := wireGuardInterfaceRecord(client, nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read WireGuard interface %s for the database: %v", nameOrID, err)
		return
	}
	if record == nil {
		return
	}

	withRouterDB(c, client, "save WireGuard interface "+record.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.PersistWireGuardInterface(ctx, conn, record)
	})
}

func wireGuardInterfaceType(name string) string {
	switch {
	case strings.HasSuffix(name, wireGuardClientSuffix):
		return db.WireGuardTypeClient
	case strings.HasSuffix(name, wireGuardServerSuffix):
		return db.WireGuardTypeServer
	}
	return ""
}

func renameWireGuardPeerKeyInDB(c echo.Context, client *routeros.Client, interfaceName, oldKey, newKey string) {
	withRouterDB(c, client, "rename WireGuard peer key on "+interfaceName, func(ctx context.Context, conn *sqlx.DB) error {
		return db.RenameWireGuardPeerKey(ctx, conn, interfaceName, oldKey, newKey)
	})
}

func removeWireGuardInterfaceFromDB(c echo.Context, client *routeros.Client, name string) {
	if wireGuardInterfaceType(name) == "" {
		return
	}

	withRouterDB(c, client, "delete WireGuard interface "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteWireGuardInterface(ctx, conn, name)
	})
}

func persistVPNClient(c echo.Context, client *routeros.Client, vpnClient *routeros.VPNClientInfo) {
	switch vpnClient.Type {
	case routeros.VPNTypeL2TPOut:
		persistL2TPClient(c, client, vpnClient.Name)
	case routeros.VPNTypeSSTPOut:
		persistSSTPClient(c, client, vpnClient.Name)
	case routeros.VPNTypeWireGuard:
		persistWireGuardInterface(c, client, vpnClient.Name)
	}
}

func ovpnServerRecord(info *routeros.OvpnServerInfo) *db.OvpnServer {
	baseName := strings.TrimSuffix(strings.TrimSuffix(info.Name, "-tcp"), "-udp")
	timestamp, _ := strconv.ParseInt(extractOvpnServerTimestamp(baseName), 10, 64)
	password, _ := strings.CutPrefix(info.Comment, ovpnServerCommentPrefix)
	if password == info.Comment {
		password = ""
	}

	return &db.OvpnServer{
		Name:                      info.Name,
		CertificateTimestamp:      timestamp,
		Protocol:                  info.ProtocolVersion,
		Port:                      info.Port,
		ClientCertificatePassword: password,
		Enabled:                   !info.Disabled,
	}
}

func persistOvpnServer(c echo.Context, client *routeros.Client, name string) {
	info, err := client.GetOvpnServer(name)
	if err != nil {
		c.Logger().Errorf("Failed to read OpenVPN server %s for the database: %v", name, err)
		return
	}

	withRouterDB(c, client, "save OpenVPN server "+info.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertOvpnServer(ctx, conn, ovpnServerRecord(info))
	})
}

func removeOvpnServersFromDB(c echo.Context, client *routeros.Client, names ...string) {
	withRouterDB(c, client, "delete OpenVPN servers", func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteOvpnServers(ctx, conn, names...)
	})
}

func persistVPNUser(c echo.Context, client *routeros.Client, oldUsername string, user *db.VPNUser) {
	withRouterDB(c, client, "save VPN user "+user.Username, func(ctx context.Context, conn *sqlx.DB) error {
		return db.ReplaceVPNUser(ctx, conn, oldUsername, user)
	})
}

func removeVPNUserFromDB(c echo.Context, client *routeros.Client, username string) {
	withRouterDB(c, client, "delete VPN user "+username, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteVPNUser(ctx, conn, username)
	})
}

func l2tpServerRecord(info *routeros.L2tpServerInfo) *db.VPNServer {
	return &db.VPNServer{
		Type:           db.VPNServerTypeL2TP,
		Enabled:        info.Enabled,
		DefaultProfile: info.DefaultProfile,
		Authentication: info.Authentication,
		UseIPsec:       info.UseIPsec == "yes" || info.UseIPsec == "required",
		IPsecSecret:    info.IPsecSecret,
	}
}

func sstpServerRecord(info *routeros.SstpServerInfo) *db.VPNServer {
	return &db.VPNServer{
		Type:                    db.VPNServerTypeSSTP,
		Enabled:                 info.Enabled,
		Port:                    info.Port,
		DefaultProfile:          info.DefaultProfile,
		Authentication:          info.Authentication,
		CertificateTimestamp:    sstpCertificateTimestamp(info.Certificate),
		VerifyClientCertificate: info.VerifyClientCertificate,
		Ciphers:                 info.Ciphers,
	}
}

func persistL2TPServer(c echo.Context, client *routeros.Client) {
	info, err := client.GetL2tpServer()
	if err != nil {
		c.Logger().Errorf("Failed to read the L2TP server for the database: %v", err)
		return
	}

	withRouterDB(c, client, "save the L2TP server", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertVPNServer(ctx, conn, l2tpServerRecord(info))
	})
}

func removeVPNServerFromDB(c echo.Context, client *routeros.Client, serverType string) {
	withRouterDB(c, client, "delete the "+serverType+" server", func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteVPNServer(ctx, conn, serverType)
	})
}

func sstpCertificateTimestamp(serverCertName string) int64 {
	timestamp, ok := strings.CutPrefix(serverCertName, "sstp-server-")
	if !ok {
		return 0
	}
	value, _ := strconv.ParseInt(timestamp, 10, 64)
	return value
}

func persistCreatedSstpServer(client *routeros.Client, config *routeros.SstpServerConfig) {
	persistInRouterDB(context.Background(), log.Printf, client, "save the SSTP server", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertVPNServer(ctx, conn, &db.VPNServer{
			Type:                    db.VPNServerTypeSSTP,
			Enabled:                 config.Enabled,
			Port:                    config.Port,
			DefaultProfile:          config.DefaultProfile,
			Authentication:          config.Authentication,
			CertificateTimestamp:    sstpCertificateTimestamp(config.Certificate),
			VerifyClientCertificate: config.VerifyClientCertificate,
			Ciphers:                 config.Ciphers,
		})
	})
}

func persistCreatedOvpnServers(client *routeros.Client, servers []db.OvpnServer, users []db.VPNUser) {
	persistInRouterDB(context.Background(), log.Printf, client, "save the new OpenVPN servers", func(ctx context.Context, conn *sqlx.DB) error {
		for i := range servers {
			if err := db.UpsertOvpnServer(ctx, conn, &servers[i]); err != nil {
				return err
			}
		}
		for i := range users {
			if err := db.UpsertVPNUser(ctx, conn, &users[i]); err != nil {
				return err
			}
		}
		return nil
	})
}
