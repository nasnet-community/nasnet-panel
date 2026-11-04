package route

import (
	"context"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

func persistForeignGatewaySetting(c echo.Context, client *routeros.Client, gateway string) {
	common.WithRouterDB(c, client, "save the foreign gateway setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, dbsync.SettingKeyForeignGateway, gateway)
	})
}
