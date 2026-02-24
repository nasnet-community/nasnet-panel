package isolation

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"backend/generated/ent"

	"go.uber.org/zap"
)

// ConfigValidatorAdapter adapts ConfigBindingValidator to the ConfigBindingValidatorPort interface
// required by IsolationVerifier. It reads config files from disk and validates IP bindings.
type ConfigValidatorAdapter struct {
	validator *ConfigBindingValidator
	logger    *zap.Logger
}

// NewConfigValidatorAdapter creates a new adapter with constructor injection
func NewConfigValidatorAdapter(logger *zap.Logger) *ConfigValidatorAdapter {
	return &ConfigValidatorAdapter{
		validator: NewConfigBindingValidator(),
		logger:    logger,
	}
}

// ValidateBinding implements ConfigBindingValidatorPort.ValidateBinding
// It reads the config file, parses it based on service type, and validates bind IPs
func (a *ConfigValidatorAdapter) ValidateBinding(ctx context.Context, instance *ent.ServiceInstance) (string, error) {
	if instance == nil {
		return "", fmt.Errorf("instance is nil")
	}

	// Check if service type is supported
	featureID := instance.FeatureID
	if !a.isSupportedServiceType(featureID) {
		return "", fmt.Errorf("unsupported service type: %s", featureID)
	}

	// Resolve config file path
	configPath, err := a.resolveConfigPath(instance)
	if err != nil {
		return "", fmt.Errorf("failed to resolve config path: %w", err)
	}

	// Read config file content
	configContent, err := os.ReadFile(configPath)
	if err != nil {
		return "", fmt.Errorf("failed to read config file %s: %w", configPath, err)
	}

	// Extract and validate bind IPs using ConfigBindingValidator
	bindIPs, err := a.validator.ExtractBindIPs(featureID, string(configContent))
	if err != nil {
		a.logger.Error("bind IP validation failed",
			zap.String("instance_id", instance.ID),
			zap.String("feature_id", featureID),
			zap.String("config_path", configPath),
			zap.Error(err))
		return "", err
	}

	// Ensure at least one bind IP was found
	if len(bindIPs) == 0 {
		return "", fmt.Errorf("no bind IPs found in config file %s", configPath)
	}

	// For services with multiple bind IPs, return the first one
	// (Most services only have one bind IP, but Tor can have SOCKSPort + ControlPort)
	bindIP := bindIPs[0]

	a.logger.Debug("bind IP validation succeeded",
		zap.String("instance_id", instance.ID),
		zap.String("feature_id", featureID),
		zap.String("bind_ip", bindIP),
		zap.Int("total_bind_ips", len(bindIPs)))

	return bindIP, nil
}

// resolveConfigPath determines the config file path based on service instance
// Priority:
// 1. Derive from instance.BinaryPath (replace /bin/<binary> with /config/<config-file>)
// 2. Standard location: /data/services/<instance-id>/config/<service-specific-config>
func (a *ConfigValidatorAdapter) resolveConfigPath(instance *ent.ServiceInstance) (string, error) {
	// Priority 1: Derive from BinaryPath if available
	if instance.BinaryPath != "" {
		derivedPath := a.deriveConfigFromBinaryPath(instance.BinaryPath, instance.FeatureID)
		if derivedPath != "" {
			if _, err := os.Stat(derivedPath); err == nil {
				return derivedPath, nil
			}
		}
	}

	// Priority 2: Standard location
	standardPath := a.getStandardConfigPath(instance)
	if _, err := os.Stat(standardPath); err == nil {
		return standardPath, nil
	}

	return "", fmt.Errorf("config file not found (checked derived path from BinaryPath and standard location)")
}

// deriveConfigFromBinaryPath derives config path from binary path
// Example: /data/services/inst-123/bin/tor -> /data/services/inst-123/config/torrc
func (a *ConfigValidatorAdapter) deriveConfigFromBinaryPath(binaryPath, serviceType string) string {
	dir := filepath.Dir(binaryPath)
	baseDir := filepath.Dir(dir) // Up one level from bin/

	configFileName := a.getConfigFileName(serviceType)
	return filepath.Join(baseDir, "config", configFileName)
}

// getStandardConfigPath returns the standard config path for a service instance
// Format: /data/services/<instance-id>/config/<config-file>
func (a *ConfigValidatorAdapter) getStandardConfigPath(instance *ent.ServiceInstance) string {
	configFileName := a.getConfigFileName(instance.FeatureID)
	return filepath.Join("/data", "services", instance.ID, "config", configFileName) //nolint:gocritic // filepath.Join handles path separators correctly, individual segments are intentional
}

// getConfigFileName returns the config file name for a given service type
func (a *ConfigValidatorAdapter) getConfigFileName(serviceType string) string {
	switch serviceType {
	case "tor":
		return "torrc"
	case "sing-box":
		return "config.json"
	case "xray-core":
		return "config.json"
	case "mtproxy":
		return "mtproxy.conf"
	case "adguard-home":
		return "AdGuardHome.yaml"
	case "psiphon":
		return "psiphon.config"
	default:
		return "config.conf"
	}
}

// isSupportedServiceType checks if a service type is supported by ConfigBindingValidator
func (a *ConfigValidatorAdapter) isSupportedServiceType(serviceType string) bool {
	supportedTypes := []string{
		"tor",
		"sing-box",
		"xray-core",
		"mtproxy",
		"adguard-home",
		"psiphon",
	}

	for _, t := range supportedTypes {
		if t == serviceType {
			return true
		}
	}
	return false
}
