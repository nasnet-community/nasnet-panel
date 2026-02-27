package features

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// maxExtractSize is the maximum allowed size for extracted files (500MB).
const maxExtractSize = 500 * 1024 * 1024

// Archive format constants.
const (
	formatNone   = "none"
	formatZipExt = "zip"
)

// ArchiveExtractor handles extraction of binaries from archive formats.
type ArchiveExtractor struct{}

// NewArchiveExtractor creates a new archive extractor.
func NewArchiveExtractor() *ArchiveExtractor {
	return &ArchiveExtractor{}
}

// Extract extracts a file from an archive to the target path.
// format: "tar.gz", "zip", or "none" (raw binary copy)
// extractPath: the filename to find inside the archive (e.g., "sing-box")
// targetPath: where to write the extracted binary
func (e *ArchiveExtractor) Extract(archivePath, format, extractPath, targetPath string) error {
	// Ensure target directory exists
	if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
		return fmt.Errorf("failed to create target directory: %w", err)
	}

	switch format {
	case "", formatNone:
		return e.copyBinary(archivePath, targetPath)
	case "tar.gz":
		return e.extractTarGz(archivePath, extractPath, targetPath)
	case formatZipExt:
		return e.extractZip(archivePath, extractPath, targetPath)
	default:
		return fmt.Errorf("unsupported archive format: %q", format)
	}
}

// copyBinary copies a raw binary file to the target path with executable permissions.
func (e *ArchiveExtractor) copyBinary(srcPath, targetPath string) error {
	tmpPath := targetPath + ".tmp"

	src, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("failed to open source: %w", err)
	}
	defer src.Close()

	dst, err := os.OpenFile(tmpPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o755)
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	if _, err := io.Copy(dst, src); err != nil {
		dst.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("failed to copy binary: %w", err)
	}

	if err := dst.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to close temp file: %w", err)
	}

	if err := os.Rename(tmpPath, targetPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to finalize binary: %w", err)
	}

	if err := os.Chmod(targetPath, 0o755); err != nil {
		return fmt.Errorf("set executable permissions: %w", err)
	}
	return nil
}

// extractTarGz extracts a file from a tar.gz archive.
func (e *ArchiveExtractor) extractTarGz(archivePath, extractPath, targetPath string) error {
	f, err := os.Open(archivePath)
	if err != nil {
		return fmt.Errorf("failed to open archive: %w", err)
	}
	defer f.Close()

	gz, err := gzip.NewReader(f)
	if err != nil {
		return fmt.Errorf("failed to create gzip reader: %w", err)
	}
	defer gz.Close()

	tr := tar.NewReader(gz)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read tar entry: %w", err)
		}

		// Only process regular files
		if header.Typeflag != tar.TypeReg {
			continue
		}

		// Match by exact name or basename
		if !matchesExtractPath(header.Name, extractPath) {
			continue
		}

		// Found the target file - extract it
		return e.writeExtractedFile(io.LimitReader(tr, maxExtractSize), targetPath)
	}

	return fmt.Errorf("file %q not found in tar.gz archive %s", extractPath, filepath.Base(archivePath))
}

// extractZip extracts a file from a zip archive.
func (e *ArchiveExtractor) extractZip(archivePath, extractPath, targetPath string) error {
	r, err := zip.OpenReader(archivePath)
	if err != nil {
		return fmt.Errorf("failed to open zip archive: %w", err)
	}
	defer r.Close()

	for _, f := range r.File {
		// Only process regular files
		if f.FileInfo().IsDir() {
			continue
		}

		// Match by exact name or basename
		if !matchesExtractPath(f.Name, extractPath) {
			continue
		}

		// Found the target file - extract it
		rc, err := f.Open()
		if err != nil {
			return fmt.Errorf("failed to open zip entry %q: %w", f.Name, err)
		}

		err = e.writeExtractedFile(io.LimitReader(rc, maxExtractSize), targetPath)
		rc.Close()
		return err
	}

	return fmt.Errorf("file %q not found in zip archive %s", extractPath, filepath.Base(archivePath))
}

// matchesExtractPath checks if a file path in an archive matches the desired extract path.
// Matches by exact name or by basename (to handle paths like "sing-box-1.11.0/sing-box").
func matchesExtractPath(archiveEntryPath, extractPath string) bool {
	// Clean the path to prevent traversal
	clean := filepath.Clean(archiveEntryPath)

	// Exact match
	if clean == extractPath {
		return true
	}

	// Basename match (handles nested paths like "sing-box-1.11.0/sing-box")
	if filepath.Base(clean) == extractPath {
		return true
	}

	// Case-insensitive basename match
	if strings.EqualFold(filepath.Base(clean), extractPath) {
		return true
	}

	return false
}

// writeExtractedFile writes content from a reader to a target path atomically.
func (e *ArchiveExtractor) writeExtractedFile(reader io.Reader, targetPath string) error {
	tmpPath := targetPath + ".tmp"

	dst, err := os.OpenFile(tmpPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o755)
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	if _, err := io.Copy(dst, reader); err != nil {
		dst.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("failed to write extracted file: %w", err)
	}

	if err := dst.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to close temp file: %w", err)
	}

	if err := os.Rename(tmpPath, targetPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to finalize extracted file: %w", err)
	}

	if err := os.Chmod(targetPath, 0o755); err != nil {
		return fmt.Errorf("set executable permissions: %w", err)
	}
	return nil
}
