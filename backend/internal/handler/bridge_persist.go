package handler

import (
	"context"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func bridgePortRecord(port *routeros.BridgePort) *db.BridgePort {
	record := &db.BridgePort{
		Bridge:    port.Bridge,
		Interface: port.Interface,
		Enabled:   port.Disabled == nil || !*port.Disabled,
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

	withRouterDB(c, client, "save the bridge port", func(ctx context.Context, conn *sqlx.DB) error {
		if err := db.UpsertBridgePort(ctx, conn, bridgePortRecord(port)); err != nil {
			return err
		}
		return db.UpdateWiFiBridge(ctx, conn, iface, bridge)
	})
}
