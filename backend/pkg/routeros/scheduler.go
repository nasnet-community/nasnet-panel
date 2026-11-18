package routeros

import (
	"errors"
	"fmt"
	"strconv"
)

// SchedulerInfo represents a /system/scheduler entry.
type SchedulerInfo struct {
	ID        string
	Name      string
	StartDate string
	StartTime string
	Interval  string
	RunCount  int
	NextRun   string
	Disabled  bool
}

// UpdateSchedulerParams holds the optional fields for updating a /system/scheduler entry.
type UpdateSchedulerParams struct {
	StartTime *string
	Interval  *string
}

// ErrSchedulerNotFound is returned by GetScheduler when no entry matches.
var ErrSchedulerNotFound = errors.New("scheduler not found")

func parseSchedulerInfo(result map[string]string) SchedulerInfo {
	runCount, _ := strconv.Atoi(result["run-count"])

	return SchedulerInfo{
		ID:        result[".id"],
		Name:      result["name"],
		StartDate: result["start-date"],
		StartTime: result["start-time"],
		Interval:  result["interval"],
		RunCount:  runCount,
		NextRun:   result["next-run"],
		Disabled:  parseRouterOSBool(result["disabled"]),
	}
}

// GetScheduler returns a /system/scheduler entry by name or .id.
func (c *Client) GetScheduler(nameOrID string) (*SchedulerInfo, error) {
	if nameOrID == "" {
		return nil, fmt.Errorf("scheduler name or ID is required")
	}

	results, err := c.GetAll("/system/scheduler", nameOrIDFilterArg(nameOrID))
	if err != nil {
		return nil, fmt.Errorf("failed to get scheduler %s: %w", nameOrID, err)
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("%w: %s", ErrSchedulerNotFound, nameOrID)
	}

	scheduler := parseSchedulerInfo(results[0])
	return &scheduler, nil
}

// UpdateScheduler applies params' non-nil fields to the /system/scheduler entry
// with the given .id.
func (c *Client) UpdateScheduler(id string, params UpdateSchedulerParams) error {
	if id == "" {
		return fmt.Errorf("scheduler ID is required")
	}

	args := []string{"=.id=" + id}

	if params.StartTime != nil {
		args = append(args, "=start-time="+*params.StartTime)
	}
	if params.Interval != nil {
		args = append(args, "=interval="+*params.Interval)
	}

	if len(args) == 1 {
		return nil
	}

	if _, err := c.Set("/system/scheduler", args...); err != nil {
		return fmt.Errorf("failed to update scheduler %s: %w", id, err)
	}

	return nil
}
