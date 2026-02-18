package repository

import (
	"context"
	"errors"
	"fmt"

	"backend/generated/ent"
)

// WithTx executes fn within a database transaction.
// If fn returns an error, the transaction is rolled back.
// If fn succeeds, the transaction is committed.
//
// Usage:
//
//	err := repository.WithTx(ctx, client, func(tx *ent.Tx) error {
//	    // Create router
//	    router, err := tx.Router.Create().SetName("test").Save(ctx)
//	    if err != nil {
//	        return err // Transaction will be rolled back
//	    }
//
//	    // Create secret
//	    _, err = tx.RouterSecret.Create().SetRouterID(router.ID).Save(ctx)
//	    if err != nil {
//	        return err // Transaction will be rolled back, router won't be created
//	    }
//
//	    return nil // Transaction will be committed
//	})
func WithTx(ctx context.Context, client *ent.Client, fn func(tx *ent.Tx) error) error {
	tx, err := client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("starting transaction: %w", err)
	}

	// Handle panic recovery
	defer func() {
		if v := recover(); v != nil {
			// Attempt to rollback, ignore any error since we're panicking
			//nolint:errcheck // can't do anything with error during panic
			_ = tx.Rollback()
			panic(v) // Re-throw the panic
		}
	}()

	// Execute the function
	if err := fn(tx); err != nil {
		// Rollback on error
		if rerr := tx.Rollback(); rerr != nil {
			return fmt.Errorf("%w", errors.Join(err, rerr))
		}
		return err
	}

	// Commit on success
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}

	return nil
}

// WithTxResult executes fn within a transaction and returns a result.
// This is useful when you need to return a value from the transaction.
//
// Usage:
//
//	router, err := repository.WithTxResult(ctx, client, func(tx *ent.Tx) (*ent.Router, error) {
//	    router, err := tx.Router.Create().SetName("test").Save(ctx)
//	    if err != nil {
//	        return nil, err
//	    }
//	    return router, nil
//	})
func WithTxResult[T any](ctx context.Context, client *ent.Client, fn func(tx *ent.Tx) (T, error)) (T, error) {
	var result T

	tx, err := client.Tx(ctx)
	if err != nil {
		return result, fmt.Errorf("starting transaction: %w", err)
	}

	// Handle panic recovery
	defer func() {
		if v := recover(); v != nil {
			//nolint:errcheck // can't do anything with error during panic
			_ = tx.Rollback()
			panic(v)
		}
	}()

	// Execute the function
	result, err = fn(tx)
	if err != nil {
		if rerr := tx.Rollback(); rerr != nil {
			return result, fmt.Errorf("%w", errors.Join(err, rerr))
		}
		return result, err
	}

	// Commit on success
	if err := tx.Commit(); err != nil {
		return result, fmt.Errorf("committing transaction: %w", err)
	}

	return result, nil
}

// txClientKey is the context key for transaction client.
type txClientKey struct{}

// WithTxClient stores a transaction client in the context.
// This enables nested transaction propagation through context.
func WithTxClient(ctx context.Context, tx *ent.Tx) context.Context {
	return context.WithValue(ctx, txClientKey{}, tx)
}

// GetTxClient retrieves a transaction client from context.
// Returns nil if no transaction is active.
func GetTxClient(ctx context.Context) *ent.Tx {
	tx, ok := ctx.Value(txClientKey{}).(*ent.Tx)
	if !ok {
		return nil
	}
	return tx
}

// GetClientOrTx returns the transaction client if one exists in context,
// otherwise returns the regular client. This allows methods to participate
// in an existing transaction or start fresh.
//
// Usage:
//
//	func (r *routerRepository) Create(ctx context.Context, input Input) (*ent.Router, error) {
//	    client := repository.GetClientOrTx(ctx, r.client)
//	    return client.Router.Create().SetName(input.Name).Save(ctx)
//	}
func GetClientOrTx(ctx context.Context, client *ent.Client) *ent.Client {
	if tx := GetTxClient(ctx); tx != nil {
		return tx.Client()
	}
	return client
}

// RunInTransaction ensures the operation runs within a transaction.
// If a transaction already exists in context, it uses that.
// Otherwise, it creates a new transaction.
//
// This enables composable transactions:
//
//	// Outer operation creates transaction
//	err := repository.RunInTransaction(ctx, client, func(ctx context.Context) error {
//	    // Inner operations participate in same transaction
//	    return innerOperation(ctx)
//	})
func RunInTransaction(ctx context.Context, client *ent.Client, fn func(ctx context.Context) error) error {
	// Check if already in a transaction
	if GetTxClient(ctx) != nil {
		return fn(ctx)
	}

	// Create new transaction
	return WithTx(ctx, client, func(tx *ent.Tx) error {
		txCtx := WithTxClient(ctx, tx)
		return fn(txCtx)
	})
}

// RunInTransactionResult is like RunInTransaction but returns a result.
func RunInTransactionResult[T any](ctx context.Context, client *ent.Client, fn func(ctx context.Context) (T, error)) (T, error) {
	// Check if already in a transaction
	if GetTxClient(ctx) != nil {
		return fn(ctx)
	}

	// Create new transaction
	return WithTxResult(ctx, client, func(tx *ent.Tx) (T, error) {
		txCtx := WithTxClient(ctx, tx)
		return fn(txCtx)
	})
}

// Savepoint represents a transaction savepoint for partial rollback.
// Note: SQLite supports savepoints, so this can be used for nested operations.
type Savepoint struct {
	tx   *ent.Tx
	name string
}

// CreateSavepoint creates a savepoint within a transaction.
// Use this for operations that might fail and need partial rollback.
//
// Usage:
//
//	sp, err := repository.CreateSavepoint(ctx, tx, "create_secret")
//	if err != nil {
//	    return err
//	}
//
//	if err := createSecret(ctx, tx); err != nil {
//	    sp.Rollback() // Rollback to savepoint
//	    return err
//	}
//	sp.Release() // Release savepoint on success
func CreateSavepoint(ctx context.Context, tx *ent.Tx, name string) (*Savepoint, error) {
	_, err := tx.ExecContext(ctx, "SAVEPOINT "+name)
	if err != nil {
		return nil, fmt.Errorf("creating savepoint %s: %w", name, err)
	}
	return &Savepoint{tx: tx, name: name}, nil
}

// Rollback rolls back to the savepoint.
func (s *Savepoint) Rollback(ctx context.Context) error {
	_, err := s.tx.ExecContext(ctx, "ROLLBACK TO SAVEPOINT "+s.name)
	if err != nil {
		return fmt.Errorf("rolling back to savepoint %s: %w", s.name, err)
	}
	return nil
}

// Release releases the savepoint (on success).
func (s *Savepoint) Release(ctx context.Context) error {
	_, err := s.tx.ExecContext(ctx, "RELEASE SAVEPOINT "+s.name)
	if err != nil {
		return fmt.Errorf("releasing savepoint %s: %w", s.name, err)
	}
	return nil
}
