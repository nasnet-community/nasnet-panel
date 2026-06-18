package routeros

import (
	"fmt"
	"strconv"
	"strings"
)

type SystemInfo struct {
	Identity      string
	Architecture  string
	BoardName     string
	Version       string
	BuildTime     string
	License       string
	UpdateChannel string
	UpTime        string
	CPUCount      int
	CPULoad       int
	CPUFrequency  string
	MemoryTotal   int64
	MemoryUsed    int64
	MemoryFree    int64
	HDDTotal      int64
	HDDFree       int64
	BadBlocks     string
}

type ResourceInfo struct {
	UpTime       string
	CPUCount     int
	CPULoad      int
	CPUFrequency string
	MemoryTotal  int64
	MemoryUsed   int64
	MemoryFree   int64
	HDDTotal     int64
	HDDFree      int64
	Version      string
	Architecture string
	BoardName    string
	BadBlocks    string
}

type Identity struct {
	Name string
}

type NTPConfig struct {
	Enabled bool
	Servers []string
	Mode    string // broadcast, manycast, unicast
	Comment string
}

type LogConfig struct {
	Disabled bool
	Topics   string // all, accounts, critical, debug, etc.
	Action   string // memory, disk, echo, send-to-ipv4, send-to-ipv6
	Target   string
	Comment  string
}

type ClockInfo struct {
	Date      string
	Time      string
	TimeZone  string
	DstActive bool
	GmtOffset string
}

type LicenseInfo struct {
	Level           string // License level (e.g., "p-unlimited", "p-60")
	SystemID        string // System identifier
	SoftwareID      string // Software identifier
	DeadlineAt      string // License deadline (timestamp)
	NextRenewalAt   string // Next renewal date (timestamp)
	LimitedUpgrades bool   // Limited upgrades allowed
}

type LogSetting struct {
	ID       string
	Disabled bool
	Topics   string
	Action   string
	Target   string
	Comment  string
}

type StorageInfo struct {
	ID        string
	Name      string
	Type      string
	MediaType string
	Size      int64
	Free      int64
	Bad       int64
	Comment   string
}

type PackageInfo struct {
	ID           string
	Name         string
	Version      string
	BuildTime    string
	Architecture string
	Available    bool
	Disabled     bool
	Installed    bool
}

type UpdateInfo struct {
	Channel          string
	InstalledVersion string
	LatestVersion    string
	Status           string
}

// UpdateCheckInfo represents package update check details.
type UpdateCheckInfo struct {
	Channel          string
	InstalledVersion string
	LatestVersion    string
	Status           string
	UpdateAvailable  bool
}

// UpdateInstallResult represents the result of package installation.
type UpdateInstallResult struct {
	Success          bool
	Message          string
	InstalledVersion string
	LatestVersion    string
}

func (c *Client) GetSystemIdentity() (*Identity, error) {
	result, err := c.GetFirst("/system/identity")
	if err != nil {
		return nil, fmt.Errorf("failed to get system identity: %w", err)
	}

	return &Identity{
		Name: result["name"],
	}, nil
}

func (c *Client) SetSystemIdentity(name string) error {
	_, err := c.conn.Run("/system/identity/set", "=name="+name)
	if err != nil {
		return fmt.Errorf("failed to set system identity: %w", err)
	}

	return nil
}

func (c *Client) ChangeUserPassword(username string, newPassword string) error {
	user, err := c.GetFirst("/user", "?name="+username)
	if err != nil {
		return fmt.Errorf("failed to find user %s: %w", username, err)
	}

	userID := user[".id"]
	if userID == "" {
		return fmt.Errorf("user %s not found", username)
	}

	_, err = c.Set("/user", "=.id="+userID, "=password="+newPassword)
	if err != nil {
		return fmt.Errorf("failed to change user password: %w", err)
	}

	return nil
}

func (c *Client) GetSystemInfo() (*SystemInfo, error) {
	resource, err := c.GetFirst("/system/resource")
	if err != nil {
		return nil, fmt.Errorf("failed to get system info: %w", err)
	}

	identity, err := c.GetSystemIdentity()
	if err != nil {
		return nil, fmt.Errorf("failed to get system info: %w", err)
	}

	license, err := c.GetLicenseInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to get system info: %w", err)
	}

	updateChannel := ""
	if update, err := c.GetFirst("/system/package/update"); err == nil {
		updateChannel = update["channel"]
	}

	cpuCount, _ := strconv.Atoi(resource["cpu-count"])
	cpuLoad, _ := strconv.Atoi(resource["cpu-load"])
	memTotal, _ := strconv.ParseInt(resource["total-memory"], 10, 64)
	freeMemory, _ := strconv.ParseInt(resource["free-memory"], 10, 64)
	hddTotal, _ := strconv.ParseInt(resource["total-hdd-space"], 10, 64)
	hddFree, _ := strconv.ParseInt(resource["free-hdd-space"], 10, 64)

	memUsed := memTotal - freeMemory
	if memUsed < 0 {
		memUsed = 0
	}

	return &SystemInfo{
		Identity:      identity.Name,
		Architecture:  resource["architecture-name"],
		BoardName:     resource["board-name"],
		Version:       resource["version"],
		BuildTime:     resource["build-time"],
		License:       license.Level,
		UpdateChannel: updateChannel,
		UpTime:        resource["uptime"],
		CPUCount:      cpuCount,
		CPULoad:       cpuLoad,
		CPUFrequency:  resource["cpu-frequency"],
		MemoryTotal:   memTotal,
		MemoryUsed:    memUsed,
		MemoryFree:    freeMemory,
		HDDTotal:      hddTotal,
		HDDFree:       hddFree,
		BadBlocks:     resource["bad-blocks"],
	}, nil
}

func (c *Client) GetResourceInfo() (*ResourceInfo, error) {
	result, err := c.GetFirst("/system/resource")
	if err != nil {
		return nil, fmt.Errorf("failed to get resource info: %w", err)
	}

	cpuCount, _ := strconv.Atoi(result["cpu-count"])
	cpuLoad, _ := strconv.Atoi(result["cpu-load"])
	memTotal, _ := strconv.ParseInt(result["total-memory"], 10, 64)
	freeMemory, _ := strconv.ParseInt(result["free-memory"], 10, 64)
	hddTotal, _ := strconv.ParseInt(result["total-hdd-space"], 10, 64)
	hddFree, _ := strconv.ParseInt(result["free-hdd-space"], 10, 64)

	memUsed := memTotal - freeMemory
	if memUsed < 0 {
		memUsed = 0
	}

	return &ResourceInfo{
		UpTime:       result["uptime"],
		CPUCount:     cpuCount,
		CPULoad:      cpuLoad,
		CPUFrequency: result["cpu-frequency"],
		MemoryTotal:  memTotal,
		MemoryUsed:   memUsed,
		MemoryFree:   freeMemory,
		HDDTotal:     hddTotal,
		HDDFree:      hddFree,
		BadBlocks:    result["bad-blocks"],
		Version:      result["version"],
		Architecture: result["architecture-name"],
		BoardName:    result["board-name"],
	}, nil
}

func (c *Client) GetNTPConfig() (*NTPConfig, error) {
	result, err := c.GetFirst("/system/ntp/client")
	if err != nil {
		return nil, fmt.Errorf("failed to get NTP config: %w", err)
	}

	return &NTPConfig{
		Enabled: parseRouterOSBool(result["enabled"]),
		Mode:    result["mode"],
		Comment: result["comment"],
	}, nil
}

func (c *Client) SetNTPConfig(config NTPConfig) error {
	args := []string{}

	if config.Enabled {
		args = append(args, "enabled=yes")
	} else {
		args = append(args, "enabled=no")
	}

	if config.Mode != "" {
		args = append(args, "mode="+config.Mode)
	}

	if len(config.Servers) > 0 {
		servers := ""
		for i, srv := range config.Servers {
			if i > 0 {
				servers += ","
			}
			servers += srv
		}
		args = append(args, "servers="+servers)
	}

	_, err := c.Set("/system/ntp/client", args...)
	if err != nil {
		return fmt.Errorf("failed to set NTP config: %w", err)
	}

	return nil
}

func (c *Client) GetClockInfo() (*ClockInfo, error) {
	result, err := c.GetFirst("/system/clock")
	if err != nil {
		return nil, fmt.Errorf("failed to get clock info: %w", err)
	}

	return &ClockInfo{
		Date:      result["date"],
		Time:      result["time"],
		TimeZone:  result["time-zone-name"],
		DstActive: parseRouterOSBool(result["dst-active"]),
		GmtOffset: result["gmt-offset"],
	}, nil
}

func (c *Client) SetSystemClock(date string, time string) error {
	_, err := c.Set("/system/clock", "date="+date, "time="+time)
	if err != nil {
		return fmt.Errorf("failed to set system clock: %w", err)
	}

	return nil
}

func (c *Client) RebootSystem() error {
	_, err := c.Execute("/system/reboot")
	if err != nil {
		return fmt.Errorf("failed to reboot: %w", err)
	}

	return nil
}

func (c *Client) ShutdownSystem() error {
	_, err := c.Execute("/system/shutdown")
	if err != nil {
		return fmt.Errorf("failed to shutdown: %w", err)
	}

	return nil
}

// ResetConfiguration resets the RouterOS configuration.
// If noDefaults is true, configuration is reset without loading defaults.
// runAfterReset specifies a script file to run after reset (e.g., "wizard.rsc").
func (c *Client) ResetConfiguration(noDefaults bool, runAfterReset string) error {
	args := []string{}

	if noDefaults {
		args = append(args, "=no-defaults=yes")
	}

	if runAfterReset != "" {
		args = append(args, "=run-after-reset="+runAfterReset)
	}

	_, err := c.Execute("/system/reset-configuration", args...)
	if err != nil {
		return fmt.Errorf("failed to reset configuration: %w", err)
	}

	return nil
}

func (c *Client) GetLicenseInfo() (*LicenseInfo, error) {
	result, err := c.GetFirst("/system/license")
	if err != nil {
		return nil, fmt.Errorf("failed to get license info: %w", err)
	}

	return &LicenseInfo{
		Level:           firstNonEmpty(result["level"], result["nlevel"]),
		SystemID:        result["system-id"],
		SoftwareID:      result["software-id"],
		DeadlineAt:      result["deadline-at"],
		NextRenewalAt:   result["next-renewal-at"],
		LimitedUpgrades: parseRouterOSBool(result["limited-upgrades"]),
	}, nil
}

// GetSystemID retrieves the system ID or software ID from the license information.
// Returns the system-id if available, otherwise returns the software-id.
// Returns an error if neither system-id nor software-id is available.
func (c *Client) GetSystemID() (string, error) {
	license, err := c.GetLicenseInfo()
	if err != nil {
		return "", fmt.Errorf("failed to get license info: %w", err)
	}

	if license.SystemID != "" {
		return license.SystemID, nil
	}

	if license.SoftwareID != "" {
		return license.SoftwareID, nil
	}

	return "", fmt.Errorf("neither system-id nor software-id is available in license info")
}

func (c *Client) ListLogSettings() ([]LogSetting, error) {
	results, err := c.GetAll("/system/logging")
	if err != nil {
		return nil, fmt.Errorf("failed to list log settings: %w", err)
	}

	var settings []LogSetting
	for _, result := range results {
		settings = append(settings, LogSetting{
			ID:       result[".id"],
			Disabled: parseRouterOSBool(result["disabled"]),
			Topics:   result["topics"],
			Action:   result["action"],
			Target:   result["target"],
			Comment:  result["comment"],
		})
	}

	return settings, nil
}

func (c *Client) AddLogSetting(config LogConfig) (string, error) {
	args := []string{
		"topics=" + config.Topics,
		"action=" + config.Action,
	}

	if config.Target != "" {
		args = append(args, "target="+config.Target)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	id, err := c.Add("/system/logging", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add log setting: %w", err)
	}

	return id, nil
}

func (c *Client) RemoveLogSetting(id string) error {
	_, err := c.Remove("/system/logging", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove log setting: %w", err)
	}

	return nil
}

func (c *Client) GetHDD() ([]StorageInfo, error) {
	results, err := c.GetAll("/system/storage")
	if err != nil {
		return nil, fmt.Errorf("failed to get storage info: %w", err)
	}

	var storages []StorageInfo
	for _, result := range results {
		size, _ := strconv.ParseInt(result["total-size"], 10, 64)
		free, _ := strconv.ParseInt(result["free-size"], 10, 64)
		bad, _ := strconv.ParseInt(result["bad-size"], 10, 64)

		storages = append(storages, StorageInfo{
			ID:        result[".id"],
			Name:      result["name"],
			Type:      result["type"],
			MediaType: result["media-type"],
			Size:      size,
			Free:      free,
			Bad:       bad,
			Comment:   result["comment"],
		})
	}

	return storages, nil
}

func (c *Client) ListPackages() ([]PackageInfo, error) {
	results, err := c.GetAll("/system/package")
	if err != nil {
		return nil, fmt.Errorf("failed to list packages: %w", err)
	}

	var packages []PackageInfo
	for _, result := range results {
		packages = append(packages, PackageInfo{
			ID:           result[".id"],
			Name:         result["name"],
			Version:      result["version"],
			BuildTime:    result["build-time"],
			Architecture: result["architecture"],
			Available:    parseRouterOSBool(result["available"]),
			Disabled:     parseRouterOSBool(result["disabled"]),
			Installed:    !parseRouterOSBool(result["disabled"]),
		})
	}

	return packages, nil
}

func (c *Client) GetSystemUpdates() (*UpdateInfo, error) {
	result, err := c.GetFirst("/system/package/update")
	if err != nil {
		return nil, fmt.Errorf("failed to get update info: %w", err)
	}

	return &UpdateInfo{
		Channel:          result["channel"],
		InstalledVersion: result["installed-version"],
		LatestVersion:    result["latest-version"],
		Status:           result["status"],
	}, nil
}

func parseRouterOSBool(value string) bool {
	switch strings.ToLower(value) {
	case "true", "yes", "on", "enabled":
		return true
	default:
		return false
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

// CheckForUpdates checks if a new package version is available.
func (c *Client) CheckForUpdates() (*UpdateCheckInfo, error) {
	_, err := c.Execute("/system/package/update/check-for-updates")
	if err != nil {
		return nil, fmt.Errorf("failed to check for updates: %w", err)
	}

	result, err := c.GetFirst("/system/package/update")
	if err != nil {
		return nil, fmt.Errorf("failed to get update status: %w", err)
	}

	latestVersion := result["latest-version"]
	installedVersion := result["installed-version"]
	status := result["status"]
	updateAvailable := latestVersion != "" && latestVersion != installedVersion && status == "New version is available"

	return &UpdateCheckInfo{
		Channel:          result["channel"],
		InstalledVersion: installedVersion,
		LatestVersion:    latestVersion,
		Status:           status,
		UpdateAvailable:  updateAvailable,
	}, nil
}

// InstallUpdate installs the latest package update.
func (c *Client) InstallUpdate() (*UpdateInstallResult, error) {
	// First check if update is available
	checkResult, err := c.CheckForUpdates()
	if err != nil {
		return &UpdateInstallResult{
			Success: false,
			Message: "Failed to check for updates before installation",
		}, err
	}

	if !checkResult.UpdateAvailable {
		return &UpdateInstallResult{
			Success:          false,
			Message:          checkResult.Status,
			InstalledVersion: checkResult.InstalledVersion,
			LatestVersion:    checkResult.LatestVersion,
		}, nil
	}

	// Proceed with installation
	_, err = c.conn.Run("/system/package/update/install")
	if err != nil {
		return &UpdateInstallResult{
			Success:          false,
			Message:          fmt.Sprintf("Failed to install update: %v", err),
			InstalledVersion: checkResult.InstalledVersion,
			LatestVersion:    checkResult.LatestVersion,
		}, err
	}

	return &UpdateInstallResult{
		Success:          true,
		Message:          "Firmware update installation initiated",
		InstalledVersion: checkResult.InstalledVersion,
		LatestVersion:    checkResult.LatestVersion,
	}, nil
}
