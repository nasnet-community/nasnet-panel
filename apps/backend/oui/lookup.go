package oui

import (
	_ "embed" // Required for //go:embed directive
	"strings"
	"sync"
)

// Embed the OUI database at compile time
//
//go:embed oui-database.txt
var ouiDatabaseRaw string

// Database represents the in-memory OUI lookup table
type Database struct {
	entries map[string]string // MAC prefix -> Vendor name
	mu      sync.RWMutex
}

// Global instance
var db *Database
var once sync.Once

// GetDatabase returns the singleton OUI database instance
func GetDatabase() *Database {
	once.Do(func() {
		db = &Database{
			entries: make(map[string]string),
		}
		db.load()
	})
	return db
}

// load parses the embedded OUI database into memory
func (db *Database) load() {
	db.mu.Lock()
	defer db.mu.Unlock()

	lines := strings.Split(ouiDatabaseRaw, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse: "MAC_PREFIX\tVendor_Name"
		parts := strings.Split(line, "\t")
		if len(parts) != 2 {
			continue
		}

		macPrefix := strings.ToUpper(strings.TrimSpace(parts[0]))
		vendorName := strings.TrimSpace(parts[1])

		// Store with colons removed for faster lookup
		macPrefixNormalized := strings.ReplaceAll(macPrefix, ":", "")
		db.entries[macPrefixNormalized] = vendorName
	}
}

// Lookup finds the vendor name for a given MAC address
//
// Accepts formats: AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, or AABBCCDDEEFF
// Returns vendor name and true if found, empty string and false otherwise
func (db *Database) Lookup(macAddress string) (string, bool) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	// Extract OUI (first 6 hex digits)
	oui := extractOUI(macAddress)
	if oui == "" {
		return "", false
	}

	vendor, found := db.entries[oui]
	return vendor, found
}

// LookupBatch performs batch lookup for multiple MAC addresses
// Returns a map of MAC address -> vendor name
func (db *Database) LookupBatch(macAddresses []string) map[string]string {
	results := make(map[string]string)

	for _, mac := range macAddresses {
		if vendor, found := db.Lookup(mac); found {
			results[mac] = vendor
		}
	}

	return results
}

// Size returns the number of OUI entries in the database
func (db *Database) Size() int {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return len(db.entries)
}

// extractOUI extracts the first 6 hex digits (OUI) from a MAC address
// Input: AA:BB:CC:DD:EE:FF or AA-BB-CC-DD-EE-FF or AABBCCDDEEFF
// Output: AABBCC
func extractOUI(macAddress string) string {
	// Remove colons and dashes
	normalized := strings.ReplaceAll(macAddress, ":", "")
	normalized = strings.ReplaceAll(normalized, "-", "")
	normalized = strings.ToUpper(normalized)

	// OUI is first 6 hex digits
	if len(normalized) < 6 {
		return ""
	}

	return normalized[:6]
}
