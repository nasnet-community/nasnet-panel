package app

import (
	"testing"

	"nasnet-panel/internal/buildinfo"
)

func TestReleaseIsDowngrade(t *testing.T) {
	saved := buildinfo.Version
	t.Cleanup(func() { buildinfo.Version = saved })

	tests := []struct {
		running, tag string
		want         bool
	}{
		{"v1.3.0", "v1.2.0", true},
		{"v1.3.0", "v1.3.0", false},
		{"v1.3.0", "v1.4.0", false},
		{"v1.3.0", "v1.3.0-rc.1", true},
		{"v1.3.0-rc.2", "v1.3.0-rc.1", true},
		{"v1.3.0", "v1.3.0-dev.20261026.1", false},
		{"v1.3.0", "not-a-tag", false},
		{localDevVersion, "v1.2.0", false},
	}
	for _, tt := range tests {
		buildinfo.Version = tt.running
		if got := releaseIsDowngrade(tt.tag); got != tt.want {
			t.Errorf("running %s, releaseIsDowngrade(%q) = %v, want %v", tt.running, tt.tag, got, tt.want)
		}
		if tt.want && releaseAutoReconfigable(tt.tag, "0.0.0") {
			t.Errorf("running %s, downgrade to %s must not be auto-reconfigurable", tt.running, tt.tag)
		}
	}
}
