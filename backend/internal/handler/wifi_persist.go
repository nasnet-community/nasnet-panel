package handler

import (
	"context"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func storableWiFi(w *routeros.WifiInfo) bool {
	return w.Name != managementWifiName && w.SSID != "" && validWifiMode(w.Mode)
}

func wifiRecord(w *routeros.WifiInfo, masterDefaultName, bridge string) *db.WiFi {
	record := &db.WiFi{
		Name:        w.Name,
		DefaultName: w.DefaultName,
		SSID:        w.SSID,
		Password:    w.Passphrase,
		Enabled:     !w.Disabled,
		Mode:        w.Mode,
		IsVirtual:   w.IsVirtual,
		Bridge:      bridge,
		AuthTypes:   w.SecurityType,
	}
	if w.IsVirtual {
		record.Master = masterDefaultName
	}
	return record
}

func persistVirtualWiFi(c echo.Context, client *routeros.Client, wifi *routeros.WifiInfo, masterDefaultName, bridge string) {
	port, err := client.GetBridgePort(bridge, wifi.Name)
	if err != nil {
		c.Logger().Errorf("Failed to read bridge port %s for the database: %v", wifi.Name, err)
		return
	}

	withRouterDB(c, client, "save virtual WiFi "+wifi.Name, func(ctx context.Context, conn *sqlx.DB) error {
		if err := db.UpsertWiFi(ctx, conn, wifiRecord(wifi, masterDefaultName, bridge)); err != nil {
			return err
		}
		return db.UpsertBridgePort(ctx, conn, bridgePortRecord(port, nil))
	})
}

func persistWiFi(c echo.Context, client *routeros.Client, nameOrID string) {
	wifi, err := client.GetWifiInterface(nameOrID)
	if err != nil {
		c.Logger().Errorf("Failed to read WiFi interface %s for the database: %v", nameOrID, err)
		return
	}
	if !storableWiFi(wifi) {
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
		if ports[i].Interface == wifi.Name && strings.HasPrefix(ports[i].Bridge, lanBridgeNamePrefix) {
			bridge = ports[i].Bridge
			break
		}
	}

	withRouterDB(c, client, "save WiFi "+wifi.Name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertWiFi(ctx, conn, wifiRecord(wifi, masterDefaultName, bridge))
	})
}

func removeWiFiFromDB(c echo.Context, client *routeros.Client, name string) {
	withRouterDB(c, client, "delete WiFi "+name, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteWiFi(ctx, conn, name)
	})
}

func removeBridgePortFromDB(c echo.Context, client *routeros.Client, iface string) {
	withRouterDB(c, client, "delete bridge port "+iface, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteBridgePort(ctx, conn, iface)
	})
}
