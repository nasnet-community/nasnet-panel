package handler

import (
	"context"
	"log"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func persistBridgePort(c echo.Context, client *routeros.Client, iface, bridge string) {
	port, err := client.GetBridgePort(bridge, iface)
	if err != nil {
		c.Logger().Errorf("Failed to read bridge port %s for the database: %v", iface, err)
		return
	}

	defaultNames, err := dbsync.InterfaceDefaultNames(client)
	if err != nil {
		c.Logger().Errorf("Failed to read the interfaces for the database: %v", err)
		return
	}

	withRouterDB(c, client, "save the bridge port", func(ctx context.Context, conn *sqlx.DB) error {
		if err := db.UpsertBridgePort(ctx, conn, dbsync.BridgePortRecord(port, defaultNames)); err != nil {
			return err
		}
		return db.UpdateWiFiBridge(ctx, conn, iface, bridge)
	})
}

func persistNetworkConfigWhenDone(client *routeros.Client, variable, token string) {
	ctx, cancel := context.WithTimeout(context.Background(), scriptDoneTimeout)
	defer cancel()

	if !waitForScriptDone(ctx, client, variable, token) {
		log.Printf("The %s script did not finish in time, its changes were not saved to the database", variable)
		return
	}

	cfg, err := dbsync.RouterNetworkConfig(client)
	if err != nil {
		log.Printf("Failed to read the network configuration for the database: %v", err)
		return
	}

	persistInRouterDB(ctx, log.Printf, client, "save the network configuration", func(ctx context.Context, conn *sqlx.DB) error {
		return db.SaveNetworkConfig(ctx, conn, cfg)
	})
}

func removeBridgePortFromDB(c echo.Context, client *routeros.Client, iface string) {
	withRouterDB(c, client, "delete bridge port "+iface, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteBridgePort(ctx, conn, iface)
	})
}
