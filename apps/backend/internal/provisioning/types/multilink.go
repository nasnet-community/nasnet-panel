package types

// MultiLinkStrategy represents multi-link strategy.
type MultiLinkStrategy string

const (
	StrategyLoadBalance MultiLinkStrategy = "LoadBalance"
	StrategyFailover    MultiLinkStrategy = "Failover"
	StrategyRoundRobin  MultiLinkStrategy = "RoundRobin"
	StrategyBoth        MultiLinkStrategy = "Both"
)

// LoadBalanceMethod represents load balancing method.
type LoadBalanceMethod string

const (
	LoadBalancePCC     LoadBalanceMethod = "PCC"
	LoadBalanceNTH     LoadBalanceMethod = "NTH"
	LoadBalanceECMP    LoadBalanceMethod = "ECMP"
	LoadBalanceBonding LoadBalanceMethod = "Bonding"
)

// BondingMode represents bonding mode.
type BondingMode string

const (
	BondingBalanceRR    BondingMode = "balance-rr"
	BondingActiveBackup BondingMode = "active-backup"
	BondingBalanceXOR   BondingMode = "balance-xor"
	BondingBroadcast    BondingMode = "broadcast"
	Bonding8023AD       BondingMode = "802.3ad"
	BondingBalanceTLB   BondingMode = "balance-tlb"
	BondingBalanceALB   BondingMode = "balance-alb"
)

// MultiLinkConfig defines multi-link configuration.
type MultiLinkConfig struct {
	Strategy           MultiLinkStrategy  `json:"strategy"`
	LoadBalanceMethod  *LoadBalanceMethod `json:"loadBalanceMethod,omitempty"`
	FailoverConfig     *FailoverConfig    `json:"failoverConfig,omitempty"`
	RoundRobinInterval *int               `json:"roundRobinInterval,omitempty"`
}

// FailoverConfig defines failover configuration.
type FailoverConfig struct {
	FailoverCheckInterval *int `json:"failoverCheckInterval,omitempty"`
	FailoverTimeout       *int `json:"failoverTimeout,omitempty"`
}

// BondingConfig defines bonding interface configuration.
type BondingConfig struct {
	Name          *string        `json:"name,omitempty"`
	Mode          *BondingMode   `json:"mode,omitempty"`
	Slaves        []string       `json:"slaves"`
	IPAddress     *string        `json:"ipAddress,omitempty"`
	ARPMonitoring *ARPMonitoring `json:"arpMonitoring,omitempty"`
	MIIMonitoring *MIIMonitoring `json:"miiMonitoring,omitempty"`
	MTU           *int           `json:"mtu,omitempty"`
	LACP          *LACPConfig    `json:"lacp,omitempty"`
}

// ARPMonitoring defines ARP monitoring configuration.
type ARPMonitoring struct {
	Enabled      bool     `json:"enabled"`
	Targets      []string `json:"targets"`
	Interval     *string  `json:"interval,omitempty"`
	ValidateTime *string  `json:"validateTime,omitempty"`
}

// MIIMonitoring defines MII monitoring configuration.
type MIIMonitoring struct {
	Enabled  bool    `json:"enabled"`
	Interval *string `json:"interval,omitempty"`
}

// LACPConfig defines LACP configuration.
type LACPConfig struct {
	Rate *string `json:"rate,omitempty"`
}
