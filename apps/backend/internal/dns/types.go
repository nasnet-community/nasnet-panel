package dns

// DnsLookupInput represents the input parameters for a DNS lookup operation
type DnsLookupInput struct {
	DeviceId   string
	Hostname   string
	RecordType string
	Server     *string // nil = use router's DNS
	Timeout    *int    // seconds
}

// DnsRecord represents a single DNS record
type DnsRecord struct {
	Name     string
	Type     string
	TTL      int
	Data     string
	Priority *int
	Weight   *int
	Port     *int
}

// DnsLookupResult represents the result of a DNS lookup operation
type DnsLookupResult struct {
	Hostname      string
	RecordType    string
	Status        string
	Records       []DnsRecord
	Server        string
	QueryTime     int
	Authoritative bool
	Error         *string
	Timestamp     string
}

// DnsServer represents a single DNS server configuration
type DnsServer struct {
	Address     string
	IsPrimary   bool
	IsSecondary bool
}

// DnsServers represents the collection of DNS servers
type DnsServers struct {
	Servers   []DnsServer
	Primary   string
	Secondary *string
}

// DnsCacheStats represents DNS cache statistics
type DnsCacheStats struct {
	TotalEntries      int
	CacheUsedBytes    int64
	CacheMaxBytes     int64
	CacheUsagePercent float64
	HitRatePercent    *float64
	TopDomains        []DnsTopDomain
	Timestamp         string
}

// DnsTopDomain represents a frequently queried domain
type DnsTopDomain struct {
	Domain      string
	QueryCount  int
	LastQueried *string
}

// FlushDnsCacheResult represents the result of flushing the DNS cache
type FlushDnsCacheResult struct {
	Success        bool
	EntriesRemoved int
	BeforeStats    DnsCacheStats
	AfterStats     DnsCacheStats
	Message        string
	Timestamp      string
}

// DnsBenchmarkServerResult represents benchmark result for a single DNS server
type DnsBenchmarkServerResult struct {
	Server         string
	ResponseTimeMs int
	Status         string
	Success        bool
	Error          *string
}

// DnsBenchmarkResult represents complete benchmark result comparing DNS servers
type DnsBenchmarkResult struct {
	TestHostname  string
	ServerResults []DnsBenchmarkServerResult
	FastestServer *DnsBenchmarkServerResult
	Timestamp     string
	TotalTimeMs   int
}
