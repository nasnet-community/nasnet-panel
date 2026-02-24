package registry

import (
	"context"
	"crypto/tls"
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

	// MaxFileSize is the maximum allowed file size in bytes (default: 500MB).
	// Set to 0 for no limit.
	MaxFileSize int64

	// ProgressFn is called periodically with bytes downloaded so far.
	// Can be nil if progress reporting is not needed.
	ProgressFn func(bytesDownloaded int64, totalBytes int64)

	// HTTPClient is an optional custom HTTP client. If nil, a default client is created.
	HTTPClient *http.Client
}

// DownloadResult contains the result of an HTTP download.
type DownloadResult struct {
	BytesWritten int64
	StatusCode   int
	ContentType  string
}

// DownloadFile downloads a file via HTTP with optional resume support.
func DownloadFile(ctx context.Context, cfg DownloadConfig) (*DownloadResult, error) {
	resp, err := executeDownloadRequest(ctx, cfg)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	totalBytes := parseContentLength(resp, cfg.ResumeFrom)

	file, err := openDestFile(cfg.DestPath, cfg.ResumeFrom)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	written, err := copyWithProgress(resp.Body, file, cfg.ResumeFrom, totalBytes, cfg.ProgressFn)
	if err != nil {
		return nil, err
	}

	return &DownloadResult{
		BytesWritten: written,
		StatusCode:   resp.StatusCode,
		ContentType:  resp.Header.Get("Content-Type"),
	}, nil
}

// executeDownloadRequest creates and executes the HTTP download request.
func executeDownloadRequest(ctx context.Context, cfg DownloadConfig) (*http.Response, error) {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 5 * time.Minute
	}

	var client *http.Client
	if cfg.HTTPClient != nil {
		client = cfg.HTTPClient
	} else {
		// Create a client with strict TLS verification and reasonable timeouts
		transport := &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: false, // DO NOT skip TLS verification
				MinVersion:         tls.VersionTLS12,
			},
			MaxIdleConns:      10,
			IdleConnTimeout:   30 * time.Second,
			DisableKeepAlives: false,
		}
		client = &http.Client{
			Timeout:   timeout,
			Transport: transport,
		}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cfg.URL, http.NoBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create download request: %w", err)
	}

	if cfg.ResumeFrom > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", cfg.ResumeFrom))
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download failed: %w", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		resp.Body.Close()
		return nil, fmt.Errorf("download returned status %d", resp.StatusCode)
	}

	// Validate Content-Length doesn't exceed MaxFileSize
	if cfg.MaxFileSize > 0 {
		contentLength := parseContentLength(resp, 0) // get actual content length
		if contentLength > cfg.MaxFileSize {
			resp.Body.Close()
			return nil, fmt.Errorf("file size %d exceeds maximum allowed %d", contentLength, cfg.MaxFileSize)
		}
	}

	return resp, nil
}

// parseContentLength extracts total byte count from Content-Length header.
func parseContentLength(resp *http.Response, resumeFrom int64) int64 {
	cl := resp.Header.Get("Content-Length")
	if cl == "" {
		return 0
	}
	parsed, err := strconv.ParseInt(cl, 10, 64)
	if err != nil {
		return 0
	}
	return parsed + resumeFrom
}

// openDestFile opens the destination file with appropriate flags for new or resumed download.
func openDestFile(destPath string, resumeFrom int64) (*os.File, error) {
	flags := os.O_CREATE | os.O_WRONLY
	if resumeFrom > 0 {
		flags |= os.O_APPEND
	} else {
		flags |= os.O_TRUNC
	}

	file, err := os.OpenFile(destPath, flags, 0o640)
	if err != nil {
		return nil, fmt.Errorf("failed to open destination file: %w", err)
	}
	return file, nil
}

// copyWithProgress copies from reader to writer with optional progress reporting and size limits.
func copyWithProgress(src io.Reader, dst io.Writer, resumeFrom, totalBytes int64, progressFn func(int64, int64)) (int64, error) {
	var written int64
	buf := make([]byte, 32*1024) // 32KB buffer

	// Limit reader to prevent reading more than announced content-length
	// This prevents slow-loris and other DoS attacks
	var limitedSrc io.Reader
	if totalBytes > 0 {
		limitedSrc = io.LimitReader(src, totalBytes)
	} else {
		limitedSrc = src
	}

	for {
		n, readErr := limitedSrc.Read(buf)
		if n > 0 {
			nw, writeErr := dst.Write(buf[:n])
			if writeErr != nil {
				return written, fmt.Errorf("failed to write to file: %w", writeErr)
			}
			written += int64(nw)

			if progressFn != nil {
				progressFn(resumeFrom+written, totalBytes)
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return written, fmt.Errorf("failed to read response body: %w", readErr)
		}
	}

	return written, nil
}
