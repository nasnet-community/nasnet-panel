package system

import (
	"sync"
	"time"
)

type systemUpdatePhase string

type systemUpdateEntry struct {
	phase       systemUpdatePhase
	message     string
	fromVersion string
	toVersion   string
	startedAt   time.Time
}

type systemUpdateState struct {
	mu      sync.RWMutex
	entries map[string]*systemUpdateEntry
}

type SetSystemIdentityRequest struct {
	Name string `json:"name" form:"name"`
}

// RestoreBackupRequest names the backup file to restore from nasnet-panel/backups.
type RestoreBackupRequest struct {
	Filename string `json:"filename" form:"filename"`
}

type ChangeUserPasswordRequest struct {
	Username    string `json:"username" form:"username"`
	NewPassword string `json:"newPassword" form:"newPassword"`
}

type SystemInfoResponse struct {
	Identity         string `json:"identity"`
	Architecture     string `json:"architecture"`
	BoardName        string `json:"boardName"`
	Version          string `json:"version"`
	BuildTime        string `json:"buildTime"`
	License          string `json:"license"`
	UpdateChannel    string `json:"updateChannel"`
	UpTime           string `json:"uptime"`
	CPUCount         int    `json:"cpuCount"`
	CPULoad          int    `json:"cpuLoad"`
	CPUFrequency     string `json:"cpuFrequency"`
	MemoryTotal      string `json:"memoryTotal"`
	MemoryUsed       string `json:"memoryUsed"`
	MemoryFree       string `json:"memoryFree"`
	MemoryTotalBytes int64  `json:"memoryTotalBytes"`
	MemoryUsedBytes  int64  `json:"memoryUsedBytes"`
	MemoryFreeBytes  int64  `json:"memoryFreeBytes"`
	HDDTotal         string `json:"hddTotal"`
	HDDFree          string `json:"hddFree"`
	HDDTotalBytes    int64  `json:"hddTotalBytes"`
	HDDFreeBytes     int64  `json:"hddFreeBytes"`
	BadBlocks        string `json:"badBlocks"`
	SystemID         string `json:"systemId"`
}

type SystemIdentityResponse struct {
	Name string `json:"name"`
}

type ResourceInfoResponse struct {
	UpTime           string `json:"uptime"`
	CPUCount         int    `json:"cpuCount"`
	CPULoad          int    `json:"cpuLoad"`
	CPUFrequency     string `json:"cpuFrequency"`
	MemoryTotal      string `json:"memoryTotal"`
	MemoryUsed       string `json:"memoryUsed"`
	MemoryFree       string `json:"memoryFree"`
	MemoryTotalBytes int64  `json:"memoryTotalBytes"`
	MemoryUsedBytes  int64  `json:"memoryUsedBytes"`
	MemoryFreeBytes  int64  `json:"memoryFreeBytes"`
	HDDTotal         string `json:"hddTotal"`
	HDDFree          string `json:"hddFree"`
	HDDTotalBytes    int64  `json:"hddTotalBytes"`
	HDDFreeBytes     int64  `json:"hddFreeBytes"`
	BadBlocks        string `json:"badBlocks"`
	Version          string `json:"version"`
	Architecture     string `json:"architecture"`
	BoardName        string `json:"boardName"`
}

type UpdateInfoResponse struct {
	Channel          string `json:"channel"`
	InstalledVersion string `json:"installedVersion"`
	LatestVersion    string `json:"latestVersion"`
	Status           string `json:"status"`
}

// UpdateCheckResponse represents package update check response.
type UpdateCheckResponse struct {
	Channel          string `json:"channel"`
	InstalledVersion string `json:"installedVersion"`
	LatestVersion    string `json:"latestVersion"`
	Status           string `json:"status"`
	UpdateAvailable  bool   `json:"updateAvailable"`
}

// UpdateInstallResponse represents package update installation response.
type UpdateInstallResponse struct {
	Success          bool   `json:"success"`
	Message          string `json:"message"`
	InstalledVersion string `json:"installedVersion"`
	LatestVersion    string `json:"latestVersion"`
}

type ClockInfoResponse struct {
	Date      string `json:"date"`
	Time      string `json:"time"`
	TimeZone  string `json:"timeZone"`
	DstActive bool   `json:"dstActive"`
	GmtOffset string `json:"gmtOffset"`
}

// BackupFileResponse represents a router backup file in the API response.
type BackupFileResponse struct {
	Filename  string `json:"filename"`
	Size      string `json:"size"`
	SizeBytes int64  `json:"sizeBytes"`
	Date      string `json:"date"`
}

// IPServiceResponse represents an /ip/service entry in the API response.
type IPServiceResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Port        int    `json:"port"`
	Proto       string `json:"proto,omitempty"`
	Address     string `json:"address,omitempty"`
	Certificate string `json:"certificate,omitempty"`
	TLSVersion  string `json:"tlsVersion,omitempty"`
	VRF         string `json:"vrf,omitempty"`
	MaxSessions int    `json:"maxSessions,omitempty"`
	Local       string `json:"local,omitempty"`
	Remote      string `json:"remote,omitempty"`
	Container   string `json:"container,omitempty"`
	Netns       string `json:"netns,omitempty"`
	Connection  bool   `json:"connection,omitempty"`
	Disabled    bool   `json:"disabled"`
	Dynamic     bool   `json:"dynamic"`
	Invalid     bool   `json:"invalid"`
	Editable    bool   `json:"editable"`
}

// UpdateIPServiceRequest represents the fields that can be changed on an /ip/service entry.
type UpdateIPServiceRequest struct {
	Port        *int    `json:"port" example:"2222"`
	Address     *string `json:"address" example:"192.168.88.0/24,10.0.0.0/8"`
	Certificate *string `json:"certificate" example:"none"`
	TLSVersion  *string `json:"tlsVersion" example:"only-1.2"`
	VRF         *string `json:"vrf" example:"main"`
	MaxSessions *int    `json:"maxSessions" example:"20"`
	Disabled    *bool   `json:"disabled" example:"false"`
}

// SystemUpdateStatusResponse is the response for GET /api/system/update-status.
type SystemUpdateStatusResponse struct {
	Phase       string `json:"phase" example:"rebooting"` // idle, downloading, rebooting, done, error
	Message     string `json:"message,omitempty"`
	FromVersion string `json:"fromVersion,omitempty"`
	ToVersion   string `json:"toVersion,omitempty"`
	StartedAt   string `json:"startedAt,omitempty"`
}

// SchedulerResponse is the response for GET /api/system/scheduler/{name}.
type SchedulerResponse struct {
	Name      string `json:"name" example:"daily-backup"`
	Enabled   bool   `json:"enabled" example:"true"`
	StartDate string `json:"startDate" example:"2026-11-04"`
	StartTime string `json:"startTime" example:"03:00:00"`
	Interval  string `json:"interval" example:"9d 02:00:00"`
	RunCount  int    `json:"runCount" example:"12"`
	NextRun   string `json:"nextRun" example:"2026-11-13 05:00:00"`
}

// UpdateSchedulerRequest holds the fields that can be changed on a /system/scheduler entry; at least one is required.
type UpdateSchedulerRequest struct {
	StartTime *string `json:"startTime" example:"03:00:00"`
	Interval  *string `json:"interval" example:"1d 00:00:00"`
}
