package dns

import (
	"context"
	"errors"
	"testing"
)

func TestGetCacheStats(t *testing.T) {
	mock := newMockRouterPort()
	mock.setResponse("/ip/dns", `cache-size: 2048KiB
cache-used: 1024KiB
servers: 8.8.8.8,1.1.1.1`)

	svc := NewService(mock)
	stats, err := svc.GetCacheStats(context.Background(), "test-device")

	if err != nil {
		t.Fatalf("GetCacheStats failed: %v", err)
	}

	// Verify cache stats
	if stats.CacheMaxBytes != 2048*1024 {
		t.Errorf("Expected CacheMaxBytes 2097152, got %d", stats.CacheMaxBytes)
	}

	if stats.CacheUsedBytes != 1024*1024 {
		t.Errorf("Expected CacheUsedBytes 1048576, got %d", stats.CacheUsedBytes)
	}

	expectedPercent := 50.0
	if stats.CacheUsagePercent != expectedPercent {
		t.Errorf("Expected CacheUsagePercent %.2f, got %.2f", expectedPercent, stats.CacheUsagePercent)
	}

	// Estimate: 1024 KiB / 100 bytes per entry = ~10485 entries
	if stats.TotalEntries == 0 {
		t.Error("Expected TotalEntries > 0")
	}
}

func TestFlushCache(t *testing.T) {
	mock := newMockRouterPort()
	// Mock will be called multiple times for different operations
	mock.setResponse("/ip/dns", `cache-size: 2048KiB
cache-used: 1024KiB`)
	mock.setResponse("/ip/dns/cache", "")

	svc := NewService(mock)
	result, err := svc.FlushCache(context.Background(), "test-device")

	if err != nil {
		t.Fatalf("FlushCache failed: %v", err)
	}

	if !result.Success {
		t.Error("Expected flush to succeed")
	}

	if result.BeforeStats.CacheUsedBytes == 0 {
		t.Error("Expected before stats to show cache usage")
	}
}

func TestRunBenchmark_NoServersConfigured(t *testing.T) {
	mock := newMockRouterPort()
	mock.setResponse("/ip/dns", "") // Empty response - no servers

	svc := NewService(mock)
	_, err := svc.RunBenchmark(context.Background(), "test-device")

	if err == nil {
		t.Error("Expected error when no DNS servers are configured")
	}

	expectedErr := "no DNS servers configured"
	if err.Error() != expectedErr {
		t.Errorf("Expected error '%s', got '%s'", expectedErr, err.Error())
	}
}

func TestBenchmarkSingleServer_Success(t *testing.T) {
	mock := newMockRouterPort()
	mock.setResponse("/tool/dns-lookup", `name: google.com
address: 142.250.80.46`)

	svc := NewService(mock)
	result := svc.benchmarkSingleServer(context.Background(), "test-device", "google.com", "8.8.8.8")

	if !result.Success {
		t.Error("Expected benchmark to succeed")
	}

	if result.ResponseTimeMs < 0 {
		t.Error("Expected positive response time")
	}

	if result.Status == "UNREACHABLE" {
		t.Error("Expected server to be reachable")
	}

	if result.Error != nil {
		t.Errorf("Expected no error, got: %s", *result.Error)
	}
}

func TestBenchmarkSingleServer_Unreachable(t *testing.T) {
	mock := newMockRouterPort()
	mock.setError("/tool/dns-lookup", errors.New("TIMEOUT: server did not respond"))

	svc := NewService(mock)
	result := svc.benchmarkSingleServer(context.Background(), "test-device", "google.com", "1.2.3.4")

	if result.Success {
		t.Error("Expected benchmark to fail")
	}

	if result.ResponseTimeMs != -1 {
		t.Errorf("Expected response time -1, got %d", result.ResponseTimeMs)
	}

	if result.Status != "UNREACHABLE" {
		t.Errorf("Expected status UNREACHABLE, got %s", result.Status)
	}

	if result.Error == nil {
		t.Error("Expected error to be set")
	}
}
