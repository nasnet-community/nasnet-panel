package handler

import pkgRouteros "nasnet-panel/pkg/routeros"

type LogEntryResponse struct {
	ID      string `json:"id"`
	Time    string `json:"time"`
	Topic   string `json:"topic"`
	Level   string `json:"level"`
	Message string `json:"message"`
	Prefix  string `json:"prefix,omitempty"`
	Account string `json:"account,omitempty"`
	Count   int    `json:"count,omitempty"`
}

type GetLogsRequest struct {
	Limit    int    `query:"limit" default:"100"`
	Text     string `query:"text"`
	Topic    string `query:"topic"`
	Severity string `query:"severity"`
}

type GetLogsResponse struct {
	Count   int                `json:"count"`
	Entries []LogEntryResponse `json:"entries"`
	Topics  []string           `json:"availableTopics,omitempty"`
	Levels  []string           `json:"availableLevels,omitempty"`
}

type LogTopicInfo struct {
	Topic       string `json:"topic"`
	Description string `json:"description"`
}

func ToLogEntryResponse(entry pkgRouteros.LogEntry) LogEntryResponse {
	return LogEntryResponse{
		ID:      entry.ID,
		Time:    entry.Time,
		Topic:   entry.Topic,
		Level:   entry.Level,
		Message: entry.Message,
		Prefix:  entry.Prefix,
		Account: entry.Account,
		Count:   entry.Count,
	}
}
