package ros

import (
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

const DefaultTimeout = 30 * time.Second

var errNotConnected = errors.New("not connected")

var errorMarkers = []string{
	"failure:",
	"syntax error",
	"bad command name",
	"expected end of command",
	"input does not match",
	"no such item",
}

type Client struct {
	host string
	port int
	user string
	pass string

	mu   sync.Mutex
	conn *ssh.Client
}

func Dial(host string, port int, user, pass string) (*Client, error) {
	c := &Client{host: host, port: port, user: user, pass: pass}
	conn, err := c.dial()
	if err != nil {
		return nil, err
	}
	c.conn = conn
	return c, nil
}

func (c *Client) dial() (*ssh.Client, error) {
	cfg := &ssh.ClientConfig{
		User: c.user,
		Auth: []ssh.AuthMethod{
			ssh.Password(c.pass),
			ssh.KeyboardInteractive(func(_, _ string, questions []string, _ []bool) ([]string, error) {
				answers := make([]string, len(questions))
				for i := range questions {
					answers[i] = c.pass
				}
				return answers, nil
			}),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), //nolint:gosec
		Timeout:         6 * time.Second,
	}
	return ssh.Dial("tcp", net.JoinHostPort(c.host, strconv.Itoa(c.port)), cfg)
}

func (c *Client) current() *ssh.Client {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.conn
}

func (c *Client) Reconnect() error {
	conn, err := c.dial()
	if err != nil {
		return err
	}
	c.mu.Lock()
	old := c.conn
	c.conn = conn
	c.mu.Unlock()
	if old != nil {
		old.Close()
	}
	return nil
}

func (c *Client) Close() {
	c.mu.Lock()
	conn := c.conn
	c.conn = nil
	c.mu.Unlock()
	if conn != nil {
		conn.Close()
	}
}

func (c *Client) RunRaw(cmd string, timeout time.Duration) (string, error) {
	conn := c.current()
	if conn == nil {
		return "", errNotConnected
	}
	sess, err := conn.NewSession()
	if err != nil {
		return "", err
	}
	defer sess.Close()

	type result struct {
		out []byte
		err error
	}
	done := make(chan result, 1)
	go func() {
		out, rerr := sess.CombinedOutput(cmd)
		done <- result{out, rerr}
	}()
	select {
	case r := <-done:
		return strings.ReplaceAll(string(r.out), "\r", ""), r.err
	case <-time.After(timeout):
		return "", fmt.Errorf("command timed out after %s", timeout)
	}
}

func (c *Client) Run(cmd string) (string, error) {
	return c.RunChecked(cmd, DefaultTimeout)
}

func (c *Client) RunChecked(cmd string, timeout time.Duration) (string, error) {
	out, err := c.RunRaw(cmd, timeout)
	if err != nil {
		if msg := strings.TrimSpace(out); msg != "" {
			return out, fmt.Errorf("%s: %w", msg, err)
		}
		return out, err
	}
	low := strings.ToLower(out)
	for _, marker := range errorMarkers {
		if strings.Contains(low, marker) {
			return out, errors.New(strings.TrimSpace(out))
		}
	}
	return out, nil
}

func (c *Client) Upload(localPath, remotePath string, progress func(done, total int64)) error {
	src, err := os.Open(localPath)
	if err != nil {
		return err
	}
	defer src.Close()
	info, err := src.Stat()
	if err != nil {
		return err
	}
	return c.UploadReader(src, info.Size(), remotePath, progress)
}

func (c *Client) UploadReader(src io.Reader, total int64, remotePath string, progress func(done, total int64)) error {
	conn := c.current()
	if conn == nil {
		return errNotConnected
	}
	sc, err := sftp.NewClient(conn)
	if err != nil {
		return fmt.Errorf("sftp session: %w", err)
	}
	defer sc.Close()

	dst, err := sc.Create(remotePath)
	if err != nil {
		return fmt.Errorf("create %s: %w", remotePath, err)
	}
	defer dst.Close()

	buf := make([]byte, 256*1024)
	var written int64
	for {
		n, rerr := src.Read(buf)
		if n > 0 {
			if _, werr := dst.Write(buf[:n]); werr != nil {
				return fmt.Errorf("upload %s: %w", remotePath, werr)
			}
			written += int64(n)
			if progress != nil {
				progress(written, total)
			}
		}
		if errors.Is(rerr, io.EOF) {
			return nil
		}
		if rerr != nil {
			return rerr
		}
	}
}
