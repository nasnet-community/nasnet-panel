package logs

import (
	pkgRouteros "nasnet-panel/pkg/routeros"
)

// ToLogEntryResponse converts RouterOS data to its API response form.
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
