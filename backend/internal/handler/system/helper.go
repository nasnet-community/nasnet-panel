package system

import (
	"fmt"
	"log"
	"net"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

func (s *systemUpdateState) tryBegin(host, from, to string) (bool, systemUpdatePhase) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if entry, ok := s.entries[host]; ok &&
		(entry.phase == systemUpdatePhaseDownloading || entry.phase == systemUpdatePhaseRebooting) {
		return false, entry.phase
	}

	s.entries[host] = &systemUpdateEntry{
		phase:       systemUpdatePhaseDownloading,
		message:     "downloading and installing the update",
		fromVersion: from,
		toVersion:   to,
		startedAt:   time.Now(),
	}
	return true, systemUpdatePhaseDownloading
}

func (s *systemUpdateState) set(host string, phase systemUpdatePhase, message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if entry, ok := s.entries[host]; ok {
		entry.phase = phase
		entry.message = message
	}
}

func (s *systemUpdateState) inProgress(host string) (bool, systemUpdatePhase) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entry, ok := s.entries[host]
	if !ok {
		return false, systemUpdatePhaseIdle
	}
	busy := entry.phase == systemUpdatePhaseDownloading || entry.phase == systemUpdatePhaseRebooting
	return busy, entry.phase
}

func (s *systemUpdateState) snapshot(host string) SystemUpdateStatusResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entry, ok := s.entries[host]
	if !ok {
		return SystemUpdateStatusResponse{Phase: string(systemUpdatePhaseIdle)}
	}
	return SystemUpdateStatusResponse{
		Phase:       string(entry.phase),
		Message:     entry.message,
		FromVersion: entry.fromVersion,
		ToVersion:   entry.toVersion,
		StartedAt:   entry.startedAt.Format(time.RFC3339),
	}
}

func beginBackup(host string) (conflict string) {
	backupOpGuard.Lock()
	defer backupOpGuard.Unlock()
	if _, restoring := restoresInProgress.Load(host); restoring {
		return "restore"
	}
	if _, deleting := deletesInProgress.Load(host); deleting {
		return "delete"
	}
	if _, busy := backupsInProgress.LoadOrStore(host, struct{}{}); busy {
		return "backup"
	}
	return ""
}

func beginRestore(host string) (conflict string) {
	backupOpGuard.Lock()
	defer backupOpGuard.Unlock()
	if _, busy := backupsInProgress.Load(host); busy {
		return "backup"
	}
	if _, deleting := deletesInProgress.Load(host); deleting {
		return "delete"
	}
	if _, busy := restoresInProgress.LoadOrStore(host, struct{}{}); busy {
		return "restore"
	}
	return ""
}

func beginDelete(host string) (conflict string) {
	backupOpGuard.Lock()
	defer backupOpGuard.Unlock()
	if _, busy := backupsInProgress.Load(host); busy {
		return "backup"
	}
	if _, busy := restoresInProgress.Load(host); busy {
		return "restore"
	}
	if _, busy := deletesInProgress.LoadOrStore(host, struct{}{}); busy {
		return "delete"
	}
	return ""
}

// watchSystemUpdate starts the package installation and follows it until the router reports the
// target version again. It runs detached from the request that started it, because RouterOS
// reboots during the update and the connection of that request is lost.
func watchSystemUpdate(config routeros.ConnectionConfig, client *routeros.Client, toVersion string) {
	host := config.Address
	startedAt := time.Now()

	installResult := make(chan error, 1)
	go func() {
		installResult <- client.StartPackageUpdateInstall()
	}()

	var installErr error
	sawOffline := false
	var poller *routeros.Client
	defer func() {
		if poller != nil {
			_ = poller.Close()
		}
	}()

	ticker := time.NewTicker(systemUpdatePollInterval)
	defer ticker.Stop()
	timeout := time.NewTimer(systemUpdateTimeout)
	defer timeout.Stop()

	for {
		select {
		case <-timeout.C:
			systemUpdates.set(host, systemUpdatePhaseError, "timed out waiting for the router to finish updating")
			return
		case installErr = <-installResult:
			installResult = nil
			systemUpdates.set(host, systemUpdatePhaseRebooting, "update installed, waiting for the router to reboot")
			continue
		case <-ticker.C:
		}

		if poller == nil {
			var err error
			if poller, err = routeros.NewClient(config); err != nil {
				poller = nil
				sawOffline = true
				systemUpdates.set(host, systemUpdatePhaseRebooting, "waiting for the router to come back")
				continue
			}
		}
		info, err := poller.GetUpdateStatus()
		if err != nil {
			_ = poller.Close()
			poller = nil
			sawOffline = true
			continue
		}

		if info.InstalledVersion == toVersion {
			systemUpdates.set(host, systemUpdatePhaseDone, "router updated to "+toVersion)
			return
		}
		if strings.Contains(strings.ToLower(info.Status), "download") {
			systemUpdates.set(host, systemUpdatePhaseDownloading, info.Status)
			continue
		}
		if installErr != nil && !sawOffline && time.Since(startedAt) > systemUpdateFailGrace {
			systemUpdates.set(host, systemUpdatePhaseError, installErr.Error())
			log.Printf("[system-update] install failed on %s: %v", host, installErr)
			return
		}
	}
}

func normalizeIPServiceAddress(address string) (string, error) {
	if strings.TrimSpace(address) == "" {
		return "", nil
	}

	parts := strings.Split(address, ",")
	cleaned := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if _, _, err := net.ParseCIDR(part); err != nil && net.ParseIP(part) == nil {
			return "", fmt.Errorf("invalid address %q: expected an IP or CIDR prefix", part)
		}
		cleaned = append(cleaned, part)
	}

	return strings.Join(cleaned, ","), nil
}

func isIPServiceEditable(service *routeros.IPServiceInfo) bool {
	return !service.Dynamic && !nonEditableIPServices[service.Name]
}

func isValidBackupFilename(name string) bool {
	return strings.HasSuffix(name, ".backup") && !strings.ContainsAny(name, `/\`) && !strings.Contains(name, "..")
}

// ToSystemInfoResponse converts RouterOS data to its API response form.
func ToSystemInfoResponse(si *routeros.SystemInfo) *SystemInfoResponse {
	if si == nil {
		return nil
	}

	return &SystemInfoResponse{
		Identity:         si.Identity,
		Architecture:     si.Architecture,
		BoardName:        si.BoardName,
		Version:          si.Version,
		BuildTime:        utils.FormatRouterOSTime(si.BuildTime),
		License:          si.License,
		UpdateChannel:    si.UpdateChannel,
		UpTime:           utils.FormatRouterOSDuration(si.UpTime),
		CPUCount:         si.CPUCount,
		CPULoad:          si.CPULoad,
		CPUFrequency:     si.CPUFrequency,
		MemoryTotal:      utils.BytesToSizeString(si.MemoryTotal),
		MemoryUsed:       utils.BytesToSizeString(si.MemoryUsed),
		MemoryFree:       utils.BytesToSizeString(si.MemoryFree),
		MemoryTotalBytes: si.MemoryTotal,
		MemoryUsedBytes:  si.MemoryUsed,
		MemoryFreeBytes:  si.MemoryFree,
		HDDTotal:         utils.BytesToSizeString(si.HDDTotal),
		HDDFree:          utils.BytesToSizeString(si.HDDFree),
		HDDTotalBytes:    si.HDDTotal,
		HDDFreeBytes:     si.HDDFree,
		BadBlocks:        si.BadBlocks,
		SystemID:         si.SystemID,
	}
}

// ToSystemIdentityResponse converts RouterOS data to its API response form.
func ToSystemIdentityResponse(id *routeros.Identity) *SystemIdentityResponse {
	if id == nil {
		return nil
	}

	return &SystemIdentityResponse{
		Name: id.Name,
	}
}

// ToBackupFileResponse converts a RouterOS FileInfo to API BackupFileResponse.
func ToBackupFileResponse(file *routeros.FileInfo) BackupFileResponse {
	return BackupFileResponse{
		Filename:  strings.TrimPrefix(file.Name, routeros.NasnetBackupsDir+"/"),
		Size:      utils.BytesToSizeString(file.Size),
		SizeBytes: file.Size,
		Date:      file.ModTime,
	}
}

// ToIPServiceResponse converts RouterOS data to its API response form.
func ToIPServiceResponse(service *routeros.IPServiceInfo) IPServiceResponse {
	return IPServiceResponse{
		ID:          service.ID,
		Name:        service.Name,
		Port:        service.Port,
		Proto:       service.Proto,
		Address:     service.Address,
		Certificate: service.Certificate,
		TLSVersion:  service.TLSVersion,
		VRF:         service.VRF,
		MaxSessions: service.MaxSessions,
		Local:       service.Local,
		Remote:      service.Remote,
		Container:   service.Container,
		Netns:       service.Netns,
		Connection:  service.Connection,
		Disabled:    service.Disabled,
		Dynamic:     service.Dynamic,
		Invalid:     service.Invalid,
		Editable:    isIPServiceEditable(service),
	}
}

// ToResourceInfoResponse converts RouterOS data to its API response form.
func ToResourceInfoResponse(ri *routeros.ResourceInfo) *ResourceInfoResponse {
	if ri == nil {
		return nil
	}

	return &ResourceInfoResponse{
		UpTime:           utils.FormatRouterOSDuration(ri.UpTime),
		CPUCount:         ri.CPUCount,
		CPULoad:          ri.CPULoad,
		CPUFrequency:     ri.CPUFrequency,
		MemoryTotal:      utils.BytesToSizeString(ri.MemoryTotal),
		MemoryUsed:       utils.BytesToSizeString(ri.MemoryUsed),
		MemoryFree:       utils.BytesToSizeString(ri.MemoryFree),
		MemoryTotalBytes: ri.MemoryTotal,
		MemoryUsedBytes:  ri.MemoryUsed,
		MemoryFreeBytes:  ri.MemoryFree,
		HDDTotal:         utils.BytesToSizeString(ri.HDDTotal),
		HDDFree:          utils.BytesToSizeString(ri.HDDFree),
		HDDTotalBytes:    ri.HDDTotal,
		HDDFreeBytes:     ri.HDDFree,
		BadBlocks:        ri.BadBlocks,
		Version:          ri.Version,
		Architecture:     ri.Architecture,
		BoardName:        ri.BoardName,
	}
}

// ToUpdateInfoResponse converts RouterOS data to its API response form.
func ToUpdateInfoResponse(ui *routeros.UpdateInfo) *UpdateInfoResponse {
	if ui == nil {
		return nil
	}

	return &UpdateInfoResponse{
		Channel:          ui.Channel,
		InstalledVersion: ui.InstalledVersion,
		LatestVersion:    ui.LatestVersion,
		Status:           ui.Status,
	}
}

// ToUpdateCheckResponse converts RouterOS data to its API response form.
func ToUpdateCheckResponse(uc *routeros.UpdateCheckInfo) *UpdateCheckResponse {
	if uc == nil {
		return nil
	}

	return &UpdateCheckResponse{
		Channel:          uc.Channel,
		InstalledVersion: uc.InstalledVersion,
		LatestVersion:    uc.LatestVersion,
		Status:           uc.Status,
		UpdateAvailable:  uc.UpdateAvailable,
	}
}

// ToUpdateInstallResponse converts RouterOS data to its API response form.
func ToUpdateInstallResponse(ui *routeros.UpdateInstallResult) *UpdateInstallResponse {
	if ui == nil {
		return nil
	}

	return &UpdateInstallResponse{
		Success:          ui.Success,
		Message:          ui.Message,
		InstalledVersion: ui.InstalledVersion,
		LatestVersion:    ui.LatestVersion,
	}
}

// ToSchedulerResponse converts RouterOS data to its API response form.
func ToSchedulerResponse(scheduler *routeros.SchedulerInfo) SchedulerResponse {
	return SchedulerResponse{
		Name:      scheduler.Name,
		Enabled:   !scheduler.Disabled,
		StartDate: routeros.FormatRouterOSTime(scheduler.StartDate),
		StartTime: scheduler.StartTime,
		Interval:  utils.FormatRouterOSDuration(scheduler.Interval),
		RunCount:  scheduler.RunCount,
		NextRun:   routeros.FormatRouterOSTime(scheduler.NextRun),
	}
}

func normalizeSchedulerStartTime(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == schedulerStartupKeyword {
		return value, nil
	}

	match := schedulerClockPattern.FindStringSubmatch(value)
	if match == nil {
		return "", fmt.Errorf("invalid startTime %q: expected HH:MM:SS or %q", value, schedulerStartupKeyword)
	}

	hours, _ := strconv.Atoi(match[1])
	minutes, _ := strconv.Atoi(match[2])
	seconds, _ := strconv.Atoi(match[3])
	if hours > 23 || minutes > 59 || seconds > 59 {
		return "", fmt.Errorf("invalid startTime %q: hours must be 0-23, minutes and seconds 0-59", value)
	}

	return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds), nil
}

func normalizeSchedulerInterval(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "", fmt.Errorf("invalid interval: value is empty")
	}

	if match := schedulerIntervalClock.FindStringSubmatch(value); match != nil {
		hours, _ := strconv.Atoi(match[2])
		minutes, _ := strconv.Atoi(match[3])
		seconds, _ := strconv.Atoi(match[4])
		if hours > 23 || minutes > 59 || seconds > 59 {
			return "", fmt.Errorf("invalid interval %q: hours must be 0-23, minutes and seconds 0-59", value)
		}

		clock := fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
		if match[1] == "" {
			return clock, nil
		}
		return match[1] + "d" + clock, nil
	}

	if schedulerIntervalLetterUnits.MatchString(value) {
		return value, nil
	}

	return "", fmt.Errorf("invalid interval %q: expected e.g. 1w2d, 1d12h30m, 10m, 1d 00:00:00 or HH:MM:SS", value)
}
