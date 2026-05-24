package handler

import "time"

// VPNCredentialsResponse represents VPN credentials in the API response.
type VPNCredentialsResponse struct {
	Username   string `json:"username" example:"NNC_zN9RI61d"`
	Password   string `json:"password" example:"UmAaItfM"`
	Server     string `json:"server" example:"dij5t.vpn.s4i.co"`
	ExpiryDate string `json:"expiryDate" example:"11/21/2026"`
}

// WizardStatus represents the current status of a setup wizard.
type WizardStatus struct {
	Completed   bool       `json:"completed" example:"false"`
	CompletedAt *time.Time `json:"completedAt" example:"null"`
	CurrentStep string     `json:"currentStep" example:"step1"`
}

// UpdateWizardStatusRequest represents a request to update wizard status fields.
type UpdateWizardStatusRequest struct {
	Completed   *bool      `json:"completed" example:"false"`
	CompletedAt *time.Time `json:"completedAt" example:"null"`
	Version     *int       `json:"version" example:"1"`
	CurrentStep *string    `json:"currentStep" example:"step2"`
}
