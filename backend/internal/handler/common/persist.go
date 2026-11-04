package common

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

// DatabaseInitTimeout bounds the router database initialisation.
const DatabaseInitTimeout = 2 * time.Minute

// AppDatabases holds the per-router database state shared by the handlers.
var (
	AppDatabases *db.Registry
	InitStarted  sync.Map
	PreInitOnce  sync.Map
)

// SetDatabases gives the handlers the registry of per-router SQLite databases that backs the app settings endpoints.
func SetDatabases(registry *db.Registry) {
	AppDatabases = registry
}

// RouterSettingsDB returns the settings database of the router of the request.
func RouterSettingsDB(c echo.Context) (conn *sqlx.DB, ok bool, handled error) {
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

	registry := AppDatabases
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

// DatabaseForClient returns the database of the router the client is connected to.
func DatabaseForClient(ctx context.Context, client *routeros.Client) (*sqlx.DB, error) {
	systemID, err := client.GetSystemID()
	if err != nil {
		return nil, fmt.Errorf("failed to read the router system ID: %w", err)
	}

	registry := AppDatabases
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

// PersistInRouterDB runs a save function against the router database and logs failures.
func PersistInRouterDB(ctx context.Context, logf func(format string, args ...interface{}), client *routeros.Client, action string, fn func(ctx context.Context, conn *sqlx.DB) error) {
	conn, err := DatabaseForClient(ctx, client)
	if err == nil {
		err = fn(ctx, conn)
	}
	if err != nil {
		logf("Failed to %s in the database: %v", action, err)
	}
}

// WithRouterDB runs a function against the router database of the request.
func WithRouterDB(c echo.Context, client *routeros.Client, action string, fn func(ctx context.Context, conn *sqlx.DB) error) {
	PersistInRouterDB(c.Request().Context(), c.Logger().Errorf, client, action, fn)
}

// PrepareRouter starts the one-time database initialisation of a router.
func PrepareRouter(host string, client *routeros.Client) {
	once, _ := PreInitOnce.LoadOrStore(host, &sync.Once{})
	if runOnce, ok := once.(*sync.Once); ok {
		runOnce.Do(func() {
			ctx, cancel := context.WithTimeout(context.Background(), DatabaseInitTimeout)
			defer cancel()
			preinit.Run(ctx, host, client)
		})
	}

	StartDatabaseInit(host, client)
}

// StartDatabaseInit initialises the router database in the background.
func StartDatabaseInit(host string, client *routeros.Client) {
	if AppDatabases == nil {
		return
	}
	if _, loaded := InitStarted.LoadOrStore(host, struct{}{}); loaded {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), DatabaseInitTimeout)
		defer cancel()

		if _, err := DatabaseForClient(ctx, client); err != nil {
			log.Printf("Failed to initialise the database of router %s: %v", host, err)
			InitStarted.Delete(host)
		}
	}()
}
