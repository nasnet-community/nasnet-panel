package handler

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/preinit"
	"nasnet-panel/pkg/routeros"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
)

const databaseInitTimeout = 2 * time.Minute

var (
	appDatabases *db.Registry
	initStarted  sync.Map
	preInitOnce  sync.Map
)

// SetDatabases gives the handlers the registry of per-router SQLite databases that backs the app settings endpoints.
func SetDatabases(registry *db.Registry) {
	appDatabases = registry
}

func routerSettingsDB(c echo.Context) (conn *sqlx.DB, ok bool, handled error) {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return nil, false, err
	}

	systemID, err := client.GetSystemID()
	if err != nil {
		if IsCredentialError(err) {
			return nil, false, ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return nil, false, ErrorResponse(c, http.StatusBadGateway, "Failed to read the router system ID", err)
	}

	registry := appDatabases
	if registry == nil {
		return nil, false, ErrorResponse(c, http.StatusInternalServerError, "The router database is not available", nil)
	}

	conn, err = registry.ForRouter(c.Request().Context(), systemID)
	if err != nil {
		return nil, false, ErrorResponse(c, http.StatusInternalServerError, "Failed to open the router database", err)
	}
	dbsync.EnsureInitialSync(c.Request().Context(), client, systemID, conn)

	return conn, true, nil
}

func databaseForClient(ctx context.Context, client *routeros.Client) (*sqlx.DB, error) {
	systemID, err := client.GetSystemID()
	if err != nil {
		return nil, fmt.Errorf("failed to read the router system ID: %w", err)
	}

	registry := appDatabases
	if registry == nil {
		return nil, errors.New("the router database is not available")
	}

	conn, err := registry.ForRouter(ctx, systemID)
	if err != nil {
		return nil, err
	}
	dbsync.EnsureInitialSync(ctx, client, systemID, conn)

	return conn, nil
}

func persistInRouterDB(ctx context.Context, logf func(format string, args ...interface{}), client *routeros.Client, action string, fn func(ctx context.Context, conn *sqlx.DB) error) {
	conn, err := databaseForClient(ctx, client)
	if err == nil {
		err = fn(ctx, conn)
	}
	if err != nil {
		logf("Failed to %s in the database: %v", action, err)
	}
}

func withRouterDB(c echo.Context, client *routeros.Client, action string, fn func(ctx context.Context, conn *sqlx.DB) error) {
	persistInRouterDB(c.Request().Context(), c.Logger().Errorf, client, action, fn)
}

func prepareRouter(host string, client *routeros.Client) {
	once, _ := preInitOnce.LoadOrStore(host, &sync.Once{})
	if runOnce, ok := once.(*sync.Once); ok {
		runOnce.Do(func() {
			ctx, cancel := context.WithTimeout(context.Background(), databaseInitTimeout)
			defer cancel()
			preinit.Run(ctx, host, client)
		})
	}

	startDatabaseInit(host, client)
}

func startDatabaseInit(host string, client *routeros.Client) {
	if appDatabases == nil {
		return
	}
	if _, loaded := initStarted.LoadOrStore(host, struct{}{}); loaded {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), databaseInitTimeout)
		defer cancel()

		if _, err := databaseForClient(ctx, client); err != nil {
			log.Printf("Failed to initialise the database of router %s: %v", host, err)
			initStarted.Delete(host)
		}
	}()
}
