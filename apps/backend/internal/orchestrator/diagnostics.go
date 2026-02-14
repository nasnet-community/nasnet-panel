package orchestrator

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/rs/zerolog"
)

// DiagnosticStatus represents the result status of a diagnostic test
type DiagnosticStatus string

const (
	DiagnosticStatusPass    DiagnosticStatus = "pass"
	DiagnosticStatusFail    DiagnosticStatus = "fail"
	DiagnosticStatusWarning DiagnosticStatus = "warning"
	DiagnosticStatusSkipped DiagnosticStatus = "skipped"
)

// DiagnosticResult represents the result of a single diagnostic test
type DiagnosticResult struct {
	TestName    string           `json:"testName"`
	Status      DiagnosticStatus `json:"status"`
	Message     string           `json:"message"`
	Details     string           `json:"details,omitempty"`
	Duration    time.Duration    `json:"duration"`
	Timestamp   time.Time        `json:"timestamp"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// DiagnosticTest defines the interface for diagnostic tests
type DiagnosticTest interface {
	// Name returns the unique name of the test
	Name() string

	// Description returns a human-readable description
	Description() string

	// Run executes the test and returns a result
	Run(ctx context.Context) DiagnosticResult
}

// DiagnosticSuite represents a collection of tests for a service
type DiagnosticSuite struct {
	ServiceName string
	Tests       []DiagnosticTest
}

// DiagnosticRunner executes diagnostic tests for service instances
type DiagnosticRunner struct {
	suites map[string]*DiagnosticSuite
	mu     sync.RWMutex
	logger zerolog.Logger
}

// NewDiagnosticRunner creates a new diagnostic runner
func NewDiagnosticRunner(logger zerolog.Logger) *DiagnosticRunner {
	return &DiagnosticRunner{
		suites: make(map[string]*DiagnosticSuite),
		logger: logger,
	}
}

// RegisterSuite registers a diagnostic suite for a service type
func (dr *DiagnosticRunner) RegisterSuite(serviceName string, suite *DiagnosticSuite) {
	dr.mu.Lock()
	defer dr.mu.Unlock()

	dr.suites[serviceName] = suite
	dr.logger.Info().
		Str("service", serviceName).
		Int("test_count", len(suite.Tests)).
		Msg("registered diagnostic suite")
}

// RunDiagnostics executes all tests for a service and returns results
func (dr *DiagnosticRunner) RunDiagnostics(ctx context.Context, serviceName string, instanceID string) []DiagnosticResult {
	dr.mu.RLock()
	suite, exists := dr.suites[serviceName]
	dr.mu.RUnlock()

	if !exists {
		return []DiagnosticResult{{
			TestName:  "suite_check",
			Status:    DiagnosticStatusSkipped,
			Message:   fmt.Sprintf("no diagnostic suite registered for service: %s", serviceName),
			Timestamp: time.Now(),
		}}
	}

	results := make([]DiagnosticResult, 0, len(suite.Tests))

	for _, test := range suite.Tests {
		dr.logger.Debug().
			Str("service", serviceName).
			Str("instance_id", instanceID).
			Str("test", test.Name()).
			Msg("running diagnostic test")

		result := test.Run(ctx)
		results = append(results, result)

		dr.logger.Info().
			Str("service", serviceName).
			Str("instance_id", instanceID).
			Str("test", test.Name()).
			Str("status", string(result.Status)).
			Dur("duration", result.Duration).
			Msg("diagnostic test completed")
	}

	return results
}

// GetAvailableTests returns the list of available tests for a service
func (dr *DiagnosticRunner) GetAvailableTests(serviceName string) []string {
	dr.mu.RLock()
	defer dr.mu.RUnlock()

	suite, exists := dr.suites[serviceName]
	if !exists {
		return nil
	}

	tests := make([]string, 0, len(suite.Tests))
	for _, test := range suite.Tests {
		tests = append(tests, test.Name())
	}

	return tests
}

// BaseTest provides common functionality for diagnostic tests
type BaseTest struct {
	TestName        string
	TestDescription string
}

// Name returns the test name
func (bt *BaseTest) Name() string {
	return bt.TestName
}

// Description returns the test description
func (bt *BaseTest) Description() string {
	return bt.TestDescription
}

// newResult creates a new diagnostic result with common fields
func (bt *BaseTest) newResult(status DiagnosticStatus, message, details string, duration time.Duration) DiagnosticResult {
	return DiagnosticResult{
		TestName:  bt.TestName,
		Status:    status,
		Message:   message,
		Details:   details,
		Duration:  duration,
		Timestamp: time.Now(),
		Metadata:  make(map[string]string),
	}
}

// HealthTest checks if a service process is running
type HealthTest struct {
	BaseTest
	Process *ManagedProcess
}

// NewHealthTest creates a health test for a managed process
func NewHealthTest(process *ManagedProcess) *HealthTest {
	return &HealthTest{
		BaseTest: BaseTest{
			TestName:        "process_health",
			TestDescription: "Verify that the service process is running",
		},
		Process: process,
	}
}

// Run executes the health test
func (ht *HealthTest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	state := ht.Process.State()
	pid := ht.Process.PID()

	if state == ProcessStateRunning && pid > 0 {
		return ht.newResult(
			DiagnosticStatusPass,
			"Process is running",
			fmt.Sprintf("PID: %d, State: %s", pid, state),
			time.Since(start),
		)
	}

	return ht.newResult(
		DiagnosticStatusFail,
		"Process is not running",
		fmt.Sprintf("State: %s", state),
		time.Since(start),
	)
}

// LogTest checks if logs are being generated
type LogTest struct {
	BaseTest
	Process     *ManagedProcess
	MinLogLines int
}

// NewLogTest creates a log test for a managed process
func NewLogTest(process *ManagedProcess, minLines int) *LogTest {
	if minLines == 0 {
		minLines = 1
	}

	return &LogTest{
		BaseTest: BaseTest{
			TestName:        "log_output",
			TestDescription: "Verify that the service is generating logs",
		},
		Process:     process,
		MinLogLines: minLines,
	}
}

// Run executes the log test
func (lt *LogTest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	logs, err := lt.Process.GetLogs(100)
	if err != nil {
		return lt.newResult(
			DiagnosticStatusFail,
			"Failed to retrieve logs",
			err.Error(),
			time.Since(start),
		)
	}

	if len(logs) < lt.MinLogLines {
		return lt.newResult(
			DiagnosticStatusWarning,
			"Insufficient log output",
			fmt.Sprintf("Expected at least %d lines, got %d", lt.MinLogLines, len(logs)),
			time.Since(start),
		)
	}

	// Check for recent logs (within last 60 seconds)
	recentCount := 0
	threshold := time.Now().Add(-60 * time.Second)
	for _, log := range logs {
		if log.Timestamp.After(threshold) {
			recentCount++
		}
	}

	return lt.newResult(
		DiagnosticStatusPass,
		"Service is generating logs",
		fmt.Sprintf("Total: %d lines, Recent (60s): %d lines", len(logs), recentCount),
		time.Since(start),
	)
}

// PortTest checks if a service is listening on expected ports
type PortTest struct {
	BaseTest
	Host string
	Port int
}

// NewPortTest creates a port connectivity test
func NewPortTest(name, description, host string, port int) *PortTest {
	return &PortTest{
		BaseTest: BaseTest{
			TestName:        name,
			TestDescription: description,
		},
		Host: host,
		Port: port,
	}
}

// Run executes the port test
func (pt *PortTest) Run(ctx context.Context) DiagnosticResult {
	// Port test implementation is service-specific
	// This will be overridden by service-specific tests
	return pt.newResult(
		DiagnosticStatusSkipped,
		"Port test not implemented",
		"",
		0,
	)
}
