package updates

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "modernc.org/sqlite" // Pure Go SQLite driver (no CGO)
)

// UpdatePhase represents a phase in the atomic update process
type UpdatePhase string

const (
	PhaseStaging    UpdatePhase = "STAGING"    // Download and verify new binary
	PhaseBackup     UpdatePhase = "BACKUP"     // Backup current binary and config
	PhaseSwap       UpdatePhase = "SWAP"       // Atomic swap of binaries
	PhaseMigration  UpdatePhase = "MIGRATION"  // Run config migrations
	PhaseValidation UpdatePhase = "VALIDATION" // Verify new version works
	PhaseCommit     UpdatePhase = "COMMIT"     // Finalize update
	PhaseRollback   UpdatePhase = "ROLLBACK"   // Restore from backup
)

// JournalEntry represents a single journal entry in the update log
type JournalEntry struct {
	ID           int64                  `json:"id"`
	InstanceID   string                 `json:"instanceId"`
	FeatureID    string                 `json:"featureId"`
	FromVersion  string                 `json:"fromVersion"`
	ToVersion    string                 `json:"toVersion"`
	Phase        UpdatePhase            `json:"phase"`
	Status       string                 `json:"status"` // pending, success, failed
	StartedAt    time.Time              `json:"startedAt"`
	CompletedAt  *time.Time             `json:"completedAt,omitempty"`
	ErrorMessage string                 `json:"errorMessage,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateJournal provides power-safe journaling for atomic updates
// Uses SQLite with WAL mode for crash recovery
type UpdateJournal struct {
	db *sql.DB
}

// NewUpdateJournal creates a new update journal with SQLite backend
func NewUpdateJournal(dbPath string) (*UpdateJournal, error) {
	// Open database with modernc.org/sqlite driver (pure Go, no CGO)
	db, err := sql.Open("sqlite", "file:"+dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Apply PRAGMAs for power-safe writes
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA synchronous=FULL",
	}
	for _, pragma := range pragmas {
		if _, err := db.ExecContext(context.Background(), pragma); err != nil {
			db.Close()
			return nil, fmt.Errorf("failed to execute %s: %w", pragma, err)
		}
	}

	journal := &UpdateJournal{db: db}

	// Initialize schema
	if err := journal.initSchema(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return journal, nil
}

// initSchema creates the journal table if it doesn't exist
func (j *UpdateJournal) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS update_journal (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		instance_id TEXT NOT NULL,
		feature_id TEXT NOT NULL,
		from_version TEXT NOT NULL,
		to_version TEXT NOT NULL,
		phase TEXT NOT NULL,
		status TEXT NOT NULL,
		started_at TIMESTAMP NOT NULL,
		completed_at TIMESTAMP,
		error_message TEXT,
		metadata TEXT,
		UNIQUE(instance_id, to_version, phase)
	);

	CREATE INDEX IF NOT EXISTS idx_instance_phase ON update_journal(instance_id, phase);
	CREATE INDEX IF NOT EXISTS idx_status ON update_journal(status);
	`

	_, err := j.db.ExecContext(context.Background(), schema)
	if err != nil {
		return fmt.Errorf("initialize update journal schema: %w", err)
	}
	return nil
}

// BeginPhase records the start of an update phase
func (j *UpdateJournal) BeginPhase(ctx context.Context, instanceID, featureID, fromVersion, toVersion string, phase UpdatePhase, metadata map[string]interface{}) (int64, error) {
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal metadata: %w", err)
	}

	result, err := j.db.ExecContext(ctx,
		`INSERT INTO update_journal (instance_id, feature_id, from_version, to_version, phase, status, started_at, metadata)
		 VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
		 ON CONFLICT(instance_id, to_version, phase) DO UPDATE SET
		   started_at = excluded.started_at,
		   status = 'pending',
		   completed_at = NULL,
		   error_message = NULL,
		   metadata = excluded.metadata`,
		instanceID, featureID, fromVersion, toVersion, phase, time.Now(), string(metadataJSON),
	)
	if err != nil {
		return 0, fmt.Errorf("failed to begin phase: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}
	return id, nil
}

// CompletePhase marks a phase as successfully completed
func (j *UpdateJournal) CompletePhase(ctx context.Context, instanceID, toVersion string, phase UpdatePhase) error {
	_, err := j.db.ExecContext(ctx,
		`UPDATE update_journal
		 SET status = 'success', completed_at = ?
		 WHERE instance_id = ? AND to_version = ? AND phase = ? AND status = 'pending'`,
		time.Now(), instanceID, toVersion, phase,
	)
	if err != nil {
		return fmt.Errorf("failed to complete phase: %w", err)
	}

	return nil
}

// FailPhase marks a phase as failed with error message
func (j *UpdateJournal) FailPhase(ctx context.Context, instanceID, toVersion string, phase UpdatePhase, errorMsg string) error {
	_, err := j.db.ExecContext(ctx,
		`UPDATE update_journal
		 SET status = 'failed', completed_at = ?, error_message = ?
		 WHERE instance_id = ? AND to_version = ? AND phase = ? AND status = 'pending'`,
		time.Now(), errorMsg, instanceID, toVersion, phase,
	)
	if err != nil {
		return fmt.Errorf("failed to fail phase: %w", err)
	}

	return nil
}

// GetIncompleteUpdates returns all updates that didn't complete successfully
// Used for crash recovery on boot
func (j *UpdateJournal) GetIncompleteUpdates(ctx context.Context) ([]JournalEntry, error) {
	rows, err := j.db.QueryContext(ctx,
		`SELECT id, instance_id, feature_id, from_version, to_version, phase, status, started_at, completed_at, error_message, metadata
		 FROM update_journal
		 WHERE status = 'pending' OR status = 'failed'
		 ORDER BY started_at ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query incomplete updates: %w", err)
	}
	defer rows.Close()

	entries, err := j.scanEntries(rows)
	if err != nil {
		return nil, fmt.Errorf("scan entries: %w", err)
	}
	return entries, nil
}

// GetUpdateHistory returns recent update history for an instance
func (j *UpdateJournal) GetUpdateHistory(ctx context.Context, instanceID string, limit int) ([]JournalEntry, error) {
	rows, err := j.db.QueryContext(ctx,
		`SELECT id, instance_id, feature_id, from_version, to_version, phase, status, started_at, completed_at, error_message, metadata
		 FROM update_journal
		 WHERE instance_id = ?
		 ORDER BY started_at DESC
		 LIMIT ?`,
		instanceID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query update history: %w", err)
	}
	defer rows.Close()

	entries, err := j.scanEntries(rows)
	if err != nil {
		return nil, fmt.Errorf("scan entries: %w", err)
	}
	return entries, nil
}

// scanEntries scans rows from the update_journal table into JournalEntry slices.
func (j *UpdateJournal) scanEntries(rows *sql.Rows) ([]JournalEntry, error) {
	var entries []JournalEntry
	for rows.Next() {
		var entry JournalEntry
		var completedAt sql.NullTime
		var errorMessage sql.NullString
		var metadataJSON sql.NullString

		if err := rows.Scan(
			&entry.ID,
			&entry.InstanceID,
			&entry.FeatureID,
			&entry.FromVersion,
			&entry.ToVersion,
			&entry.Phase,
			&entry.Status,
			&entry.StartedAt,
			&completedAt,
			&errorMessage,
			&metadataJSON,
		); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		if completedAt.Valid {
			entry.CompletedAt = &completedAt.Time
		}
		if errorMessage.Valid {
			entry.ErrorMessage = errorMessage.String
		}
		if metadataJSON.Valid {
			if err := json.Unmarshal([]byte(metadataJSON.String), &entry.Metadata); err != nil {
				// Ignore metadata parse errors
				entry.Metadata = make(map[string]interface{})
			}
		}

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	return entries, nil
}

// Close closes the database connection
func (j *UpdateJournal) Close() error {
	if err := j.db.Close(); err != nil {
		return fmt.Errorf("close update journal database: %w", err)
	}
	return nil
}
