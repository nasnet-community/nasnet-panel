package config

import (
	"fmt"
	"testing"
)

// mockGenerator is a mock implementation of Generator for testing
type mockGenerator struct {
	serviceType string
	schema      *Schema
}

func (m *mockGenerator) GetServiceType() string {
	return m.serviceType
}

func (m *mockGenerator) GetSchema() *Schema {
	return m.schema
}

func (m *mockGenerator) Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error) {
	return []byte("mock config"), nil
}

func (m *mockGenerator) Validate(config map[string]interface{}, bindIP string) error {
	return nil
}

func (m *mockGenerator) GetConfigFileName() string {
	return "config.txt"
}

func (m *mockGenerator) GetConfigFormat() string {
	return "text"
}

func newMockGenerator(serviceType string) *mockGenerator {
	return &mockGenerator{
		serviceType: serviceType,
		schema: &Schema{
			ServiceType: serviceType,
			Version:     "1.0.0",
			Fields: []Field{
				{Name: "port", Type: "int", Required: true},
			},
		},
	}
}

func TestRegistry_Register(t *testing.T) {
	registry := NewRegistry()

	t.Run("register valid generator", func(t *testing.T) {
		gen := newMockGenerator("test-service")
		err := registry.Register(gen)
		if err != nil {
			t.Errorf("Register() error = %v, expected nil", err)
		}
	})

	t.Run("register nil generator", func(t *testing.T) {
		err := registry.Register(nil)
		if err == nil {
			t.Error("Register() expected error for nil generator, got nil")
		}
	})

	t.Run("register duplicate service type", func(t *testing.T) {
		gen1 := newMockGenerator("duplicate")
		gen2 := newMockGenerator("duplicate")

		err1 := registry.Register(gen1)
		if err1 != nil {
			t.Errorf("First Register() error = %v, expected nil", err1)
		}

		err2 := registry.Register(gen2)
		if err2 == nil {
			t.Error("Second Register() expected error for duplicate, got nil")
		}
	})
}

func TestRegistry_Get(t *testing.T) {
	registry := NewRegistry()
	gen := newMockGenerator("test-service")
	registry.Register(gen)

	t.Run("get existing generator", func(t *testing.T) {
		retrieved, err := registry.Get("test-service")
		if err != nil {
			t.Errorf("Get() error = %v, expected nil", err)
		}
		if retrieved.GetServiceType() != "test-service" {
			t.Errorf("Get() returned wrong generator, got %v", retrieved.GetServiceType())
		}
	})

	t.Run("get non-existent generator", func(t *testing.T) {
		_, err := registry.Get("non-existent")
		if err == nil {
			t.Error("Get() expected error for non-existent service, got nil")
		}
	})
}

func TestRegistry_Has(t *testing.T) {
	registry := NewRegistry()
	gen := newMockGenerator("test-service")
	registry.Register(gen)

	t.Run("has existing generator", func(t *testing.T) {
		if !registry.Has("test-service") {
			t.Error("Has() returned false for existing generator")
		}
	})

	t.Run("has non-existent generator", func(t *testing.T) {
		if registry.Has("non-existent") {
			t.Error("Has() returned true for non-existent generator")
		}
	})
}

func TestRegistry_List(t *testing.T) {
	registry := NewRegistry()

	t.Run("empty registry", func(t *testing.T) {
		list := registry.List()
		if len(list) != 0 {
			t.Errorf("List() expected empty slice, got %d items", len(list))
		}
	})

	t.Run("multiple generators", func(t *testing.T) {
		registry.Register(newMockGenerator("service1"))
		registry.Register(newMockGenerator("service2"))
		registry.Register(newMockGenerator("service3"))

		list := registry.List()
		if len(list) != 3 {
			t.Errorf("List() expected 3 items, got %d", len(list))
		}
	})
}

func TestRegistry_Unregister(t *testing.T) {
	registry := NewRegistry()
	gen := newMockGenerator("test-service")
	registry.Register(gen)

	t.Run("unregister existing generator", func(t *testing.T) {
		err := registry.Unregister("test-service")
		if err != nil {
			t.Errorf("Unregister() error = %v, expected nil", err)
		}
		if registry.Has("test-service") {
			t.Error("Generator still exists after unregister")
		}
	})

	t.Run("unregister non-existent generator", func(t *testing.T) {
		err := registry.Unregister("non-existent")
		if err == nil {
			t.Error("Unregister() expected error for non-existent service, got nil")
		}
	})
}

func TestRegistry_Count(t *testing.T) {
	registry := NewRegistry()

	if registry.Count() != 0 {
		t.Errorf("Count() expected 0, got %d", registry.Count())
	}

	registry.Register(newMockGenerator("service1"))
	registry.Register(newMockGenerator("service2"))

	if registry.Count() != 2 {
		t.Errorf("Count() expected 2, got %d", registry.Count())
	}
}

func TestRegistry_Clear(t *testing.T) {
	registry := NewRegistry()
	registry.Register(newMockGenerator("service1"))
	registry.Register(newMockGenerator("service2"))

	registry.Clear()

	if registry.Count() != 0 {
		t.Errorf("Clear() expected count 0, got %d", registry.Count())
	}
}

func TestRegistry_GetSchema(t *testing.T) {
	registry := NewRegistry()
	gen := newMockGenerator("test-service")
	registry.Register(gen)

	t.Run("get schema for existing service", func(t *testing.T) {
		schema, err := registry.GetSchema("test-service")
		if err != nil {
			t.Errorf("GetSchema() error = %v, expected nil", err)
		}
		if schema.ServiceType != "test-service" {
			t.Errorf("GetSchema() returned wrong schema, got %v", schema.ServiceType)
		}
	})

	t.Run("get schema for non-existent service", func(t *testing.T) {
		_, err := registry.GetSchema("non-existent")
		if err == nil {
			t.Error("GetSchema() expected error for non-existent service, got nil")
		}
	})
}

func TestRegistry_Generate(t *testing.T) {
	registry := NewRegistry()
	gen := newMockGenerator("test-service")
	registry.Register(gen)

	config := map[string]interface{}{
		"port": 9050,
	}

	t.Run("generate for existing service", func(t *testing.T) {
		output, err := registry.Generate("test-service", "instance-123", config, "192.168.1.1")
		if err != nil {
			t.Errorf("Generate() error = %v, expected nil", err)
		}
		if len(output) == 0 {
			t.Error("Generate() returned empty output")
		}
	})

	t.Run("generate for non-existent service", func(t *testing.T) {
		_, err := registry.Generate("non-existent", "instance-123", config, "192.168.1.1")
		if err == nil {
			t.Error("Generate() expected error for non-existent service, got nil")
		}
	})
}

func TestRegistry_Validate(t *testing.T) {
	registry := NewRegistry()
	gen := newMockGenerator("test-service")
	registry.Register(gen)

	config := map[string]interface{}{
		"port": 9050,
	}

	t.Run("validate for existing service", func(t *testing.T) {
		err := registry.Validate("test-service", config, "192.168.1.1")
		if err != nil {
			t.Errorf("Validate() error = %v, expected nil", err)
		}
	})

	t.Run("validate for non-existent service", func(t *testing.T) {
		err := registry.Validate("non-existent", config, "192.168.1.1")
		if err == nil {
			t.Error("Validate() expected error for non-existent service, got nil")
		}
	})
}

func TestRegistry_ThreadSafety(t *testing.T) {
	registry := NewRegistry()

	// Run concurrent operations to test thread safety
	done := make(chan bool)

	// Concurrent registers
	for i := 0; i < 10; i++ {
		go func(id int) {
			gen := newMockGenerator("service-" + string(rune('0'+id)))
			registry.Register(gen)
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify count
	if registry.Count() != 10 {
		t.Errorf("Expected 10 generators after concurrent registers, got %d", registry.Count())
	}
}

// TestRegistry_ConcurrentReadWrite tests concurrent reads during writes.
func TestRegistry_ConcurrentReadWrite(t *testing.T) {
	registry := NewRegistry()

	// Pre-register some generators
	for i := 0; i < 5; i++ {
		gen := newMockGenerator("service-" + string(rune('0'+i)))
		registry.Register(gen)
	}

	// Run concurrent reads and writes
	done := make(chan bool)
	errors := make(chan error, 100)

	// Concurrent readers (Get, Has, List)
	for i := 0; i < 20; i++ {
		go func(id int) {
			for j := 0; j < 100; j++ {
				serviceType := "service-" + string(rune('0'+(id%5)))

				// Test Get
				if _, err := registry.Get(serviceType); err != nil {
					errors <- err
				}

				// Test Has
				if !registry.Has(serviceType) {
					errors <- fmt.Errorf("expected service %s to exist", serviceType)
				}

				// Test List
				registry.List()
			}
			done <- true
		}(i)
	}

	// Concurrent writers (Register)
	for i := 5; i < 10; i++ {
		go func(id int) {
			gen := newMockGenerator("service-" + string(rune('0'+id)))
			if err := registry.Register(gen); err != nil {
				errors <- err
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 25; i++ {
		<-done
	}

	// Check for errors
	close(errors)
	for err := range errors {
		t.Errorf("Concurrent operation error: %v", err)
	}

	// Verify final count
	if registry.Count() != 10 {
		t.Errorf("Expected 10 generators after concurrent operations, got %d", registry.Count())
	}
}
