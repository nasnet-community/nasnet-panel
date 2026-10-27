package handler

import (
	"context"

	"nasnet-panel/internal/db"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const settingKeyUpdateChannel = "app_update_channel"

func persistUpdateChannelSetting(c echo.Context, channel string) {
	client, err := TryGetRouterOSClient(c)
	if err != nil {
		c.Logger().Errorf("Failed to reach the router to save the update channel: %v", err)
		return
	}

	withRouterDB(c, client, "save the update channel setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, settingKeyUpdateChannel, channel)
	})
}
