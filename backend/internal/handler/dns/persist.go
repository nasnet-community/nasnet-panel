package dns

import (
	"context"
	"strconv"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func persistDNSServers(c echo.Context, client *routeros.Client) {
	info, err := client.GetDNSInfo()
	if err != nil {
		c.Logger().Errorf("Failed to read the DNS configuration for the database: %v", err)
		return
	}
	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		c.Logger().Errorf("Failed to read the DNS forwarders for the database: %v", err)
		return
	}

	servers := dbsync.DNSServerRecords(info, forwarders)
	common.WithRouterDB(c, client, "save the DNS servers", func(ctx context.Context, conn *sqlx.DB) error {
		return db.SaveDNSServers(ctx, conn, servers)
	})
}

func persistDNSStaticEntry(c echo.Context, client *routeros.Client, entry *routeros.StaticDNSEntry) {
	common.WithRouterDB(c, client, "save static DNS entry "+entry.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertDNSStaticEntry(ctx, conn, dbsync.DNSStaticEntryRecord(entry))
	})
}

func removeDNSStaticEntryFromDB(c echo.Context, client *routeros.Client, routerID string) {
	common.WithRouterDB(c, client, "delete static DNS entry "+routerID, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteDNSStaticEntry(ctx, conn, routerID)
	})
}

func persistAdBlockSetting(c echo.Context, client *routeros.Client, enabled bool) {
	common.WithRouterDB(c, client, "save the ad-block setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, dbsync.SettingKeyAdBlockEnabled, strconv.FormatBool(enabled))
	})
}
