package config

import (
	"strings"
	"testing"
)

func TestValidateBindIP(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
		errMsg  string
	}{
		{
			name:    "valid IPv4",
			ip:      "192.168.1.100",
			wantErr: false,
		},
		{
			name:    "valid IPv6",
			ip:      "2001:db8::1",
			wantErr: false,
		},
		{
			name:    "reject wildcard IPv4",
			ip:      "0.0.0.0",
			wantErr: true,
			errMsg:  "wildcard IP addresses",
		},
		{
			name:    "reject wildcard IPv6",
			ip:      "::",
			wantErr: true,
			errMsg:  "wildcard IP addresses",
		},
		{
			name:    "reject loopback IPv4",
			ip:      "127.0.0.1",
			wantErr: true,
			errMsg:  "loopback IP addresses",
		},
		{
			name:    "reject loopback IPv6",
			ip:      "::1",
			wantErr: true,
			errMsg:  "loopback IP addresses",
		},
		{
			name:    "empty IP",
			ip:      "",
			wantErr: true,
			errMsg:  "bind IP is required",
		},
		{
			name:    "invalid IP format",
			ip:      "999.999.999.999",
			wantErr: true,
			errMsg:  "invalid IP address",
		},
		// Additional wildcard variations (CRITICAL edge cases)
		{
			name:    "reject ::0 (wildcard variation)",
			ip:      "::0",
			wantErr: true,
			errMsg:  "wildcard IP addresses",
		},
		{
			name:    "reject 0:0:0:0:0:0:0:0 (expanded wildcard)",
			ip:      "0:0:0:0:0:0:0:0",
			wantErr: true,
			errMsg:  "wildcard IP addresses",
		},
		{
			name:    "reject 0000:0000:0000:0000:0000:0000:0000:0000 (zero-padded wildcard)",
			ip:      "0000:0000:0000:0000:0000:0000:0000:0000",
			wantErr: true,
			errMsg:  "wildcard IP addresses",
		},
		// Loopback variations
		{
			name:    "reject 127.0.0.2 (loopback range)",
			ip:      "127.0.0.2",
			wantErr: true,
			errMsg:  "loopback IP addresses",
		},
		{
			name:    "reject 127.255.255.255 (loopback range end)",
			ip:      "127.255.255.255",
			wantErr: true,
			errMsg:  "loopback IP addresses",
		},
		// Valid private IPs (should PASS - used for VLAN isolation)
		{
			name:    "accept 10.0.0.1 (private range)",
			ip:      "10.0.0.1",
			wantErr: false,
		},
		{
			name:    "accept 172.16.0.1 (private range)",
			ip:      "172.16.0.1",
			wantErr: false,
		},
		{
			name:    "accept 192.168.0.1 (private range)",
			ip:      "192.168.0.1",
			wantErr: false,
		},
		{
			name:    "accept fd00::1 (IPv6 ULA)",
			ip:      "fd00::1",
			wantErr: false,
		},
		// Edge cases for validation
		{
			name:    "reject IPv4-mapped IPv6 wildcard",
			ip:      "::ffff:0.0.0.0",
			wantErr: true,
			errMsg:  "wildcard IP addresses",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateBindIP(tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateBindIP() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && tt.errMsg != "" && err != nil {
				if !strings.Contains(err.Error(), tt.errMsg) {
					t.Errorf("ValidateBindIP() error message = %v, want to contain %v", err.Error(), tt.errMsg)
				}
			}
		})
	}
}

func TestValidatePort(t *testing.T) {
	tests := []struct {
		name    string
		port    int
		wantErr bool
	}{
		{name: "valid port 80", port: 80, wantErr: false},
		{name: "valid port 443", port: 443, wantErr: false},
		{name: "valid port 9050", port: 9050, wantErr: false},
		{name: "valid port 1", port: 1, wantErr: false},
		{name: "valid port 65535", port: 65535, wantErr: false},
		{name: "invalid port 0", port: 0, wantErr: true},
		{name: "invalid port -1", port: -1, wantErr: true},
		{name: "invalid port 65536", port: 65536, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePort(tt.port)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePort() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateNonEmpty(t *testing.T) {
	tests := []struct {
		name      string
		fieldName string
		value     string
		wantErr   bool
	}{
		{name: "valid string", fieldName: "test", value: "value", wantErr: false},
		{name: "empty string", fieldName: "test", value: "", wantErr: true},
		{name: "whitespace only", fieldName: "test", value: "   ", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateNonEmpty(tt.fieldName, tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateNonEmpty() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateEnum(t *testing.T) {
	allowedValues := []string{"relay", "bridge", "exit"}

	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{name: "valid relay", value: "relay", wantErr: false},
		{name: "valid bridge", value: "bridge", wantErr: false},
		{name: "valid exit", value: "exit", wantErr: false},
		{name: "invalid value", value: "invalid", wantErr: true},
		{name: "empty string", value: "", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEnum("mode", tt.value, allowedValues)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateEnum() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateRange(t *testing.T) {
	tests := []struct {
		name    string
		value   int
		min     int
		max     int
		wantErr bool
	}{
		{name: "valid in range", value: 50, min: 1, max: 100, wantErr: false},
		{name: "valid at min", value: 1, min: 1, max: 100, wantErr: false},
		{name: "valid at max", value: 100, min: 1, max: 100, wantErr: false},
		{name: "below min", value: 0, min: 1, max: 100, wantErr: true},
		{name: "above max", value: 101, min: 1, max: 100, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRange("test", tt.value, tt.min, tt.max)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateRange() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidatePositive(t *testing.T) {
	tests := []struct {
		name    string
		value   int
		wantErr bool
	}{
		{name: "positive", value: 1, wantErr: false},
		{name: "large positive", value: 1000, wantErr: false},
		{name: "zero", value: 0, wantErr: true},
		{name: "negative", value: -1, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePositive("test", tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePositive() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateDNSName(t *testing.T) {
	tests := []struct {
		name     string
		hostname string
		wantErr  bool
	}{
		{name: "valid simple", hostname: "example.com", wantErr: false},
		{name: "valid subdomain", hostname: "sub.example.com", wantErr: false},
		{name: "valid with hyphens", hostname: "my-server.example.com", wantErr: false},
		{name: "valid single label", hostname: "localhost", wantErr: false},
		{name: "empty", hostname: "", wantErr: true},
		{name: "invalid character", hostname: "test_invalid.com", wantErr: true},
		{name: "invalid character space", hostname: "test invalid.com", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDNSName(tt.hostname)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDNSName() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
	}{
		{name: "valid http", url: "http://example.com", wantErr: false},
		{name: "valid https", url: "https://example.com", wantErr: false},
		{name: "valid with path", url: "https://example.com/path", wantErr: false},
		{name: "empty", url: "", wantErr: true},
		{name: "no protocol", url: "example.com", wantErr: true},
		{name: "invalid protocol", url: "ftp://example.com", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateURL(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateURL() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{name: "valid email", email: "user@example.com", wantErr: false},
		{name: "valid with subdomain", email: "user@mail.example.com", wantErr: false},
		{name: "empty", email: "", wantErr: true},
		{name: "no @", email: "userexample.com", wantErr: true},
		{name: "no local part", email: "@example.com", wantErr: true},
		{name: "no domain", email: "user@", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateEmail() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
