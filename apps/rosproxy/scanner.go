package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Note: ScanTask is defined in main.go to avoid duplication

// Device represents a discovered device
type Device struct {
	IP       string   `json:"ip"`
	Hostname string   `json:"hostname,omitempty"`
	Ports    []int    `json:"ports"`
	Type     string   `json:"type"`
	Vendor   string   `json:"vendor"`
	Services []string `json:"services"`
}

// Scanner manages concurrent network scanning
type Scanner struct {
	tasks       map[string]*ScanTask
	mu          sync.RWMutex
	maxWorkers  int
	timeout     time.Duration
	targetPorts []int
}

// Global scanner instance
var scanner = &Scanner{
	tasks:       make(map[string]*ScanTask),
	maxWorkers:  20,                               // Increased for gateway scanning
	timeout:     2 * time.Second,                  // Faster timeout for HTTP endpoints
	targetPorts: []int{80, 443, 8728, 8729, 8291}, // MikroTik common ports
}

// HTTP API focused ports for automatic scanning
var httpApiPorts = []int{80, 443}

// handleScan starts a new network scan
func handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	var req struct {
		Subnet string `json:"subnet"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid_json", "Invalid JSON format")
		return
	}

	if req.Subnet == "" {
		errorResponse(w, http.StatusBadRequest, "missing_subnet", "Subnet is required")
		return
	}

	// Generate unique task ID
	taskID := fmt.Sprintf("scan_%d", time.Now().UnixNano())

	// Create scan task with cancellation context
	_, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID:        taskID,
		Subnet:    req.Subnet,
		StartTime: time.Now(),
		Status:    "running",
		Progress:  0,
		Results:   make([]Device, 0),
		Cancel:    cancel,
	}

	// Store task using the scanner pool from main.go
	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()

	// Start scan in goroutine
	go processScanTask(task)

	// Return task info
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
		"message": "Scan started successfully",
	})
}

// handleScanStatus returns the status of a scan
func handleScanStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET method is allowed")
		return
	}

	taskID := r.URL.Query().Get("task_id")
	if taskID == "" {
		errorResponse(w, http.StatusBadRequest, "missing_task_id", "task_id parameter is required")
		return
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[taskID]
	scannerPool.mu.RUnlock()

	if !exists {
		errorResponse(w, http.StatusNotFound, "task_not_found", "Task not found")
		return
	}

	response := map[string]interface{}{
		"task_id":    task.ID,
		"subnet":     task.Subnet,
		"start_time": task.StartTime.Unix(),
		"status":     task.Status,
		"progress":   task.Progress,
		"results":    task.Results,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleScanStop stops a running scan
func handleScanStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	var req struct {
		TaskID string `json:"task_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid_json", "Invalid JSON format")
		return
	}

	if req.TaskID == "" {
		errorResponse(w, http.StatusBadRequest, "missing_task_id", "task_id is required")
		return
	}

	scannerPool.mu.RLock()
	task, exists := scannerPool.activeTasks[req.TaskID]
	scannerPool.mu.RUnlock()

	if !exists {
		errorResponse(w, http.StatusNotFound, "task_not_found", "Task not found")
		return
	}

	// Cancel the task
	if task.Cancel != nil {
		task.Cancel()
	}

	task.Status = "cancelled"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"task_id": req.TaskID,
		"status":  "cancelled",
		"message": "Scan stopped successfully",
	})
}

// handleAutoScan starts an automatic gateway scan
func handleAutoScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	// Generate unique task ID for auto scan
	taskID := fmt.Sprintf("auto_scan_%d", time.Now().UnixNano())

	// Create scan task with cancellation context
	_, cancel := context.WithCancel(context.Background())
	task := &ScanTask{
		ID:        taskID,
		Subnet:    "192.168.0-255.1", // Gateway range
		StartTime: time.Now(),
		Status:    "running",
		Progress:  0,
		Results:   make([]Device, 0),
		Cancel:    cancel,
	}

	// Store task using the scanner pool from main.go
	scannerPool.mu.Lock()
	scannerPool.activeTasks[taskID] = task
	scannerPool.mu.Unlock()

	// Start gateway scan in goroutine
	go processGatewayScanTask(task)

	// Return task info
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"task_id": taskID,
		"status":  "started",
		"message": "Gateway auto-scan started successfully",
	})
}

// processGatewayScanTask executes automatic gateway scanning for 192.168.0-255.1
func processGatewayScanTask(task *ScanTask) {
	ctx := context.Background()
	if task.Cancel != nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithCancel(ctx)
		defer cancel()
	}

	// Generate gateway IPs: 192.168.0.1 to 192.168.255.1
	ips := generateGatewayIPs()

	totalIPs := len(ips)
	if totalIPs == 0 {
		task.Status = "completed"
		task.Progress = 100
		return
	}

	// Channel for work distribution
	jobs := make(chan string, scanner.maxWorkers)
	results := make(chan Device, scanner.maxWorkers)

	// Worker pool
	var wg sync.WaitGroup
	for i := 0; i < scanner.maxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					if device := scanGatewayIP(ctx, ip, httpApiPorts, scanner.timeout); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	// Result collector
	go func() {
		wg.Wait()
		close(results)
	}()

	// Progress tracker and result collector
	processed := 0
	var deviceResults []Device
	go func() {
		for device := range results {
			processed++
			progress := (processed * 100) / totalIPs
			task.Progress = progress

			// Store device object directly
			deviceResults = append(deviceResults, device)
			task.Results = deviceResults
		}
	}()

	// Send jobs
	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
			}
		}
	}()

	// Wait for completion
	wg.Wait()

	// Update final status
	task.Status = "completed"
	task.Progress = 100

	// Cleanup task after 30 minutes (shorter for auto scans)
	go func() {
		time.Sleep(30 * time.Minute)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

// generateGatewayIPs generates all 192.168.x.1 addresses (256 total)
func generateGatewayIPs() []string {
	var ips []string
	for i := 0; i <= 255; i++ {
		ip := fmt.Sprintf("192.168.%d.1", i)
		ips = append(ips, ip)
	}
	return ips
}

// RouterOSInfo represents the information extracted from a RouterOS API response
type RouterOSInfo struct {
	Version      string
	Architecture string
	BoardName    string
	Confidence   int
	IsValid      bool
}

// validateRouterOSResponse validates if the response body is from a RouterOS device
func validateRouterOSResponse(body []byte) RouterOSInfo {
	var result RouterOSInfo

	// Try to parse JSON response
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return result // Invalid JSON - not RouterOS
	}

	confidence := 0

	// Check for RouterOS-specific fields (RouterOS v6 and v7+)
	routerOSFields := []string{
		"version", "version-string", "architecture", "architecture-name", "board-name",
		"cpu", "cpu-count", "cpu-frequency", "total-memory", "free-memory",
		"platform", "factory-software", "uptime", // RouterOS v7+ specific fields
	}

	presentFields := 0
	for _, field := range routerOSFields {
		if _, exists := data[field]; exists {
			presentFields++
			confidence += 10 // 10 points per RouterOS field
		}
	}

	// Extract version information
	if version, ok := data["version"].(string); ok {
		result.Version = version
		// Check version format (like "7.8" or "6.49.8")
		if matched, _ := regexp.MatchString(`^\d+\.\d+`, version); matched {
			confidence += 20
		}
		if strings.Contains(strings.ToLower(version), "routeros") {
			confidence += 30
		}
	} else if versionString, ok := data["version-string"].(string); ok {
		result.Version = versionString
		confidence += 15
	}

	// Extract architecture (check both v6 and v7+ field names)
	if arch, ok := data["architecture"].(string); ok {
		result.Architecture = arch
		if strings.Contains(strings.ToLower(arch), "arm") || strings.Contains(strings.ToLower(arch), "x86") || strings.Contains(strings.ToLower(arch), "mips") {
			confidence += 15
		}
	} else if archName, ok := data["architecture-name"].(string); ok {
		result.Architecture = archName
		if strings.Contains(strings.ToLower(archName), "arm") || strings.Contains(strings.ToLower(archName), "x86") || strings.Contains(strings.ToLower(archName), "mips") {
			confidence += 15
		}
	}

	// Extract board name
	if boardName, ok := data["board-name"].(string); ok {
		result.BoardName = boardName
		confidence += 15
	}

	// Extra confidence for RouterOS-specific values
	if platform, ok := data["platform"].(string); ok {
		if strings.Contains(strings.ToLower(platform), "mikrotik") {
			confidence += 25 // High confidence for MikroTik platform
		}
	}

	result.Confidence = confidence
	// Must have at least 3 RouterOS fields and confidence > 40 to be valid
	result.IsValid = presentFields >= 3 && confidence >= 40

	return result
}

// checkRouterOSAPI attempts to verify if the device is actually running RouterOS
func checkRouterOSAPI(ctx context.Context, ip string, port int, timeout time.Duration) *RouterOSInfo {
	protocol := "http"
	if port == 443 {
		protocol = "https"
	}

	url := fmt.Sprintf("%s://%s:%d/rest/system/resource", protocol, ip, port)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // Skip cert verification
		},
	}

	// Create request with Basic Auth (default admin with no password)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil
	}
	req.SetBasicAuth("admin", "")

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	// For 200 responses, validate the content
	if resp.StatusCode == 200 {
		validation := validateRouterOSResponse(body)
		if validation.IsValid {
			return &validation
		}
		return nil // Response was 200 but not RouterOS
	}

	// For 401 responses, this likely indicates RouterOS with authentication required
	if resp.StatusCode == 401 {
		// Check for RouterOS-specific headers or content
		contentType := resp.Header.Get("Content-Type")

		// RouterOS typically returns JSON error messages for 401 on REST API
		if strings.Contains(strings.ToLower(contentType), "application/json") {
			// Additional validation: check if response body looks like RouterOS error
			if strings.Contains(strings.ToLower(string(body)), "unauthorized") ||
				strings.Contains(strings.ToLower(string(body)), "error") {
				return &RouterOSInfo{
					IsValid:    true,
					Confidence: 35, // Moderate confidence for auth-required detection
				}
			}
		}

		// Fallback: if WWW-Authenticate header is present and contains "basic"
		wwwAuth := resp.Header.Get("WWW-Authenticate")
		if strings.Contains(strings.ToLower(wwwAuth), "basic") {
			return &RouterOSInfo{
				IsValid:    true,
				Confidence: 30, // Lower confidence for auth-only detection
			}
		}

		// Even without WWW-Authenticate, 401 on /rest/system/resource is strong indication of RouterOS
		// Very few other devices use this specific REST API path
		return &RouterOSInfo{
			IsValid:    true,
			Confidence: 25, // Lower confidence but still valid
		}
	}

	return nil // Any other status means not RouterOS
}

// scanGatewayIP scans a single gateway IP specifically for RouterOS devices
func scanGatewayIP(ctx context.Context, ip string, ports []int, timeout time.Duration) *Device {
	var openPorts []int
	var services []string
	var routerOSInfo *RouterOSInfo

	// First, check if RouterOS API is available on any port
	for _, port := range ports {
		select {
		case <-ctx.Done():
			return nil
		default:
			if isPortOpen(ctx, ip, port, timeout) {
				openPorts = append(openPorts, port)
				services = append(services, getServiceName(port))

				// Try to verify RouterOS API on this port
				if info := checkRouterOSAPI(ctx, ip, port, timeout); info != nil {
					routerOSInfo = info
					break // Found RouterOS, no need to check other ports
				}
			}
		}
	}

	// Only return device if we confirmed RouterOS or found MikroTik-specific ports
	if routerOSInfo != nil && routerOSInfo.IsValid {
		// Try to resolve hostname
		hostname := ""
		if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
			hostname = names[0]
		}

		// Update service names to reflect MikroTik detection
		mikrotikServices := make([]string, len(services))
		for i, service := range services {
			switch service {
			case "http":
				mikrotikServices[i] = "mikrotik-rest" // HTTP REST API
			case "https":
				mikrotikServices[i] = "mikrotik-rest-ssl" // HTTPS REST API
			default:
				mikrotikServices[i] = service // Keep original service names for API/Winbox ports
			}
		}

		return &Device{
			IP:       ip,
			Hostname: hostname,
			Ports:    openPorts,
			Type:     "router",
			Vendor:   "MikroTik",
			Services: mikrotikServices,
		}
	}

	return nil // Not a RouterOS device
}

// processScanTask executes the actual network scan
func processScanTask(task *ScanTask) {
	ctx := context.Background()
	if task.Cancel != nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithCancel(ctx)
		defer cancel()
	}

	// Parse IP range from subnet
	ips, err := parseIPRange(task.Subnet)
	if err != nil {
		task.Status = "error"
		return
	}

	totalIPs := len(ips)
	if totalIPs == 0 {
		task.Status = "completed"
		task.Progress = 100
		return
	}

	// Channel for work distribution
	jobs := make(chan string, scanner.maxWorkers)
	results := make(chan Device, scanner.maxWorkers)

	// Worker pool
	var wg sync.WaitGroup
	for i := 0; i < scanner.maxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					if device := scanIP(ctx, ip, scanner.targetPorts, scanner.timeout); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	// Result collector
	go func() {
		wg.Wait()
		close(results)
	}()

	// Progress tracker and result collector
	processed := 0
	var deviceResults []Device
	go func() {
		for device := range results {
			processed++
			progress := (processed * 100) / totalIPs
			task.Progress = progress

			// Store device object directly
			deviceResults = append(deviceResults, device)
			task.Results = deviceResults
		}
	}()

	// Send jobs
	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
			}
		}
	}()

	// Wait for completion
	wg.Wait()

	// Update final status
	task.Status = "completed"
	task.Progress = 100

	// Cleanup task after 1 hour
	go func() {
		time.Sleep(1 * time.Hour)
		scannerPool.mu.Lock()
		delete(scannerPool.activeTasks, task.ID)
		scannerPool.mu.Unlock()
	}()
}

// parseIPRange parses CIDR notation or IP range into individual IPs
func parseIPRange(subnet string) ([]string, error) {
	var ips []string

	if strings.Contains(subnet, "/") {
		// CIDR notation
		_, ipNet, err := net.ParseCIDR(subnet)
		if err != nil {
			return nil, err
		}

		// Generate all IPs in CIDR range
		for ip := ipNet.IP.Mask(ipNet.Mask); ipNet.Contains(ip); incIP(ip) {
			ips = append(ips, ip.String())
			// Limit to prevent memory issues on large ranges
			if len(ips) > 1000 {
				break
			}
		}
	} else if strings.Contains(subnet, "-") {
		// Range notation (e.g., 192.168.1.1-192.168.1.100)
		parts := strings.Split(subnet, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid IP range format")
		}

		startIP := net.ParseIP(strings.TrimSpace(parts[0]))
		endIP := net.ParseIP(strings.TrimSpace(parts[1]))
		if startIP == nil || endIP == nil {
			return nil, fmt.Errorf("invalid IP addresses in range")
		}

		// Convert to 4-byte representation
		start := startIP.To4()
		end := endIP.To4()
		if start == nil || end == nil {
			return nil, fmt.Errorf("only IPv4 ranges supported")
		}

		// Generate IPs in range
		for ip := make(net.IP, 4); ; incIP(ip) {
			copy(ip, start)
			ips = append(ips, ip.String())
			if ip.Equal(end) || len(ips) > 1000 {
				break
			}
			incIP(start)
		}
	} else {
		// Single IP
		if net.ParseIP(subnet) != nil {
			ips = append(ips, subnet)
		} else {
			return nil, fmt.Errorf("invalid IP format")
		}
	}

	return ips, nil
}

// incIP increments an IP address
func incIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

// scanIP scans a single IP for open ports and identifies MikroTik devices with verification
func scanIP(ctx context.Context, ip string, ports []int, timeout time.Duration) *Device {
	var openPorts []int
	var services []string

	// Channel for port scan results
	portChan := make(chan int, len(ports))

	// Limit concurrent port scans per IP to conserve resources
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup

	for _, port := range ports {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			select {
			case <-ctx.Done():
				return
			default:
				if isPortOpen(ctx, ip, p, timeout) {
					portChan <- p
				}
			}
		}(port)
	}

	// Close channel when all goroutines complete
	go func() {
		wg.Wait()
		close(portChan)
	}()

	// Collect open ports
	for port := range portChan {
		openPorts = append(openPorts, port)
		services = append(services, getServiceName(port))
	}

	if len(openPorts) == 0 {
		return nil
	}

	// Try to resolve hostname
	hostname := ""
	if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
		hostname = names[0]
	}

	// Identify device type based on open ports
	deviceType := "unknown"
	vendor := "unknown"

	// Check for specific MikroTik API ports first (high confidence)
	if containsPort(openPorts, 8728) || containsPort(openPorts, 8729) || containsPort(openPorts, 8291) {
		deviceType = "router"
		vendor = "MikroTik"
	} else if containsPort(openPorts, 80) || containsPort(openPorts, 443) {
		// For HTTP/HTTPS ports, verify RouterOS API
		for _, port := range []int{80, 443} {
			if containsPort(openPorts, port) {
				if info := checkRouterOSAPI(ctx, ip, port, timeout); info != nil && info.IsValid {
					deviceType = "router"
					vendor = "MikroTik"
					break
				}
			}
		}
		// If no RouterOS API found, don't classify as router
		if deviceType == "unknown" {
			return nil // Not a MikroTik device
		}
	}

	// Only return devices that are confirmed MikroTik or have MikroTik-specific ports
	if vendor == "MikroTik" || containsPort(openPorts, 8728) || containsPort(openPorts, 8729) || containsPort(openPorts, 8291) {
		// Update service names to reflect MikroTik detection when vendor is MikroTik
		finalServices := services
		if vendor == "MikroTik" {
			mikrotikServices := make([]string, len(services))
			for i, service := range services {
				switch service {
				case "http":
					mikrotikServices[i] = "mikrotik-rest" // HTTP REST API
				case "https":
					mikrotikServices[i] = "mikrotik-rest-ssl" // HTTPS REST API
				default:
					mikrotikServices[i] = service // Keep original service names for API/Winbox ports
				}
			}
			finalServices = mikrotikServices
		}

		return &Device{
			IP:       ip,
			Hostname: hostname,
			Ports:    openPorts,
			Type:     deviceType,
			Vendor:   vendor,
			Services: finalServices,
		}
	}

	return nil // Not a MikroTik device
}

// isPortOpen checks if a specific port is open on an IP
func isPortOpen(ctx context.Context, ip string, port int, timeout time.Duration) bool {
	address := net.JoinHostPort(ip, strconv.Itoa(port))

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return false
	}
	defer conn.Close()

	return true
}

// getServiceName returns service name for common ports
func getServiceName(port int) string {
	services := map[int]string{
		80:   "http",
		443:  "https",
		8728: "mikrotik-api",
		8729: "mikrotik-api-ssl",
		8291: "mikrotik-winbox",
	}

	if name, exists := services[port]; exists {
		return name
	}
	return fmt.Sprintf("tcp/%d", port)
}

// containsPort checks if a port exists in the slice
func containsPort(ports []int, port int) bool {
	for _, p := range ports {
		if p == port {
			return true
		}
	}
	return false
}
