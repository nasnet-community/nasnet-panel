// Package nasnetapi is a client for the NasNet community API at api.joinnasnet.com.
package nasnetapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	// DefaultBaseURL is the production API address.
	DefaultBaseURL = "https://api.joinnasnet.com"

	// SourceAll lists the union of the registry and bgp sources.
	SourceAll = "all"
	// SourceRegistry lists the ranges the regional registries allocated.
	SourceRegistry = "registry"
	// SourceBGP lists the ranges announced on the internet.
	SourceBGP = "bgp"

	// FamilyIPv4 selects IPv4 prefixes.
	FamilyIPv4 = "4"
	// FamilyIPv6 selects IPv6 prefixes.
	FamilyIPv6 = "6"
	// FamilyAll selects both families.
	FamilyAll = "all"

	// DNSDomestic marks a country-local DNS server.
	DNSDomestic = "domestic"
	// DNSForeign marks an international DNS server.
	DNSForeign = "foreign"

	defaultTimeout   = 30 * time.Second
	maxResponseBytes = 64 << 20
	maxErrorBody     = 4 << 10
	userAgent        = "nasnet-panel"
)

// Client calls the NasNet community API.
type Client struct {
	baseURL    string
	userID     string
	httpClient *http.Client
}

// APIError is a non-200 reply from the API.
type APIError struct {
	Status  int
	Message string
}

// Info is the reply of GET /.
type Info struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// SourceSummary is the prefix count and last update of one source.
type SourceSummary struct {
	IPv4Count int    `json:"ipv4_count"`
	IPv6Count int    `json:"ipv6_count"`
	UpdatedAt string `json:"updated_at"`
}

// Country is one supported country with its prefix counts.
type Country struct {
	Country   string                    `json:"country"`
	IPv4Count *int                      `json:"ipv4_count"`
	IPv6Count *int                      `json:"ipv6_count"`
	UpdatedAt *string                   `json:"updated_at"`
	Sources   map[string]*SourceSummary `json:"sources"`
}

// CountriesResponse is the reply of GET /v1/countries.
type CountriesResponse struct {
	Countries []Country `json:"countries"`
}

// IPListOptions selects the prefixes returned for a country; empty fields use the API defaults.
type IPListOptions struct {
	Source string
	Family string
	Limit  *int
	Offset int
}

// IPList is the JSON reply of GET /v1/countries/{cc}/ips.
type IPList struct {
	Country   string   `json:"country"`
	Source    string   `json:"source"`
	Family    string   `json:"family"`
	Total     int      `json:"total"`
	Offset    int      `json:"offset"`
	Limit     *int     `json:"limit"`
	UpdatedAt string   `json:"updated_at"`
	Prefixes  []string `json:"prefixes"`
}

// IPAddresses is the plain-text reply of GET /v1/countries/{cc}/ips with its header values.
type IPAddresses struct {
	Prefixes   []string
	TotalCount int
	UpdatedAt  string
}

// IPCheck is the reply of GET /v1/countries/{cc}/check.
type IPCheck struct {
	IP        string  `json:"ip"`
	Country   string  `json:"country"`
	Source    string  `json:"source"`
	Match     bool    `json:"match"`
	Prefix    *string `json:"prefix"`
	UpdatedAt string  `json:"updated_at"`
}

// DNSServer is one DNS server of a country.
type DNSServer struct {
	Type        string `json:"type"`
	IP          string `json:"ip"`
	Description string `json:"description"`
}

// DNSResponse is the reply of GET /v1/countries/{cc}/dns.
type DNSResponse struct {
	Country string      `json:"country"`
	Servers []DNSServer `json:"servers"`
}

// VPNAccount is the reply of GET /v1/vpn.
type VPNAccount struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Primary   string `json:"primary"`
	Fallback1 string `json:"fallback1"`
	Fallback2 string `json:"fallback2"`
}

// CountryHealth is the last update time of each source of one country.
type CountryHealth struct {
	Country  string  `json:"country"`
	All      *string `json:"all"`
	Registry *string `json:"registry"`
	BGP      *string `json:"bgp"`
}

// Health is the reply of GET /health.
type Health struct {
	OK        bool            `json:"ok"`
	Countries []CountryHealth `json:"countries"`
}

// FeedRequest is the body of POST /v1/feed.
type FeedRequest struct {
	Country    string   `json:"country"`
	Source     string   `json:"source"`
	SourceTime string   `json:"source_time,omitempty"`
	Prefixes   []string `json:"prefixes,omitempty"`
}

// FeedResponse is the reply of POST /v1/feed.
type FeedResponse struct {
	OK        bool   `json:"ok"`
	IPv4Count int    `json:"ipv4_count"`
	IPv6Count int    `json:"ipv6_count"`
	SyncedAt  string `json:"synced_at"`
}

// Error implements error.
func (e *APIError) Error() string {
	return fmt.Sprintf("nasnet api: status %d: %s", e.Status, e.Message)
}

// New returns a client that sends userID as the router key.
func New(userID string) *Client {
	return &Client{
		baseURL:    DefaultBaseURL,
		userID:     userID,
		httpClient: &http.Client{Timeout: defaultTimeout},
	}
}

// WithBaseURL overrides the API address.
func (c *Client) WithBaseURL(baseURL string) *Client {
	c.baseURL = strings.TrimRight(baseURL, "/")
	return c
}

// WithHTTPClient replaces the HTTP client.
func (c *Client) WithHTTPClient(httpClient *http.Client) *Client {
	c.httpClient = httpClient
	return c
}

// Info calls GET /.
func (c *Client) Info(ctx context.Context) (*Info, error) {
	var out Info
	if err := c.getJSON(ctx, "/", nil, false, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Health calls GET /health. A 503 reply that carries data is returned without an error.
func (c *Client) Health(ctx context.Context) (*Health, error) {
	var out Health
	if err := c.getJSON(ctx, "/health", nil, false, &out); err != nil {
		var apiErr *APIError
		if errors.As(err, &apiErr) && apiErr.Status == http.StatusServiceUnavailable && len(out.Countries) > 0 {
			return &out, nil
		}
		return nil, err
	}
	return &out, nil
}

// Countries calls GET /v1/countries.
func (c *Client) Countries(ctx context.Context) (*CountriesResponse, error) {
	var out CountriesResponse
	if err := c.getJSON(ctx, "/v1/countries", nil, true, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CountryIPs calls GET /v1/countries/{cc}/ips with format=json.
func (c *Client) CountryIPs(ctx context.Context, country string, opts IPListOptions) (*IPList, error) {
	query := opts.query()
	query.Set("format", "json")

	var out IPList
	if err := c.getJSON(ctx, countryPath(country, "ips"), query, true, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CountryAddresses calls GET /v1/countries/{cc}/ips with format=addresses.
func (c *Client) CountryAddresses(ctx context.Context, country string, opts IPListOptions) (*IPAddresses, error) {
	query := opts.query()
	query.Set("format", "addresses")

	resp, err := c.do(ctx, http.MethodGet, countryPath(country, "ips"), query, true, nil, "")
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := readBody(resp)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, newAPIError(resp.StatusCode, body)
	}

	total, _ := strconv.Atoi(resp.Header.Get("X-Total-Count"))
	return &IPAddresses{
		Prefixes:   strings.Fields(string(body)),
		TotalCount: total,
		UpdatedAt:  resp.Header.Get("X-Updated-At"),
	}, nil
}

// CheckIP calls GET /v1/countries/{cc}/check for one IPv4 or IPv6 address.
func (c *Client) CheckIP(ctx context.Context, country, ip, source string) (*IPCheck, error) {
	query := url.Values{"ip": {ip}}
	if source != "" {
		query.Set("source", source)
	}

	var out IPCheck
	if err := c.getJSON(ctx, countryPath(country, "check"), query, true, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DNSServers calls GET /v1/countries/{cc}/dns.
func (c *Client) DNSServers(ctx context.Context, country string) (*DNSResponse, error) {
	var out DNSResponse
	if err := c.getJSON(ctx, countryPath(country, "dns"), nil, true, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// VPN calls GET /v1/vpn and returns the VPN account of the router. The client's
// user ID is sent as device_id, which is how the API identifies the router.
func (c *Client) VPN(ctx context.Context) (*VPNAccount, error) {
	if c.userID == "" {
		return nil, errors.New("nasnet api: user ID is required for /v1/vpn")
	}

	var out VPNAccount
	if err := c.getJSON(ctx, "/v1/vpn", url.Values{"device_id": {c.userID}}, false, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Feed calls POST /v1/feed. It needs the server-side feed token.
func (c *Client) Feed(ctx context.Context, feedToken string, req FeedRequest) (*FeedResponse, error) {
	payload, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("nasnet api: failed to encode feed request: %w", err)
	}

	httpReq, err := c.newRequest(ctx, http.MethodPost, "/v1/feed", nil, false, bytes.NewReader(payload), "application/json")
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+feedToken)

	var out FeedResponse
	if err := c.send(httpReq, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (o IPListOptions) query() url.Values {
	query := url.Values{}
	if o.Source != "" {
		query.Set("source", o.Source)
	}
	if o.Family != "" {
		query.Set("family", o.Family)
	}
	if o.Limit != nil {
		query.Set("limit", strconv.Itoa(*o.Limit))
	}
	if o.Offset > 0 {
		query.Set("offset", strconv.Itoa(o.Offset))
	}
	return query
}

func countryPath(country, resource string) string {
	return "/v1/countries/" + url.PathEscape(strings.ToLower(country)) + "/" + resource
}

func (c *Client) getJSON(ctx context.Context, path string, query url.Values, signed bool, out any) error {
	req, err := c.newRequest(ctx, http.MethodGet, path, query, signed, nil, "")
	if err != nil {
		return err
	}
	resp, err := c.httpClient.Do(req) //nolint:gosec // base URL is client configuration, not request input
	if err != nil {
		return fmt.Errorf("nasnet api: request failed: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := readBody(resp)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		_ = json.Unmarshal(body, out)
		return newAPIError(resp.StatusCode, body)
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("nasnet api: failed to decode response: %w", err)
	}
	return nil
}

func (c *Client) send(req *http.Request, out any) error {
	resp, err := c.httpClient.Do(req) //nolint:gosec // base URL is client configuration, not request input
	if err != nil {
		return fmt.Errorf("nasnet api: request failed: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := readBody(resp)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return newAPIError(resp.StatusCode, body)
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("nasnet api: failed to decode response: %w", err)
	}
	return nil
}

func (c *Client) do(ctx context.Context, method, path string, query url.Values, signed bool, body io.Reader, contentType string) (*http.Response, error) {
	req, err := c.newRequest(ctx, method, path, query, signed, body, contentType)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req) //nolint:gosec // base URL is client configuration, not request input
	if err != nil {
		return nil, fmt.Errorf("nasnet api: request failed: %w", err)
	}
	return resp, nil
}

func (c *Client) newRequest(ctx context.Context, method, path string, query url.Values, signed bool, body io.Reader, contentType string) (*http.Request, error) {
	if query == nil {
		query = url.Values{}
	}
	if signed {
		if c.userID == "" {
			return nil, fmt.Errorf("nasnet api: user ID is required for %s", path)
		}
		query.Set("user_id", c.userID)
	}

	target := c.baseURL + path
	if len(query) > 0 {
		target += "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, method, target, body)
	if err != nil {
		return nil, fmt.Errorf("nasnet api: failed to build request: %w", err)
	}
	req.Header.Set("User-Agent", userAgent)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	return req, nil
}

func readBody(resp *http.Response) ([]byte, error) {
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes))
	if err != nil {
		return nil, fmt.Errorf("nasnet api: failed to read response: %w", err)
	}
	return body, nil
}

func newAPIError(status int, body []byte) error {
	var payload struct {
		Error string `json:"error"`
	}
	message := ""
	if json.Unmarshal(body, &payload) == nil {
		message = payload.Error
	}
	if message == "" {
		if len(body) > maxErrorBody {
			body = body[:maxErrorBody]
		}
		message = strings.TrimSpace(string(body))
	}
	if message == "" {
		message = http.StatusText(status)
	}
	return &APIError{Status: status, Message: message}
}
