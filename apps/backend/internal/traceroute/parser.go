package traceroute

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Parser parses MikroTik traceroute output into structured data.
type Parser struct {
	// Regex patterns for parsing
	hopLineRegex     *regexp.Regexp
	timeoutRegex     *regexp.Regexp
	unreachableRegex *regexp.Regexp
}

// NewParser creates a new traceroute output parser.
func NewParser() *Parser {
	return &Parser{
		// Match hop lines like: " 1  192.168.1.1  0.5ms  0.6ms  0.4ms" or " 1  *  *  *"
		// Supports IPv4, IPv6, and hostnames in the address field
		hopLineRegex: regexp.MustCompile(`^\s*(\d+)\s+(\S+)\s+([\d.]+ms|\*)\s+([\d.]+ms|\*)\s+([\d.]+ms|\*)`),
		// Match timeout indicators
		timeoutRegex: regexp.MustCompile(`\*`),
		// Match unreachable messages
		unreachableRegex: regexp.MustCompile(`!H|!N|!P`),
	}
}

// ParseLine parses a single line of MikroTik traceroute output.
// Returns the hop data if the line contains hop information, or nil if it's not a hop line.
func (p *Parser) ParseLine(line string) *Hop {
	line = strings.TrimSpace(line)
	if line == "" {
		return nil
	}

	// Try to match hop line
	matches := p.hopLineRegex.FindStringSubmatch(line)
	if len(matches) < 6 {
		return nil
	}

	// Extract hop number
	hopNum, err := strconv.Atoi(matches[1])
	if err != nil {
		return nil
	}

	// Extract address
	address := matches[2]
	var hopAddress *string
	var hostname *string

	// Check if address is a timeout indicator
	if address == "*" || address == "* * *" {
		hopAddress = nil
	} else {
		hopAddress = &address
		// TODO: Perform reverse DNS lookup for hostname if needed
		hostname = nil
	}

	// Parse probes (3 probe results)
	probes := make([]HopProbe, 0, 3)
	totalLatency := 0.0
	successCount := 0

	for i := 3; i <= 5 && i < len(matches); i++ {
		probeStr := matches[i]
		probe := HopProbe{
			ProbeNumber: i - 2,
		}

		if probeStr == "*" || probeStr == "" {
			probe.Success = false
			probe.LatencyMs = nil
		} else {
			// Parse latency (remove "ms" suffix)
			latencyStr := strings.TrimSuffix(probeStr, "ms")
			latency, parseErr := strconv.ParseFloat(latencyStr, 64)
			if parseErr == nil {
				probe.Success = true
				probe.LatencyMs = &latency
				totalLatency += latency
				successCount++
			} else {
				probe.Success = false
				probe.LatencyMs = nil
			}
		}

		probes = append(probes, probe)
	}

	// Calculate average latency and packet loss
	var avgLatency *float64
	if successCount > 0 {
		avg := totalLatency / float64(successCount)
		avgLatency = &avg
	}

	packetLoss := (float64(len(probes)-successCount) / float64(len(probes))) * 100

	// Determine hop status
	status := p.determineStatus(line, successCount, len(probes))

	return &Hop{
		HopNumber:    hopNum,
		Address:      hopAddress,
		Hostname:     hostname,
		Status:       status,
		AvgLatencyMs: avgLatency,
		PacketLoss:   packetLoss,
		Probes:       probes,
	}
}

// determineStatus determines the hop status based on the line content.
func (p *Parser) determineStatus(line string, successCount, _ int) HopStatus {
	// Check for explicit unreachable indicators
	if p.unreachableRegex.MatchString(line) {
		return HopStatusUnreachable
	}

	// Check for timeouts
	if successCount == 0 {
		return HopStatusTimeout
	}

	// Check for prohibited
	if strings.Contains(line, "!P") {
		return HopStatusProhibited
	}

	return HopStatusSuccess
}

// ParseMikroTikOutput parses complete MikroTik traceroute output.
// Example MikroTik output:
//
//	traceroute to 8.8.8.8 (8.8.8.8), 30 hops max
//	 1  192.168.1.1  0.5ms  0.6ms  0.4ms
//	 2  10.0.0.1  5.2ms  5.1ms  5.3ms
//	 3  8.8.8.8  15.3ms  15.2ms  15.4ms
func (p *Parser) ParseMikroTikOutput(output, target string, protocol Protocol, maxHops int) (*Result, error) {
	lines := strings.Split(output, "\n")

	result := &Result{
		Target:   target,
		Protocol: protocol,
		MaxHops:  maxHops,
		Hops:     []Hop{},
	}

	for _, line := range lines {
		// Try to parse as hop line
		hop := p.ParseLine(line)
		if hop != nil {
			result.Hops = append(result.Hops, *hop)
		}

		// Extract target IP from header line if present
		if strings.Contains(line, "traceroute to") && strings.Contains(line, "(") {
			// Extract IP from format: "traceroute to example.com (1.2.3.4)" or IPv6
			start := strings.Index(line, "(")
			end := strings.Index(line, ")")
			if start != -1 && end != -1 && end > start {
				result.TargetIP = line[start+1 : end]
			}
		}
	}

	// If we didn't extract target IP from output, use target as IP
	if result.TargetIP == "" {
		result.TargetIP = target
	}

	// Determine if destination was reached
	if len(result.Hops) > 0 {
		lastHop := result.Hops[len(result.Hops)-1]
		if lastHop.Address != nil && *lastHop.Address == result.TargetIP {
			result.ReachedDestination = true
		}
	}

	if len(result.Hops) == 0 {
		return nil, fmt.Errorf("no hops found in traceroute output")
	}

	return result, nil
}

// BuildMikroTikCommand builds the MikroTik traceroute command string.
func BuildMikroTikCommand(input Input) string {
	var cmd strings.Builder
	fmt.Fprintf(&cmd, "/tool traceroute address=%s", input.Target)

	if input.MaxHops > 0 {
		fmt.Fprintf(&cmd, " max-hops=%d", input.MaxHops)
	}

	if input.Timeout > 0 {
		// MikroTik expects timeout in seconds, input is in milliseconds
		timeoutSec := input.Timeout / 1000
		if timeoutSec < 1 {
			timeoutSec = 1
		}
		fmt.Fprintf(&cmd, " timeout=%ds", timeoutSec)
	}

	if input.ProbeCount > 0 {
		fmt.Fprintf(&cmd, " count=%d", input.ProbeCount)
	}

	// MikroTik protocol parameter
	switch input.Protocol {
	case ProtocolICMP:
		cmd.WriteString(" protocol=icmp")
	case ProtocolUDP:
		cmd.WriteString(" protocol=udp")
	case ProtocolTCP:
		cmd.WriteString(" protocol=tcp")
	default:
		cmd.WriteString(" protocol=icmp")
	}

	return cmd.String()
}
