package system

import (
	"testing"
	"time"
)

func TestHasBackupExtension(t *testing.T) {
	cases := map[string]bool{
		"router.backup":       true,
		"Router.BACKUP":       true,
		"  spaced.Backup  ":   true,
		".backup":             false,
		"router.rsc":          false,
		"router.backup.rsc":   false,
		"router.backup.zip":   false,
		"routerbackup":        false,
		"":                    false,
		"2026-10-29_01.bak":   false,
		"nested/dir/x.backup": true,
	}
	for name, want := range cases {
		if got := hasBackupExtension(name); got != want {
			t.Errorf("hasBackupExtension(%q) = %v, want %v", name, got, want)
		}
	}
}

func TestUploadedBackupFilename(t *testing.T) {
	ts := time.Date(2026, 11, 16, 9, 5, 7, 0, time.UTC)
	got := uploadedBackupFilename(ts)
	if want := "uploaded_2026-11-16_09-05-07.backup"; got != want {
		t.Fatalf("uploadedBackupFilename() = %q, want %q", got, want)
	}
	if !isValidBackupFilename(got) {
		t.Fatalf("uploadedBackupFilename() = %q is not accepted by isValidBackupFilename", got)
	}
}
