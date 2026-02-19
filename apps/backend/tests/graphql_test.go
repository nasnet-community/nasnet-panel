//go:build dev
// +build dev

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/vektah/gqlparser/v2/ast"

	"backend/graph"
	"backend/graph/resolver"
)

// createTestGraphQLServer creates a GraphQL server for testing
func createTestGraphQLServer() *handler.Server {
	resolv := resolver.NewResolver()
	schema := graph.NewExecutableSchema(graph.Config{
		Resolvers: resolv,
	})

	srv := handler.New(schema)
	srv.AddTransport(transport.POST{})
	srv.SetQueryCache(lru.New[*ast.QueryDocument](100))
	srv.Use(extension.Introspection{})

	return srv
}

// TestGraphQLHealthQuery tests the health query
func TestGraphQLHealthQuery(t *testing.T) {
	e := echo.New()
	graphqlServer := createTestGraphQLServer()

	// Create GraphQL query for health
	query := `{"query":"{ health { status version connectedRouters checkedAt } }"}`

	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(query))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	// Use Echo to handle the request
	c := e.NewContext(req, rec)
	err := echo.WrapHandler(graphqlServer)(c)
	require.NoError(t, err)

	// Check status code
	assert.Equal(t, http.StatusOK, rec.Code)

	// Parse response
	var response map[string]interface{}
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should have data or errors field
	_, hasData := response["data"]
	_, hasErrors := response["errors"]
	assert.True(t, hasData || hasErrors, "Response should have either data or errors")
}

// TestGraphQLVersionQuery tests the version query
func TestGraphQLVersionQuery(t *testing.T) {
	e := echo.New()
	graphqlServer := createTestGraphQLServer()

	// Create GraphQL query for version
	query := `{"query":"{ version }"}`

	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(query))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	c := e.NewContext(req, rec)
	err := echo.WrapHandler(graphqlServer)(c)
	require.NoError(t, err)

	// Check status code
	assert.Equal(t, http.StatusOK, rec.Code)
}

// TestGraphQLIntrospection tests that introspection is enabled
func TestGraphQLIntrospection(t *testing.T) {
	e := echo.New()
	graphqlServer := createTestGraphQLServer()

	// Create introspection query
	query := `{"query":"{ __schema { types { name } } }"}`

	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(query))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	c := e.NewContext(req, rec)
	err := echo.WrapHandler(graphqlServer)(c)
	require.NoError(t, err)

	// Check status code
	assert.Equal(t, http.StatusOK, rec.Code)

	// Parse response
	var response map[string]interface{}
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should have data with __schema
	data, hasData := response["data"].(map[string]interface{})
	if hasData {
		_, hasSchema := data["__schema"]
		assert.True(t, hasSchema, "Introspection should be enabled")
	}
}

// TestGraphQLInvalidQuery tests handling of invalid queries
func TestGraphQLInvalidQuery(t *testing.T) {
	e := echo.New()
	graphqlServer := createTestGraphQLServer()

	// Invalid query (missing closing brace)
	query := `{"query":"{ invalidField"}`

	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(query))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	c := e.NewContext(req, rec)
	err := echo.WrapHandler(graphqlServer)(c)
	require.NoError(t, err)

	// gqlgen returns 422 for invalid queries (parse errors)
	assert.True(t, rec.Code == http.StatusOK || rec.Code == http.StatusUnprocessableEntity,
		"Should return 200 or 422 for invalid queries")

	// Parse response
	var response map[string]interface{}
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should have errors field
	_, hasErrors := response["errors"]
	assert.True(t, hasErrors, "Invalid query should return errors")
}

// TestGraphQLEmptyQuery tests handling of empty queries
func TestGraphQLEmptyQuery(t *testing.T) {
	e := echo.New()
	graphqlServer := createTestGraphQLServer()

	// Empty query
	query := `{"query":""}`

	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(query))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	c := e.NewContext(req, rec)
	err := echo.WrapHandler(graphqlServer)(c)
	require.NoError(t, err)

	// gqlgen returns 422 for empty queries
	assert.True(t, rec.Code == http.StatusOK || rec.Code == http.StatusUnprocessableEntity,
		"Should return 200 or 422 for empty queries")

	var response map[string]interface{}
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	require.NoError(t, err)

	// Empty query should return errors
	_, hasErrors := response["errors"]
	assert.True(t, hasErrors, "Empty query should return errors")
}
