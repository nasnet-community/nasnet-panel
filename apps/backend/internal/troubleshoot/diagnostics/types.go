package diagnostics

// StepResult represents the result of a diagnostic step execution.
type StepResult struct {
	Success         bool
	Message         string
	Details         string
	ExecutionTimeMs int
	IssueCode       string
	Target          string
}

// ISPInfo contains ISP contact information.
type ISPInfo struct {
	Name  string
	Phone string
	URL   string
}

// NetworkConfig contains detected network configuration.
type NetworkConfig struct {
	WanInterface string
	Gateway      string
	ISPInfo      *ISPInfo
}
