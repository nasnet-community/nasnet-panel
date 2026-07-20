package routeros

import (
	"fmt"
	"strings"
)

// NetwatchType represents the probe type of a Netwatch entry.
type NetwatchType string

// Netwatch probe type constants.
const (
	NetwatchTypeICMP     NetwatchType = "icmp"
	NetwatchTypeTCPConn  NetwatchType = "tcp-conn"
	NetwatchTypeHTTPGet  NetwatchType = "http-get"
	NetwatchTypeHTTPSGet NetwatchType = "https-get"
	NetwatchTypeDNS      NetwatchType = "dns"
	NetwatchTypeSimple   NetwatchType = "simple"
)

// NetwatchStatus represents the current probe status.
type NetwatchStatus string

// Netwatch probe status constants.
const (
	NetwatchStatusUp      NetwatchStatus = "up"
	NetwatchStatusDown    NetwatchStatus = "down"
	NetwatchStatusUnknown NetwatchStatus = "unknown"
)

// NetwatchItem represents a /tool/netwatch entry.
type NetwatchItem struct {
	ID                string
	Name              string
	Host              string
	Type              NetwatchType
	Interval          string
	Timeout           string
	SrcAddress        string
	StartDelay        string
	StartupDelay      string
	UpScript          string
	DownScript        string
	TestScript        string
	IgnoreInitialUp   bool
	IgnoreInitialDown bool
	Disabled          bool
	Status            NetwatchStatus
	Since             string
	DoneTests         string
	FailedTests       string
	Port              string
	ThrHTTPTime       string
	HTTPCodeMin       string
	HTTPCodeMax       string
	Certificate       string
	CheckCertificate  bool
	PacketInterval    string
	PacketCount       string
	PacketSize        string
	TTL               string
	ThrMax            string
	ThrAvg            string
	ThrStdev          string
	ThrJitter         string
	ThrLossPercent    string
	ThrLossCount      string
	ThrTCPConnTime    string
	RecordType        string
	DNSServer         string
	Comment           string
}

func parseNetwatchItem(raw map[string]string) NetwatchItem {
	return NetwatchItem{
		ID:                raw[".id"],
		Name:              raw["name"],
		Host:              raw["host"],
		Type:              NetwatchType(raw["type"]),
		Interval:          raw["interval"],
		Timeout:           raw["timeout"],
		SrcAddress:        raw["src-address"],
		StartDelay:        raw["start-delay"],
		StartupDelay:      raw["startup-delay"],
		UpScript:          raw["up-script"],
		DownScript:        raw["down-script"],
		TestScript:        raw["test-script"],
		IgnoreInitialUp:   raw["ignore-initial-up"] == "true" || raw["ignore-initial-up"] == "yes",
		IgnoreInitialDown: raw["ignore-initial-down"] == "true" || raw["ignore-initial-down"] == "yes",
		Disabled:          raw["disabled"] == "true" || raw["disabled"] == "yes",
		Status:            NetwatchStatus(raw["status"]),
		Since:             raw["since"],
		DoneTests:         raw["done-tests"],
		FailedTests:       raw["failed-tests"],
		Port:              raw["port"],
		ThrHTTPTime:       raw["thr-http-time"],
		HTTPCodeMin:       raw["http-code-min"],
		HTTPCodeMax:       raw["http-code-max"],
		Certificate:       raw["certificate"],
		CheckCertificate:  raw["check-certificate"] == "true" || raw["check-certificate"] == "yes",
		PacketInterval:    raw["packet-interval"],
		PacketCount:       raw["packet-count"],
		PacketSize:        raw["packet-size"],
		TTL:               raw["ttl"],
		ThrMax:            raw["thr-max"],
		ThrAvg:            raw["thr-avg"],
		ThrStdev:          raw["thr-stdev"],
		ThrJitter:         raw["thr-jitter"],
		ThrLossPercent:    raw["thr-loss-percent"],
		ThrLossCount:      raw["thr-loss-count"],
		ThrTCPConnTime:    raw["thr-tcp-conn-time"],
		RecordType:        raw["record-type"],
		DNSServer:         raw["dns-server"],
		Comment:           raw["comment"],
	}
}

// NetwatchFilter defines optional server-side filter criteria for ListNetwatch.
type NetwatchFilter struct {
	Host     *string
	Type     *NetwatchType
	Status   *NetwatchStatus
	Disabled *bool
	Comment  *string
}

// ListNetwatch retrieves Netwatch entries, optionally filtered server-side.
func (c *Client) ListNetwatch(filter NetwatchFilter) ([]NetwatchItem, error) {
	args := []string{}

	if filter.Host != nil {
		args = append(args, "?=host="+*filter.Host)
	}
	if filter.Type != nil {
		args = append(args, "?=type="+string(*filter.Type))
	}
	if filter.Status != nil {
		args = append(args, "?=status="+string(*filter.Status))
	}
	if filter.Disabled != nil {
		v := "false"
		if *filter.Disabled {
			v = "true"
		}
		args = append(args, "?=disabled="+v)
	}
	if filter.Comment != nil {
		args = append(args, "?=comment="+*filter.Comment)
	}

	results, err := c.GetAll("/tool/netwatch", args...)
	if err != nil {
		if strings.Contains(err.Error(), "no results found") {
			return []NetwatchItem{}, nil
		}
		return nil, fmt.Errorf("failed to list netwatch entries: %w", err)
	}

	items := make([]NetwatchItem, len(results))
	for i, raw := range results {
		items[i] = parseNetwatchItem(raw)
	}

	return items, nil
}

// AddNetwatchParams holds parameters for creating a Netwatch entry.
type AddNetwatchParams struct {
	Host              string
	Type              NetwatchType
	Interval          *string
	Timeout           *string
	SrcAddress        *string
	StartDelay        *string
	StartupDelay      *string
	UpScript          *string
	DownScript        *string
	TestScript        *string
	IgnoreInitialUp   *bool
	IgnoreInitialDown *bool
	Disabled          *bool
	Port              *string
	ThrHTTPTime       *string
	HTTPCodeMin       *string
	HTTPCodeMax       *string
	Certificate       *string
	CheckCertificate  *bool
	PacketInterval    *string
	PacketCount       *string
	PacketSize        *string
	TTL               *string
	ThrMax            *string
	ThrAvg            *string
	ThrStdev          *string
	ThrJitter         *string
	ThrLossPercent    *string
	ThrLossCount      *string
	ThrTCPConnTime    *string
	RecordType        *string
	DNSServer         *string
	Comment           *string
}

// AddNetwatch creates a new Netwatch entry and returns it.
func (c *Client) AddNetwatch(params AddNetwatchParams) (NetwatchItem, error) {
	args := []string{
		"=host=" + params.Host,
		"=type=" + string(params.Type),
	}

	if params.Interval != nil {
		args = append(args, "=interval="+*params.Interval)
	}
	if params.Timeout != nil {
		args = append(args, "=timeout="+*params.Timeout)
	}
	if params.SrcAddress != nil {
		args = append(args, "=src-address="+*params.SrcAddress)
	}
	if params.StartDelay != nil {
		args = append(args, "=start-delay="+*params.StartDelay)
	}
	if params.StartupDelay != nil {
		args = append(args, "=startup-delay="+*params.StartupDelay)
	}
	if params.UpScript != nil {
		args = append(args, "=up-script="+*params.UpScript)
	}
	if params.DownScript != nil {
		args = append(args, "=down-script="+*params.DownScript)
	}
	if params.TestScript != nil {
		args = append(args, "=test-script="+*params.TestScript)
	}
	if params.IgnoreInitialUp != nil {
		args = append(args, "=ignore-initial-up="+boolToYesNo(*params.IgnoreInitialUp))
	}
	if params.IgnoreInitialDown != nil {
		args = append(args, "=ignore-initial-down="+boolToYesNo(*params.IgnoreInitialDown))
	}
	if params.Disabled != nil {
		args = append(args, "=disabled="+boolToYesNo(*params.Disabled))
	}
	if params.Port != nil {
		args = append(args, "=port="+*params.Port)
	}
	if params.ThrHTTPTime != nil {
		args = append(args, "=thr-http-time="+*params.ThrHTTPTime)
	}
	if params.HTTPCodeMin != nil {
		args = append(args, "=http-code-min="+*params.HTTPCodeMin)
	}
	if params.HTTPCodeMax != nil {
		args = append(args, "=http-code-max="+*params.HTTPCodeMax)
	}
	if params.Certificate != nil {
		args = append(args, "=certificate="+*params.Certificate)
	}
	if params.CheckCertificate != nil {
		args = append(args, "=check-certificate="+boolToYesNo(*params.CheckCertificate))
	}
	if params.PacketInterval != nil {
		args = append(args, "=packet-interval="+*params.PacketInterval)
	}
	if params.PacketCount != nil {
		args = append(args, "=packet-count="+*params.PacketCount)
	}
	if params.PacketSize != nil {
		args = append(args, "=packet-size="+*params.PacketSize)
	}
	if params.TTL != nil {
		args = append(args, "=ttl="+*params.TTL)
	}
	if params.ThrMax != nil {
		args = append(args, "=thr-max="+*params.ThrMax)
	}
	if params.ThrAvg != nil {
		args = append(args, "=thr-avg="+*params.ThrAvg)
	}
	if params.ThrStdev != nil {
		args = append(args, "=thr-stdev="+*params.ThrStdev)
	}
	if params.ThrJitter != nil {
		args = append(args, "=thr-jitter="+*params.ThrJitter)
	}
	if params.ThrLossPercent != nil {
		args = append(args, "=thr-loss-percent="+*params.ThrLossPercent)
	}
	if params.ThrLossCount != nil {
		args = append(args, "=thr-loss-count="+*params.ThrLossCount)
	}
	if params.ThrTCPConnTime != nil {
		args = append(args, "=thr-tcp-conn-time="+*params.ThrTCPConnTime)
	}
	if params.RecordType != nil {
		args = append(args, "=record-type="+*params.RecordType)
	}
	if params.DNSServer != nil {
		args = append(args, "=dns-server="+*params.DNSServer)
	}
	if params.Comment != nil {
		args = append(args, "=comment="+*params.Comment)
	}

	id, err := c.Add("/tool/netwatch", args...)
	if err != nil {
		return NetwatchItem{}, fmt.Errorf("failed to add netwatch entry: %w", err)
	}

	result, err := c.GetByID("/tool/netwatch", id)
	if err != nil {
		return NetwatchItem{}, fmt.Errorf("failed to retrieve created netwatch entry: %w", err)
	}

	return parseNetwatchItem(result), nil
}

// UpdateNetwatchParams holds optional fields for updating a Netwatch entry.
type UpdateNetwatchParams struct {
	Host              *string
	Type              *NetwatchType
	Interval          *string
	Timeout           *string
	SrcAddress        *string
	StartDelay        *string
	StartupDelay      *string
	UpScript          *string
	DownScript        *string
	TestScript        *string
	IgnoreInitialUp   *bool
	IgnoreInitialDown *bool
	Disabled          *bool
	Port              *string
	ThrHTTPTime       *string
	HTTPCodeMin       *string
	HTTPCodeMax       *string
	Certificate       *string
	CheckCertificate  *bool
	PacketInterval    *string
	PacketCount       *string
	PacketSize        *string
	TTL               *string
	ThrMax            *string
	ThrAvg            *string
	ThrStdev          *string
	ThrJitter         *string
	ThrLossPercent    *string
	ThrLossCount      *string
	ThrTCPConnTime    *string
	RecordType        *string
	DNSServer         *string
	Comment           *string
}

// UpdateNetwatch updates a Netwatch entry by name or ID and returns the updated entry.
func (c *Client) UpdateNetwatch(nameOrID string, params UpdateNetwatchParams) (NetwatchItem, error) {
	var result map[string]string
	var err error

	if strings.HasPrefix(nameOrID, "*") {
		result, err = c.GetByID("/tool/netwatch", nameOrID)
	} else {
		result, err = c.GetFirst("/tool/netwatch", "?=name="+nameOrID)
		if err != nil {
			result, err = c.GetFirst("/tool/netwatch", "?=host="+nameOrID)
		}
	}
	if err != nil {
		return NetwatchItem{}, fmt.Errorf("failed to find netwatch entry %s: %w", nameOrID, err)
	}

	id := result[".id"]
	args := []string{"=.id=" + id}

	if params.Host != nil {
		args = append(args, "=host="+*params.Host)
	}
	if params.Type != nil {
		args = append(args, "=type="+string(*params.Type))
	}
	if params.Interval != nil {
		args = append(args, "=interval="+*params.Interval)
	}
	if params.Timeout != nil {
		args = append(args, "=timeout="+*params.Timeout)
	}
	if params.SrcAddress != nil {
		args = append(args, "=src-address="+*params.SrcAddress)
	}
	if params.StartDelay != nil {
		args = append(args, "=start-delay="+*params.StartDelay)
	}
	if params.StartupDelay != nil {
		args = append(args, "=startup-delay="+*params.StartupDelay)
	}
	if params.UpScript != nil {
		args = append(args, "=up-script="+*params.UpScript)
	}
	if params.DownScript != nil {
		args = append(args, "=down-script="+*params.DownScript)
	}
	if params.TestScript != nil {
		args = append(args, "=test-script="+*params.TestScript)
	}
	if params.IgnoreInitialUp != nil {
		args = append(args, "=ignore-initial-up="+boolToYesNo(*params.IgnoreInitialUp))
	}
	if params.IgnoreInitialDown != nil {
		args = append(args, "=ignore-initial-down="+boolToYesNo(*params.IgnoreInitialDown))
	}
	if params.Disabled != nil {
		args = append(args, "=disabled="+boolToYesNo(*params.Disabled))
	}
	if params.Port != nil {
		args = append(args, "=port="+*params.Port)
	}
	if params.ThrHTTPTime != nil {
		args = append(args, "=thr-http-time="+*params.ThrHTTPTime)
	}
	if params.HTTPCodeMin != nil {
		args = append(args, "=http-code-min="+*params.HTTPCodeMin)
	}
	if params.HTTPCodeMax != nil {
		args = append(args, "=http-code-max="+*params.HTTPCodeMax)
	}
	if params.Certificate != nil {
		args = append(args, "=certificate="+*params.Certificate)
	}
	if params.CheckCertificate != nil {
		args = append(args, "=check-certificate="+boolToYesNo(*params.CheckCertificate))
	}
	if params.PacketInterval != nil {
		args = append(args, "=packet-interval="+*params.PacketInterval)
	}
	if params.PacketCount != nil {
		args = append(args, "=packet-count="+*params.PacketCount)
	}
	if params.PacketSize != nil {
		args = append(args, "=packet-size="+*params.PacketSize)
	}
	if params.TTL != nil {
		args = append(args, "=ttl="+*params.TTL)
	}
	if params.ThrMax != nil {
		args = append(args, "=thr-max="+*params.ThrMax)
	}
	if params.ThrAvg != nil {
		args = append(args, "=thr-avg="+*params.ThrAvg)
	}
	if params.ThrStdev != nil {
		args = append(args, "=thr-stdev="+*params.ThrStdev)
	}
	if params.ThrJitter != nil {
		args = append(args, "=thr-jitter="+*params.ThrJitter)
	}
	if params.ThrLossPercent != nil {
		args = append(args, "=thr-loss-percent="+*params.ThrLossPercent)
	}
	if params.ThrLossCount != nil {
		args = append(args, "=thr-loss-count="+*params.ThrLossCount)
	}
	if params.ThrTCPConnTime != nil {
		args = append(args, "=thr-tcp-conn-time="+*params.ThrTCPConnTime)
	}
	if params.RecordType != nil {
		args = append(args, "=record-type="+*params.RecordType)
	}
	if params.DNSServer != nil {
		args = append(args, "=dns-server="+*params.DNSServer)
	}
	if params.Comment != nil {
		args = append(args, "=comment="+*params.Comment)
	}

	_, err = c.Set("/tool/netwatch", args...)
	if err != nil {
		return NetwatchItem{}, fmt.Errorf("failed to update netwatch entry %s: %w", nameOrID, err)
	}

	result, err = c.GetByID("/tool/netwatch", id)
	if err != nil {
		return NetwatchItem{}, fmt.Errorf("failed to retrieve updated netwatch entry: %w", err)
	}

	return parseNetwatchItem(result), nil
}

// DeleteNetwatch removes a Netwatch entry by name or ID.
func (c *Client) DeleteNetwatch(nameOrID string) error {
	var result map[string]string
	var err error

	if strings.HasPrefix(nameOrID, "*") {
		result, err = c.GetByID("/tool/netwatch", nameOrID)
	} else {
		result, err = c.GetFirst("/tool/netwatch", "?=name="+nameOrID)
		if err != nil {
			result, err = c.GetFirst("/tool/netwatch", "?=host="+nameOrID)
		}
	}
	if err != nil {
		return fmt.Errorf("failed to find netwatch entry %s: %w", nameOrID, err)
	}

	_, err = c.Remove("/tool/netwatch", "=.id="+result[".id"])
	if err != nil {
		return fmt.Errorf("failed to delete netwatch entry %s: %w", nameOrID, err)
	}

	return nil
}

func boolToYesNo(v bool) string {
	if v {
		return "yes"
	}
	return "no"
}
