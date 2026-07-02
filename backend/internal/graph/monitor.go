package graph

import (
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/simplequeue"
	"nasnet-panel/pkg/utils"
)

// RouterCredentials stores connection info for a RouterOS device.
type RouterCredentials struct {
	IP       string
	Username string
	Password string
	Port     int
}

// InterfaceStats holds traffic statistics for an interface.
type InterfaceStats struct {
	RxBytes   int64
	TxBytes   int64
	Timestamp time.Time
}

// RouterMonitor tracks interface traffic for a single RouterOS device.
type RouterMonitor struct {
	credentials        RouterCredentials
	client             *routeros.Client
	queues             map[string]*simplequeue.Queue[TrafficData]
	previousStats      map[string]InterfaceStats
	previousInterfaces []string
	queueSize          int
	mu                 sync.RWMutex
	done               chan struct{}
	ticker             *time.Ticker
	stopOnce           sync.Once
}

var (
	activeMonitors = make(map[string]*RouterMonitor)
	monitorsMu     sync.RWMutex
)

// StartMonitoring creates and starts a monitoring goroutine for a RouterOS device.
// The function runs in a separate goroutine and periodically fetches interface statistics.
// If a monitor already exists for the given IP, it is reused and not recreated.
// queueSize specifies the capacity for each interface's traffic data queue.
func StartMonitoring(credentials RouterCredentials, interval time.Duration, queueSize int) error {
	monitorsMu.Lock()
	defer monitorsMu.Unlock()

	// If monitor already exists for this IP, reuse it without recreating
	if _, ok := activeMonitors[credentials.IP]; ok {
		log.Printf("Monitor already running for router %s, reusing existing monitor", credentials.IP)
		return nil
	}

	client, err := routeros.NewClient(routeros.ConnectionConfig{
		Address:  credentials.IP,
		Username: credentials.Username,
		Password: credentials.Password,
		Port:     credentials.Port,
	})
	if err != nil {
		return fmt.Errorf("failed to create RouterOS client for %s: %w", credentials.IP, err)
	}

	monitor := &RouterMonitor{
		credentials:        credentials,
		client:             client,
		queues:             make(map[string]*simplequeue.Queue[TrafficData]),
		previousStats:      make(map[string]InterfaceStats),
		previousInterfaces: []string{},
		queueSize:          queueSize,
		done:               make(chan struct{}),
		ticker:             time.NewTicker(interval),
	}

	activeMonitors[credentials.IP] = monitor

	// Start monitoring in a separate goroutine
	go monitor.run()

	log.Printf("Started monitoring interfaces for router %s", credentials.IP)
	return nil
}

// StopMonitoring stops the monitoring goroutine for a RouterOS device.
func StopMonitoring(ip string) {
	monitorsMu.Lock()
	defer monitorsMu.Unlock()

	if monitor, ok := activeMonitors[ip]; ok {
		monitor.Stop()
		delete(activeMonitors, ip)
		log.Printf("Stopped monitoring router %s", ip)
	}
}

// GetMonitor returns the monitor for a given router IP.
func GetMonitor(ip string) *RouterMonitor {
	monitorsMu.RLock()
	defer monitorsMu.RUnlock()
	return activeMonitors[ip]
}

// GetInterfaceQueue returns the traffic queue for a specific interface.
func (m *RouterMonitor) GetInterfaceQueue(interfaceName string) *simplequeue.Queue[TrafficData] {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.queues[interfaceName]
}

// Stop gracefully stops the monitor.
func (m *RouterMonitor) Stop() {
	m.stopOnce.Do(func() {
		close(m.done)
		m.ticker.Stop()
		if m.client != nil {
			m.client.Close()
		}
	})
}

// run is the main monitoring loop.
func (m *RouterMonitor) run() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Monitor for %s crashed: %v", m.credentials.IP, r)
		}
	}()

	// Initial fetch
	m.fetchAndUpdateStats()

	for {
		select {
		case <-m.done:
			return
		case <-m.ticker.C:
			m.fetchAndUpdateStats()
		}
	}
}

// fetchAndUpdateStats fetches current interface statistics and updates queues.
func (m *RouterMonitor) fetchAndUpdateStats() {
	interfaces, err := m.client.ListInterfaces()
	if err != nil {
		if isCredentialError(err) {
			log.Printf("Credentials invalid for router %s - stopping monitor", m.credentials.IP)
			m.Stop()
			// Remove from active monitors
			monitorsMu.Lock()
			delete(activeMonitors, m.credentials.IP)
			monitorsMu.Unlock()
			return
		}
		log.Printf("Failed to fetch interfaces from %s: %v", m.credentials.IP, err)
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Build current interface list
	currentInterfaces := make([]string, 0, len(interfaces))
	currentStats := make(map[string]InterfaceStats)

	now := time.Now()

	for _, iface := range interfaces {
		ifName := iface.Name
		currentInterfaces = append(currentInterfaces, ifName)

		var rxBytes, txBytes int64
		if iface.RxByte != nil {
			rxBytes = *iface.RxByte
		}
		if iface.TxByte != nil {
			txBytes = *iface.TxByte
		}

		currentStats[ifName] = InterfaceStats{
			RxBytes:   rxBytes,
			TxBytes:   txBytes,
			Timestamp: now,
		}

		// Create queue for new interfaces
		if _, exists := m.queues[ifName]; !exists {
			m.queues[ifName] = simplequeue.New[TrafficData](ifName, m.queueSize)
		}

		// Calculate rate and push to queue
		m.calculateAndPushTraffic(ifName, currentStats[ifName])
	}

	// Remove queues for deleted interfaces
	for _, prevIfName := range m.previousInterfaces {
		found := false
		for _, currIfName := range currentInterfaces {
			if prevIfName == currIfName {
				found = true
				break
			}
		}
		if !found {
			delete(m.queues, prevIfName)
			delete(m.previousStats, prevIfName)
			log.Printf("Interface %s removed from monitoring on %s", prevIfName, m.credentials.IP)
		}
	}

	m.previousInterfaces = currentInterfaces
	m.previousStats = currentStats
}

// calculateAndPushTraffic calculates traffic rate and pushes data to the queue.
func (m *RouterMonitor) calculateAndPushTraffic(ifName string, currentStats InterfaceStats) {
	rxStr, txStr := "0 B/s", "0 B/s"

	if prevStats, exists := m.previousStats[ifName]; exists {
		timeDiffSecs := currentStats.Timestamp.Sub(prevStats.Timestamp).Seconds()
		if timeDiffSecs > 0 {
			rxRate := float64(currentStats.RxBytes-prevStats.RxBytes) / timeDiffSecs
			txRate := float64(currentStats.TxBytes-prevStats.TxBytes) / timeDiffSecs

			rxStr = formatRate(int64(rxRate))
			txStr = formatRate(int64(txRate))
		}
	}

	traffic := TrafficData{
		RxBytes:   currentStats.RxBytes,
		TxBytes:   currentStats.TxBytes,
		RX:        rxStr,
		TX:        txStr,
		Timestamp: currentStats.Timestamp,
	}

	if queue, exists := m.queues[ifName]; exists {
		queue.Push(traffic)
	}
}

// formatRate formats bytes per second as a human-readable string.
func formatRate(bytesPerSecond int64) string {
	if bytesPerSecond < 0 {
		bytesPerSecond = 0
	}
	return utils.BytesToSizeString(bytesPerSecond) + "/s"
}

// GetRouterStats returns all current traffic stats for a router.
func (m *RouterMonitor) GetRouterStats() map[string][]TrafficData {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := make(map[string][]TrafficData)
	for ifName, queue := range m.queues {
		stats[ifName] = queue.GetAll()
	}
	return stats
}

// GetInterfaceStats returns traffic stats for a specific interface.
func (m *RouterMonitor) GetInterfaceStats(ifName string) []TrafficData {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if queue, exists := m.queues[ifName]; exists {
		return queue.GetAll()
	}
	return nil
}

// GetActiveRouters returns a list of currently monitored router IPs.
func GetActiveRouters() []string {
	monitorsMu.RLock()
	defer monitorsMu.RUnlock()

	ips := make([]string, 0, len(activeMonitors))
	for ip := range activeMonitors {
		ips = append(ips, ip)
	}
	return ips
}

// isCredentialError checks if an error is due to invalid credentials.
func isCredentialError(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())

	credentialKeywords := []string{
		"after login:",
		"no such user",
		"invalid user",
		"invalid password",
		"authentication failed",
		"login failed",
		"unauthorized",
	}

	for _, keyword := range credentialKeywords {
		if strings.Contains(errMsg, keyword) {
			return true
		}
	}

	return false
}
