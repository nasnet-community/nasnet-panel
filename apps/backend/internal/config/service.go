package config

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/network"
	"backend/internal/storage"

	"github.com/rs/zerolog"
)

// ConfigService orchestrates the validate → generate → write → publish flow
// for service configuration management.
type ConfigService struct {
	registry      *Registry
	store         *ent.Client
	pathResolver  storage.PathResolverPort
	portRegistry  *network.PortRegistry
	vlanAllocator *network.VLANAllocator
	publisher     *events.Publisher
	logger        zerolog.Logger
}

// ConfigServiceConfig holds dependencies for ConfigService (constructor injection).
type ConfigServiceConfig struct {
	Registry      *Registry
	Store         *ent.Client
	EventBus      events.EventBus
	PathResolver  storage.PathResolverPort
	PortRegistry  *network.PortRegistry
	VLANAllocator *network.VLANAllocator
	Logger        zerolog.Logger
}

// NewConfigService creates a new ConfigService with dependency injection.
func NewConfigService(cfg ConfigServiceConfig) (*ConfigService, error) {
	if cfg.Registry == nil {
		return nil, fmt.Errorf("registry is required")
	}
	if cfg.Store == nil {
		return nil, fmt.Errorf("store is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("eventBus is required")
	}
	if cfg.PathResolver == nil {
		return nil, fmt.Errorf("pathResolver is required")
	}

	publisher := events.NewPublisher(cfg.EventBus, "config_service")

	return &ConfigService{
		registry:      cfg.Registry,
		store:         cfg.Store,
		pathResolver:  cfg.PathResolver,
		portRegistry:  cfg.PortRegistry,
		vlanAllocator: cfg.VLANAllocator,
		publisher:     publisher,
		logger:        cfg.Logger,
	}, nil
}

// ValidateConfig validates a configuration for a service instance.
func (s *ConfigService) ValidateConfig(ctx context.Context, instanceID string, config map[string]interface{}) error {
	// Fetch instance from database
	instance, err := s.store.ServiceInstance.Query().
		Where(serviceinstance.ID(instanceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("service instance not found: %s", instanceID)
		}
		return fmt.Errorf("failed to fetch instance: %w", err)
	}

	// Get generator for this service type
	generator, err := s.registry.Get(instance.FeatureID)
	if err != nil {
		return fmt.Errorf("no generator found for service type %s: %w", instance.FeatureID, err)
	}

	// Get bind IP from VLAN allocation or instance
	bindIP, err := s.getBindIP(ctx, instance)
	if err != nil {
		return fmt.Errorf("failed to get bind IP: %w", err)
	}

	// Validate config with generator
	if err := generator.Validate(config, bindIP); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	return nil
}

// GetSchema retrieves the configuration schema for a service type.
func (s *ConfigService) GetSchema(ctx context.Context, serviceType string) (*ConfigSchema, error) {
	schema, err := s.registry.GetSchema(serviceType)
	if err != nil {
		return nil, fmt.Errorf("failed to get schema: %w", err)
	}

	return schema, nil
}

// GetConfig retrieves the current configuration for a service instance.
func (s *ConfigService) GetConfig(ctx context.Context, instanceID string) (map[string]interface{}, error) {
	// Fetch instance from database
	instance, err := s.store.ServiceInstance.Query().
		Where(serviceinstance.ID(instanceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("service instance not found: %s", instanceID)
		}
		return nil, fmt.Errorf("failed to fetch instance: %w", err)
	}

	// Return persisted config
	if instance.Config == nil {
		return make(map[string]interface{}), nil
	}

	return instance.Config, nil
}

// ApplyConfig orchestrates the complete flow: validate → generate → write → persist → publish.
func (s *ConfigService) ApplyConfig(ctx context.Context, instanceID string, config map[string]interface{}) error {
	// 1. Fetch instance from database
	instance, err := s.store.ServiceInstance.Query().
		Where(serviceinstance.ID(instanceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("service instance not found: %s", instanceID)
		}
		return fmt.Errorf("failed to fetch instance: %w", err)
	}

	s.logger.Info().
		Str("instance_id", instanceID).
		Str("service_type", instance.FeatureID).
		Msg("Applying configuration")

	// 2. Get generator from registry
	generator, err := s.registry.Get(instance.FeatureID)
	if err != nil {
		return fmt.Errorf("no generator found for service type %s: %w", instance.FeatureID, err)
	}

	// 3. Get bind IP from VLAN allocation or instance
	bindIP, err := s.getBindIP(ctx, instance)
	if err != nil {
		return fmt.Errorf("failed to get bind IP: %w", err)
	}

	s.logger.Debug().
		Str("instance_id", instanceID).
		Str("bind_ip", bindIP).
		Msg("Resolved bind IP")

	// 4. Validate config
	if err := generator.Validate(config, bindIP); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	// 5. Generate config content
	configContent, err := generator.Generate(instanceID, config, bindIP)
	if err != nil {
		return fmt.Errorf("config generation failed: %w", err)
	}

	// 6. Get config file path
	configFileName := generator.GetConfigFileName()
	configPath := s.pathResolver.ConfigPath(instance.FeatureID)

	// Ensure config directory exists
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Adjust config path to include the specific filename
	// PathResolver returns path like "/flash/features/config/tor.json"
	// But we need "/flash/features/config/tor/torrc" for Tor
	instanceConfigDir := filepath.Join(configDir, instance.FeatureID)
	if err := os.MkdirAll(instanceConfigDir, 0755); err != nil {
		return fmt.Errorf("failed to create instance config directory: %w", err)
	}
	finalConfigPath := filepath.Join(instanceConfigDir, configFileName)

	// 7. Backup existing config
	backupPath := finalConfigPath + ".backup"
	if _, err := os.Stat(finalConfigPath); err == nil {
		// Config exists, create backup
		if err := os.Rename(finalConfigPath, backupPath); err != nil {
			s.logger.Warn().
				Err(err).
				Str("config_path", finalConfigPath).
				Msg("Failed to backup existing config")
		} else {
			s.logger.Debug().
				Str("backup_path", backupPath).
				Msg("Created config backup")
		}
	}

	// 8. Atomic write: temp file + os.Rename()
	tempPath := finalConfigPath + ".tmp"
	if err := os.WriteFile(tempPath, configContent, 0644); err != nil {
		return fmt.Errorf("failed to write temp config file: %w", err)
	}

	// Atomic rename (POSIX guarantee)
	if err := os.Rename(tempPath, finalConfigPath); err != nil {
		// Cleanup temp file on failure
		os.Remove(tempPath)

		// Restore backup if exists
		if _, statErr := os.Stat(backupPath); statErr == nil {
			if restoreErr := os.Rename(backupPath, finalConfigPath); restoreErr != nil {
				s.logger.Error().
					Err(restoreErr).
					Msg("Failed to restore config from backup")
			}
		}

		return fmt.Errorf("atomic rename failed: %w", err)
	}

	s.logger.Info().
		Str("config_path", finalConfigPath).
		Int("size_bytes", len(configContent)).
		Msg("Config file written successfully")

	// 9. Persist config to database
	_, err = instance.Update().
		SetConfig(config).
		Save(ctx)
	if err != nil {
		s.logger.Error().
			Err(err).
			Str("instance_id", instanceID).
			Msg("Failed to persist config to database (file written successfully)")

		// NOTE: We don't rollback the file write here because the file is the source of truth
		// The database persistence is for auditing/recovery only
		return fmt.Errorf("failed to persist config to database: %w", err)
	}

	// 10. Publish ConfigApplied event
	if err := s.publisher.PublishConfigApplied(ctx, instanceID, instance.RouterID, 1, []string{configFileName}); err != nil {
		s.logger.Warn().
			Err(err).
			Str("instance_id", instanceID).
			Msg("Failed to publish ConfigApplied event")
		// Don't fail the operation if event publishing fails
	}

	s.logger.Info().
		Str("instance_id", instanceID).
		Str("service_type", instance.FeatureID).
		Str("config_path", finalConfigPath).
		Msg("Configuration applied successfully")

	return nil
}

// getBindIP retrieves the bind IP for a service instance from VLAN allocation.
func (s *ConfigService) getBindIP(ctx context.Context, instance *ent.ServiceInstance) (string, error) {
	// If instance already has a bind_ip set, use it
	if instance.BindIP != "" {
		return instance.BindIP, nil
	}

	// If VLAN allocator is not configured, return error
	if s.vlanAllocator == nil {
		return "", fmt.Errorf("no bind IP configured and VLAN allocator not available")
	}

	// TODO: Get bind IP from VLAN allocation
	// This requires querying the VLAN allocation for this instance
	// For now, we require bind_ip to be set on the instance
	return "", fmt.Errorf("bind IP not configured for instance %s", instance.ID)
}

// GetConfigFilePath returns the full path to the config file for a service instance.
func (s *ConfigService) GetConfigFilePath(ctx context.Context, instanceID string) (string, error) {
	// Fetch instance from database
	instance, err := s.store.ServiceInstance.Query().
		Where(serviceinstance.ID(instanceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return "", fmt.Errorf("service instance not found: %s", instanceID)
		}
		return "", fmt.Errorf("failed to fetch instance: %w", err)
	}

	// Get generator to determine config filename
	generator, err := s.registry.Get(instance.FeatureID)
	if err != nil {
		return "", fmt.Errorf("no generator found for service type %s: %w", instance.FeatureID, err)
	}

	configFileName := generator.GetConfigFileName()
	configPath := s.pathResolver.ConfigPath(instance.FeatureID)
	configDir := filepath.Dir(configPath)
	instanceConfigDir := filepath.Join(configDir, instance.FeatureID)

	return filepath.Join(instanceConfigDir, configFileName), nil
}
