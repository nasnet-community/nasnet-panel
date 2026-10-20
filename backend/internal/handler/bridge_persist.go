package handler

import (
	"context"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func interfaceDefaultNames(client *routeros.Client) (map[string]string, error) {
	interfaces, err := client.ListInterfaces()
	if err != nil {
		return nil, err
	}

	names := make(map[string]string, len(interfaces))
	for i := range interfaces {
		if interfaces[i].DefaultName != nil {
			names[interfaces[i].Name] = *interfaces[i].DefaultName
		}
	}
	return names, nil
}

const (
	wanChangeDoneVariable = "ChangeWANDone"
	scriptDoneTimeout     = time.Minute
	scriptDonePollEvery   = 500 * time.Millisecond
)

func waitForScriptDone(client *routeros.Client, variable, token string) {
	deadline := time.Now().Add(scriptDoneTimeout)
	for time.Now().Before(deadline) {
		if value, err := client.GetEnvironmentVariable(variable); err == nil && value == token {
			return
		}
		time.Sleep(scriptDonePollEvery)
	}
}

func bridgePortRecord(port *routeros.BridgePort, defaultNames map[string]string) *db.BridgePort {
	record := &db.BridgePort{
		Bridge:      port.Bridge,
		Interface:   port.Interface,
		DefaultName: defaultNames[port.Interface],
		Enabled:     port.Disabled == nil || !*port.Disabled,
	}
	if port.Comment != nil {
		record.Comment = *port.Comment
	}
	return record
}

func persistBridgePort(c echo.Context, client *routeros.Client, iface, bridge string) {
	port, err := client.GetBridgePort(bridge, iface)
	if err != nil {
		c.Logger().Errorf("Failed to read bridge port %s for the database: %v", iface, err)
		return
	}

	defaultNames, err := interfaceDefaultNames(client)
	if err != nil {
		c.Logger().Errorf("Failed to read the interfaces for the database: %v", err)
		return
	}

	withRouterDB(c, client, "save the bridge port", func(ctx context.Context, conn *sqlx.DB) error {
		if err := db.UpsertBridgePort(ctx, conn, bridgePortRecord(port, defaultNames)); err != nil {
			return err
		}
		return db.UpdateWiFiBridge(ctx, conn, iface, bridge)
	})
}

func persistNetworkConfig(c echo.Context, client *routeros.Client) {
	cfg, err := routerNetworkConfig(client)
	if err != nil {
		c.Logger().Errorf("Failed to read the network configuration for the database: %v", err)
		return
	}

	withRouterDB(c, client, "save the network configuration", func(ctx context.Context, conn *sqlx.DB) error {
		return db.SaveNetworkConfig(ctx, conn, cfg)
	})
}
