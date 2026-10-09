package handler

import "testing"

func TestCatalogURL(t *testing.T) {
	for override, want := range map[string]string{
		"":                         "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/main",
		"  ":                       "https://raw.githubusercontent.com/nasnet-community/nasnet-panel-plugins/main",
		"http://10.0.2.2:8787/":    "http://10.0.2.2:8787",
		"http://10.0.2.2:8787/dev": "http://10.0.2.2:8787/dev",
	} {
		if got := catalogURL(override); got != want {
			t.Errorf("catalogURL(%q) = %q, want %q", override, got, want)
		}
	}
}
