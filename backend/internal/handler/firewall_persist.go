package handler

import (
	"context"
	"strconv"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const settingKeyDomesticBlockEnabled = "domestic_block_enabled"

func persistDomesticBlockSetting(c echo.Context, client *routeros.Client, blocked bool) {
	withRouterDB(c, client, "save the domestic block setting", func(ctx context.Context, conn *sqlx.DB) error {
		return db.UpsertSetting(ctx, conn, settingKeyDomesticBlockEnabled, strconv.FormatBool(blocked))
	})
}
