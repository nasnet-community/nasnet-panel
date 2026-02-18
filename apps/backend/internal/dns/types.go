package dns

// LookupInput represents the input parameters for a DNS lookup operation.
type LookupInput struct {
	DeviceId   string
	Hostname   string
	RecordType string
	Server     *string // nil = use router's DNS
	Timeout    *int    // seconds
}

// Record represents a single DNS record.
type Record struct {
	Name     string
	Type     string
	TTL      int
	Data     string
	Priority *int
	Weight   *int
	Port     *int
}

// LookupResult represents the result of a DNS lookup operation.
type LookupResult struct {
	Hostname      string
	RecordType    string
	Status        string
	Records       []Record
	Server        string
	QueryTime     int
	Authoritative bool
	Error         *string
	Timestamp     string
}

// Server represents a single DNS server configuration.
type Server struct {
	Address     string
	IsPrimary   bool
	IsSecondary bool
}

// Servers represents the collection of DNS servers.
type Servers struct {
	Servers   []Server
	Primary   string
	Secondary *string
}

// CacheStats represents DNS cache statistics.
type CacheStats struct {
	TotalEntries      int
	CacheUsedBytes    int64
	CacheMaxBytes     int64
	CacheUsagePercent float64
	HitRatePercent    *float64
	TopDomains        []TopDomain
	Timestamp         string
}

// TopDomain represents a frequently queried domain.
type TopDomain struct {
	Domain      string
	QueryCount  int
	LastQueried *string
}

// FlushCacheResult represents the result of flushing the DNS cache.
type FlushCacheResult struct {
	Success        bool
	EntriesRemoved int
	BeforeStats    CacheStats
	AfterStats     CacheStats
	Message        string
	Timestamp      string
}

// BenchmarkServerResult represents benchmark result for a single DNS server.
type BenchmarkServerResult struct {
	Server         string
	ResponseTimeMs int
	Status         string
	Success        bool
	Error          *string
}

// BenchmarkResult represents complete benchmark result comparing DNS servers.
type BenchmarkResult struct {
	TestHostname  string
	ServerResults []BenchmarkServerResult
	FastestServer *BenchmarkServerResult
	Timestamp     string
	TotalTimeMs   int
}
