package translator

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTranslator_TranslateToCanonical(t *testing.T) {
	translator := NewDefaultTranslator()

	t.Run("basic query translation", func(t *testing.T) {
		cmd, err := translator.TranslateToCanonical(TranslateInput{
			Path:   "/interface",
			Action: ActionPrint,
			Filters: map[string]interface{}{
				"type": "ether",
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "/interface", cmd.Path)
		assert.Equal(t, ActionPrint, cmd.Action)
		require.Len(t, cmd.Filters, 1)
		assert.Equal(t, "type", cmd.Filters[0].Field)
		assert.Equal(t, "ether", cmd.Filters[0].Value)
	})

	t.Run("field name translation", func(t *testing.T) {
		cmd, err := translator.TranslateToCanonical(TranslateInput{
			Path:   "/interface",
			Action: ActionSet,
			ID:     "*1",
			Fields: map[string]interface{}{
				"macAddress": "00:11:22:33:44:55",
				"mtu":        1500,
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "00:11:22:33:44:55", cmd.Parameters["mac-address"])
		assert.Equal(t, 1500, cmd.Parameters["mtu"])
	})

	t.Run("enabled to disabled inversion", func(t *testing.T) {
		cmd, err := translator.TranslateToCanonical(TranslateInput{
			Path:   "/interface",
			Action: ActionSet,
			ID:     "*1",
			Fields: map[string]interface{}{
				"enabled": true,
			},
		})

		require.NoError(t, err)
		// "enabled: true" should become "disabled: false"
		assert.Equal(t, false, cmd.Parameters["disabled"])
	})

	t.Run("proplist translation", func(t *testing.T) {
		cmd, err := translator.TranslateToCanonical(TranslateInput{
			Path:     "/interface",
			Action:   ActionPrint,
			PropList: []string{"name", "macAddress", "mtu"},
		})

		require.NoError(t, err)
		assert.Equal(t, []string{"name", "mac-address", "mtu"}, cmd.PropList)
	})

	t.Run("metadata preservation", func(t *testing.T) {
		meta := CommandMetadata{
			RequestID:     "req-123",
			OperationName: "ListInterfaces",
			RouterID:      "router-456",
		}

		cmd, err := translator.TranslateToCanonical(TranslateInput{
			Path:     "/interface",
			Action:   ActionPrint,
			Metadata: meta,
		})

		require.NoError(t, err)
		assert.Equal(t, meta, cmd.Metadata)
	})
}

func TestTranslator_ConvenienceMethods(t *testing.T) {
	translator := NewDefaultTranslator()
	meta := CommandMetadata{RequestID: "req-123"}

	t.Run("TranslateQuery", func(t *testing.T) {
		cmd, err := translator.TranslateQuery("/interface", map[string]interface{}{"type": "ether"}, []string{"name"}, meta)
		require.NoError(t, err)
		assert.Equal(t, ActionPrint, cmd.Action)
		assert.Len(t, cmd.Filters, 1)
	})

	t.Run("TranslateGet", func(t *testing.T) {
		cmd, err := translator.TranslateGet("/interface/ethernet", "*1", meta)
		require.NoError(t, err)
		assert.Equal(t, ActionGet, cmd.Action)
		assert.Equal(t, "*1", cmd.ID)
	})

	t.Run("TranslateCreate", func(t *testing.T) {
		fields := map[string]interface{}{"name": "bridge1"}
		cmd, err := translator.TranslateCreate("/interface/bridge", fields, meta)
		require.NoError(t, err)
		assert.Equal(t, ActionAdd, cmd.Action)
		assert.Equal(t, "bridge1", cmd.Parameters["name"])
	})

	t.Run("TranslateUpdate", func(t *testing.T) {
		fields := map[string]interface{}{"mtu": 1500}
		cmd, err := translator.TranslateUpdate("/interface/ethernet", "*1", fields, meta)
		require.NoError(t, err)
		assert.Equal(t, ActionSet, cmd.Action)
		assert.Equal(t, "*1", cmd.ID)
		assert.Equal(t, 1500, cmd.Parameters["mtu"])
	})

	t.Run("TranslateDelete", func(t *testing.T) {
		cmd, err := translator.TranslateDelete("/interface/bridge", "*A1", meta)
		require.NoError(t, err)
		assert.Equal(t, ActionRemove, cmd.Action)
		assert.Equal(t, "*A1", cmd.ID)
	})
}

func TestTranslator_TranslateResponseToGraphQL(t *testing.T) {
	translator := NewDefaultTranslator()
	ctx := context.Background()

	t.Run("single record translation", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				".id":         "*1",
				"name":        "ether1",
				"mac-address": "00:11:22:33:44:55",
				"mtu":         "1500",
				"disabled":    "no",
			},
		}

		result, err := translator.TranslateResponseToGraphQL(ctx, "/interface", response)
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.(map[string]interface{})
		assert.Equal(t, "*1", data["id"]) // .id -> id (remove dot)
		assert.Equal(t, "ether1", data["name"])
		assert.Equal(t, "00:11:22:33:44:55", data["macAddress"])
	})

	t.Run("list translation", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: []map[string]interface{}{
				{"name": "ether1", "type": "ether"},
				{"name": "ether2", "type": "ether"},
			},
		}

		result, err := translator.TranslateResponseToGraphQL(ctx, "/interface", response)
		require.NoError(t, err)

		data := result.Data.([]map[string]interface{})
		assert.Len(t, data, 2)
		assert.Equal(t, "ether1", data[0]["name"])
	})

	t.Run("error response passthrough", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: false,
			Error: &CommandError{
				Code:     "NOT_FOUND",
				Message:  "Item not found",
				Category: ErrorCategoryNotFound,
			},
		}

		result, err := translator.TranslateResponseToGraphQL(ctx, "/interface", response)
		require.NoError(t, err)
		assert.False(t, result.Success)
		assert.Equal(t, "NOT_FOUND", result.Error.Code)
	})

	t.Run("nil response", func(t *testing.T) {
		_, err := translator.TranslateResponseToGraphQL(ctx, "/interface", nil)
		require.Error(t, err)
	})
}

func TestTranslator_SetVersion(t *testing.T) {
	translator := NewDefaultTranslator()
	assert.Nil(t, translator.version)

	version := &RouterOSVersion{Major: 7, Minor: 13}
	translator.SetVersion(version)

	assert.Equal(t, version, translator.version)

	// Version should be included in commands
	cmd, _ := translator.TranslateToCanonical(TranslateInput{
		Path:   "/interface",
		Action: ActionPrint,
	})
	assert.Equal(t, version, cmd.Version)
}

func TestTranslateError(t *testing.T) {
	tests := []struct {
		name         string
		err          error
		protocol     Protocol
		wantCategory ErrorCategory
		wantRetry    bool
	}{
		{
			name:         "not found error",
			err:          errors.New("item not found"),
			protocol:     ProtocolREST,
			wantCategory: ErrorCategoryNotFound,
			wantRetry:    false,
		},
		{
			name:         "duplicate error",
			err:          errors.New("entry already exists"),
			protocol:     ProtocolAPI,
			wantCategory: ErrorCategoryConflict,
			wantRetry:    false,
		},
		{
			name:         "validation error",
			err:          errors.New("invalid value"),
			protocol:     ProtocolSSH,
			wantCategory: ErrorCategoryValidation,
			wantRetry:    false,
		},
		{
			name:         "permission error",
			err:          errors.New("permission denied"),
			protocol:     ProtocolREST,
			wantCategory: ErrorCategoryPermission,
			wantRetry:    false,
		},
		{
			name:         "timeout error",
			err:          errors.New("operation timeout"),
			protocol:     ProtocolAPI,
			wantCategory: ErrorCategoryTimeout,
			wantRetry:    true,
		},
		{
			name:         "connection error",
			err:          errors.New("connection refused"),
			protocol:     ProtocolSSH,
			wantCategory: ErrorCategoryConnection,
			wantRetry:    true,
		},
		{
			name:         "unknown error",
			err:          errors.New("something unexpected"),
			protocol:     ProtocolREST,
			wantCategory: ErrorCategoryInternal,
			wantRetry:    false,
		},
		{
			name:         "nil error",
			err:          nil,
			protocol:     ProtocolREST,
			wantCategory: "",
			wantRetry:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TranslateError(tt.err, tt.protocol)

			if tt.err == nil {
				assert.Nil(t, result)
				return
			}

			require.NotNil(t, result)
			assert.Equal(t, tt.wantCategory, result.Category)
			assert.Equal(t, tt.wantRetry, result.Retryable)
			assert.Equal(t, string(tt.protocol), result.Details["protocol"])
		})
	}
}

func TestTranslator_FullRoundTrip(t *testing.T) {
	// Test a complete GraphQL -> Canonical -> Response -> GraphQL flow
	translator := NewDefaultTranslator()
	ctx := context.Background()

	// 1. Translate GraphQL mutation input to canonical command
	cmd, err := translator.TranslateToCanonical(TranslateInput{
		Path:   "/interface/ethernet",
		Action: ActionSet,
		ID:     "*1",
		Fields: map[string]interface{}{
			"enabled": false,
			"mtu":     1400,
			"comment": "Main uplink",
		},
		Metadata: CommandMetadata{
			RequestID:     "req-roundtrip",
			OperationName: "UpdateInterface",
		},
	})

	require.NoError(t, err)
	assert.Equal(t, "/interface/ethernet", cmd.Path)
	assert.Equal(t, ActionSet, cmd.Action)
	assert.Equal(t, "*1", cmd.ID)
	// enabled:false -> disabled:true
	assert.Equal(t, true, cmd.Parameters["disabled"])
	assert.Equal(t, 1400, cmd.Parameters["mtu"])

	// 2. Simulate a router response (MikroTik format)
	routerResponse := &CanonicalResponse{
		Success: true,
		Data: map[string]interface{}{
			".id":         "*1",
			"name":        "ether1",
			"mac-address": "00:11:22:33:44:55",
			"mtu":         "1400",
			"disabled":    "yes",
			"comment":     "Main uplink",
		},
	}

	// 3. Translate response back to GraphQL format
	graphqlResponse, err := translator.TranslateResponseToGraphQL(ctx, "/interface/ethernet", routerResponse)
	require.NoError(t, err)
	require.True(t, graphqlResponse.Success)

	data := graphqlResponse.Data.(map[string]interface{})
	assert.Equal(t, "*1", data["id"]) // .id -> id (remove dot)
	assert.Equal(t, "ether1", data["name"])
	assert.Equal(t, "00:11:22:33:44:55", data["macAddress"])
	// disabled:yes -> enabled:false would need special handling
}
