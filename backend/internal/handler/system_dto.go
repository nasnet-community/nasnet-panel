package handler

import (
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

type SetSystemIdentityRequest struct {
	Name string `json:"name" form:"name"`
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

// ToSystemInfoResponse converts SystemInfo to SystemInfoResponse.
//

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

func ToSystemIdentityResponse(id *routeros.Identity) *SystemIdentityResponse {
	if id == nil {
		return nil
	}

	return &SystemIdentityResponse{
		Name: id.Name,
	}
}

// ToIPServiceResponse converts a RouterOS IPServiceInfo to API IPServiceResponse.
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

// ToUpdateCheckResponse converts UpdateCheckInfo to UpdateCheckResponse.
//

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

// ToUpdateInstallResponse converts UpdateInstallResult to UpdateInstallResponse.
//

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
