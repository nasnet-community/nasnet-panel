package handler

import (
	"context"
	"strconv"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const settingKeyDirectForeignEnabled = "direct_foreign_enabled"

func persistDirectForeignSetting(c echo.Context, client *routeros.Client, enabled bool) {
	withRouterDB(c, client, "save the direct foreign setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, settingKeyDirectForeignEnabled, strconv.FormatBool(enabled))
	})
}
