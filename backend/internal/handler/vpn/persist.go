package vpn

import (
	"context"
	"log"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func persistL2TPClient(c echo.Context, client *routeros.Client, nameOrID string) {
	info, err := client.GetL2TPClientInfo(nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read L2TP client %s for the database: %v", nameOrID, err)
		return
	}

	common.WithRouterDB(c, client, "save L2TP client "+info.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertL2TPClient(ctx, conn, dbsync.L2TPClientRecord(info))
	})
}

func removeL2TPClientFromDB(c echo.Context, client *routeros.Client, name string) {
	common.WithRouterDB(c, client, "delete L2TP client "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteL2TPClient(ctx, conn, name)
	})
}

func persistSSTPClient(c echo.Context, client *routeros.Client, nameOrID string) {
	info, err := client.GetSSTPClientInfo(nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read SSTP client %s for the database: %v", nameOrID, err)
		return
	}

	common.WithRouterDB(c, client, "save SSTP client "+info.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSSTPClient(ctx, conn, dbsync.SSTPClientRecord(info))
	})
}

func removeSSTPClientFromDB(c echo.Context, client *routeros.Client, name string) {
	common.WithRouterDB(c, client, "delete SSTP client "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteSSTPClient(ctx, conn, name)
	})
}

func persistWireGuardInterface(c echo.Context, client *routeros.Client, nameOrID string) {
	record, err := dbsync.WireGuardInterfaceRecord(client, nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read WireGuard interface %s for the database: %v", nameOrID, err)
		return
	}
	if record == nil {
		return
	}

	common.WithRouterDB(c, client, "save WireGuard interface "+record.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.PersistWireGuardInterface(ctx, conn, record)
	})
}

func renameWireGuardPeerKeyInDB(c echo.Context, client *routeros.Client, interfaceName, oldKey, newKey string) {
	common.WithRouterDB(c, client, "rename WireGuard peer key on "+interfaceName, func(ctx context.Context, conn *sqlx.DB) error {
		return db.RenameWireGuardPeerKey(ctx, conn, interfaceName, oldKey, newKey)
	})
}

func removeWireGuardInterfaceFromDB(c echo.Context, client *routeros.Client, name string) {
	if dbsync.WireGuardInterfaceType(name) == "" {
		return
	}

	common.WithRouterDB(c, client, "delete WireGuard interface "+name, func(ctx context.Context, conn *sqlx.DB) error {
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

func persistOvpnServer(c echo.Context, client *routeros.Client, name string) {
	info, err := client.GetOvpnServer(name)
	if err != nil {
		c.Logger().Errorf("Failed to read OpenVPN server %s for the database: %v", name, err)
		return
	}

	common.WithRouterDB(c, client, "save OpenVPN server "+info.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertOvpnServer(ctx, conn, dbsync.OvpnServerRecord(info))
	})
}

func removeOvpnServersFromDB(c echo.Context, client *routeros.Client, names ...string) {
	common.WithRouterDB(c, client, "delete OpenVPN servers", func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteOvpnServers(ctx, conn, names...)
	})
}

func persistVPNUser(c echo.Context, client *routeros.Client, oldUsername string, user *db.VPNUser) {
	common.WithRouterDB(c, client, "save VPN user "+user.Username, func(ctx context.Context, conn *sqlx.DB) error {
		return db.ReplaceVPNUser(ctx, conn, oldUsername, user)
	})
}

func removeVPNUserFromDB(c echo.Context, client *routeros.Client, username string) {
	common.WithRouterDB(c, client, "delete VPN user "+username, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteVPNUser(ctx, conn, username)
	})
}

func persistL2TPServer(c echo.Context, client *routeros.Client) {
	info, err := client.GetL2tpServer()
	if err != nil {
		c.Logger().Errorf("Failed to read the L2TP server for the database: %v", err)
		return
	}

	common.WithRouterDB(c, client, "save the L2TP server", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertVPNServer(ctx, conn, dbsync.L2TPServerRecord(info))
	})
}

func removeVPNServerFromDB(c echo.Context, client *routeros.Client, serverType string) {
	common.WithRouterDB(c, client, "delete the "+serverType+" server", func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteVPNServer(ctx, conn, serverType)
	})
}

func persistCreatedSstpServer(client *routeros.Client, config *routeros.SstpServerConfig, certificatePassword string) {
	common.PersistInRouterDB(context.Background(), log.Printf, client, "save the SSTP server", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertVPNServer(ctx, conn, &db.VPNServer{
			Type:                    db.VPNServerTypeSSTP,
			Enabled:                 config.Enabled,
			Port:                    config.Port,
			DefaultProfile:          config.DefaultProfile,
			Authentication:          config.Authentication,
			CertificateTimestamp:    dbsync.SSTPCertificateTimestamp(config.Certificate),
			VerifyClientCertificate: config.VerifyClientCertificate,
			Ciphers:                 config.Ciphers,
			CertificatePassword:     certificatePassword,
		})
	})
}

func persistCreatedOvpnServers(client *routeros.Client, servers []db.OvpnServer, users []db.VPNUser) {
	common.PersistInRouterDB(context.Background(), log.Printf, client, "save the new OpenVPN servers", func(ctx context.Context, conn *sqlx.DB) error {
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
