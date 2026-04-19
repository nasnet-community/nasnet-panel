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
	Identity      string `json:"identity"`
	Architecture  string `json:"architecture"`
	BoardName     string `json:"boardName"`
	Version       string `json:"version"`
	BuildTime     string `json:"buildTime"`
	License       string `json:"license"`
	UpdateChannel string `json:"updateChannel"`
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
	Version       string `json:"version"`
	BuildTime     string `json:"buildTime"`
	Channel       string `json:"channel"`
	UpdatePolicy  string `json:"updatePolicy"`
	CurrentTime   string `json:"currentTime"`
	InstallTime   string `json:"installTime"`
	ScheduledTime string `json:"scheduledTime"`
}

type ClockInfoResponse struct {
	Date      string `json:"date"`
	Time      string `json:"time"`
	TimeZone  string `json:"timeZone"`
	DstActive bool   `json:"dstActive"`
	GmtOffset string `json:"gmtOffset"`
}

func ToSystemInfoResponse(si *routeros.SystemInfo) *SystemInfoResponse {
	if si == nil {
		return nil
	}

	return &SystemInfoResponse{
		Identity:      si.Identity,
		Architecture:  si.Architecture,
		BoardName:     si.BoardName,
		Version:       si.Version,
		BuildTime:     si.BuildTime,
		License:       si.License,
		UpdateChannel: si.UpdateChannel,
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

func ToResourceInfoResponse(ri *routeros.ResourceInfo) *ResourceInfoResponse {
	if ri == nil {
		return nil
	}

	return &ResourceInfoResponse{
		UpTime:           utils.FormatRouterOSTime(ri.UpTime),
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
		Version:       ui.Version,
		BuildTime:     ui.BuildTime,
		Channel:       ui.Channel,
		UpdatePolicy:  ui.UpdatePolicy,
		CurrentTime:   ui.CurrentTime,
		InstallTime:   ui.InstallTime,
		ScheduledTime: ui.ScheduledTime,
	}
}

func ToClockInfoResponse(ci *routeros.ClockInfo) *ClockInfoResponse {
	if ci == nil {
		return nil
	}

	return &ClockInfoResponse{
		Date:      ci.Date,
		Time:      ci.Time,
		TimeZone:  ci.TimeZone,
		DstActive: ci.DstActive,
		GmtOffset: ci.GmtOffset,
	}
}
