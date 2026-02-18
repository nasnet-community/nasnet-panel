package config

import (
	"fmt"
	"sync"
)

// Registry is a thread-safe registry of config generators for different service types.
type Registry struct {
	mu         sync.RWMutex
	generators map[string]Generator
}

// NewRegistry creates a new generator registry.
func NewRegistry() *Registry {
	return &Registry{
		generators: make(map[string]Generator),
	}
}

// Register registers a config generator for a service type.
func (r *Registry) Register(generator Generator) error {
	if generator == nil {
		return fmt.Errorf("generator cannot be nil")
	}

	serviceType := generator.GetServiceType()
	if serviceType == "" {
		return fmt.Errorf("generator service type cannot be empty")
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.generators[serviceType]; exists {
		return fmt.Errorf("generator for service type %s is already registered", serviceType)
	}

	r.generators[serviceType] = generator
	return nil
}

// Get retrieves a config generator by service type.
func (r *Registry) Get(serviceType string) (Generator, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	generator, exists := r.generators[serviceType]
	if !exists {
		return nil, fmt.Errorf("no generator registered for service type: %s", serviceType)
	}

	return generator, nil
}

// Has checks if a generator is registered for a service type.
func (r *Registry) Has(serviceType string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	_, exists := r.generators[serviceType]
	return exists
}

// List returns all registered service types.
func (r *Registry) List() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	types := make([]string, 0, len(r.generators))
	for serviceType := range r.generators {
		types = append(types, serviceType)
	}
	return types
}

// Unregister removes a generator from the registry.
func (r *Registry) Unregister(serviceType string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.generators[serviceType]; !exists {
		return fmt.Errorf("no generator registered for service type: %s", serviceType)
	}

	delete(r.generators, serviceType)
	return nil
}

// Count returns the number of registered generators.
func (r *Registry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.generators)
}

// Clear removes all registered generators.
func (r *Registry) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.generators = make(map[string]Generator)
}

// GetSchema retrieves the schema for a service type.
func (r *Registry) GetSchema(serviceType string) (*Schema, error) {
	generator, err := r.Get(serviceType)
	if err != nil {
		return nil, err
	}

	return generator.GetSchema(), nil
}

// Generate generates configuration for a service instance.
func (r *Registry) Generate(serviceType, instanceID string, config map[string]interface{}, bindIP string) ([]byte, error) {
	generator, err := r.Get(serviceType)
	if err != nil {
		return nil, err
	}

	return generator.Generate(instanceID, config, bindIP)
}

// Validate validates configuration for a service type.
func (r *Registry) Validate(serviceType string, config map[string]interface{}, bindIP string) error {
	generator, err := r.Get(serviceType)
	if err != nil {
		return err
	}

	return generator.Validate(config, bindIP)
}
