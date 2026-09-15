package env

import (
	"os"
	"os/exec"
	"runtime"
	"strings"
	"testing"
)

var baseTools = []string{"ip", "nft", "dnsmasq", "qemu-img", "go", "env", "sysctl"}

var featureTools = map[string][]string{
	"wireguard":   {"wg"},
	"l2tp":        {"xl2tpd", "pppd"},
	"openvpn":     {"openvpn"},
	"cli-install": {"bash", "ssh", "scp", "curl", "sha256sum"},
	"arm64":       {"qemu-system-aarch64"},
	"x86_64":      {"qemu-system-x86_64"},
}

func Preflight(t *testing.T) {
	t.Helper()
	if runtime.GOOS != "linux" {
		t.Fatalf("test-lab needs Linux with KVM, this is %s", runtime.GOOS)
	}
	if os.Geteuid() != 0 {
		t.Fatal("test-lab needs root to create network namespaces, bridges and tap devices, run it with sudo")
	}
	if _, err := os.Stat("/dev/kvm"); err != nil {
		t.Fatalf("KVM is not available: %v", err)
	}
	if missing := MissingTools(baseTools...); len(missing) > 0 {
		t.Fatalf("missing tools: %s", strings.Join(missing, ", "))
	}
}

func MissingTools(tools ...string) []string {
	var missing []string
	for _, tool := range tools {
		if _, err := exec.LookPath(tool); err != nil {
			missing = append(missing, tool)
		}
	}
	return missing
}

func MissingFeatureTools(features ...string) []string {
	var tools []string
	for _, f := range features {
		tools = append(tools, featureTools[f]...)
	}
	return MissingTools(tools...)
}
