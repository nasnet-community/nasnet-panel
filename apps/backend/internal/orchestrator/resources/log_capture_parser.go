package resources

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"
)

// DefaultLogParser is the default parser that handles plain text and JSON logs
func DefaultLogParser(line, source string) LogEntry {
	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     LogLevelUnknown,
		Message:   line,
		Source:    source,
		RawLine:   line,
		Metadata:  make(map[string]string),
	}

	// Try parsing as JSON (for sing-box, AdGuard Home)
	if strings.HasPrefix(line, "{") {
		if parseJSONLogEntry(line, &entry) {
			return entry
		}
	}

	// Plain text parsing (for Tor, MTProxy, Psiphon)
	entry.Level = inferLogLevel(line)
	entry.Message = strings.TrimSpace(line)

	return entry
}

// parseJSONLogEntry attempts to parse a JSON log line into the entry.
// Returns true if parsing succeeded.
func parseJSONLogEntry(line string, entry *LogEntry) bool {
	var jsonLog map[string]interface{}
	if err := json.Unmarshal([]byte(line), &jsonLog); err != nil {
		return false
	}

	parseJSONTimestamp(jsonLog, entry)
	if level, ok := jsonLog["level"].(string); ok {
		entry.Level = parseLogLevel(level)
	}
	parseJSONMessage(jsonLog, entry)
	extractJSONMetadata(jsonLog, entry)

	return true
}

// parseJSONTimestamp extracts a timestamp from "time" or "timestamp" JSON fields.
func parseJSONTimestamp(jsonLog map[string]interface{}, entry *LogEntry) {
	for _, key := range []string{"time", "timestamp"} {
		if ts, ok := jsonLog[key].(string); ok {
			if parsed, err := time.Parse(time.RFC3339Nano, ts); err == nil {
				entry.Timestamp = parsed
				return
			}
		}
	}
}

// parseJSONMessage extracts the message from "msg" or "message" JSON fields.
func parseJSONMessage(jsonLog map[string]interface{}, entry *LogEntry) {
	for _, key := range []string{"msg", "message"} {
		if msg, ok := jsonLog[key].(string); ok {
			entry.Message = msg
			return
		}
	}
}

// extractJSONMetadata stores non-standard JSON fields as metadata.
func extractJSONMetadata(jsonLog map[string]interface{}, entry *LogEntry) {
	reservedKeys := map[string]bool{"time": true, "timestamp": true, "level": true, "msg": true, "message": true}
	for k, v := range jsonLog {
		if !reservedKeys[k] {
			if str, ok := v.(string); ok {
				entry.Metadata[k] = str
			}
		}
	}
}

// parseLogLevel parses a log level string from JSON logs
func parseLogLevel(level string) LogLevel {
	level = strings.ToLower(strings.TrimSpace(level))
	switch level {
	case "debug", "dbg", "trace":
		return LogLevelDebug
	case "info", "information":
		return LogLevelInfo
	case "warn", "warning":
		return LogLevelWarn
	case "error", "err", "fatal", "panic":
		return LogLevelError
	default:
		return LogLevelUnknown
	}
}

// inferLogLevel attempts to infer log level from plain text logs
func inferLogLevel(line string) LogLevel {
	lineLower := strings.ToLower(line)

	if strings.Contains(lineLower, "error") || strings.Contains(lineLower, "fatal") || strings.Contains(lineLower, "panic") {
		return LogLevelError
	}
	if strings.Contains(lineLower, "warn") || strings.Contains(lineLower, "warning") {
		return LogLevelWarn
	}
	if strings.Contains(lineLower, "info") {
		return LogLevelInfo
	}
	if strings.Contains(lineLower, "debug") || strings.Contains(lineLower, "trace") {
		return LogLevelDebug
	}

	// Default to info for unknown
	return LogLevelInfo
}

// CopyLogs copies logs from a reader (e.g., process stdout/stderr) to the log capture
// This is a convenience function for wiring up process output
func CopyLogs(dst *LogCapture, src io.Reader, prefix string) error {
	scanner := bufio.NewScanner(src)
	for scanner.Scan() {
		line := scanner.Text()
		if prefix != "" {
			line = prefix + line
		}
		if err := dst.WriteLine(line); err != nil {
			return err
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("log capture: scanner error: %w", err)
	}
	return nil
}
