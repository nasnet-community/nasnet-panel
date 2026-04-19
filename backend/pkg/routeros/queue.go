package routeros

import (
	"fmt"
	"strconv"
)

type QueueConfig struct {
	Name           string
	Target         string
	Direction      string // in, out
	Priority       int
	PacketMark     string
	ConnectionMark string
	Disabled       bool
	MaxLimit       string
	BurstLimit     string
	BurstThreshold string
	BurstTime      string
	Comment        string
}

type QueueInfo struct {
	ID             string
	Name           string
	Target         string
	Direction      string
	Priority       int
	PacketMark     string
	ConnectionMark string
	Disabled       bool
	MaxLimit       string
	BurstLimit     string
	BurstThreshold string
	BurstTime      string
	Bytes          string
	Packets        string
	Comment        string
}

type SimpleQueueConfig struct {
	Name           string
	Target         string
	MaxLimit       string // e.g., "10M/5M" (upload/download)
	BurstLimit     string
	BurstThreshold string
	Priority       int
	Parent         string
	Disabled       bool
	Comment        string
}

func (c *Client) ListQueues() ([]QueueInfo, error) {
	results, err := c.GetAll("/queue/general")
	if err != nil {
		return nil, fmt.Errorf("failed to list queues: %w", err)
	}

	queues := make([]QueueInfo, 0)
	for _, result := range results {
		priority, _ := strconv.Atoi(result["priority"])
		queues = append(queues, QueueInfo{
			ID:             result[".id"],
			Name:           result["name"],
			Target:         result["target"],
			Direction:      result["direction"],
			Priority:       priority,
			PacketMark:     result["packet-mark"],
			ConnectionMark: result["connection-mark"],
			Disabled:       result["disabled"] == "true",
			MaxLimit:       result["max-limit"],
			BurstLimit:     result["burst-limit"],
			BurstThreshold: result["burst-threshold"],
			BurstTime:      result["burst-time"],
			Bytes:          result["bytes"],
			Packets:        result["packets"],
			Comment:        result["comment"],
		})
	}

	return queues, nil
}

func (c *Client) AddQueue(config QueueConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
		"target=" + config.Target,
		"direction=" + config.Direction,
	}

	if config.Priority > 0 {
		args = append(args, "priority="+strconv.Itoa(config.Priority))
	}
	if config.PacketMark != "" {
		args = append(args, "packet-mark="+config.PacketMark)
	}
	if config.ConnectionMark != "" {
		args = append(args, "connection-mark="+config.ConnectionMark)
	}
	if config.MaxLimit != "" {
		args = append(args, "max-limit="+config.MaxLimit)
	}
	if config.BurstLimit != "" {
		args = append(args, "burst-limit="+config.BurstLimit)
	}
	if config.BurstThreshold != "" {
		args = append(args, "burst-threshold="+config.BurstThreshold)
	}
	if config.BurstTime != "" {
		args = append(args, "burst-time="+config.BurstTime)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/queue/general", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add queue: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveQueue(id string) error {
	_, err := c.Remove("/queue/general", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove queue: %w", err)
	}

	return nil
}

func (c *Client) ListSimpleQueues() ([]map[string]string, error) {
	results, err := c.GetAll("/queue/simple")
	if err != nil {
		return nil, fmt.Errorf("failed to list simple queues: %w", err)
	}

	return results, nil
}

func (c *Client) AddSimpleQueue(config SimpleQueueConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
		"target=" + config.Target,
		"max-limit=" + config.MaxLimit,
	}

	if config.BurstLimit != "" {
		args = append(args, "burst-limit="+config.BurstLimit)
	}
	if config.BurstThreshold != "" {
		args = append(args, "burst-threshold="+config.BurstThreshold)
	}
	if config.Priority > 0 {
		args = append(args, "priority="+strconv.Itoa(config.Priority))
	}
	if config.Parent != "" {
		args = append(args, "parent="+config.Parent)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/queue/simple", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add simple queue: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) RemoveSimpleQueue(id string) error {
	_, err := c.Remove("/queue/simple", "=.id="+id)
	if err != nil {
		return fmt.Errorf("failed to remove simple queue: %w", err)
	}

	return nil
}
