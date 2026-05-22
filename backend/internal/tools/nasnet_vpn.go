// Package tools provides utility functions for external API integrations.
package tools

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"nasnet-panel/pkg/utils"
)

const (
	nasnetVPNEndpoint = "https://qhgkwmfqfehctenggfvp.supabase.co/functions/v1/l2tp-credentials"
	//nolint:gosec // Bearer token for NasNet API - public token
	bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZ2t3bWZxZmVoY3RlbmdnZnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjg0ODcsImV4cCI6MjA2MTk0NDQ4N30.Qc5I5gHVFwaZLbeiUQntn5F_2HkOa-MbdmLO-VbPo5s"
)

// L2TPCredentialsRequest represents the request body for fetching L2TP credentials.
type L2TPCredentialsRequest struct {
	Platform  string `json:"platform"`
	Referrer  string `json:"referrer"`
	SessionID string `json:"sessionId"`
}

// L2TPCredentialsData represents the VPN credentials data from NasNet API.
type L2TPCredentialsData struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	Server     string `json:"server"`
	ExpiryDate string `json:"expiry_date"`
}

// L2TPCredentialsResponse represents the complete response from the NasNet VPN API.
type L2TPCredentialsResponse struct {
	Success      bool                `json:"success"`
	Credentials  L2TPCredentialsData `json:"credentials"`
	CSV          string              `json:"csv"`
	Message      string              `json:"message"`
	IsNewSession bool                `json:"isNewSession"`
}

// L2TPCredentials represents the simplified VPN credentials for internal use.
type L2TPCredentials struct {
	Username   string
	Password   string
	Server     string
	ExpiryDate string
}

// GetNasNetVPNCredentials fetches L2TP VPN credentials from the NasNet API.
// It hashes the provided systemID using SHA256 before sending the request.
func GetNasNetVPNCredentials(systemID string) (*L2TPCredentials, error) {
	if systemID == "" {
		return nil, fmt.Errorf("system ID is required")
	}

	hashedID := utils.HashSHA256(systemID)

	request := L2TPCredentialsRequest{
		Platform:  "nasnet-panel",
		Referrer:  "nasnet-panel",
		SessionID: "sess_" + hashedID,
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	ctx := context.Background()
	httpReq, err := http.NewRequestWithContext(ctx, "POST", nasnetVPNEndpoint, bytes.NewReader(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+bearerToken)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %w", err)
	}
	if resp == nil {
		return nil, fmt.Errorf("HTTP response is nil")
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var response L2TPCredentialsResponse
	if err := json.Unmarshal(respBody, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("API error: %s", response.Message)
	}

	return &L2TPCredentials{
		Username:   response.Credentials.Username,
		Password:   response.Credentials.Password,
		Server:     response.Credentials.Server,
		ExpiryDate: response.Credentials.ExpiryDate,
	}, nil
}
