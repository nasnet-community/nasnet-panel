//go:build dev
// +build dev

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestHealthHandler tests the health check endpoint
func TestHealthHandler(t *testing.T) {
	// Create a new Echo instance
	e := echo.New()

	// Create a test request
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Call the handler
	err := echoHealthHandler(c)
	require.NoError(t, err)

	// Check status code
	assert.Equal(t, http.StatusOK, rec.Code)

	// Parse response body
	var response HealthResponse
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify response fields
	assert.Equal(t, "healthy", response.Status)
	assert.NotZero(t, response.Timestamp)
	assert.NotEmpty(t, response.Version)
	assert.NotEmpty(t, response.Uptime)
}

// TestHealthResponseFormat tests the health response JSON format
func TestHealthResponseFormat(t *testing.T) {
	// Create sample health response
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().Unix(),
		Memory:    100,
		Version:   "test-v1.0",
		Uptime:    "1h30m0s",
	}

	// Marshal to JSON
	data, err := json.Marshal(response)
	require.NoError(t, err)

	// Verify JSON structure
	var parsed map[string]interface{}
	err = json.Unmarshal(data, &parsed)
	require.NoError(t, err)

	assert.Contains(t, parsed, "status")
	assert.Contains(t, parsed, "timestamp")
	assert.Contains(t, parsed, "memory_mb")
	assert.Contains(t, parsed, "version")
	assert.Contains(t, parsed, "uptime")
}

// TestErrorResponse tests the error response format
func TestErrorResponse(t *testing.T) {
	// Create a new Echo instance
	e := echo.New()

	// Create a test request
	req := httptest.NewRequest(http.MethodGet, "/error", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Call the error handler
	err := echoErrorResponse(c, http.StatusBadRequest, "test_error", "Test error message")
	require.NoError(t, err)

	// Check status code
	assert.Equal(t, http.StatusBadRequest, rec.Code)

	// Parse response body
	var response ErrorResponse
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify response fields
	assert.Equal(t, "test_error", response.Error)
	assert.Equal(t, "Test error message", response.Message)
	assert.NotZero(t, response.Timestamp)
}

// TestServerVersion tests that ServerVersion is set
func TestServerVersion(t *testing.T) {
	// ServerVersion should be set to development version in dev build
	assert.NotEmpty(t, ServerVersion)
}

// TestScannerPoolCreation tests scanner pool initialization
func TestScannerPoolCreation(t *testing.T) {
	pool := NewScannerPool(2)
	assert.NotNil(t, pool)
	assert.Equal(t, 2, pool.maxWorkers)
	assert.NotNil(t, pool.tasks)
	assert.NotNil(t, pool.activeTasks)
}

// TestErrorResponseJSON tests that error response produces valid JSON
func TestErrorResponseJSON(t *testing.T) {
	errResp := ErrorResponse{
		Error:     "test_error",
		Message:   "This is a test error",
		Timestamp: 1234567890,
	}

	data, err := json.Marshal(errResp)
	require.NoError(t, err)

	// Should produce valid JSON with expected fields
	assert.Contains(t, string(data), `"error":"test_error"`)
	assert.Contains(t, string(data), `"message":"This is a test error"`)
	assert.Contains(t, string(data), `"timestamp":1234567890`)
}
