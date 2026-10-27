package handler

import (
	"context"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const settingKeyUpdateChannel = "app_update_channel"

func persistUpdateChannelSetting(c echo.Context, client *routeros.Client, channel string) {
	withRouterDB(c, client, "save the update channel setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, settingKeyUpdateChannel, channel)
	})
}
