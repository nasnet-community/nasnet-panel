package handler

// VPNCredentialsResponse represents VPN credentials in the API response.
type VPNCredentialsResponse struct {
	Username   string `json:"username" example:"NNC_zN9RI61d"`
	Password   string `json:"password" example:"UmAaItfM"`
	Server     string `json:"server" example:"dij5t.vpn.s4i.co"`
	ExpiryDate string `json:"expiryDate" example:"11/21/2026"`
}
