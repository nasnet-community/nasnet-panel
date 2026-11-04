package firewall

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

func persistDomesticBlockSetting(c echo.Context, client *routeros.Client, blocked bool) {
	common.WithRouterDB(c, client, "save the domestic block setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, dbsync.SettingKeyDomesticBlockEnabled, strconv.FormatBool(blocked))
	})
}

func persistDomesticAddress(c echo.Context, client *routeros.Client, address string) {
	common.WithRouterDB(c, client, "save domestic address "+address, func(ctx context.Context, conn *sqlx.DB) error {
		return db.AddDomesticAddress(ctx, conn, address)
	})
}

func persistDomesticAddressChange(c echo.Context, client *routeros.Client, oldAddress, newAddress string) {
	common.WithRouterDB(c, client, "update domestic address "+oldAddress, func(ctx context.Context, conn *sqlx.DB) error {
		return db.ReplaceDomesticAddress(ctx, conn, oldAddress, newAddress)
	})
}

func removeDomesticAddressFromDB(c echo.Context, client *routeros.Client, address string) {
	common.WithRouterDB(c, client, "delete domestic address "+address, func(ctx context.Context, conn *sqlx.DB) error {
		return db.DeleteDomesticAddress(ctx, conn, address)
	})
}
