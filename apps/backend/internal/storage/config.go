package storage

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/globalsettings"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog"

	"backend/internal/events"
)

const (
	// StorageNamespace is the namespace for storage-related settings.
	StorageNamespace = "storage"

	// Storage setting keys
	StorageKeyExternalPath = "external_path"
	StorageKeyEnabled      = "enabled"
)

// StorageConfig represents the storage configuration.
type StorageConfig struct { //nolint:revive // type name appropriate for this package
	Enabled      bool   `json:"enabled"`
	ExternalPath string `json:"external_path"`
}

// StorageConfigService manages storage configuration persistence and validation.
type StorageConfigService struct { //nolint:revive // type name appropriate for this package
	client    *ent.Client
	detector  *StorageDetector
	publisher *events.Publisher
	logger    zerolog.Logger
}

// NewStorageConfigService creates a new StorageConfigService.
func NewStorageConfigService(
	client *ent.Client,
	detector *StorageDetector,
	publisher *events.Publisher,
	logger zerolog.Logger,
) *StorageConfigService {

	return &StorageConfigService{
		client:    client,
		detector:  detector,
		publisher: publisher,
		logger:    logger.With().Str("component", "storage-config").Logger(),
	}
}

// SetExternalPath sets the external storage path.
// Validates that the path exists and is mounted before saving.
func (s *StorageConfigService) SetExternalPath(ctx context.Context, path string) error {
	s.logger.Info().Str("path", path).Msg("setting external storage path")

	// Validate the path exists and is mounted
	if err := s.validatePath(path); err != nil {
		s.logger.Error().Err(err).Str("path", path).Msg("path validation failed")
		return err
	}

	// Get current config to check if changed
	currentPath, err := s.GetExternalPath(ctx)
	if err != nil {
		currentPath = ""
	}

	// Save to database
	value := map[string]interface{}{
		"path": path,
	}

	if err := s.upsertSetting(ctx, StorageKeyExternalPath, value, globalsettings.ValueTypeString, "External storage mount path"); err != nil {
		s.logger.Error().Err(err).Msg("failed to save external path")
		return WrapStorageError(ErrCodeInvalidConfig, "failed to save configuration", path, err)
	}

	s.logger.Info().
		Str("path", path).
		Str("previous_path", currentPath).
		Msg("external storage path updated")

	// Emit configuration changed event
	if currentPath != path {
		event := events.NewStorageConfigChangedEvent(
			"", // featureID - not applicable for global config
			"", // instanceID - not applicable for global config
			currentPath,
			path,
			1, // configVersion - increment in real implementation
			"storage-config-service",
		)
		if err := s.publisher.Publish(ctx, event); err != nil {
			s.logger.Error().Err(err).Msg("failed to publish storage config changed event")
		}
	}

	return nil
}

// GetExternalPath retrieves the configured external storage path.
func (s *StorageConfigService) GetExternalPath(ctx context.Context) (string, error) {
	setting, err := s.client.GlobalSettings.Query().
		Where(
			globalsettings.NamespaceEQ(StorageNamespace),
			globalsettings.KeyEQ(StorageKeyExternalPath),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return "", nil // Not configured yet
		}
		return "", fmt.Errorf("failed to query external path: %w", err)
	}

	if path, ok := setting.Value["path"].(string); ok {
		return path, nil
	}

	return "", nil
}

// SetEnabled enables or disables external storage usage.
func (s *StorageConfigService) SetEnabled(ctx context.Context, enabled bool) error {
	s.logger.Info().Bool("enabled", enabled).Msg("setting external storage enabled state")

	// If enabling, validate that path is configured and mounted
	if enabled {
		path, err := s.GetExternalPath(ctx)
		if err != nil {
			return err
		}
		if path == "" {
			return NewStorageError(
				ErrCodeInvalidConfig,
				"external path must be configured before enabling",
				"",
			)
		}
		if err := s.validatePath(path); err != nil {
			return err
		}
	}

	value := map[string]interface{}{
		"enabled": enabled,
	}

	if err := s.upsertSetting(ctx, StorageKeyEnabled, value, globalsettings.ValueTypeBoolean, "Whether external storage is enabled"); err != nil {
		s.logger.Error().Err(err).Msg("failed to save enabled state")
		return WrapStorageError(ErrCodeInvalidConfig, "failed to save configuration", "", err)
	}

	s.logger.Info().Bool("enabled", enabled).Msg("external storage enabled state updated")
	return nil
}

// IsEnabled checks if external storage is enabled.
func (s *StorageConfigService) IsEnabled(ctx context.Context) (bool, error) {
	setting, err := s.client.GlobalSettings.Query().
		Where(
			globalsettings.NamespaceEQ(StorageNamespace),
			globalsettings.KeyEQ(StorageKeyEnabled),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return false, nil // Default to disabled
		}
		return false, fmt.Errorf("failed to query enabled state: %w", err)
	}

	if enabled, ok := setting.Value["enabled"].(bool); ok {
		return enabled, nil
	}

	return false, nil
}

// GetConfig retrieves the complete storage configuration.
func (s *StorageConfigService) GetConfig(ctx context.Context) (*StorageConfig, error) {
	enabled, err := s.IsEnabled(ctx)
	if err != nil {
		return nil, err
	}

	path, err := s.GetExternalPath(ctx)
	if err != nil {
		return nil, err
	}

	return &StorageConfig{
		Enabled:      enabled,
		ExternalPath: path,
	}, nil
}

// UpdateConfig updates the complete storage configuration atomically.
func (s *StorageConfigService) UpdateConfig(ctx context.Context, cfg *StorageConfig) error {
	s.logger.Info().
		Bool("enabled", cfg.Enabled).
		Str("path", cfg.ExternalPath).
		Msg("updating storage configuration")

	// Validate path first if provided
	if cfg.ExternalPath != "" {
		if err := s.validatePath(cfg.ExternalPath); err != nil {
			return err
		}
	}

	// Validate enabled state
	if cfg.Enabled && cfg.ExternalPath == "" {
		return NewStorageError(
			ErrCodeInvalidConfig,
			"external path must be configured when enabled is true",
			"",
		)
	}

	// Update path first
	if cfg.ExternalPath != "" {
		if err := s.SetExternalPath(ctx, cfg.ExternalPath); err != nil {
			return err
		}
	}

	// Then update enabled state
	return s.SetEnabled(ctx, cfg.Enabled)
}

// validatePath checks if a path exists and is mounted via StorageDetector.
func (s *StorageConfigService) validatePath(path string) error {
	if path == "" {
		return NewStorageError(
			ErrCodeInvalidPath,
			"path cannot be empty",
			path,
		)
	}

	// Check if path is one of the monitored mount points
	state := s.detector.GetCurrentState()

	mp, exists := state.MountPoints[path]
	if !exists {
		return NewStorageError(
			ErrCodeMountNotFound,
			"path is not a monitored mount point",
			path,
		)
	}

	if !mp.IsMounted {
		return NewStorageError(
			ErrCodeNotMounted,
			"storage device is not mounted",
			path,
		)
	}

	// Check if there's at least 100MB free space
	const minRequiredSpaceMB = 100
	if mp.FreeMB < minRequiredSpaceMB {
		return NewStorageErrorWithDetails(
			ErrCodeInsufficientSpace,
			"insufficient free space",
			path,
			map[string]interface{}{
				"available_mb": mp.FreeMB,
				"required_mb":  minRequiredSpaceMB,
			},
		)
	}

	return nil
}

// upsertSetting creates or updates a global setting.
func (s *StorageConfigService) upsertSetting(
	ctx context.Context,
	key string,
	value map[string]interface{},
	valueType globalsettings.ValueType,
	description string,
) error {
	// Check if setting exists
	existing, err := s.client.GlobalSettings.Query().
		Where(
			globalsettings.NamespaceEQ(StorageNamespace),
			globalsettings.KeyEQ(key),
		).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return fmt.Errorf("failed to query existing setting: %w", err)
	}

	// Serialize value to JSON
	valueBytes, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to serialize value: %w", err)
	}

	var valueMap map[string]interface{}
	if unmarErr := json.Unmarshal(valueBytes, &valueMap); unmarErr != nil {
		return fmt.Errorf("failed to deserialize value: %w", unmarErr)
	}

	if existing != nil {
		// Update existing
		_, err = s.client.GlobalSettings.UpdateOneID(existing.ID).
			SetValue(valueMap).
			Save(ctx)
		return err
	}

	// Create new
	_, err = s.client.GlobalSettings.Create().
		SetID(ulid.Make().String()).
		SetNamespace(StorageNamespace).
		SetKey(key).
		SetValue(valueMap).
		SetValueType(valueType).
		SetDescription(description).
		SetEditable(true).
		SetRequiresRestart(false).
		SetSensitive(false).
		Save(ctx)

	return err
}
