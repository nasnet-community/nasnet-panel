package oui

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

// VendorResponse represents the API response for vendor lookup
type VendorResponse struct {
	MAC    string `json:"mac"`
	Vendor string `json:"vendor,omitempty"`
	Found  bool   `json:"found"`
}

// BatchVendorRequest represents a batch lookup request
type BatchVendorRequest struct {
	MacAddresses []string `json:"macAddresses"`
}

// BatchVendorResponse represents the API response for batch vendor lookup
type BatchVendorResponse struct {
	Results map[string]string `json:"results"`
	Count   int               `json:"count"`
}

// HandleVendorLookup handles GET /api/oui/:mac
//
// Returns vendor name for a given MAC address
//
// Response:
//
//	200: { "mac": "AA:BB:CC:DD:EE:FF", "vendor": "Apple, Inc.", "found": true }
//	404: { "mac": "AA:BB:CC:DD:EE:FF", "found": false }
func HandleVendorLookup(w http.ResponseWriter, r *http.Request) {
	// Extract MAC address from URL
	vars := mux.Vars(r)
	macAddress := vars["mac"]

	if macAddress == "" {
		http.Error(w, "MAC address is required", http.StatusBadRequest)
		return
	}

	// Lookup vendor
	db := GetDatabase()
	vendor, found := db.Lookup(macAddress)

	// Build response
	response := VendorResponse{
		MAC:    macAddress,
		Vendor: vendor,
		Found:  found,
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=86400") // Cache for 24 hours

	if !found {
		w.WriteHeader(http.StatusNotFound)
	}

	json.NewEncoder(w).Encode(response)
}

// HandleBatchVendorLookup handles POST /api/oui/batch
//
// Performs batch lookup for multiple MAC addresses
//
// Request body:
//
//	{ "macAddresses": ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"] }
//
// Response:
//
//	200: { "results": { "AA:BB:CC:DD:EE:FF": "Apple, Inc." }, "count": 1 }
func HandleBatchVendorLookup(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req BatchVendorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.MacAddresses) == 0 {
		http.Error(w, "macAddresses array is required", http.StatusBadRequest)
		return
	}

	// Limit batch size to prevent abuse
	const maxBatchSize = 100
	if len(req.MacAddresses) > maxBatchSize {
		http.Error(w, "Batch size exceeds maximum of 100", http.StatusBadRequest)
		return
	}

	// Perform batch lookup
	db := GetDatabase()
	results := db.LookupBatch(req.MacAddresses)

	// Build response
	response := BatchVendorResponse{
		Results: results,
		Count:   len(results),
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=86400") // Cache for 24 hours

	json.NewEncoder(w).Encode(response)
}

// HandleOUIStats handles GET /api/oui/stats
//
// Returns statistics about the OUI database
//
// Response:
//
//	200: { "totalEntries": 1234, "loaded": true }
func HandleOUIStats(w http.ResponseWriter, r *http.Request) {
	db := GetDatabase()

	response := map[string]interface{}{
		"totalEntries": db.Size(),
		"loaded":       true,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RegisterRoutes registers OUI lookup routes with the router
//
// Routes:
//   - GET  /api/oui/:mac      - Single vendor lookup
//   - POST /api/oui/batch     - Batch vendor lookup
//   - GET  /api/oui/stats     - Database statistics
func RegisterRoutes(router *mux.Router) {
	// Single lookup
	router.HandleFunc("/api/oui/{mac}", HandleVendorLookup).Methods("GET")

	// Batch lookup
	router.HandleFunc("/api/oui/batch", HandleBatchVendorLookup).Methods("POST")

	// Stats
	router.HandleFunc("/api/oui/stats", HandleOUIStats).Methods("GET")
}

// normalizeMAC normalizes a MAC address to the format AA:BB:CC:DD:EE:FF
func normalizeMAC(mac string) string {
	// Remove separators
	cleaned := strings.ReplaceAll(mac, ":", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ToUpper(cleaned)

	if len(cleaned) != 12 {
		return mac // Return original if invalid
	}

	// Add colons
	return cleaned[0:2] + ":" + cleaned[2:4] + ":" + cleaned[4:6] + ":" +
		cleaned[6:8] + ":" + cleaned[8:10] + ":" + cleaned[10:12]
}
