package notifications

import (
	"net"
	"testing"
)

// TestIsPrivateIP tests the isPrivateIP helper function.
func TestIsPrivateIP(t *testing.T) {
	tests := []struct {
		name     string
		ip       string
		expected bool
	}{
		// IPv4 loopback
		{"IPv4 loopback 127.0.0.1", "127.0.0.1", true},
		{"IPv4 loopback 127.1.2.3", "127.1.2.3", true},

		// IPv4 private ranges
		{"IPv4 10.x", "10.0.0.1", true},
		{"IPv4 10.x high", "10.255.255.255", true},
		{"IPv4 172.16.x", "172.16.0.1", true},
		{"IPv4 172.31.x", "172.31.255.255", true},
		{"IPv4 192.168.x", "192.168.1.1", true},

		// IPv4 link-local
		{"IPv4 link-local", "169.254.1.1", true},

		// IPv6 loopback
		{"IPv6 loopback", "::1", true},

		// IPv6 link-local
		{"IPv6 link-local", "fe80::1", true},

		// Public IPs (should not be blocked)
		{"Public IPv4 Google DNS", "8.8.8.8", false},
		{"Public IPv4 Cloudflare", "1.1.1.1", false},
		{"Public IPv6 Google", "2001:4860:4860::8888", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ip := net.ParseIP(tt.ip)
			if ip == nil {
				t.Fatalf("Invalid IP address: %s", tt.ip)
			}

			result := isPrivateIP(ip)
			if result != tt.expected {
				t.Errorf("isPrivateIP(%s) = %v, expected %v", tt.ip, result, tt.expected)
			}
		})
	}
}

// TestValidateURL_HTTPSOnly tests that only HTTPS is allowed.
func TestValidateURL_HTTPSOnly(t *testing.T) {
	w := &WebhookChannel{}

	tests := []struct {
		name    string
		url     string
		wantErr bool
		errMsg  string
	}{
		{
			name:    "HTTPS allowed",
			url:     "https://api.example.com/webhook",
			wantErr: false,
		},
		{
			name:    "HTTP rejected",
			url:     "http://api.example.com/webhook",
			wantErr: true,
			errMsg:  "only HTTPS protocol is allowed",
		},
		{
			name:    "FTP rejected",
			url:     "ftp://example.com/webhook",
			wantErr: true,
			errMsg:  "only HTTPS protocol is allowed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := w.validateURL(tt.url)
			if tt.wantErr {
				if err == nil {
					t.Errorf("validateURL() expected error, got nil")
				} else if tt.errMsg != "" && err.Error() != tt.errMsg {
					t.Errorf("validateURL() error = %v, want %v", err.Error(), tt.errMsg)
				}
			} else {
				if err != nil {
					t.Errorf("validateURL() unexpected error: %v", err)
				}
			}
		})
	}
}

// TestValidateURL_Localhost tests that localhost is blocked.
func TestValidateURL_Localhost(t *testing.T) {
	w := &WebhookChannel{}

	tests := []string{
		"https://localhost/webhook",
		"https://127.0.0.1/webhook",
		"https://[::1]/webhook",
	}

	for _, url := range tests {
		t.Run(url, func(t *testing.T) {
			err := w.validateURL(url)
			if err == nil {
				t.Errorf("validateURL(%s) should block localhost, got nil error", url)
			}
		})
	}
}
