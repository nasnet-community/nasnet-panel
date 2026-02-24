package translator

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResponseTranslator_TranslateResponse(t *testing.T) {
	registry := BuildDefaultRegistry()
	rt := NewResponseTranslator(registry)
	ctx := context.Background()

	t.Run("translate single record", func(t *testing.T) {
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

		result, err := rt.TranslateResponse(ctx, "/interface", response)
		require.NoError(t, err)
		require.True(t, result.Success)

		data := result.Data.(map[string]interface{})
		assert.Equal(t, "*1", data["id"])
		assert.Equal(t, "ether1", data["name"])
		assert.Equal(t, "00:11:22:33:44:55", data["macAddress"])
		assert.Equal(t, 1500, data["mtu"])
		// "disabled=no" is mapped to "enabled=true" via the field registry (inverted)
		assert.Equal(t, true, data["enabled"])
	})

	t.Run("translate list of records", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: []map[string]interface{}{
				{"name": "ether1", "type": "ether", "disabled": "no"},
				{"name": "ether2", "type": "ether", "disabled": "yes"},
			},
		}

		result, err := rt.TranslateResponse(ctx, "/interface", response)
		require.NoError(t, err)

		data := result.Data.([]map[string]interface{})
		require.Len(t, data, 2)
		assert.Equal(t, "ether1", data[0]["name"])
		// disabled=no -> enabled=true (inverted)
		assert.Equal(t, true, data[0]["enabled"])
		assert.Equal(t, "ether2", data[1]["name"])
		// disabled=yes -> enabled=false (inverted)
		assert.Equal(t, false, data[1]["enabled"])
	})

	t.Run("error response passes through", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: false,
			Error: &CommandError{
				Code:    "NOT_FOUND",
				Message: "Item not found",
			},
		}

		result, err := rt.TranslateResponse(ctx, "/interface", response)
		require.NoError(t, err)
		assert.False(t, result.Success)
		assert.Equal(t, "NOT_FOUND", result.Error.Code)
	})

	t.Run("nil response returns error", func(t *testing.T) {
		_, err := rt.TranslateResponse(ctx, "/interface", nil)
		require.Error(t, err)
	})

	t.Run("preserves metadata", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data:    map[string]interface{}{"name": "test"},
			Metadata: ResponseMetadata{
				Protocol:    ProtocolAPI,
				RecordCount: 1,
			},
		}

		result, err := rt.TranslateResponse(ctx, "/interface", response)
		require.NoError(t, err)
		assert.Equal(t, ProtocolAPI, result.Metadata.Protocol)
		assert.Equal(t, 1, result.Metadata.RecordCount)
	})
}

func TestResponseTranslator_ValueConversion(t *testing.T) {
	registry := BuildDefaultRegistry()
	rt := NewResponseTranslator(registry)
	ctx := context.Background()

	t.Run("convert boolean values", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"disabled": "yes",
				"running":  "no",   // has mapping at /interface with FieldTypeBool
				"dynamic":  "true", // no mapping, auto-converts
			},
		}

		result, err := rt.TranslateResponse(ctx, "/interface", response)
		require.NoError(t, err)

		data := result.Data.(map[string]interface{})
		// disabled=yes -> enabled=false (inverted via field mapping)
		assert.Equal(t, false, data["enabled"])
		// running has FieldTypeBool mapping: "no" -> false
		assert.Equal(t, false, data["running"])
		// dynamic auto-converts: "true" -> true
		assert.Equal(t, true, data["dynamic"])
	})

	t.Run("convert numeric values", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"mtu":      "1500",      // has FieldTypeInt mapping at /interface
				"cpu-load": "45",        // auto-converts (no mapping at /interface path)
				"tx-bytes": "123456789", // has FieldTypeSize mapping -> int64
			},
		}

		result, err := rt.TranslateResponse(ctx, "/interface", response)
		require.NoError(t, err)

		data := result.Data.(map[string]interface{})
		// mtu has FieldTypeInt mapping -> int
		assert.Equal(t, 1500, data["mtu"])
		// cpu-load auto-converts (no mapping at /interface path)
		assert.Equal(t, 45, data["cpuLoad"])
		// tx-bytes has FieldTypeSize mapping -> int64
		txBytesVal := data["txBytes"]
		assert.NotNil(t, txBytesVal)
		// txBytes should be int64 due to FieldTypeSize mapping
		txBytesInt64, ok := txBytesVal.(int64)
		assert.True(t, ok, "txBytes should be int64, got %T", txBytesVal)
		assert.Equal(t, int64(123456789), txBytesInt64)
	})

	t.Run("duration values", func(t *testing.T) {
		// Register uptime with duration type
		registry := NewFieldMappingRegistry()
		registry.Register(&FieldMapping{
			GraphQLField:  "uptime",
			MikroTikField: "uptime",
			Path:          "/system/resource",
			Type:          FieldTypeDuration,
		})
		rt := NewResponseTranslator(registry)

		response := &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"uptime": "1d2h30m",
			},
		}

		result, err := rt.TranslateResponse(ctx, "/system/resource", response)
		require.NoError(t, err)

		data := result.Data.(map[string]interface{})
		// Should convert to Go duration string format
		assert.Contains(t, data["uptime"].(string), "h")
	})
}

func TestResponseTranslator_FieldNameTranslation(t *testing.T) {
	registry := BuildDefaultRegistry()
	rt := NewResponseTranslator(registry)
	ctx := context.Background()

	tests := []struct {
		mikrotikField string
		graphqlField  string
	}{
		{"mac-address", "macAddress"},
		{"default-name", "defaultName"},
		{".id", "id"},
		{".nextid", "nextid"},
		{"tx-bytes", "txBytes"}, // Uses auto-conversion
		{"free-memory", "freeMemory"},
	}

	for _, tt := range tests {
		t.Run(tt.mikrotikField, func(t *testing.T) {
			response := &CanonicalResponse{
				Success: true,
				Data: map[string]interface{}{
					tt.mikrotikField: "test-value",
				},
			}

			result, err := rt.TranslateResponse(ctx, "/interface", response)
			require.NoError(t, err)

			data := result.Data.(map[string]interface{})
			_, ok := data[tt.graphqlField]
			assert.True(t, ok, "expected field %s to be present", tt.graphqlField)
		})
	}
}

func TestResponseTranslator_NormalizeRecord(t *testing.T) {
	rt := NewResponseTranslator(nil)

	t.Run("transform .id to id", func(t *testing.T) {
		record := map[string]interface{}{
			".id":  "*1",
			"name": "test",
		}

		result := rt.NormalizeRecord(record)
		assert.Equal(t, "*1", result["id"])
		assert.Nil(t, result[".id"])
	})

	t.Run("transform disabled to enabled", func(t *testing.T) {
		record := map[string]interface{}{
			"disabled": true,
			"name":     "test",
		}

		result := rt.NormalizeRecord(record)
		assert.Equal(t, false, result["enabled"])
		assert.Nil(t, result["disabled"])
	})

	t.Run("transform disabled string to enabled", func(t *testing.T) {
		record := map[string]interface{}{
			"disabled": "yes",
			"name":     "test",
		}

		result := rt.NormalizeRecord(record)
		assert.Equal(t, false, result["enabled"])
	})
}

func TestBatchTranslator(t *testing.T) {
	registry := BuildDefaultRegistry()
	bt := NewBatchTranslator(registry)
	ctx := context.Background()

	t.Run("translate batch responses", func(t *testing.T) {
		paths := []string{"/interface", "/ip/address"}
		responses := []*CanonicalResponse{
			{
				Success: true,
				Data: map[string]interface{}{
					"name":        "ether1",
					"mac-address": "00:11:22:33:44:55",
				},
			},
			{
				Success: true,
				Data: map[string]interface{}{
					"address":   "192.168.1.1/24",
					"interface": "ether1",
				},
			},
		}

		results, err := bt.TranslateBatch(ctx, paths, responses)
		require.NoError(t, err)
		require.Len(t, results, 2)

		// First response
		data1 := results[0].Data.(map[string]interface{})
		assert.Equal(t, "ether1", data1["name"])
		assert.Equal(t, "00:11:22:33:44:55", data1["macAddress"])

		// Second response
		data2 := results[1].Data.(map[string]interface{})
		assert.Equal(t, "192.168.1.1/24", data2["address"])
		assert.Equal(t, "ether1", data2["interface"])
	})

	t.Run("mismatched path and response count", func(t *testing.T) {
		paths := []string{"/interface"}
		responses := []*CanonicalResponse{
			{Success: true, Data: map[string]interface{}{}},
			{Success: true, Data: map[string]interface{}{}},
		}

		_, err := bt.TranslateBatch(ctx, paths, responses)
		require.Error(t, err)
	})
}

func TestResponseTranslator_NilRegistry(t *testing.T) {
	// Test that nil registry doesn't panic and falls back to auto-conversion
	rt := NewResponseTranslator(nil)
	ctx := context.Background()

	response := &CanonicalResponse{
		Success: true,
		Data: map[string]interface{}{
			"name":   "test",
			"count":  "42",
			"active": "yes",
		},
	}

	result, err := rt.TranslateResponse(ctx, "/test/path", response)
	require.NoError(t, err)
	require.True(t, result.Success)

	data := result.Data.(map[string]interface{})
	assert.Equal(t, "test", data["name"])
	assert.Equal(t, 42, data["count"]) // Auto-converted to int
	assert.Equal(t, true, data["active"]) // Auto-converted to bool
}

func TestResponseTranslator_NilRecord(t *testing.T) {
	rt := NewResponseTranslator(nil)

	t.Run("translate nil record", func(t *testing.T) {
		record := rt.translateRecord("/interface", nil)
		assert.NotNil(t, record)
		assert.Equal(t, 0, len(record))
	})

	t.Run("nil value in record", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"name":    nil,
				"address": "192.168.1.1",
			},
		}

		result, err := rt.TranslateResponse(context.Background(), "/interface", response)
		require.NoError(t, err)

		data := result.Data.(map[string]interface{})
		assert.Nil(t, data["name"])
		assert.Equal(t, "192.168.1.1", data["address"])
	})
}

func TestResponseTranslator_ContextCancellation(t *testing.T) {
	registry := BuildDefaultRegistry()
	rt := NewResponseTranslator(registry)

	t.Run("canceled context returns error", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		response := &CanonicalResponse{
			Success: true,
			Data:    map[string]interface{}{"name": "test"},
		}

		_, err := rt.TranslateResponse(ctx, "/interface", response)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "canceled")
	})
}

func TestBatchTranslator_ContextCancellation(t *testing.T) {
	registry := BuildDefaultRegistry()
	bt := NewBatchTranslator(registry)

	t.Run("canceled context in batch", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		paths := []string{"/interface"}
		responses := []*CanonicalResponse{
			{Success: true, Data: map[string]interface{}{"name": "test"}},
		}

		_, err := bt.TranslateBatch(ctx, paths, responses)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "canceled")
	})
}

func TestStreamingResponseTranslator(t *testing.T) {
	registry := BuildDefaultRegistry()
	srt := NewStreamingResponseTranslator("/interface", registry)
	ctx := context.Background()

	t.Run("translate single event", func(t *testing.T) {
		response := &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"name":        "ether1",
				"mac-address": "00:11:22:33:44:55",
			},
		}

		result, err := srt.Translate(ctx, response)
		require.NoError(t, err)

		data := result.Data.(map[string]interface{})
		assert.Equal(t, "00:11:22:33:44:55", data["macAddress"])
	})

	t.Run("translate channel", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		input := make(chan *CanonicalResponse, 3)
		input <- &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"name":     "ether1",
				"disabled": "no",
			},
		}
		input <- &CanonicalResponse{
			Success: true,
			Data: map[string]interface{}{
				"name":     "ether2",
				"disabled": "yes",
			},
		}
		close(input)

		output := srt.TranslateChannel(ctx, input)

		var results []*CanonicalResponse
		for result := range output {
			results = append(results, result)
		}

		require.Len(t, results, 2)

		data1 := results[0].Data.(map[string]interface{})
		// disabled=no -> enabled=true (inverted)
		assert.Equal(t, true, data1["enabled"])

		data2 := results[1].Data.(map[string]interface{})
		// disabled=yes -> enabled=false (inverted)
		assert.Equal(t, false, data2["enabled"])
	})

	t.Run("channel respects context cancellation", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		input := make(chan *CanonicalResponse)

		output := srt.TranslateChannel(ctx, input)

		// Cancel immediately
		cancel()

		// Channel should close
		select {
		case _, ok := <-output:
			if ok {
				t.Error("expected channel to be closed")
			}
		case <-time.After(100 * time.Millisecond):
			// OK - channel is closed
		}
	})

	t.Run("channel handles nil response", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		input := make(chan *CanonicalResponse, 1)
		input <- nil // Send nil response
		close(input)

		output := srt.TranslateChannel(ctx, input)

		result := <-output
		require.NotNil(t, result)
		assert.False(t, result.Success)
		assert.Equal(t, "TRANSLATION_ERROR", result.Error.Code)
		assert.Contains(t, result.Error.Message, "nil")
	})

	t.Run("translate nil streaming response", func(t *testing.T) {
		_, err := srt.Translate(context.Background(), nil)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "nil")
	})
}
