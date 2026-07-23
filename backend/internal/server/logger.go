// Package server provides HTTP/HTTPS server setup and logging utilities.
package server

import (
	"io"
	"log"
	"os"
	"strings"

	"nasnet-panel/internal/config"
)

// filteredErrorLog returns a logger for http.Server.ErrorLog that drops lines
// matching any of the given substrings in production, while passing all other
// messages through. Returns nil in non-production so the default logger is used.
func filteredErrorLog(filters ...string) *log.Logger {
	if !config.IsProduction() {
		return nil
	}
	return log.New(&filteringWriter{w: os.Stderr, filters: filters}, "", log.LstdFlags)
}

// filteringWriter drops log lines that contain any of the filter substrings.
type filteringWriter struct {
	w       io.Writer
	filters []string
}

func (f *filteringWriter) Write(p []byte) (int, error) {
	s := string(p)
	for _, filter := range f.filters {
		if strings.Contains(s, filter) {
			return len(p), nil
		}
	}
	return f.w.Write(p)
}
