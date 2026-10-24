package handler

// SetDirectForeignRequest represents a request to enable or disable the direct foreign mode.
// Enabling it sends VPN-bound traffic out of the foreign link without the VPN, so it also
// requires Acknowledge to be true, confirming the user accepts that risk.
type SetDirectForeignRequest struct {
	Enabled     *bool `json:"enabled" example:"true"`
	Acknowledge bool  `json:"acknowledge" example:"true"`
}

// DirectForeignRuleResponse describes one of the routing rules that implement the direct foreign mode.
type DirectForeignRuleResponse struct {
	ID       string `json:"id"`
	Comment  string `json:"comment"`
	Disabled bool   `json:"disabled"`
}

// DirectForeignResponse reports whether VPN-bound traffic currently leaves directly through the foreign link.
// Enabled is true only when every rule is enabled; Rules shows each rule so a partial state is visible.
// ForeignRouteReady reports whether the foreign routing table has a usable default route.
type DirectForeignResponse struct {
	Enabled           bool                        `json:"enabled"`
	ForeignRouteReady bool                        `json:"foreignRouteReady"`
	Rules             []DirectForeignRuleResponse `json:"rules"`
	AddedRules        int                         `json:"addedRules,omitempty"`
	ConnectionsReset  int                         `json:"connectionsReset,omitempty"`
}
