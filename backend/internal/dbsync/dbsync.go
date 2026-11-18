// Package dbsync keeps a router's database in step with the router by copying the router's existing
// configuration into it the first time the database is used.
package dbsync

import (
	"context"
	"log"
	"sync"

	"github.com/jmoiron/sqlx"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"
)

var (
	initialSyncLocks sync.Map
	initialSynced    sync.Map
)

// EnsureInitialSync copies the router's existing configuration into its database the first
// time that database is used, so records created before the database existed are not missing.
// It is best effort: a part that fails to sync is logged and skipped, never blocks the request.
func EnsureInitialSync(ctx context.Context, client *routeros.Client, systemID string, conn *sqlx.DB) {
	if _, ok := initialSynced.Load(systemID); ok {
		return
	}

	lock, _ := initialSyncLocks.LoadOrStore(systemID, &sync.Mutex{})
	mu, ok := lock.(*sync.Mutex)
	if !ok {
		return
	}
	mu.Lock()
	defer mu.Unlock()
	if _, ok := initialSynced.Load(systemID); ok {
		return
	}

	done, err := db.InitialSyncDone(ctx, conn)
	if err != nil {
		log.Printf("Failed to check the initial database sync: %v", err)
		return
	}
	if !done {
		syncExistingConfig(ctx, client, conn)
		if err := db.MarkInitialSyncDone(ctx, conn); err != nil {
			log.Printf("Failed to record the initial database sync: %v", err)
			return
		}
	}

	initialSynced.Store(systemID, struct{}{})
}
