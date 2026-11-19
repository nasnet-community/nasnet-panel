package routeros

import "testing"

func mustParse(t *testing.T, s string) Version {
	t.Helper()
	v, err := ParseVersion(s)
	if err != nil {
		t.Fatalf("ParseVersion(%q): %v", s, err)
	}
	return v
}

func TestVersionOrder(t *testing.T) {
	// Each is older than the one after it.
	ordered := []string{
		"6.49.17", "7.1", "7.9.2", "7.11", "7.12beta3", "7.12beta10", "7.12rc1", "7.12rc2",
		"7.12", "7.12.1beta1", "7.12.1", "7.24.5", "7.100",
	}
	for i, a := range ordered {
		for j, b := range ordered {
			want := 0
			if i < j {
				want = -1
			} else if i > j {
				want = 1
			}
			if got := mustParse(t, a).Compare(mustParse(t, b)); got != want {
				t.Errorf("%s compared with %s = %d, want %d", a, b, got, want)
			}
		}
	}
}

func TestVersionEquality(t *testing.T) {
	for _, pair := range [][2]string{
		{"7.12", "7.12.0"},
		{"7.24.5", "7.24.5 (stable)"},
		{"7.18rc3", "7.18rc3 (testing)"},
		{"7.20beta4", "7.20beta4 (development)"},
		{"6.49.10", "6.49.10 (long-term)"},
		{"  7.11  ", "7.11"},
	} {
		if got := mustParse(t, pair[0]).Compare(mustParse(t, pair[1])); got != 0 {
			t.Errorf("%q compared with %q = %d, want 0", pair[0], pair[1], got)
		}
	}
}

func TestVersionString(t *testing.T) {
	for in, want := range map[string]string{
		"7.24.5 (stable)":         "7.24.5",
		"7.12rc1":                 "7.12rc1",
		" 7.11 ":                  "7.11",
		"7.20beta4 (development)": "7.20beta4",
	} {
		if got := mustParse(t, in).String(); got != want {
			t.Errorf("String of %q = %q, want %q", in, got, want)
		}
	}
}

func TestVersionGarbage(t *testing.T) {
	for _, in := range []string{
		"", " ", "abc", "7", "7.", ".7", "7..1", "7.x", "7.1.2.3", "v7.11", "-7.1", "7.11-beta1",
		"7.12 beta3", "7.12beta", "7.12rc", "7.12alpha1", "7.12beta3 extra", "7.12 (Stable)", "7.12 ()",
		"7.12(stable)", "7,12", "7.99999999999999999999",
	} {
		if v, err := ParseVersion(in); err == nil {
			t.Errorf("ParseVersion(%q) = %q, want an error", in, v)
		}
	}
}
