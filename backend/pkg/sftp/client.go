package sftp

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

// Client represents an SFTP client connection.
type Client struct {
	host       string
	port       int
	username   string
	password   string
	sshClient  *ssh.Client
	sftpClient *sftp.Client
	timeout    time.Duration
}

// Config represents SFTP client configuration.
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	Timeout  time.Duration
}

// NewClient creates a new SFTP client with the given configuration.
func NewClient(cfg Config) *Client {
	if cfg.Port == 0 {
		cfg.Port = 22
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}

	return &Client{
		host:     cfg.Host,
		port:     cfg.Port,
		username: cfg.Username,
		password: cfg.Password,
		timeout:  cfg.Timeout,
	}
}

// Connect establishes SSH and SFTP connections to the remote server.
func (c *Client) Connect() error {
	if c.host == "" {
		return fmt.Errorf("host is required")
	}
	if c.username == "" {
		return fmt.Errorf("username is required")
	}
	if c.password == "" {
		return fmt.Errorf("password is required")
	}

	sshConfig := &ssh.ClientConfig{
		User: c.username,
		Auth: []ssh.AuthMethod{
			ssh.Password(c.password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), //nolint:gosec // For RouterOS connections only
		Timeout:         c.timeout,
	}

	addr := fmt.Sprintf("%s:%d", c.host, c.port)

	sshClient, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return fmt.Errorf("failed to dial SSH: %w", err)
	}

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		sshClient.Close()
		return fmt.Errorf("failed to create SFTP client: %w", err)
	}

	c.sshClient = sshClient
	c.sftpClient = sftpClient
	return nil
}

// Close closes both SFTP and SSH connections.
func (c *Client) Close() error {
	var err error
	if c.sftpClient != nil {
		err = c.sftpClient.Close()
	}
	if c.sshClient != nil {
		if closeErr := c.sshClient.Close(); closeErr != nil && err == nil {
			err = closeErr
		}
	}
	return err
}

// UploadFromFile uploads a local file to the remote server.
// remotePath can be a full path or just a filename.
func (c *Client) UploadFromFile(localPath, remotePath string) error {
	if c.sftpClient == nil {
		return fmt.Errorf("SFTP client not connected")
	}

	if localPath == "" {
		return fmt.Errorf("local path is required")
	}
	if remotePath == "" {
		return fmt.Errorf("remote path is required")
	}

	localFile, err := os.Open(localPath)
	if err != nil {
		return fmt.Errorf("failed to open local file %s: %w", localPath, err)
	}
	defer localFile.Close()

	remoteFile, err := c.sftpClient.Create(remotePath)
	if err != nil {
		return fmt.Errorf("failed to create remote file %s: %w", remotePath, err)
	}
	defer remoteFile.Close()

	if _, err := io.Copy(remoteFile, localFile); err != nil {
		return fmt.Errorf("failed to upload file to %s: %w", remotePath, err)
	}

	return nil
}

// UploadFromString uploads content from a string to the remote server.
// remotePath can be a full path or just a filename.
func (c *Client) UploadFromString(content, remotePath string) error {
	if c.sftpClient == nil {
		return fmt.Errorf("SFTP client not connected")
	}

	if remotePath == "" {
		return fmt.Errorf("remote path is required")
	}

	remoteFile, err := c.sftpClient.Create(remotePath)
	if err != nil {
		return fmt.Errorf("failed to create remote file %s: %w", remotePath, err)
	}
	defer remoteFile.Close()
	if _, err := io.WriteString(remoteFile, content); err != nil {
		return fmt.Errorf("failed to write to remote file %s: %w", remotePath, err)
	}

	return nil
}

// UploadFromReader uploads content from an io.Reader to the remote server.
func (c *Client) UploadFromReader(reader io.Reader, remotePath string) error {
	if c.sftpClient == nil {
		return fmt.Errorf("SFTP client not connected")
	}

	if remotePath == "" {
		return fmt.Errorf("remote path is required")
	}

	remoteFile, err := c.sftpClient.Create(remotePath)
	if err != nil {
		return fmt.Errorf("failed to create remote file %s: %w", remotePath, err)
	}
	defer remoteFile.Close()

	if _, err := io.Copy(remoteFile, reader); err != nil {
		return fmt.Errorf("failed to upload to remote file %s: %w", remotePath, err)
	}

	return nil
}

// Download downloads a file from the remote server to a local path.
func (c *Client) Download(remotePath, localPath string) error {
	if c.sftpClient == nil {
		return fmt.Errorf("SFTP client not connected")
	}

	if remotePath == "" {
		return fmt.Errorf("remote path is required")
	}
	if localPath == "" {
		return fmt.Errorf("local path is required")
	}

	remoteFile, err := c.sftpClient.Open(remotePath)
	if err != nil {
		return fmt.Errorf("failed to open remote file %s: %w", remotePath, err)
	}
	defer remoteFile.Close()

	// Create parent directories if needed
	localDir := filepath.Dir(localPath)
	if err := os.MkdirAll(localDir, 0755); err != nil {
		return fmt.Errorf("failed to create local directory %s: %w", localDir, err)
	}

	localFile, err := os.Create(localPath)
	if err != nil {
		return fmt.Errorf("failed to create local file %s: %w", localPath, err)
	}
	defer localFile.Close()

	if _, err := io.Copy(localFile, remoteFile); err != nil {
		return fmt.Errorf("failed to download file from %s: %w", remotePath, err)
	}

	return nil
}

// ListFiles lists files in the remote directory.
func (c *Client) ListFiles(remotePath string) ([]os.FileInfo, error) {
	if c.sftpClient == nil {
		return nil, fmt.Errorf("SFTP client not connected")
	}

	if remotePath == "" {
		remotePath = "."
	}

	files, err := c.sftpClient.ReadDir(remotePath)
	if err != nil {
		return nil, fmt.Errorf("failed to list files in %s: %w", remotePath, err)
	}

	return files, nil
}

// DeleteFile deletes a file on the remote server.
func (c *Client) DeleteFile(remotePath string) error {
	if c.sftpClient == nil {
		return fmt.Errorf("SFTP client not connected")
	}

	if remotePath == "" {
		return fmt.Errorf("remote path is required")
	}

	if err := c.sftpClient.Remove(remotePath); err != nil {
		return fmt.Errorf("failed to delete remote file %s: %w", remotePath, err)
	}

	return nil
}

// FileExists checks if a file exists on the remote server.
func (c *Client) FileExists(remotePath string) (bool, error) {
	if c.sftpClient == nil {
		return false, fmt.Errorf("SFTP client not connected")
	}

	if remotePath == "" {
		return false, fmt.Errorf("remote path is required")
	}

	_, err := c.sftpClient.Stat(remotePath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}
