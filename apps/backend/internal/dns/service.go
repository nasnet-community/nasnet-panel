package dns

import (
	"context"
	"fmt"
	"time"

	"backend/internal/router"
)

// Service provides DNS lookup operations via RouterPort
type Service struct {
	routerPort router.RouterPort
}

// NewService creates a new DNS service instance
func NewService(rp router.RouterPort) *Service {
	return &Service{
		routerPort: rp,
	}
}

// PerformLookup executes a DNS lookup operation
func (s *Service) PerformLookup(ctx context.Context, input *LookupInput) (*LookupResult, error) {
	start := time.Now()

	// Determine which server to use
	server, err := s.resolveServer(ctx, input)
	if err != nil {
		return nil, err
	}

	// Route based on record type and server
	var records []Record
	var lookupErr error
	var authoritative bool

	// Use RouterOS native lookup for A/AAAA records when using router's DNS.
	// lookupViaRouterOS detects whether the answer came from the router's own
	// static DNS table (authoritative=true) or was forwarded/cached (authoritative=false).
	// lookupViaGoResolver uses Go's net package which does not expose the DNS AA flag,
	// so authoritative is always false for that path.
	if (input.RecordType == "A" || input.RecordType == "AAAA") && (input.Server == nil || *input.Server == "") {
		records, authoritative, lookupErr = s.lookupViaRouterOS(ctx, input)
	} else {
		records, lookupErr = s.lookupViaGoResolver(ctx, input, server)
		authoritative = false // Go's net.Resolver does not expose the DNS AA flag
	}

	queryTime := int(time.Since(start).Milliseconds())

	// If lookup failed, return error result
	if lookupErr != nil {
		errorMsg := lookupErr.Error()
		return &LookupResult{
			Hostname:      input.Hostname,
			RecordType:    input.RecordType,
			Status:        mapErrorToStatus(lookupErr),
			Records:       []Record{},
			Server:        server,
			QueryTime:     queryTime,
			Authoritative: authoritative,
			Error:         &errorMsg,
			Timestamp:     time.Now().Format(time.RFC3339),
		}, nil
	}

	// Success - return result
	return &LookupResult{
		Hostname:      input.Hostname,
		RecordType:    input.RecordType,
		Status:        "SUCCESS",
		Records:       records,
		Server:        server,
		QueryTime:     queryTime,
		Authoritative: authoritative,
		Timestamp:     time.Now().Format(time.RFC3339),
	}, nil
}

// GetConfiguredServers retrieves DNS servers configured on the router
func (s *Service) GetConfiguredServers(ctx context.Context, deviceId string) (*Servers, error) {
	// Execute /ip/dns/print command
	cmd := router.Command{
		Path:   "/ip/dns",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	// Parse RouterOS response
	return parseRouterOSServers(result.RawOutput), nil
}

// GetCacheStats retrieves DNS cache statistics from the router
func (s *Service) GetCacheStats(ctx context.Context, deviceId string) (*CacheStats, error) {
	// Execute /ip/dns/print command to get cache info
	cmd := router.Command{
		Path:   "/ip/dns",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	// Parse cache statistics from RouterOS response
	stats := parseRouterOSCacheStats(result.RawOutput)
	stats.Timestamp = time.Now().Format(time.RFC3339)

	return stats, nil
}

// FlushCache flushes the DNS cache on the router
func (s *Service) FlushCache(ctx context.Context, deviceId string) (*FlushCacheResult, error) {
	// Get cache stats before flushing
	beforeStats, err := s.GetCacheStats(ctx, deviceId)
	if err != nil {
		return nil, err
	}

	// Execute /ip/dns/cache/flush command
	cmd := router.Command{
		Path:   "/ip/dns/cache",
		Action: "flush",
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		errMsg := "Failed to flush DNS cache"
		return &FlushCacheResult{
			Success:        false,
			EntriesRemoved: 0,
			BeforeStats:    *beforeStats,
			AfterStats:     CacheStats{Timestamp: time.Now().Format(time.RFC3339)},
			Message:        errMsg,
			Timestamp:      time.Now().Format(time.RFC3339),
		}, err
	}

	// Get cache stats after flushing
	afterStats, err := s.GetCacheStats(ctx, deviceId)
	if err != nil {
		// If we can't get after stats, create empty stats
		afterStats = &CacheStats{
			TotalEntries:   0,
			CacheUsedBytes: 0,
			Timestamp:      time.Now().Format(time.RFC3339),
		}
	}

	entriesRemoved := beforeStats.TotalEntries - afterStats.TotalEntries

	return &FlushCacheResult{
		Success:        true,
		EntriesRemoved: entriesRemoved,
		BeforeStats:    *beforeStats,
		AfterStats:     *afterStats,
		Message:        fmt.Sprintf("DNS cache flushed successfully. Removed %d entries.", entriesRemoved),
		Timestamp:      time.Now().Format(time.RFC3339),
	}, nil
}

// RunBenchmark benchmarks all configured DNS servers
func (s *Service) RunBenchmark(ctx context.Context, deviceId string) (*BenchmarkResult, error) {
	start := time.Now()

	// Get configured DNS servers
	servers, err := s.GetConfiguredServers(ctx, deviceId)
	if err != nil {
		return nil, err
	}

	if len(servers.Servers) == 0 {
		return nil, fmt.Errorf("no DNS servers configured")
	}

	// Test hostname (well-known, reliable)
	testHostname := "google.com"

	// Run benchmarks in parallel
	results := make([]BenchmarkServerResult, len(servers.Servers))
	type benchmarkJob struct {
		index  int
		server string
	}

	jobs := make(chan benchmarkJob, len(servers.Servers))
	resultsChan := make(chan BenchmarkServerResult, len(servers.Servers))

	// Start worker goroutines
	numWorkers := len(servers.Servers)
	if numWorkers > 5 {
		numWorkers = 5 // Limit concurrent workers
	}

	for w := 0; w < numWorkers; w++ {
		go func() {
			for job := range jobs {
				result := s.benchmarkSingleServer(ctx, deviceId, testHostname, job.server)
				resultsChan <- result
			}
		}()
	}

	// Send jobs
	for i, srv := range servers.Servers {
		jobs <- benchmarkJob{index: i, server: srv.Address}
	}
	close(jobs)

	// Collect results
	for i := 0; i < len(servers.Servers); i++ {
		results[i] = <-resultsChan
	}

	// Sort by response time (ascending)
	sortBenchmarkResults(results)

	// Label fastest server and slow servers
	var fastestServer *BenchmarkServerResult
	for i := range results {
		if results[i].Success && results[i].ResponseTimeMs > 0 {
			if fastestServer == nil {
				results[i].Status = "FASTEST"
				fastestServer = &results[i]
			} else {
				switch {
				case results[i].ResponseTimeMs > 100:
					results[i].Status = "SLOW"
				default:
					results[i].Status = "GOOD"
				}
			}
		} else if !results[i].Success {
			results[i].Status = "UNREACHABLE"
		}
	}

	totalTimeMs := int(time.Since(start).Milliseconds())

	return &BenchmarkResult{
		TestHostname:  testHostname,
		ServerResults: results,
		FastestServer: fastestServer,
		Timestamp:     time.Now().Format(time.RFC3339),
		TotalTimeMs:   totalTimeMs,
	}, nil
}

// benchmarkSingleServer tests a single DNS server
func (s *Service) benchmarkSingleServer(ctx context.Context, deviceId, hostname, server string) BenchmarkServerResult {
	start := time.Now()

	// Create lookup input
	input := &LookupInput{
		DeviceId:   deviceId,
		Hostname:   hostname,
		RecordType: "A",
		Server:     &server,
		Timeout:    new(int),
	}
	*input.Timeout = 5 // 5 second timeout

	// Perform lookup
	_, err := s.PerformLookup(ctx, input)

	responseTimeMs := int(time.Since(start).Milliseconds())

	if err != nil {
		errMsg := err.Error()
		return BenchmarkServerResult{
			Server:         server,
			ResponseTimeMs: -1,
			Status:         "UNREACHABLE",
			Success:        false,
			Error:          &errMsg,
		}
	}

	return BenchmarkServerResult{
		Server:         server,
		ResponseTimeMs: responseTimeMs,
		Status:         "GOOD",
		Success:        true,
		Error:          nil,
	}
}
