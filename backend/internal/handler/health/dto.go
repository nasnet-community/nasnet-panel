// Package health holds the health API group handlers.
package health

// CheckResponse is the response of the health check endpoint.
type CheckResponse struct {
	Status  string `json:"status"`
	Server  string `json:"server"`
	Version string `json:"version"`
}
