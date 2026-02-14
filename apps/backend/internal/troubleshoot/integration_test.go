//go:build integration
// +build integration

package troubleshoot_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"backend/generated/graphql"
	"backend/graph/resolver"
	"backend/internal/router"
	"backend/internal/troubleshoot"
)

// Integration tests for Troubleshoot GraphQL API
// Tests the complete flow from GraphQL mutation to service execution
//
// Run with: go test -tags=integration ./internal/troubleshoot/...

func setupTestServer(t *testing.T) *httptest.Server {
	// Create mock router port
	mockPort := router.NewMockAdapter("integration-test-router")

	// Create troubleshoot service
	svc := troubleshoot.NewService(mockPort)

	// Create resolver
	resolv := resolver.NewResolverWithConfig(resolver.ResolverConfig{
		TroubleshootService: svc,
	})

	// Create GraphQL server
	schema := graph.NewExecutableSchema(graph.Config{
		Resolvers: resolv,
	})
	srv := handler.NewDefaultServer(schema)

	// Create HTTP test server
	return httptest.NewServer(srv)
}

func executeGraphQL(t *testing.T, server *httptest.Server, query string) map[string]interface{} {
	reqBody := map[string]string{"query": query}
	jsonBody, err := json.Marshal(reqBody)
	require.NoError(t, err)

	resp, err := http.Post(server.URL, "application/json", strings.NewReader(string(jsonBody)))
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)

	return result
}

func TestIntegration_StartTroubleshoot(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	mutation := `
		mutation {
			startTroubleshoot(routerId: "test-router") {
				session {
					id
					routerId
					status
					wanInterface
					gateway
					steps {
						id
						name
						status
					}
					startedAt
				}
				errors {
					code
					message
				}
			}
		}
	`

	result := executeGraphQL(t, server, mutation)

	// Check for errors
	errors, hasErrors := result["errors"]
	if hasErrors {
		t.Logf("GraphQL Errors: %+v", errors)
	}
	require.False(t, hasErrors, "Expected no GraphQL errors")

	// Extract data
	data := result["data"].(map[string]interface{})
	startTroubleshoot := data["startTroubleshoot"].(map[string]interface{})

	// Verify no mutation errors
	mutationErrors := startTroubleshoot["errors"]
	assert.Nil(t, mutationErrors, "Expected no mutation errors")

	// Verify session
	session := startTroubleshoot["session"].(map[string]interface{})
	assert.NotEmpty(t, session["id"], "Session ID should not be empty")
	assert.Equal(t, "test-router", session["routerId"])
	assert.Equal(t, "RUNNING", session["status"])

	// Verify network detection
	assert.Equal(t, "ether1", session["wanInterface"])
	assert.Equal(t, "192.168.1.1", session["gateway"])

	// Verify 5 steps created
	steps := session["steps"].([]interface{})
	assert.Len(t, steps, 5)

	// Verify all steps are pending initially
	for i, stepInterface := range steps {
		step := stepInterface.(map[string]interface{})
		assert.NotEmpty(t, step["id"], "Step %d should have ID", i)
		assert.NotEmpty(t, step["name"], "Step %d should have name", i)
		assert.Equal(t, "PENDING", step["status"], "Step %d should be pending", i)
	}

	// Verify timestamp
	assert.NotEmpty(t, session["startedAt"])
}

func TestIntegration_RunTroubleshootStep_WAN(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// First, create a session
	startMutation := `
		mutation {
			startTroubleshoot(routerId: "test-router") {
				session {
					id
				}
			}
		}
	`

	startResult := executeGraphQL(t, server, startMutation)
	data := startResult["data"].(map[string]interface{})
	startTroubleshoot := data["startTroubleshoot"].(map[string]interface{})
	session := startTroubleshoot["session"].(map[string]interface{})
	sessionID := session["id"].(string)

	// Now run WAN step
	runStepMutation := `
		mutation {
			runTroubleshootStep(sessionId: "` + sessionID + `", stepType: WAN) {
				step {
					id
					name
					status
					result {
						success
						message
						issueCode
						executionTimeMs
					}
					fix {
						issueCode
						title
						explanation
						command
						confidence
						requiresConfirmation
						isManualFix
						manualSteps
					}
					completedAt
				}
				errors {
					code
					message
				}
			}
		}
	`

	result := executeGraphQL(t, server, runStepMutation)

	// Verify no errors
	assert.Nil(t, result["errors"])

	// Extract step
	data = result["data"].(map[string]interface{})
	runStep := data["runTroubleshootStep"].(map[string]interface{})
	step := runStep["step"].(map[string]interface{})

	// With MockAdapter, WAN should pass
	assert.Equal(t, "wan", step["id"])
	assert.Equal(t, "WAN Interface Check", step["name"])
	assert.Equal(t, "PASSED", step["status"])

	// Verify result
	stepResult := step["result"].(map[string]interface{})
	assert.True(t, stepResult["success"].(bool))
	assert.NotEmpty(t, stepResult["message"])
	assert.Nil(t, stepResult["issueCode"]) // No issue when passing
	assert.Greater(t, stepResult["executionTimeMs"].(float64), 0.0)

	// Verify no fix for passing step
	assert.Nil(t, step["fix"])

	// Verify completion timestamp
	assert.NotEmpty(t, step["completedAt"])
}

func TestIntegration_RunAllSteps(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// Create session
	startMutation := `mutation { startTroubleshoot(routerId: "test-router") { session { id } } }`
	startResult := executeGraphQL(t, server, startMutation)
	sessionID := startResult["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)

	// Run all 5 steps
	steps := []string{"WAN", "GATEWAY", "INTERNET", "DNS", "NAT"}
	for _, stepType := range steps {
		runStepMutation := `
			mutation {
				runTroubleshootStep(sessionId: "` + sessionID + `", stepType: ` + stepType + `) {
					step {
						id
						status
						result {
							success
						}
					}
				}
			}
		`

		result := executeGraphQL(t, server, runStepMutation)

		// Verify no errors
		assert.Nil(t, result["errors"], "Step %s should not have errors", stepType)

		// Extract step
		data := result["data"].(map[string]interface{})
		runStep := data["runTroubleshootStep"].(map[string]interface{})
		step := runStep["step"].(map[string]interface{})

		// With MockAdapter, all steps should pass
		assert.Equal(t, "PASSED", step["status"], "Step %s should pass", stepType)

		stepResult := step["result"].(map[string]interface{})
		assert.True(t, stepResult["success"].(bool), "Step %s result should be success", stepType)
	}
}

func TestIntegration_ApplyTroubleshootFix(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// Create session
	startMutation := `mutation { startTroubleshoot(routerId: "test-router") { session { id } } }`
	startResult := executeGraphQL(t, server, startMutation)
	sessionID := startResult["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)

	// Apply fix
	applyFixMutation := `
		mutation {
			applyTroubleshootFix(sessionId: "` + sessionID + `", issueCode: "WAN_DISABLED") {
				success
				message
				rollbackCommand
				errors {
					code
					message
				}
			}
		}
	`

	result := executeGraphQL(t, server, applyFixMutation)

	// Verify no errors
	assert.Nil(t, result["errors"])

	// Extract result
	data := result["data"].(map[string]interface{})
	applyFix := data["applyTroubleshootFix"].(map[string]interface{})

	assert.True(t, applyFix["success"].(bool))
	assert.NotEmpty(t, applyFix["message"])
	assert.NotEmpty(t, applyFix["rollbackCommand"])
	assert.Nil(t, applyFix["errors"])
}

func TestIntegration_CancelTroubleshoot(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// Create session
	startMutation := `mutation { startTroubleshoot(routerId: "test-router") { session { id } } }`
	startResult := executeGraphQL(t, server, startMutation)
	sessionID := startResult["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)

	// Cancel
	cancelMutation := `
		mutation {
			cancelTroubleshoot(sessionId: "` + sessionID + `") {
				id
				status
			}
		}
	`

	result := executeGraphQL(t, server, cancelMutation)

	// Verify no errors
	assert.Nil(t, result["errors"])

	// Extract result
	data := result["data"].(map[string]interface{})
	session := data["cancelTroubleshoot"].(map[string]interface{})

	assert.Equal(t, sessionID, session["id"])
	assert.Equal(t, "CANCELLED", session["status"])
}

func TestIntegration_GetTroubleshootSession(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// Create session
	startMutation := `mutation { startTroubleshoot(routerId: "test-router") { session { id } } }`
	startResult := executeGraphQL(t, server, startMutation)
	sessionID := startResult["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)

	// Query session
	query := `
		query {
			troubleshootSession(sessionId: "` + sessionID + `") {
				id
				routerId
				status
				wanInterface
				gateway
				steps {
					id
					name
					status
				}
				appliedFixes
				startedAt
			}
		}
	`

	result := executeGraphQL(t, server, query)

	// Verify no errors
	assert.Nil(t, result["errors"])

	// Extract session
	data := result["data"].(map[string]interface{})
	session := data["troubleshootSession"].(map[string]interface{})

	assert.Equal(t, sessionID, session["id"])
	assert.Equal(t, "test-router", session["routerId"])
	assert.Equal(t, "RUNNING", session["status"])
	assert.Equal(t, "ether1", session["wanInterface"])
	assert.Equal(t, "192.168.1.1", session["gateway"])

	steps := session["steps"].([]interface{})
	assert.Len(t, steps, 5)

	appliedFixes := session["appliedFixes"].([]interface{})
	assert.Len(t, appliedFixes, 0) // No fixes applied yet
}

func TestIntegration_ErrorHandling_SessionNotFound(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	mutation := `
		mutation {
			runTroubleshootStep(sessionId: "nonexistent-session", stepType: WAN) {
				step {
					id
				}
				errors {
					code
					message
				}
			}
		}
	`

	result := executeGraphQL(t, server, mutation)

	// Should have mutation errors (not GraphQL errors)
	data := result["data"].(map[string]interface{})
	runStep := data["runTroubleshootStep"].(map[string]interface{})
	errors := runStep["errors"].([]interface{})

	assert.NotEmpty(t, errors)
	firstError := errors[0].(map[string]interface{})
	assert.Equal(t, "SESSION_NOT_FOUND", firstError["code"])
}

func TestIntegration_ErrorHandling_UnknownFixCode(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// Create session
	startMutation := `mutation { startTroubleshoot(routerId: "test-router") { session { id } } }`
	startResult := executeGraphQL(t, server, startMutation)
	sessionID := startResult["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)

	// Apply unknown fix
	applyFixMutation := `
		mutation {
			applyTroubleshootFix(sessionId: "` + sessionID + `", issueCode: "UNKNOWN_CODE") {
				success
				errors {
					code
					message
				}
			}
		}
	`

	result := executeGraphQL(t, server, applyFixMutation)

	// Should have mutation errors
	data := result["data"].(map[string]interface{})
	applyFix := data["applyTroubleshootFix"].(map[string]interface{})

	assert.False(t, applyFix["success"].(bool))

	errors := applyFix["errors"].([]interface{})
	assert.NotEmpty(t, errors)
	firstError := errors[0].(map[string]interface{})
	assert.Equal(t, "FIX_NOT_FOUND", firstError["code"])
}

func TestIntegration_ConcurrentSessions(t *testing.T) {
	server := setupTestServer(t)
	defer server.Close()

	// Create 3 concurrent sessions
	sessions := make([]string, 3)
	for i := 0; i < 3; i++ {
		startMutation := `mutation { startTroubleshoot(routerId: "router-` + string(rune(i+1)) + `") { session { id } } }`
		result := executeGraphQL(t, server, startMutation)
		sessionID := result["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)
		sessions[i] = sessionID
	}

	// Verify all sessions have unique IDs
	uniqueSessions := make(map[string]bool)
	for _, sid := range sessions {
		assert.False(t, uniqueSessions[sid], "Session IDs should be unique")
		uniqueSessions[sid] = true
	}
	assert.Len(t, uniqueSessions, 3)

	// Run steps on all sessions concurrently
	for _, sid := range sessions {
		mutation := `mutation { runTroubleshootStep(sessionId: "` + sid + `", stepType: WAN) { step { status } } }`
		result := executeGraphQL(t, server, mutation)

		data := result["data"].(map[string]interface{})
		runStep := data["runTroubleshootStep"].(map[string]interface{})
		step := runStep["step"].(map[string]interface{})

		assert.Equal(t, "PASSED", step["status"])
	}
}

func TestIntegration_SessionTTL(t *testing.T) {
	// This test is time-sensitive and may be skipped in CI
	if testing.Short() {
		t.Skip("Skipping TTL test in short mode")
	}

	server := setupTestServer(t)
	defer server.Close()

	// Create session
	startMutation := `mutation { startTroubleshoot(routerId: "test-router") { session { id } } }`
	startResult := executeGraphQL(t, server, startMutation)
	sessionID := startResult["data"].(map[string]interface{})["startTroubleshoot"].(map[string]interface{})["session"].(map[string]interface{})["id"].(string)

	// Session should exist immediately
	query := `query { troubleshootSession(sessionId: "` + sessionID + `") { id } }`
	result := executeGraphQL(t, server, query)
	assert.Nil(t, result["errors"])

	// Note: Testing actual TTL cleanup would require waiting 1+ hour
	// In practice, this would be tested separately or mocked
	t.Log("TTL test placeholder - actual cleanup would take 1+ hour")
}
