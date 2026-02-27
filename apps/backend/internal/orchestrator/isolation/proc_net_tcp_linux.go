//go:build linux

package isolation

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"

	"go.uber.org/zap"
)

const (
	// ProcNetTCPPath is the path to /proc/net/tcp on Linux
	ProcNetTCPPath = "/proc/net/tcp"
)

// ProcessBindingConflict represents a detected process binding conflict
type ProcessBindingConflict struct {
	LocalIP   string
	LocalPort int
	State     string // TCP state (LISTEN, ESTABLISHED, etc.)
}

// parseProcNetTCP parses /proc/net/tcp and returns a list of conflicts for the given bind IP
// Returns a list of local addresses (IP:port) that are bound on the system
func (iv *IsolationVerifier) parseProcNetTCP(bindIP string) ([]ProcessBindingConflict, error) {
	file, err := os.Open(ProcNetTCPPath)
	if err != nil {
		// Graceful degradation: if /proc/net/tcp is unreadable, log and return nil (non-fatal)
		iv.logger.Debug("failed to open /proc/net/tcp, process binding verification skipped",
			zap.String("path", ProcNetTCPPath),
			zap.Error(err))
		return nil, nil
	}
	defer file.Close()

	var conflicts []ProcessBindingConflict
	scanner := bufio.NewScanner(file)

	// Skip header line (line 0: "  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode")
	lineNum := 0
	for scanner.Scan() {
		line := scanner.Text()
		lineNum++

		// Skip header
		if lineNum == 1 {
			continue
		}

		// Parse each line in /proc/net/tcp
		// Format (tab/space separated):
		// sl local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
		// Example:
		// 123: 0100007F:0050 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 32968 1 0000000000000000 100 0 0 10 0
		//
		// local_address is in hex format: XXXX XXXX:YYYY where XXXX XXXX is IP (little-endian) and YYYY is port

		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}

		// local_address is at index 1
		localAddrStr := fields[1]
		// state is at index 3
		state := fields[3]

		// Parse local_address (hex IP:port in little-endian format)
		ipPort := strings.Split(localAddrStr, ":")
		if len(ipPort) != 2 {
			continue
		}

		// Convert hex IP to standard format
		ipHex := ipPort[0]
		portHex := ipPort[1]

		// IP is in little-endian format (4 bytes as 8 hex digits)
		ip, err := hexToIP(ipHex)
		if err != nil {
			continue
		}

		// Port is big-endian (2 bytes as 4 hex digits)
		port, err := strconv.ParseInt(portHex, 16, 32)
		if err != nil {
			continue
		}

		// Check if this IP matches the bind IP we're checking
		if ip == bindIP {
			conflicts = append(conflicts, ProcessBindingConflict{
				LocalIP:   ip,
				LocalPort: int(port),
				State:     state,
			})
		}
	}

	if err := scanner.Err(); err != nil {
		iv.logger.Warn("error reading /proc/net/tcp",
			zap.Error(err))
		// Non-fatal error, return what we parsed so far
		return conflicts, nil
	}

	return conflicts, nil
}

// hexToIP converts a hex IP address string to standard dotted decimal format
// Input format: XXXX XXXX (8 hex digits, little-endian)
// Example: 0100007F → 127.0.0.1
func hexToIP(hexIP string) (string, error) {
	// Pad if necessary
	if len(hexIP) < 8 {
		hexIP = strings.Repeat("0", 8-len(hexIP)) + hexIP
	}

	// Parse as 4-byte integer (little-endian)
	val, err := strconv.ParseInt(hexIP, 16, 32)
	if err != nil {
		return "", fmt.Errorf("failed to parse hex IP: %w", err)
	}

	// Convert little-endian bytes to IP address
	// In /proc/net/tcp, the bytes are in little-endian format
	b := []byte{
		byte(val & 0xFF),
		byte((val >> 8) & 0xFF),
		byte((val >> 16) & 0xFF),
		byte((val >> 24) & 0xFF),
	}

	return net.IPv4(b[3], b[2], b[1], b[0]).String(), nil
}
