package resolver

// This file contains helper/conversion functions for logs and diagnostics resolvers.
// Query, mutation, and subscription resolvers are in logs_diagnostics.resolvers.go.

import (
	"bufio"
	"os"

	"backend/graph/model"
)

// readLastNLines reads the last N lines from a log file.
func readLastNLines(filePath, serviceID string, maxLines int) ([]*model.LogEntry, int, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, 0, err
	}
	defer file.Close()

	// Read file to count total lines
	scanner := bufio.NewScanner(file)
	lineCount := 0
	for scanner.Scan() {
		lineCount++
	}

	if err := scanner.Err(); err != nil {
		return nil, 0, err
	}

	// If we need fewer lines than the file has, seek and read
	entries := make([]*model.LogEntry, 0, maxLines)
	if lineCount <= maxLines {
		// Read all lines
		_, _ = file.Seek(0, 0) //nolint:errcheck // best-effort seek for re-reading
		scanner = bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			entries = append(entries, &model.LogEntry{
				Level:   model.LogLevelInfo,
				Message: line,
				Source:  serviceID,
				RawLine: line,
			})
		}
	} else {
		// Read last N lines
		_, _ = file.Seek(0, 0) //nolint:errcheck // best-effort seek for re-reading
		scanner = bufio.NewScanner(file)
		linesToSkip := lineCount - maxLines
		lineIdx := 0
		for scanner.Scan() {
			if lineIdx >= linesToSkip {
				line := scanner.Text()
				entries = append(entries, &model.LogEntry{
					Level:   model.LogLevelInfo,
					Message: line,
					Source:  serviceID,
					RawLine: line,
				})
			}
			lineIdx++
		}
	}

	return entries, lineCount, nil
}

// mapEventLevelToModel maps an event log level string to a GraphQL LogLevel.
func mapEventLevelToModel(level string) model.LogLevel {
	switch level {
	case "DEBUG":
		return model.LogLevelDebug
	case "INFO":
		return model.LogLevelInfo
	case "WARN":
		return model.LogLevelWarn
	case "ERROR":
		return model.LogLevelError
	default:
		return model.LogLevelUnknown
	}
}
