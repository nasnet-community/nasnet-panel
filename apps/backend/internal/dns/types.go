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
