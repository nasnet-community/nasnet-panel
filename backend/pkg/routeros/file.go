package routeros

import (
	"fmt"
	"os"
	"path/filepath"
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

// AddFile writes content to a file on RouterOS device.
// If file doesn't exist, it creates it first. File size is limited to 60KB.
func (c *Client) AddFile(filename, contents string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	exists, err := c.FileExists(filename)
	if err != nil {
		return fmt.Errorf("failed to check file existence: %w", err)
	}

	if !exists {
		_, err := c.Execute("/file/add", "=name="+filename, "=type=file")
		if err != nil {
			return fmt.Errorf("failed to create file %s: %w", filename, err)
		}
	}

	fileInfo, err := c.GetFile(filename)
	if err != nil {
		return fmt.Errorf("failed to get file %s: %w", filename, err)
	}

	_, err = c.Execute("/file/set", "=.id="+fileInfo.ID, "=contents="+contents)
	if err != nil {
		return fmt.Errorf("failed to write file %s: %w", filename, err)
	}

	return nil
}

// UploadFile reads a local file and uploads it to RouterOS device.
// The destination filename is the basename of the source file.
// File size is limited to 60KB.
func (c *Client) UploadFile(localPath string) (string, error) {
	if localPath == "" {
		return "", fmt.Errorf("local file path is required")
	}

	content, err := os.ReadFile(localPath)
	if err != nil {
		return "", fmt.Errorf("failed to read local file %s: %w", localPath, err)
	}

	/*	if len(content) > 61440 {
		return "", fmt.Errorf("file size exceeds 60KB limit: %d bytes", len(content))
	}*/

	filename := filepath.Base(localPath)
	err = c.AddFile(filename, string(content))
	if err != nil {
		return "", err
	}

	return filename, nil
}

// UploadFileAs reads a local file and uploads it to RouterOS device with a custom destination name.
// File size is limited to 60KB.
func (c *Client) UploadFileAs(localPath, remoteFilename string) error {
	if localPath == "" {
		return fmt.Errorf("local file path is required")
	}
	if remoteFilename == "" {
		return fmt.Errorf("remote filename is required")
	}

	content, err := os.ReadFile(localPath)
	if err != nil {
		return fmt.Errorf("failed to read local file %s: %w", localPath, err)
	}

	if len(content) > 61440 {
		return fmt.Errorf("file size exceeds 60KB limit: %d bytes", len(content))
	}

	return c.AddFile(remoteFilename, string(content))
}

// ReplaceFileContents replaces the entire contents of an existing file.
// File size is limited to 60KB.
func (c *Client) ReplaceFileContents(filename, newContents string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	fileInfo, err := c.GetFile(filename)
	if err != nil {
		return fmt.Errorf("failed to get file %s: %w", filename, err)
	}

	_, err = c.Execute("/file/set", "=.id="+fileInfo.ID, "=contents="+newContents)
	if err != nil {
		return fmt.Errorf("failed to replace file %s contents: %w", filename, err)
	}

	return nil
}

// AppendToFile appends content to the end of an existing file.
// File size is limited to 60KB total.
func (c *Client) AppendToFile(filename, contentToAppend string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	currentContents, err := c.GetFileContents(filename, 0)
	if err != nil {
		return fmt.Errorf("failed to read file %s: %w", filename, err)
	}

	newContents := currentContents + contentToAppend
	return c.ReplaceFileContents(filename, newContents)
}

// PrependToFile prepends content to the beginning of an existing file.
// File size is limited to 60KB total.
func (c *Client) PrependToFile(filename, contentToPrepend string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	currentContents, err := c.GetFileContents(filename, 0)
	if err != nil {
		return fmt.Errorf("failed to read file %s: %w", filename, err)
	}

	newContents := contentToPrepend + currentContents
	return c.ReplaceFileContents(filename, newContents)
}

// DeleteFile removes a file from RouterOS by name.
func (c *Client) DeleteFile(filename string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	fileInfo, err := c.GetFile(filename)
	if err != nil {
		return fmt.Errorf("failed to get file %s: %w", filename, err)
	}

	_, err = c.Execute("/file/remove", "=.id="+fileInfo.ID)
	if err != nil {
		return fmt.Errorf("failed to delete file %s: %w", filename, err)
	}

	return nil
}

// CopyFile creates a copy of an existing file with a new name.
func (c *Client) CopyFile(sourceFilename, destinationFilename string) error {
	if sourceFilename == "" {
		return fmt.Errorf("source filename is required")
	}
	if destinationFilename == "" {
		return fmt.Errorf("destination filename is required")
	}

	contents, err := c.GetFileContents(sourceFilename, 0)
	if err != nil {
		return fmt.Errorf("failed to read source file %s: %w", sourceFilename, err)
	}

	return c.AddFile(destinationFilename, contents)
}

// RenameFile renames a file by copying to new name and deleting the old one.
func (c *Client) RenameFile(oldFilename, newFilename string) error {
	if oldFilename == "" {
		return fmt.Errorf("old filename is required")
	}
	if newFilename == "" {
		return fmt.Errorf("new filename is required")
	}

	err := c.CopyFile(oldFilename, newFilename)
	if err != nil {
		return fmt.Errorf("failed to copy file to new name: %w", err)
	}

	err = c.DeleteFile(oldFilename)
	if err != nil {
		return fmt.Errorf("failed to delete old file: %w", err)
	}

	return nil
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
