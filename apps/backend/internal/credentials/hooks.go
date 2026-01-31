// Package credentials provides ent hooks for automatic credential encryption/decryption.
package credentials

import (
	"backend/ent"
	"backend/ent/hook"
	"backend/internal/encryption"
	"context"
	"fmt"
)

// RegisterHooks registers encryption hooks on the ent client.
// This should be called once when initializing the database client.
//
// The hooks will:
// - Automatically encrypt username and password on Create and Update operations
// - Set the key version from the encryption service
//
// Note: Decryption is handled by the Service.Get() method, not hooks,
// because ent doesn't have read hooks - only mutation hooks.
func RegisterHooks(client *ent.Client, encService *encryption.Service) error {
	if encService == nil {
		return fmt.Errorf("encryption service is required")
	}

	// Register encryption hook for RouterSecret mutations
	client.RouterSecret.Use(encryptionHook(encService))

	return nil
}

// encryptionHook returns an ent hook that encrypts credentials before save.
// This hook is applied to both Create and Update operations.
func encryptionHook(encService *encryption.Service) ent.Hook {
	return func(next ent.Mutator) ent.Mutator {
		return hook.RouterSecretFunc(func(ctx context.Context, m *ent.RouterSecretMutation) (ent.Value, error) {
			// Check if this is a Create or Update operation
			op := m.Op()
			if op.Is(ent.OpCreate) || op.Is(ent.OpUpdate) || op.Is(ent.OpUpdateOne) {
				// Handle username encryption if set
				if username, ok := m.EncryptedUsername(); ok {
					// Check if it's already encrypted (base64 encoded)
					// If it looks like plaintext, encrypt it
					if !isEncrypted(username) {
						encrypted, err := encService.Encrypt(string(username))
						if err != nil {
							return nil, fmt.Errorf("failed to encrypt username: %w", err)
						}
						m.SetEncryptedUsername([]byte(encrypted))
					}
				}

				// Handle password encryption if set
				if password, ok := m.EncryptedPassword(); ok {
					// Check if it's already encrypted
					if !isEncrypted(password) {
						encrypted, err := encService.Encrypt(string(password))
						if err != nil {
							return nil, fmt.Errorf("failed to encrypt password: %w", err)
						}
						m.SetEncryptedPassword([]byte(encrypted))
					}
				}

				// Always set the key version on mutation
				m.SetKeyVersion(encService.KeyVersion())
			}

			// Continue with the next mutator in the chain
			return next.Mutate(ctx, m)
		})
	}
}

// isEncrypted attempts to determine if data is already encrypted.
// Encrypted data from our service is base64 encoded and starts with
// a specific structure. This is a heuristic check.
func isEncrypted(data []byte) bool {
	if len(data) == 0 {
		return false
	}

	// Our encrypted format is base64(nonce + ciphertext + tag)
	// Minimum size: 12 (nonce) + 1 (min ciphertext) + 16 (tag) = 29 bytes
	// Base64 encoded: ceil(29 * 4 / 3) = 40 chars minimum
	// If the data is less than this, it's likely plaintext
	if len(data) < 40 {
		return false
	}

	// Check if it looks like base64
	for _, b := range data {
		if !isBase64Char(b) {
			return false
		}
	}

	return true
}

// isBase64Char returns true if the byte is a valid base64 character.
func isBase64Char(b byte) bool {
	return (b >= 'A' && b <= 'Z') ||
		(b >= 'a' && b <= 'z') ||
		(b >= '0' && b <= '9') ||
		b == '+' || b == '/' || b == '='
}

// CreateWithPlaintext is a helper that creates RouterSecret with plaintext credentials.
// The hook will automatically encrypt them.
func CreateWithPlaintext(ctx context.Context, client *ent.Client, routerID, username, password string) (*ent.RouterSecret, error) {
	return client.RouterSecret.Create().
		SetRouterID(routerID).
		SetEncryptedUsername([]byte(username)). // Hook will encrypt
		SetEncryptedPassword([]byte(password)). // Hook will encrypt
		SetEncryptionNonce([]byte{}).           // Not used, nonce is in ciphertext
		Save(ctx)
}

// UpdateWithPlaintext is a helper that updates RouterSecret with plaintext credentials.
// The hook will automatically encrypt them.
func UpdateWithPlaintext(ctx context.Context, secret *ent.RouterSecret, username, password string) (*ent.RouterSecret, error) {
	return secret.Update().
		SetEncryptedUsername([]byte(username)). // Hook will encrypt
		SetEncryptedPassword([]byte(password)). // Hook will encrypt
		Save(ctx)
}
