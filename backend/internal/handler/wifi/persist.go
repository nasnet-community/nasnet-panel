package wifi

import (
	"context"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func persistVirtualWiFi(c echo.Context, client *routeros.Client, wifi *routeros.WifiInfo, masterDefaultName, bridge string) {
	port, err := client.GetBridgePort(bridge, wifi.Name)
	if err != nil {
		c.Logger().Errorf("Failed to read bridge port %s for the database: %v", wifi.Name, err)
		return
	}

	common.WithRouterDB(c, client, "save virtual WiFi "+wifi.Name, func(ctx context.Context, conn *sqlx.DB) error {
		if err := db.UpsertWiFi(ctx, conn, dbsync.WiFiRecord(wifi, masterDefaultName, bridge)); err != nil {
			return err
		}
		return db.UpsertBridgePort(ctx, conn, dbsync.BridgePortRecord(port, nil))
	})
}

func persistWiFi(c echo.Context, client *routeros.Client, nameOrID string) {
	wifi, err := client.GetWifiInterface(nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read WiFi interface %s for the database: %v", nameOrID, err)
		return
	}
	if !dbsync.StorableWiFi(wifi) {
		return
	}

	masterDefaultName := ""
	if wifi.IsVirtual {
		master, err := client.GetWifiInterface(wifi.Interface)
		if err != nil {
			c.Logger().Errorf("Failed to read master WiFi interface %s for the database: %v", wifi.Interface, err)
			return
		}
		masterDefaultName = master.DefaultName
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		c.Logger().Errorf("Failed to list bridge ports for the database: %v", err)
		return
	}
	bridge := ""
	for i := range ports {
		if ports[i].Interface == wifi.Name && strings.HasPrefix(ports[i].Bridge, dbsync.LANBridgeNamePrefix) {
			bridge = ports[i].Bridge
			break
		}
	}

	common.WithRouterDB(c, client, "save WiFi "+wifi.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertWiFi(ctx, conn, dbsync.WiFiRecord(wifi, masterDefaultName, bridge))
	})
}

func removeWiFiFromDB(c echo.Context, client *routeros.Client, name string) {
	common.WithRouterDB(c, client, "delete WiFi "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteWiFi(ctx, conn, name)
	})
}
