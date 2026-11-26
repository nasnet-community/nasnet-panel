package net

// NetwatchHostType categorizes a monitored host.
type NetwatchHostType string

// netwatchComment is the type and preference of one failover probe.
type netwatchComment struct {
	hostType NetwatchHostType
	rank     int
}

// netwatchCandidate is a probe that may represent its type in the status response.
type netwatchCandidate struct {
	response    NetStatusResponse
	rank        int
	routeActive bool
	up          bool
}

// NetStatusResponse represents the probe that stands for one type in the status response.
// Host is the address the probe checks: the DNS server of a DNS probe, otherwise its host.
// RouteActive tells whether an active route to Host exists in the main routing table.
type NetStatusResponse struct {
	Host        string           `json:"host"`
	Status      string           `json:"status"`
	Since       string           `json:"since"`
	Type        NetwatchHostType `json:"type"`
	RouteActive bool             `json:"routeActive"`
}
