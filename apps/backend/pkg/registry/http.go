package registry

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"
)

// DownloadConfig configures an HTTP download operation.
type DownloadConfig struct {
	// URL is the source URL to download from.
	URL string

	// DestPath is the local file path to write the download to.
	DestPath string

	// Timeout is the maximum time for the entire download (default: 5 minutes).
	Timeout time.Duration

	// ResumeFrom is the byte offset to resume a partial download from.
	// If 0, the download starts from the beginning.
	ResumeFrom int64

	// ProgressFn is called periodically with bytes downloaded so far.
	// Can be nil if progress reporting is not needed.
	ProgressFn func(bytesDownloaded int64, totalBytes int64)
}

// DownloadResult contains the result of an HTTP download.
type DownloadResult struct {
	BytesWritten int64
	StatusCode   int
	ContentType  string
}

// DownloadFile downloads a file via HTTP with optional resume support.
func DownloadFile(ctx context.Context, cfg DownloadConfig) (*DownloadResult, error) {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 5 * time.Minute
	}

	client := &http.Client{Timeout: timeout}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cfg.URL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create download request: %w", err)
	}

	// Add Range header for resume support
	if cfg.ResumeFrom > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", cfg.ResumeFrom))
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	// Accept 200 (full) or 206 (partial/resume)
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		return nil, fmt.Errorf("download returned status %d", resp.StatusCode)
	}

	// Determine total size for progress reporting
	var totalBytes int64
	if cl := resp.Header.Get("Content-Length"); cl != "" {
		totalBytes, _ = strconv.ParseInt(cl, 10, 64)
		totalBytes += cfg.ResumeFrom
	}

	// Open destination file
	flags := os.O_CREATE | os.O_WRONLY
	if cfg.ResumeFrom > 0 {
		flags |= os.O_APPEND
	} else {
		flags |= os.O_TRUNC
	}

	file, err := os.OpenFile(cfg.DestPath, flags, 0640)
	if err != nil {
		return nil, fmt.Errorf("failed to open destination file: %w", err)
	}
	defer file.Close()

	// Copy with progress reporting
	var written int64
	buf := make([]byte, 32*1024) // 32KB buffer

	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			nw, writeErr := file.Write(buf[:n])
			if writeErr != nil {
				return nil, fmt.Errorf("failed to write to file: %w", writeErr)
			}
			written += int64(nw)

			if cfg.ProgressFn != nil {
				cfg.ProgressFn(cfg.ResumeFrom+written, totalBytes)
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return nil, fmt.Errorf("failed to read response body: %w", readErr)
		}
	}

	return &DownloadResult{
		BytesWritten: written,
		StatusCode:   resp.StatusCode,
		ContentType:  resp.Header.Get("Content-Type"),
	}, nil
}
