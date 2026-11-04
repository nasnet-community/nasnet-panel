// Package route holds the route API group handlers.
package route

// UpdateForeignGatewayRequest represents the request to update foreign gateway route.
type UpdateForeignGatewayRequest struct {
	Gateway string `json:"gateway"`
}

// ForeignGatewayResponse represents the response for foreign gateway operations.
type ForeignGatewayResponse struct {
	Gateway       string `json:"gateway"`
	RoutesUpdated int    `json:"routesUpdated,omitempty"`
}
