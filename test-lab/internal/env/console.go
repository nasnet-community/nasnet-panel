package env

import (
	"fmt"
	"net"
	"os"
	"strings"
	"sync"
	"time"
)

type console struct {
	conn net.Conn
	log  *os.File
	done chan struct{}

	mu  sync.Mutex
	buf string
}

func dialConsole(path, logPath string, timeout time.Duration) (*console, error) {
	deadline := time.Now().Add(timeout)
	for {
		conn, err := net.Dial("unix", path)
		if err == nil {
			f, ferr := os.Create(logPath)
			if ferr != nil {
				_ = conn.Close()
				return nil, ferr
			}
			c := &console{conn: conn, log: f, done: make(chan struct{})}
			go c.read()
			return c, nil
		}
		if time.Now().After(deadline) {
			return nil, fmt.Errorf("connect to router console: %w", err)
		}
		time.Sleep(500 * time.Millisecond)
	}
}

func (c *console) read() {
	defer close(c.done)
	chunk := make([]byte, 4096)
	for {
		n, err := c.conn.Read(chunk)
		if n > 0 {
			_, _ = c.log.Write(chunk[:n])
			c.mu.Lock()
			c.buf += strings.ToLower(string(chunk[:n]))
			c.mu.Unlock()
		}
		if err != nil {
			return
		}
	}
}

func (c *console) expect(timeout time.Duration, poke bool, patterns ...string) (string, string, error) {
	deadline := time.Now().Add(timeout)
	lastPoke := time.Now()
	for {
		c.mu.Lock()
		for _, pattern := range patterns {
			if i := strings.Index(c.buf, pattern); i >= 0 {
				before := c.buf[:i]
				c.buf = c.buf[i+len(pattern):]
				c.mu.Unlock()
				return pattern, before, nil
			}
		}
		c.mu.Unlock()

		select {
		case <-c.done:
			return "", "", fmt.Errorf("console closed while waiting for %q", patterns)
		default:
		}
		if time.Now().After(deadline) {
			return "", "", fmt.Errorf("timed out after %s waiting for %q", timeout, patterns)
		}
		if poke && time.Since(lastPoke) > 3*time.Second {
			_ = c.send("")
			lastPoke = time.Now()
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func (c *console) clear() {
	c.mu.Lock()
	c.buf = ""
	c.mu.Unlock()
}

func (c *console) settle() {
	time.Sleep(time.Second)
	c.clear()
}

func (c *console) login(user, password string) (bool, error) {
	passwordSet := false
	candidates := []string{"", password}
attempts:
	for attempt := 0; attempt < 4; attempt++ {
		c.settle()
		if err := c.send(user + "+cet"); err != nil {
			return false, err
		}
		match, _, err := c.expect(30*time.Second, false, "password:", "login:")
		if err != nil {
			return false, err
		}
		if match == "login:" {
			continue
		}
		if err := c.send(candidates[attempt%len(candidates)]); err != nil {
			return false, err
		}

		sentLicense, sentNew, sentRepeat := false, false, false
		for {
			match, _, err := c.expect(90*time.Second, false,
				"license?", "repeat new password>", "new password>", "login failed", "login:", "] >")
			if err != nil {
				return false, err
			}
			switch match {
			case "] >":
				c.settle()
				return passwordSet, nil
			case "license?":
				if !sentLicense {
					sentLicense = true
					err = c.send("n")
				}
			case "new password>":
				if !sentNew {
					sentNew = true
					passwordSet = true
					err = c.send(password)
				}
			case "repeat new password>":
				if !sentRepeat {
					sentRepeat = true
					err = c.send(password)
				}
			default:
				continue attempts
			}
			if err != nil {
				return false, err
			}
		}
	}
	return false, fmt.Errorf("could not log in to the router console")
}

func (c *console) send(line string) error {
	_, err := c.conn.Write([]byte(line + "\r"))
	return err
}

func (c *console) close() {
	_ = c.conn.Close()
	<-c.done
	_ = c.log.Close()
}
