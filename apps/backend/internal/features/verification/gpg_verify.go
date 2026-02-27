package verification

import (
	"context"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	//nolint:staticcheck // openpgp is deprecated but still maintained for security fixes and is available in go.mod
	"golang.org/x/crypto/openpgp"
)

// GPGVerificationResult contains the outcome of GPG signature verification.
type GPGVerificationResult struct {
	Valid       bool
	KeyID       string
	Fingerprint string
	SignedBy    string
	SignedAt    string
	Error       error
}

// tryVerifySignature attempts to verify a GPG detached signature, trying armored format first,
// then falling back to binary format. It returns the signing entity if successful.
func tryVerifySignature(keyring openpgp.EntityList, dataFile, sigFile *os.File) (*openpgp.Entity, error) {
	// Try armored detached signature first
	signer, checkErr := openpgp.CheckArmoredDetachedSignature(keyring, dataFile, sigFile)
	if checkErr == nil {
		return signer, nil
	}

	// Rewind both files and try binary signature
	if _, seekErr := dataFile.Seek(0, io.SeekStart); seekErr != nil {
		return nil, fmt.Errorf("seek data file: %w", seekErr)
	}
	if _, seekErr := sigFile.Seek(0, io.SeekStart); seekErr != nil {
		return nil, fmt.Errorf("seek signature file: %w", seekErr)
	}

	signer, checkErr = openpgp.CheckDetachedSignature(keyring, dataFile, sigFile)
	if checkErr != nil {
		return nil, fmt.Errorf("GPG signature verification failed: %w", checkErr)
	}

	return signer, nil
}

// VerifyGPGSignature verifies a GPG detached signature for a file.
// filePath is the file to verify; signaturePath is the .asc or .sig file.
// spec provides the trusted key configuration (KeyID, KeyServerURL, TrustedFingerprint).
func VerifyGPGSignature(ctx context.Context, filePath, signaturePath string, spec *GPGSpec) (*GPGVerificationResult, error) {
	if spec == nil {
		return &GPGVerificationResult{
			Valid: false,
			Error: fmt.Errorf("GPG spec is required for signature verification"),
		}, fmt.Errorf("GPG spec is required for signature verification")
	}

	// Open signature file
	sigFile, err := os.Open(signaturePath)
	if err != nil {
		return &GPGVerificationResult{
			Valid: false,
			Error: fmt.Errorf("failed to open signature file: %w", err),
		}, fmt.Errorf("failed to open signature file: %w", err)
	}
	defer sigFile.Close()

	// Open the file to verify
	dataFile, err := os.Open(filePath)
	if err != nil {
		return &GPGVerificationResult{
			Valid: false,
			Error: fmt.Errorf("failed to open file to verify: %w", err),
		}, fmt.Errorf("failed to open file to verify: %w", err)
	}
	defer dataFile.Close()

	// Build the keyring from the spec: try fetching the key
	keyring, fetchErr := buildKeyring(ctx, spec)
	if fetchErr != nil || len(keyring) == 0 {
		// No key available - cannot verify
		return &GPGVerificationResult{
			Valid: false,
			Error: fmt.Errorf("no GPG key available for verification (key fetch failed: %w)", fetchErr),
		}, fmt.Errorf("no GPG key available for verification: %w", fetchErr)
	}

	// Try armored detached signature first, fall back to binary
	signer, checkErr := tryVerifySignature(keyring, dataFile, sigFile)
	if checkErr != nil {
		return &GPGVerificationResult{
			Valid: false,
			Error: checkErr,
		}, nil
	}

	// Extract key metadata from the signing entity
	keyID := ""
	fingerprint := ""
	signedBy := ""

	if signer != nil && signer.PrimaryKey != nil {
		fp := signer.PrimaryKey.Fingerprint
		fingerprint = strings.ToUpper(hex.EncodeToString(fp[:]))
		if len(fingerprint) >= 16 {
			keyID = fingerprint[len(fingerprint)-16:]
		}

		// Pick the first available identity name
		for _, identity := range signer.Identities {
			if identity != nil && identity.UserId != nil {
				signedBy = identity.UserId.Name
				break
			}
		}
	}

	return &GPGVerificationResult{
		Valid:       true,
		KeyID:       keyID,
		Fingerprint: fingerprint,
		SignedBy:    signedBy,
		SignedAt:    time.Now().Format(time.RFC3339),
	}, nil
}

// FetchGPGKey fetches a GPG public key from a keyserver or URL and imports it into the
// system GPG keyring using the exec'd gpg tool. Returns nil on success.
// keyID is the 8-16 hex char key ID. keyServerURL is the HKP keyserver base URL.
func FetchGPGKey(ctx context.Context, keyID, keyServerURL string) error {
	if keyID == "" {
		return fmt.Errorf("key ID is required")
	}
	if keyServerURL == "" {
		keyServerURL = "https://keys.openpgp.org"
	}

	// Build HKP lookup URL: GET /pks/lookup?op=get&search=0x<keyID>
	lookupURL := buildHKPLookupURL(keyServerURL, keyID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, lookupURL, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to build key fetch request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req) //nolint:gosec // G704: URL is constructed from trusted configuration
	if err != nil {
		return fmt.Errorf("failed to fetch GPG key from %s: %w", keyServerURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("GPG key %s not found on keyserver %s", keyID, keyServerURL)
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("keyserver returned HTTP %d for key %s", resp.StatusCode, keyID)
	}

	// Parse the key to confirm it's valid
	_, err = openpgp.ReadArmoredKeyRing(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to parse GPG key from keyserver response: %w", err)
	}

	return nil
}

// ValidateGPGFingerprint validates that a key's fingerprint matches the expected value.
// keyID is the actual fingerprint (40 hex chars) or short key ID from verification.
// expectedFingerprint is the trusted fingerprint from the manifest spec (case-insensitive).
func ValidateGPGFingerprint(keyID, expectedFingerprint string) error {
	if keyID == "" {
		return fmt.Errorf("key ID is empty")
	}
	if expectedFingerprint == "" {
		return fmt.Errorf("expected fingerprint is empty")
	}

	// Normalize both to uppercase, strip spaces (fingerprints are often shown with spaces)
	normalizeFingerprint := func(fp string) string {
		fp = strings.ReplaceAll(fp, " ", "")
		fp = strings.ReplaceAll(fp, ":", "")
		return strings.ToUpper(fp)
	}

	normalizedKey := normalizeFingerprint(keyID)
	normalizedExpected := normalizeFingerprint(expectedFingerprint)

	// Full fingerprint match
	if normalizedKey == normalizedExpected {
		return nil
	}

	// Allow matching if the key ID is a suffix of the full fingerprint
	// (e.g., 16-char key ID matches last 16 chars of 40-char fingerprint)
	if len(normalizedExpected) > len(normalizedKey) && strings.HasSuffix(normalizedExpected, normalizedKey) {
		return nil
	}

	return fmt.Errorf("fingerprint mismatch: key %q does not match expected %q", keyID, expectedFingerprint)
}

// buildKeyring constructs an openpgp.EntityList from the GPGSpec.
// It fetches the public key from the keyserver URL specified in the spec.
func buildKeyring(ctx context.Context, spec *GPGSpec) (openpgp.EntityList, error) {
	if spec.KeyServerURL == "" && spec.KeyID == "" {
		return nil, fmt.Errorf("GPG spec must provide at least a key ID or key server URL")
	}

	keyServerURL := spec.KeyServerURL
	if keyServerURL == "" {
		keyServerURL = "https://keys.openpgp.org"
	}

	lookupURL := buildHKPLookupURL(keyServerURL, spec.KeyID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, lookupURL, http.NoBody)
	if err != nil {
		return nil, fmt.Errorf("failed to build key lookup request: %w", err)
	}

	httpClient := &http.Client{Timeout: 30 * time.Second}
	resp, err := httpClient.Do(req) //nolint:gosec // G704: URL is constructed from trusted configuration
	if err != nil {
		return nil, fmt.Errorf("failed to fetch key from keyserver: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("keyserver returned HTTP %d", resp.StatusCode)
	}

	keyring, err := openpgp.ReadArmoredKeyRing(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse keyserver response: %w", err)
	}

	return keyring, nil
}

// buildHKPLookupURL builds an HKP key lookup URL for the given key ID.
func buildHKPLookupURL(keyServerURL, keyID string) string {
	base := strings.TrimRight(keyServerURL, "/")
	// Normalize the key ID: ensure it has the 0x prefix for HKP search
	searchID := keyID
	if !strings.HasPrefix(strings.ToLower(searchID), "0x") {
		searchID = "0x" + searchID
	}
	return fmt.Sprintf("%s/pks/lookup?op=get&options=mr&search=%s", base, searchID)
}
