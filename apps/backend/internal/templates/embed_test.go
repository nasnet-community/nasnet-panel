package templates

import (
	"testing"
)

func TestEmbedFS(t *testing.T) {
	entries, err := builtInTemplatesFS.ReadDir("built_in")
	if err != nil {
		t.Fatalf("Failed to read embedded dir: %v", err)
	}

	if entries == nil {
		t.Fatalf("Failed to read entries: entries is nil")
	}

	t.Logf("Found %d entries in built_in/", len(entries))
	for _, entry := range entries {
		if entry == nil {
			t.Logf("- <nil entry>")
			continue
		}
		t.Logf("- %s (IsDir: %v)", entry.Name(), entry.IsDir())
	}

	// Try to read one file
	data, err := builtInTemplatesFS.ReadFile("built_in/privacy-bundle.json")
	if err != nil {
		t.Fatalf("Failed to read privacy-bundle.json: %v", err)
	}
	t.Logf("Read %d bytes from privacy-bundle.json", len(data))
}
