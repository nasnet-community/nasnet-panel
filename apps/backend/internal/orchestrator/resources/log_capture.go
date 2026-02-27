package resources

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
)

const (
	// MaxLogFileSize is the threshold for log rotation (10MB)
	MaxLogFileSize = 10 * 1024 * 1024

	// DefaultSubscriberBufferSize is the buffer size for subscriber channels
	DefaultSubscriberBufferSize = 100

	// MaxTailLines is the maximum number of lines to read when tailing logs
	MaxTailLines = 1000
)

// LogLevel represents the severity level of a log entry
type LogLevel string

const (
	LogLevelDebug   LogLevel = "debug"
	LogLevelInfo    LogLevel = "info"
	LogLevelWarn    LogLevel = "warn"
	LogLevelError   LogLevel = "error"
	LogLevelUnknown LogLevel = "unknown"
)

// LogEntry represents a single log line with parsed metadata
type LogEntry struct {
	Timestamp time.Time         `json:"timestamp"`
	Level     LogLevel          `json:"level"`
	Message   string            `json:"message"`
	Source    string            `json:"source"`             // e.g., "tor", "singbox", "adguard"
	RawLine   string            `json:"rawLine"`            // Original log line
	Metadata  map[string]string `json:"metadata,omitempty"` // Additional parsed fields
}

// LogSubscriber represents a client subscribed to log updates
type LogSubscriber struct {
	ID      string
	Channel chan LogEntry
	Filter  LogFilterFunc
}

// LogFilterFunc is a function that determines if a log entry should be sent to a subscriber
type LogFilterFunc func(entry LogEntry) bool

// LogCaptureConfig holds configuration for log capture
type LogCaptureConfig struct {
	InstanceID       string        // Service instance ID
	ServiceName      string        // Service name (e.g., "tor", "singbox")
	LogDir           string        // Directory to store logs
	MaxFileSize      int64         // Max file size before rotation (default: 10MB)
	SubscriberBuffer int           // Buffer size for subscriber channels (default: 100)
	Logger           *zap.Logger   // Logger for internal logging
	Parser           LogParserFunc // Custom log parser (optional)
}

// LogParserFunc is a function that parses a log line into a LogEntry
type LogParserFunc func(line string, source string) LogEntry

// LogCapture manages log capture, rotation, and broadcasting for a service instance
type LogCapture struct {
	instanceID  string
	serviceName string
	logDir      string
	maxFileSize int64
	parser      LogParserFunc

	mu          sync.RWMutex
	logFile     *os.File
	currentSize int64
	subscribers map[string]*LogSubscriber
	closed      bool

	logger *zap.Logger
}

// NewLogCapture creates a new LogCapture instance
func NewLogCapture(cfg LogCaptureConfig) (*LogCapture, error) {
	if cfg.InstanceID == "" {
		return nil, fmt.Errorf("instance ID is required")
	}
	if cfg.ServiceName == "" {
		return nil, fmt.Errorf("service name is required")
	}
	if cfg.LogDir == "" {
		return nil, fmt.Errorf("log directory is required")
	}

	maxFileSize := cfg.MaxFileSize
	if maxFileSize == 0 {
		maxFileSize = MaxLogFileSize
	}

	parser := cfg.Parser
	if parser == nil {
		parser = DefaultLogParser
	}

	// Ensure log directory exists
	if err := os.MkdirAll(cfg.LogDir, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create log directory %s: %w", cfg.LogDir, err)
	}

	lc := &LogCapture{
		instanceID:  cfg.InstanceID,
		serviceName: cfg.ServiceName,
		logDir:      cfg.LogDir,
		maxFileSize: maxFileSize,
		parser:      parser,
		subscribers: make(map[string]*LogSubscriber),
		logger:      cfg.Logger,
	}

	if lc.logger == nil {
		lc.logger = zap.NewNop()
	}

	// Open initial log file
	if err := lc.openLogFile(); err != nil {
		return nil, fmt.Errorf("failed to open log file: %w", err)
	}

	return lc, nil
}

// openLogFile opens or creates the log file for writing
func (lc *LogCapture) openLogFile() error {
	logPath := lc.getLogPath()

	// Check if file exists and get its size
	info, err := os.Stat(logPath)
	if err == nil {
		lc.currentSize = info.Size()
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("failed to stat log file: %w", err)
	}

	// Open file for appending (create if not exists)
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	lc.logFile = file
	return nil
}

// getLogPath returns the path to the current log file
func (lc *LogCapture) getLogPath() string {
	filename := fmt.Sprintf("%s-%s.log", lc.serviceName, lc.instanceID)
	return filepath.Join(lc.logDir, filename)
}

// getBackupLogPath returns the path to the backup log file
func (lc *LogCapture) getBackupLogPath() string {
	return lc.getLogPath() + ".1"
}

// Write implements io.Writer interface for capturing stdout/stderr
func (lc *LogCapture) Write(p []byte) (n int, err error) {
	lc.mu.Lock()
	defer lc.mu.Unlock()

	if lc.closed {
		return 0, fmt.Errorf("log capture is closed")
	}

	// Check if rotation is needed
	if lc.currentSize+int64(len(p)) > lc.maxFileSize {
		if rotateErr := lc.rotateLogFileUnsafe(); rotateErr != nil {
			lc.logger.Error("failed to rotate log file", zap.Error(rotateErr))
			// Continue writing to the current file even if rotation fails
		}
	}

	// Write to file
	n, err = lc.logFile.Write(p)
	if err != nil {
		return n, fmt.Errorf("write to log file: %w", err)
	}
	lc.currentSize += int64(n)

	// Parse and broadcast to subscribers (non-blocking)
	lc.broadcastLogUnsafe(string(p))

	return n, nil
}

// WriteLine writes a complete log line and broadcasts it to subscribers
func (lc *LogCapture) WriteLine(line string) error {
	if !strings.HasSuffix(line, "\n") {
		line += "\n"
	}
	_, err := lc.Write([]byte(line))
	return err
}

// rotateLogFileUnsafe rotates the log file (caller must hold lock)
func (lc *LogCapture) rotateLogFileUnsafe() error {
	// Close current log file
	if errClose := lc.logFile.Close(); errClose != nil {
		return fmt.Errorf("failed to close log file: %w", errClose)
	}

	// Remove old backup if exists
	backupPath := lc.getBackupLogPath()
	if errRemove := os.Remove(backupPath); errRemove != nil && !os.IsNotExist(errRemove) {
		lc.logger.Warn("failed to remove old backup log", zap.Error(errRemove))
	}

	// Rename current log to backup
	logPath := lc.getLogPath()
	if errRename := os.Rename(logPath, backupPath); errRename != nil {
		return fmt.Errorf("failed to rename log file: %w", errRename)
	}

	lc.logger.Info("rotated log file",
		zap.String("instance_id", lc.instanceID),
		zap.String("service", lc.serviceName))

	// Reset size and open new file
	lc.currentSize = 0
	return lc.openLogFile()
}

// broadcastLogUnsafe broadcasts a log line to all subscribers (caller must hold lock)
func (lc *LogCapture) broadcastLogUnsafe(line string) {
	// Split into individual lines
	lines := strings.Split(strings.TrimSuffix(line, "\n"), "\n")

	for _, l := range lines {
		if l == "" {
			continue
		}

		// Parse log entry
		entry := lc.parser(l, lc.serviceName)

		// Send to all subscribers (non-blocking)
		for _, sub := range lc.subscribers {
			// Apply filter if specified
			if sub.Filter != nil && !sub.Filter(entry) {
				continue
			}

			// Non-blocking send
			select {
			case sub.Channel <- entry:
			default:
				// Buffer full, skip this entry
				lc.logger.Debug("subscriber buffer full, skipping log entry",
					zap.String("subscriber_id", sub.ID))
			}
		}
	}
}

// Subscribe subscribes to log updates with an optional filter
func (lc *LogCapture) Subscribe(id string, bufferSize int, filter LogFilterFunc) (*LogSubscriber, error) {
	lc.mu.Lock()
	defer lc.mu.Unlock()

	if lc.closed {
		return nil, fmt.Errorf("log capture is closed")
	}

	if _, exists := lc.subscribers[id]; exists {
		return nil, fmt.Errorf("subscriber %s already exists", id)
	}

	if bufferSize == 0 {
		bufferSize = DefaultSubscriberBufferSize
	}

	sub := &LogSubscriber{
		ID:      id,
		Channel: make(chan LogEntry, bufferSize),
		Filter:  filter,
	}

	lc.subscribers[id] = sub

	lc.logger.Debug("subscriber added",
		zap.String("subscriber_id", id),
		zap.String("instance_id", lc.instanceID))

	return sub, nil
}

// Unsubscribe removes a subscriber
func (lc *LogCapture) Unsubscribe(id string) {
	lc.mu.Lock()
	defer lc.mu.Unlock()

	if sub, exists := lc.subscribers[id]; exists {
		close(sub.Channel)
		delete(lc.subscribers, id)

		lc.logger.Debug("subscriber removed",
			zap.String("subscriber_id", id),
			zap.String("instance_id", lc.instanceID))
	}
}

// TailLogs reads the last N lines from the log file
func (lc *LogCapture) TailLogs(maxLines int) ([]LogEntry, error) {
	lc.mu.RLock()
	logPath := lc.getLogPath()
	lc.mu.RUnlock()

	if maxLines <= 0 || maxLines > MaxTailLines {
		maxLines = MaxTailLines
	}

	file, err := os.Open(logPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []LogEntry{}, nil
		}
		return nil, fmt.Errorf("open log file: %w", err)
	}
	defer file.Close()

	// Read all lines
	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to read log file: %w", err)
	}

	// Get last N lines
	startIdx := 0
	if len(lines) > maxLines {
		startIdx = len(lines) - maxLines
	}
	if startIdx < len(lines) {
		lines = lines[startIdx:]
	} else {
		lines = nil
	}

	// Parse log entries
	entries := make([]LogEntry, 0, len(lines))
	for _, line := range lines {
		if line != "" {
			entries = append(entries, lc.parser(line, lc.serviceName))
		}
	}

	return entries, nil
}

// GetCurrentSize returns the current size of the log file in bytes
func (lc *LogCapture) GetCurrentSize() int64 {
	lc.mu.RLock()
	defer lc.mu.RUnlock()
	return lc.currentSize
}

// GetSubscriberCount returns the number of active subscribers
func (lc *LogCapture) GetSubscriberCount() int {
	lc.mu.RLock()
	defer lc.mu.RUnlock()
	return len(lc.subscribers)
}

// Close closes the log capture and cleans up resources
func (lc *LogCapture) Close() error {
	lc.mu.Lock()
	defer lc.mu.Unlock()

	if lc.closed {
		return nil
	}

	lc.closed = true

	// Close all subscriber channels
	for id, sub := range lc.subscribers {
		close(sub.Channel)
		delete(lc.subscribers, id)
	}

	// Close log file
	if lc.logFile != nil {
		if err := lc.logFile.Close(); err != nil {
			return fmt.Errorf("failed to close log file: %w", err)
		}
	}

	lc.logger.Info("log capture closed",
		zap.String("instance_id", lc.instanceID),
		zap.String("service", lc.serviceName))

	return nil
}
