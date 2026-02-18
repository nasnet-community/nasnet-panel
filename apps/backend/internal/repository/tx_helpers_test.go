package repository_test

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"backend/generated/ent"
	"backend/internal/common/ulid"
	"backend/internal/repository"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDB creates a test database with in-memory SQLite.
func setupTestDB(t *testing.T) *ent.Client {
	t.Helper()

	// Open database with modernc.org/sqlite driver
	db, err := sql.Open("sqlite", "file::memory:?cache=shared&_time_format=sqlite")
	require.NoError(t, err)

	// Enable foreign keys via PRAGMA
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	// Create ent driver wrapping the sql.DB
	drv := entsql.OpenDB(dialect.SQLite, db)

	// Create ent client
	client := ent.NewClient(ent.Driver(drv))

	// Run migrations
	err = client.Schema.Create(context.Background())
	require.NoError(t, err)

	t.Cleanup(func() {
		client.Close()
		db.Close()
	})

	return client
}

// TestWithTx verifies transaction helper functionality.
func TestWithTx(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	t.Run("commits on success", func(t *testing.T) {
		var createdUserID string

		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			// Create a user within transaction
			user, err := tx.User.Create().
				SetID(ulid.NewString()).
				SetUsername("txtest_commit").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
			if err != nil {
				return err
			}
			createdUserID = user.ID
			return nil
		})

		require.NoError(t, err)

		// Verify user was committed
		user, err := client.User.Get(ctx, createdUserID)
		require.NoError(t, err)
		assert.Equal(t, "txtest_commit", user.Username)
	})

	t.Run("rolls back on error", func(t *testing.T) {
		userID := ulid.NewString()

		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			// Create a user
			_, err := tx.User.Create().
				SetID(userID).
				SetUsername("txtest_rollback").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
			if err != nil {
				return err
			}

			// Return error to trigger rollback
			return errors.New("intentional error")
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "intentional error")

		// Verify user was NOT created (rolled back)
		_, err = client.User.Get(ctx, userID)
		assert.True(t, ent.IsNotFound(err), "user should not exist after rollback")
	})

	t.Run("handles panic with rollback", func(t *testing.T) {
		userID := ulid.NewString()

		defer func() {
			r := recover()
			assert.NotNil(t, r, "should have panicked")
			assert.Equal(t, "intentional panic", r)

			// Verify user was NOT created (rolled back due to panic)
			_, err := client.User.Get(context.Background(), userID)
			assert.True(t, ent.IsNotFound(err), "user should not exist after panic rollback")
		}()

		_ = repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			// Create a user
			_, err := tx.User.Create().
				SetID(userID).
				SetUsername("txtest_panic").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
			if err != nil {
				return err
			}

			// Panic to trigger rollback
			panic("intentional panic")
		})
	})
}

// TestWithTxResult verifies transaction helper with return value.
func TestWithTxResult(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	t.Run("returns result on success", func(t *testing.T) {
		user, err := repository.WithTxResult(ctx, client, func(tx *ent.Tx) (*ent.User, error) {
			return tx.User.Create().
				SetID(ulid.NewString()).
				SetUsername("txresult_success").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
		})

		require.NoError(t, err)
		require.NotNil(t, user)
		assert.Equal(t, "txresult_success", user.Username)
	})

	t.Run("returns zero value on error", func(t *testing.T) {
		user, err := repository.WithTxResult(ctx, client, func(tx *ent.Tx) (*ent.User, error) {
			return nil, errors.New("intentional error")
		})

		require.Error(t, err)
		assert.Nil(t, user)
	})
}

// TestTransactionContext verifies context-based transaction propagation.
func TestTransactionContext(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	t.Run("stores and retrieves transaction", func(t *testing.T) {
		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			txCtx := repository.WithTxClient(ctx, tx)

			// Retrieve transaction from context
			retrieved := repository.GetTxClient(txCtx)
			assert.Equal(t, tx, retrieved)

			return nil
		})

		require.NoError(t, err)
	})

	t.Run("returns nil when no transaction in context", func(t *testing.T) {
		tx := repository.GetTxClient(ctx)
		assert.Nil(t, tx)
	})

	t.Run("GetClientOrTx returns transaction client when present", func(t *testing.T) {
		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			txCtx := repository.WithTxClient(ctx, tx)

			// Should return transaction's client
			result := repository.GetClientOrTx(txCtx, client)
			assert.NotNil(t, result)

			return nil
		})

		require.NoError(t, err)
	})

	t.Run("GetClientOrTx returns original client when no transaction", func(t *testing.T) {
		result := repository.GetClientOrTx(ctx, client)
		assert.Equal(t, client, result)
	})
}

// TestRunInTransaction verifies composable transaction helper.
func TestRunInTransaction(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	t.Run("creates new transaction when none exists", func(t *testing.T) {
		var sawTransaction bool

		err := repository.RunInTransaction(ctx, client, func(innerCtx context.Context) error {
			tx := repository.GetTxClient(innerCtx)
			sawTransaction = tx != nil
			return nil
		})

		require.NoError(t, err)
		assert.True(t, sawTransaction, "should have created transaction")
	})

	t.Run("reuses existing transaction", func(t *testing.T) {
		var outerTx, innerTx *ent.Tx

		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			outerTx = tx
			txCtx := repository.WithTxClient(ctx, tx)

			return repository.RunInTransaction(txCtx, client, func(innerCtx context.Context) error {
				innerTx = repository.GetTxClient(innerCtx)
				return nil
			})
		})

		require.NoError(t, err)
		assert.Equal(t, outerTx, innerTx, "should reuse same transaction")
	})
}

// TestSavepoint verifies savepoint functionality.
func TestSavepoint(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	t.Run("creates and releases savepoint", func(t *testing.T) {
		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			sp, err := repository.CreateSavepoint(ctx, tx, "test_sp")
			if err != nil {
				return err
			}

			// Create a user after savepoint
			_, err = tx.User.Create().
				SetID(ulid.NewString()).
				SetUsername("savepoint_test").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
			if err != nil {
				return err
			}

			// Release savepoint (commit this portion)
			return sp.Release(ctx)
		})

		require.NoError(t, err)

		// Verify user exists
		users, err := client.User.Query().All(ctx)
		require.NoError(t, err)
		found := false
		for _, u := range users {
			if u.Username == "savepoint_test" {
				found = true
				break
			}
		}
		assert.True(t, found, "user should exist after savepoint release")
	})

	t.Run("rollback to savepoint undoes changes", func(t *testing.T) {
		var firstUserID string

		err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
			// Create first user
			firstUser, err := tx.User.Create().
				SetID(ulid.NewString()).
				SetUsername("before_savepoint").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
			if err != nil {
				return err
			}
			firstUserID = firstUser.ID

			// Create savepoint
			sp, err := repository.CreateSavepoint(ctx, tx, "test_sp")
			if err != nil {
				return err
			}

			// Create second user after savepoint
			_, err = tx.User.Create().
				SetID(ulid.NewString()).
				SetUsername("after_savepoint").
				SetPasswordHash("hash").
				SetRole("viewer").
				Save(ctx)
			if err != nil {
				return err
			}

			// Rollback to savepoint (undoes second user)
			err = sp.Rollback(ctx)
			if err != nil {
				return err
			}

			return nil // Commit the transaction (first user should exist)
		})

		require.NoError(t, err)

		// First user should exist
		_, err = client.User.Get(ctx, firstUserID)
		require.NoError(t, err, "first user should exist")

		// Second user should NOT exist (rolled back)
		users, err := client.User.Query().All(ctx)
		require.NoError(t, err)
		for _, u := range users {
			assert.NotEqual(t, "after_savepoint", u.Username, "second user should not exist after savepoint rollback")
		}
	})
}
