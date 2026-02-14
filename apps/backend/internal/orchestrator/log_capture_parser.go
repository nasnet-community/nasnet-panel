package orchestrator

import (
	"bufio"
	"encoding/json"
	"io"
	"strings"
	"time"
)

// DefaultLogParser is the default parser that handles plain text and JSON logs
func DefaultLogParser(line string, source string) LogEntry {
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
		var jsonLog map[string]interface{}
		if err := json.Unmarshal([]byte(line), &jsonLog); err == nil {
			// Parse JSON log structure
			if ts, ok := jsonLog["time"].(string); ok {
				if parsed, err := time.Parse(time.RFC3339Nano, ts); err == nil {
					entry.Timestamp = parsed
				}
			} else if ts, ok := jsonLog["timestamp"].(string); ok {
				if parsed, err := time.Parse(time.RFC3339Nano, ts); err == nil {
					entry.Timestamp = parsed
				}
			}

			if level, ok := jsonLog["level"].(string); ok {
				entry.Level = parseLogLevel(level)
			}

			if msg, ok := jsonLog["msg"].(string); ok {
				entry.Message = msg
			} else if msg, ok := jsonLog["message"].(string); ok {
				entry.Message = msg
			}

			// Store additional fields as metadata
			for k, v := range jsonLog {
				if k != "time" && k != "timestamp" && k != "level" && k != "msg" && k != "message" {
					if str, ok := v.(string); ok {
						entry.Metadata[k] = str
					}
				}
			}

			return entry
		}
	}

	// Plain text parsing (for Tor, MTProxy, Psiphon)
	entry.Level = inferLogLevel(line)
	entry.Message = strings.TrimSpace(line)

	return entry
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
	return scanner.Err()
}
