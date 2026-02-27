// Package wifi provides WiFi interface provisioning for MikroTik routers.
//
// RouterOS API paths used:
//
//	/interface/wifi          — rename, enable/disable WiFi interfaces
//	/interface/wifi/security — security profile (WPA2/WPA3)
//	/interface/wifi/configuration — SSID, band, mode settings
//	/interface/bridge/port   — add wifi interface to LAN bridge
//	/interface/list/member   — add wifi WAN interface to WAN list
package wifi

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

const (
	wifiProvisioningComment = "nnc-provisioned-"
	defaultWiFiInterface    = "wifi1"
)

// Service provisions WiFi interfaces on MikroTik routers.
type Service struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	logger     *zap.SugaredLogger
}

// ServiceConfig holds configuration for Service.
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewService creates a new wifi provisioning Service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// AvailableBands tracks which WiFi bands the router supports.
type AvailableBands struct {
	Has2_4    bool
	Has5      bool
	Has5_2    bool
	Bands5GHz []string // e.g., ["wifi5", "wifi5-2"]
}

// ProvisionResult holds IDs of created WiFi resources.
type ProvisionResult struct {
	SecurityProfileIDs []string
	ConfigurationIDs   []string
	ProvisioningIDs    []string
	BridgePortIDs      []string
	InterfaceListIDs   []string
}

// DetectBands queries the router to detect available WiFi bands.
func (s *Service) DetectBands(ctx context.Context) (*AvailableBands, error) {
	cmd := router.Command{
		Path:   "/interface/wifi",
		Action: "print",
		Props:  []string{"name", "default-name", "band"},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		// No WiFi available or command unsupported — return empty bands.
		return &AvailableBands{}, fmt.Errorf("failed to detect WiFi bands: %w", err)
	}

	bands := &AvailableBands{}
	for _, iface := range result.Data {
		defaultName := iface["default-name"]
		switch defaultName {
		case defaultWiFiInterface:
			bands.Has5 = true
			bands.Bands5GHz = append(bands.Bands5GHz, "wifi5")
		case "wifi2":
			bands.Has2_4 = true
		case "wifi3":
			bands.Has5_2 = true
			bands.Bands5GHz = append(bands.Bands5GHz, "wifi5-2")
		}
	}

	// Single-band routers: if only one interface found, it is 2.4 GHz.
	if len(result.Data) == 1 {
		bands.Has2_4 = true
		bands.Has5 = false
		bands.Bands5GHz = nil
	}

	return bands, nil
}

// RenameInterfaces renames default WiFi interface names to NasNet conventions.
func (s *Service) RenameInterfaces(ctx context.Context, bands *AvailableBands, comment string) error {
	totalBands := 0
	if bands.Has2_4 {
		totalBands++
	}
	totalBands += len(bands.Bands5GHz)

	if bands.Has2_4 {
		defaultName := "wifi2"
		if totalBands == 1 {
			defaultName = defaultWiFiInterface
		}
		if err := s.setWifiInterface(ctx, defaultName, "wifi2.4", comment); err != nil {
			return err
		}
	}
	if bands.Has5 {
		if err := s.setWifiInterface(ctx, defaultWiFiInterface, "wifi5", comment); err != nil {
			return err
		}
	}
	if bands.Has5_2 {
		if err := s.setWifiInterface(ctx, "wifi3", "wifi5-2", comment); err != nil {
			return err
		}
	}
	return nil
}

// setWifiInterface renames a WiFi interface by its default-name.
func (s *Service) setWifiInterface(ctx context.Context, defaultName, newName, comment string) error {
	cmd := router.Command{
		Path:   "/interface/wifi",
		Action: "set",
		Args: map[string]string{
			"numbers":  fmt.Sprintf("[find default-name=%s]", defaultName),
			"name":     newName,
			"disabled": "no",
			"comment":  comment,
		},
	}
	_, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to set WiFi interface: %w", err)
	}
	return nil
}

// ProvisionMasterAP configures a WiFi interface as a master AP.
func (s *Service) ProvisionMasterAP(ctx context.Context, sessionID, band string, wifiCfg types.WirelessConfig, bands *AvailableBands) (*ProvisionResult, error) {
	comment := wifiProvisioningComment + sessionID
	result := &ProvisionResult{}

	ifName := bandToInterfaceName(band, bands)

	// 1. Create security profile.
	secProfileName := fmt.Sprintf("sec-%s-%s", wifiCfg.SSID, band)
	secID, err := s.createSecurityProfile(ctx, secProfileName, wifiCfg.Password, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create security profile: %w", err)
	}
	result.SecurityProfileIDs = append(result.SecurityProfileIDs, secID)

	// 2. Create configuration.
	configName := fmt.Sprintf("cfg-%s-%s", wifiCfg.SSID, band)
	ssid := wifiCfg.SSID
	if wifiCfg.SplitBand {
		ssid = fmt.Sprintf("%s-%s", wifiCfg.SSID, band)
	}
	cfgID, err := s.createConfiguration(ctx, configName, ssid, secProfileName, comment, wifiCfg.IsHide)
	if err != nil {
		return nil, fmt.Errorf("failed to create configuration: %w", err)
	}
	result.ConfigurationIDs = append(result.ConfigurationIDs, cfgID)

	// 3. Set master interface to use this configuration.
	setCmd := router.Command{
		Path:   "/interface/wifi",
		Action: "set",
		Args: map[string]string{
			"numbers":       ifName,
			"configuration": configName,
			"security":      secProfileName,
			"disabled":      "no",
			"comment":       comment,
		},
	}
	if _, err := s.routerPort.ExecuteCommand(ctx, setCmd); err != nil {
		return nil, fmt.Errorf("failed to set master AP: %w", err)
	}

	s.logger.Infow("master AP provisioned", "interface", ifName, "ssid", ssid, "band", band)
	return result, nil
}

// ProvisionSlaveSSID creates an additional SSID as a slave interface.
func (s *Service) ProvisionSlaveSSID(ctx context.Context, sessionID, band, masterIF string, wifiCfg types.WirelessConfig, bands *AvailableBands) (*ProvisionResult, error) {
	comment := wifiProvisioningComment + sessionID
	result := &ProvisionResult{}

	// 1. Create security profile.
	secProfileName := fmt.Sprintf("sec-%s-%s-slave", wifiCfg.SSID, band)
	secID, err := s.createSecurityProfile(ctx, secProfileName, wifiCfg.Password, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create slave security profile: %w", err)
	}
	result.SecurityProfileIDs = append(result.SecurityProfileIDs, secID)

	// 2. Create configuration.
	configName := fmt.Sprintf("cfg-%s-%s-slave", wifiCfg.SSID, band)
	ssid := wifiCfg.SSID
	if wifiCfg.SplitBand {
		ssid = fmt.Sprintf("%s-%s", wifiCfg.SSID, band)
	}
	cfgID, err := s.createConfiguration(ctx, configName, ssid, secProfileName, comment, wifiCfg.IsHide)
	if err != nil {
		return nil, fmt.Errorf("failed to create slave configuration: %w", err)
	}
	result.ConfigurationIDs = append(result.ConfigurationIDs, cfgID)

	// 3. Add slave interface.
	slaveName := fmt.Sprintf("%s-%s", masterIF, wifiCfg.SSID)
	addCmd := router.Command{
		Path:   "/interface/wifi",
		Action: "add",
		Args: map[string]string{
			"name":             slaveName,
			"master-interface": masterIF,
			"configuration":    configName,
			"security":         secProfileName,
			"disabled":         "no",
			"comment":          comment,
		},
	}
	if _, err := s.routerPort.ExecuteCommand(ctx, addCmd); err != nil {
		return nil, fmt.Errorf("failed to add slave interface: %w", err)
	}

	s.logger.Infow("slave SSID provisioned", "slave", slaveName, "master", masterIF, "band", band)
	return result, nil
}

// AddToBridge adds a WiFi interface to a bridge.
func (s *Service) AddToBridge(ctx context.Context, ifName, bridgeName, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args: map[string]string{
			"interface": ifName,
			"bridge":    bridgeName,
			"comment":   comment,
		},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add WiFi interface to bridge: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("bridge port add failed: %w", result.Error)
	}
	return result.ID, nil
}

// AddToInterfaceList adds a WiFi interface to a named interface list.
func (s *Service) AddToInterfaceList(ctx context.Context, ifName, listName, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/list/member",
		Action: "add",
		Args: map[string]string{
			"interface": ifName,
			"list":      listName,
			"comment":   comment,
		},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add WiFi interface to list: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("interface list add failed: %w", result.Error)
	}
	return result.ID, nil
}

// Remove cleans up all WiFi resources tagged with the given session comment.
func (s *Service) Remove(ctx context.Context, sessionID string) error {
	comment := wifiProvisioningComment + sessionID

	paths := []string{
		"/interface/bridge/port",
		"/interface/list/member",
		"/interface/wifi",
		"/interface/wifi/configuration",
		"/interface/wifi/security",
	}

	for _, path := range paths {
		if err := s.removeByComment(ctx, path, comment); err != nil {
			s.logger.Warnw("failed to remove wifi resources", "path", path, "error", err)
		}
	}

	s.logger.Infow("wifi resources removed", "sessionID", sessionID)
	return nil
}

// createSecurityProfile adds a /interface/wifi/security entry.
func (s *Service) createSecurityProfile(ctx context.Context, name, passphrase, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/wifi/security",
		Action: "add",
		Args: map[string]string{
			"name":                 name,
			"authentication-types": "wpa2-psk,wpa3-psk",
			"passphrase":           passphrase,
			"comment":              comment,
		},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create WiFi security profile: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("security profile failed: %w", result.Error)
	}
	return result.ID, nil
}

// createConfiguration adds a /interface/wifi/configuration entry.
func (s *Service) createConfiguration(ctx context.Context, name, ssid, secProfile, comment string, isHide bool) (string, error) {
	hideSSID := "no"
	if isHide {
		hideSSID = "yes"
	}
	cmd := router.Command{
		Path:   "/interface/wifi/configuration",
		Action: "add",
		Args: map[string]string{
			"name":      name,
			"ssid":      ssid,
			"security":  secProfile,
			"hide-ssid": hideSSID,
			"comment":   comment,
		},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute create configuration command: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("configuration failed: %w", result.Error)
	}
	return result.ID, nil
}

// removeByComment removes all resources at the given path with a matching comment.
func (s *Service) removeByComment(ctx context.Context, path, comment string) error {
	queryCmd := router.Command{
		Path:   path,
		Action: "print",
	}

	queryResult, err := s.routerPort.ExecuteCommand(ctx, queryCmd)
	if err != nil {
		return fmt.Errorf("failed to query resources at %s: %w", path, err)
	}

	if !queryResult.Success {
		return fmt.Errorf("query at %s failed: %w", path, queryResult.Error)
	}

	for _, item := range queryResult.Data {
		if itemComment, ok := item["comment"]; ok && itemComment == comment {
			if id, hasID := item[".id"]; hasID {
				removeCmd := router.Command{
					Path:   path,
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}
				if _, removeErr := s.routerPort.ExecuteCommand(ctx, removeCmd); removeErr != nil {
					s.logger.Warnw("failed to remove resource", "path", path, "id", id, "error", removeErr)
				}
			}
		}
	}

	return nil
}

// bandToInterfaceName maps a band string to a WiFi interface name.
func bandToInterfaceName(band string, _ *AvailableBands) string {
	switch band {
	case "2.4":
		return "wifi2.4"
	case "5":
		return "wifi5"
	case "5-2":
		return "wifi5-2"
	default:
		return defaultWiFiInterface
	}
}
