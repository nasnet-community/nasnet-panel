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

// Service orchestrates the validate → generate → write → publish flow
// for service configuration management.
type Service struct {
	registry      *Registry
	store         *ent.Client
	pathResolver  storage.PathResolverPort
	portRegistry  *network.PortRegistry
	vlanAllocator *network.VLANAllocator
	publisher     *events.Publisher
	logger        zerolog.Logger
}

// Config holds dependencies for Service (constructor injection).
type Config struct {
	Registry      *Registry
	Store         *ent.Client
	EventBus      events.EventBus
	PathResolver  storage.PathResolverPort
	PortRegistry  *network.PortRegistry
	VLANAllocator *network.VLANAllocator
	Logger        zerolog.Logger
}

// NewService creates a new Service with dependency injection.
func NewService(cfg Config) (*Service, error) {
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

	return &Service{
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
func (s *Service) ValidateConfig(ctx context.Context, instanceID string, config map[string]interface{}) error {
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
	if validateErr := generator.Validate(config, bindIP); validateErr != nil {
		return fmt.Errorf("validation failed: %w", validateErr)
	}

	return nil
}

// GetSchema retrieves the configuration schema for a service type.
func (s *Service) GetSchema(_ context.Context, serviceType string) (*Schema, error) {
	schema, err := s.registry.GetSchema(serviceType)
	if err != nil {
		return nil, fmt.Errorf("failed to get schema: %w", err)
	}

	return schema, nil
}

// GetConfig retrieves the current configuration for a service instance.
func (s *Service) GetConfig(ctx context.Context, instanceID string) (map[string]interface{}, error) {
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
func (s *Service) ApplyConfig(ctx context.Context, instanceID string, config map[string]interface{}) error {
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

	// 3. Validate and generate config content
	configContent, err := s.validateAndGenerate(ctx, instance, generator, instanceID, config)
	if err != nil {
		return err
	}

	// 4. Write config file atomically with backup
	configFileName := generator.GetConfigFileName()
	finalConfigPath, err := s.writeConfigFile(instance, configFileName, configContent)
	if err != nil {
		return err
	}

	// 5. Persist config to database
	_, err = instance.Update().
		SetConfig(config).
		Save(ctx)
	if err != nil {
		s.logger.Error().
			Err(err).
			Str("instance_id", instanceID).
			Msg("Failed to persist config to database (file written successfully)")
		return fmt.Errorf("failed to persist config to database: %w", err)
	}

	// 6. Publish ConfigApplied event (non-fatal)
	if publishErr := s.publisher.PublishConfigApplied(ctx, instanceID, instance.RouterID, 1, []string{configFileName}); publishErr != nil {
		s.logger.Warn().
			Err(publishErr).
			Str("instance_id", instanceID).
			Msg("Failed to publish ConfigApplied event")
	}

	s.logger.Info().
		Str("instance_id", instanceID).
		Str("service_type", instance.FeatureID).
		Str("config_path", finalConfigPath).
		Msg("Configuration applied successfully")

	return nil
}

// validateAndGenerate validates config and generates config content.
func (s *Service) validateAndGenerate(ctx context.Context, instance *ent.ServiceInstance, generator Generator, instanceID string, config map[string]interface{}) ([]byte, error) {
	bindIP, err := s.getBindIP(ctx, instance)
	if err != nil {
		return nil, fmt.Errorf("failed to get bind IP: %w", err)
	}

	s.logger.Debug().
		Str("instance_id", instanceID).
		Str("bind_ip", bindIP).
		Msg("Resolved bind IP")

	if validateErr := generator.Validate(config, bindIP); validateErr != nil {
		return nil, fmt.Errorf("validation failed: %w", validateErr)
	}

	configContent, err := generator.Generate(instanceID, config, bindIP)
	if err != nil {
		return nil, fmt.Errorf("config generation failed: %w", err)
	}

	return configContent, nil
}

// writeConfigFile writes config content atomically with backup and rollback support.
func (s *Service) writeConfigFile(instance *ent.ServiceInstance, configFileName string, content []byte) (string, error) {
	configPath := s.pathResolver.ConfigPath(instance.FeatureID)
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		return "", fmt.Errorf("failed to create config directory: %w", err)
	}

	instanceConfigDir := filepath.Join(configDir, instance.FeatureID)
	if err := os.MkdirAll(instanceConfigDir, 0o755); err != nil {
		return "", fmt.Errorf("failed to create instance config directory: %w", err)
	}
	finalConfigPath := filepath.Join(instanceConfigDir, configFileName)

	// Backup existing config
	backupPath := finalConfigPath + ".backup"
	if _, statErr := os.Stat(finalConfigPath); statErr == nil {
		if backupErr := os.Rename(finalConfigPath, backupPath); backupErr != nil {
			s.logger.Warn().Err(backupErr).Str("config_path", finalConfigPath).Msg("Failed to backup existing config")
		} else {
			s.logger.Debug().Str("backup_path", backupPath).Msg("Created config backup")
		}
	}

	// Atomic write: temp file + rename
	tempPath := finalConfigPath + ".tmp"
	if err := os.WriteFile(tempPath, content, 0o644); err != nil {
		return "", fmt.Errorf("failed to write temp config file: %w", err)
	}

	if err := os.Rename(tempPath, finalConfigPath); err != nil {
		os.Remove(tempPath)
		s.restoreBackup(backupPath, finalConfigPath)
		return "", fmt.Errorf("atomic rename failed: %w", err)
	}

	s.logger.Info().Str("config_path", finalConfigPath).Int("size_bytes", len(content)).Msg("Config file written successfully")
	return finalConfigPath, nil
}

// restoreBackup restores a config file from its backup.
func (s *Service) restoreBackup(backupPath, configPath string) {
	if _, statErr := os.Stat(backupPath); statErr == nil {
		if restoreErr := os.Rename(backupPath, configPath); restoreErr != nil {
			s.logger.Error().Err(restoreErr).Msg("Failed to restore config from backup")
		}
	}
}

// getBindIP retrieves the bind IP for a service instance from VLAN allocation.
func (s *Service) getBindIP(_ context.Context, instance *ent.ServiceInstance) (string, error) {
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
func (s *Service) GetConfigFilePath(ctx context.Context, instanceID string) (string, error) {
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
