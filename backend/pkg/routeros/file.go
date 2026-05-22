package routeros

import (
	"fmt"
	"strconv"
	"time"
)

// FileInfo represents file metadata from RouterOS.
type FileInfo struct {
	ID       string
	Name     string
	Size     int64
	Type     string
	ModTime  string
	Comment  string
	Disabled bool
}

// GetFile retrieves file metadata by name from RouterOS /file path.
func (c *Client) GetFile(name string) (*FileInfo, error) {
	if name == "" {
		return nil, fmt.Errorf("file name is required")
	}

	results, err := c.GetAll("/file", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get file %s: %w", name, err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("file %s not found", name)
	}

	return parseFileInfo(results[0]), nil
}

// GetFileContents retrieves the contents of a file by name or ID from RouterOS.
// The chunkSize parameter should be the size of the file, or 0 to use default chunk size.
// Returns the file contents as a string.
// Includes retry logic to handle cases where file write is still in progress.
func (c *Client) GetFileContents(nameOrID string, chunkSize int64) (string, error) {
	if nameOrID == "" {
		return "", fmt.Errorf("file name or ID is required")
	}

	if chunkSize == 0 {
		chunkSize = 10240
	}

	const maxRetries = 5
	const initialDelay = 50 * time.Millisecond

	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		reply, err := c.Execute("/file/read", "=file="+nameOrID, "=offset=0", "=chunk-size="+fmt.Sprintf("%d", chunkSize))
		if err != nil {
			lastErr = err
			if attempt < maxRetries-1 {
				time.Sleep(initialDelay * time.Duration(1<<uint(attempt)))
			}
			continue
		}

		if reply == nil || len(reply.Re) == 0 {
			lastErr = fmt.Errorf("unexpected response format for file %s", nameOrID)
			if attempt < maxRetries-1 {
				time.Sleep(initialDelay * time.Duration(1<<uint(attempt)))
			}
			continue
		}

		contents, ok := reply.Re[0].Map["data"]
		if !ok || contents == "" {
			lastErr = fmt.Errorf("no contents returned for file %s", nameOrID)
			if attempt < maxRetries-1 {
				time.Sleep(initialDelay * time.Duration(1<<uint(attempt)))
			}
			continue
		}

		return contents, nil
	}

	return "", fmt.Errorf("failed to read file %s after %d attempts: %w", nameOrID, maxRetries, lastErr)
}

// ListFiles retrieves all files from RouterOS /file path.
func (c *Client) ListFiles() ([]FileInfo, error) {
	results, err := c.GetAll("/file")
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}

	files := make([]FileInfo, 0, len(results))
	for _, file := range results {
		files = append(files, *parseFileInfo(file))
	}

	return files, nil
}

// FileExists checks if a file exists in RouterOS by name.
func (c *Client) FileExists(name string) (bool, error) {
	if name == "" {
		return false, fmt.Errorf("file name is required")
	}

	results, err := c.GetAll("/file", "?=name="+name)
	if err != nil {
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return len(results) > 0, nil
}

// parseFileInfo converts a RouterOS file map to FileInfo struct.
func parseFileInfo(fileMap map[string]string) *FileInfo {
	size := int64(0)
	if sizeStr, ok := fileMap["size"]; ok && sizeStr != "" {
		if parsed, err := strconv.ParseInt(sizeStr, 10, 64); err == nil {
			size = parsed
		}
	}

	disabled := fileMap["disabled"] == "true"

	return &FileInfo{
		ID:       fileMap[".id"],
		Name:     fileMap["name"],
		Size:     size,
		Type:     fileMap["type"],
		ModTime:  fileMap["creation-time"],
		Comment:  fileMap["comment"],
		Disabled: disabled,
	}
}
