// Package rosapi is a small RouterOS API client.
//
// Commands are serialized per client and every read and write carries a deadline, so a router
// that stops answering fails the command instead of blocking it forever. A single goroutine
// reads the connection at any time, and Close only closes the net.Conn, so it is safe to call
// while a command is running.
package rosapi

import (
	"bufio"
	"bytes"
	"crypto/md5" //nolint:gosec,gocritic // RouterOS pre-6.43 login challenge requires MD5
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const (
	reSentence    = "!re"
	doneSentence  = "!done"
	trapSentence  = "!trap"
	fatalSentence = "!fatal"
	emptySentence = "!empty"

	maxWordSize = 16 << 20

	keepAlivePeriod = 15 * time.Second
)

// DefaultIdleTimeout is how long a command may go without receiving any data from the router.
var DefaultIdleTimeout = 60 * time.Second

// ErrClosed is returned when a command runs on a closed or broken connection.
var ErrClosed = errors.New("use of closed network connection")

// Pair is one key/value attribute of a sentence.
type Pair struct {
	Key, Value string
}

// Sentence is one reply line read from the router.
type Sentence struct {
	Word string
	Tag  string
	List []Pair
	Map  map[string]string
}

func (s *Sentence) String() string {
	return fmt.Sprintf("%s @%s %#q", s.Word, s.Tag, s.List)
}

// Reply holds all the sentences of one command reply.
type Reply struct {
	Re   []*Sentence
	Done *Sentence
}

func (r *Reply) String() string {
	var sb strings.Builder
	for _, sen := range r.Re {
		sb.WriteString(sen.String())
		sb.WriteRune('\n')
	}
	if r.Done != nil {
		sb.WriteString(r.Done.String())
	}
	return sb.String()
}

// DeviceError is an error sentence (!trap or !fatal) sent by the router.
type DeviceError struct {
	Sentence *Sentence
}

func (e *DeviceError) Error() string {
	if m := e.Sentence.Map["message"]; m != "" {
		return "from RouterOS device: " + m
	}
	return "from RouterOS device: unknown error: " + e.Sentence.String()
}

// UnknownReplyError is returned for a reply sentence with an unrecognized first word.
type UnknownReplyError struct {
	Sentence *Sentence
}

func (e *UnknownReplyError) Error() string {
	return "unknown RouterOS reply word: " + e.Sentence.Word
}

// Client is a connection to a RouterOS API service.
type Client struct {
	mu          sync.Mutex
	conn        net.Conn
	r           *bufio.Reader
	w           *bufio.Writer
	idleTimeout time.Duration
	closed      atomic.Bool
}

// DialTimeout connects to address and logs in. The timeout covers both dialing and login.
func DialTimeout(address, username, password string, timeout time.Duration) (*Client, error) {
	dialer := net.Dialer{Timeout: timeout, KeepAlive: keepAlivePeriod}
	conn, err := dialer.Dial("tcp", address)
	if err != nil {
		return nil, err
	}

	c := NewClient(conn)
	c.idleTimeout = timeout
	if err := c.Login(username, password); err != nil {
		_ = c.Close()
		return nil, fmt.Errorf("could not login: %w", err)
	}
	c.idleTimeout = DefaultIdleTimeout

	return c, nil
}

// NewClient wraps an established connection. It does not log in.
func NewClient(conn net.Conn) *Client {
	return &Client{
		conn:        conn,
		r:           bufio.NewReader(conn),
		w:           bufio.NewWriter(conn),
		idleTimeout: DefaultIdleTimeout,
	}
}

// SetIdleTimeout changes how long a command may wait for data from the router.
func (c *Client) SetIdleTimeout(d time.Duration) {
	c.mu.Lock()
	c.idleTimeout = d
	c.mu.Unlock()
}

// Close closes the connection. It is safe to call concurrently with Run, which then fails.
func (c *Client) Close() error {
	if c.closed.Swap(true) {
		return nil
	}
	return c.conn.Close()
}

// Login authenticates, supporting both the RouterOS 6.43+ and the older challenge method.
func (c *Client) Login(username, password string) error {
	r, err := c.Run("/login", "=name="+username, "=password="+password)
	if err != nil {
		return err
	}
	if r.Done == nil {
		return errors.New("RouterOS: /login: no reply")
	}
	ret, ok := r.Done.Map["ret"]
	if !ok {
		return nil
	}

	challenge, err := hex.DecodeString(ret)
	if err != nil {
		return fmt.Errorf("RouterOS: /login: invalid challenge received: %w", err)
	}
	h := md5.New() //nolint:gosec,gocritic // RouterOS pre-6.43 login challenge requires MD5
	h.Write([]byte{0})
	h.Write([]byte(password))
	h.Write(challenge)
	_, err = c.Run("/login", "=name="+username, fmt.Sprintf("=response=00%x", h.Sum(nil)))
	return err
}

// Run sends one sentence and returns its reply. A !trap error is returned after the reply has
// been read to its end, so the connection stays usable. Any I/O or protocol error closes it.
func (c *Client) Run(sentence ...string) (*Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.closed.Load() {
		return nil, ErrClosed
	}

	if err := c.write(sentence); err != nil {
		_ = c.Close()
		return nil, err
	}

	reply, err := c.readReply()
	if err != nil {
		var devErr *DeviceError
		if !errors.As(err, &devErr) || devErr.Sentence.Word == fatalSentence {
			_ = c.Close()
		}
		return nil, err
	}
	return reply, nil
}

func (c *Client) write(words []string) error {
	if err := c.conn.SetWriteDeadline(time.Now().Add(c.idleTimeout)); err != nil {
		return err
	}
	for _, word := range words {
		if _, err := c.w.Write(encodeLength(len(word))); err != nil {
			return err
		}
		if _, err := c.w.WriteString(word); err != nil {
			return err
		}
	}
	if err := c.w.WriteByte(0); err != nil {
		return err
	}
	return c.w.Flush()
}

func (c *Client) readReply() (*Reply, error) {
	out := new(Reply)
	var lastErr error

	for {
		if err := c.conn.SetReadDeadline(time.Now().Add(c.idleTimeout)); err != nil {
			return nil, err
		}
		sen, err := c.readSentence()
		if err != nil {
			return nil, err
		}

		switch sen.Word {
		case reSentence:
			out.Re = append(out.Re, sen)
		case doneSentence:
			out.Done = sen
			return out, lastErr
		case trapSentence:
			lastErr = &DeviceError{Sentence: sen}
		case fatalSentence:
			return nil, &DeviceError{Sentence: sen}
		case "", emptySentence:
		default:
			return nil, &UnknownReplyError{Sentence: sen}
		}
	}
}

func (c *Client) readSentence() (*Sentence, error) {
	sen := &Sentence{Map: make(map[string]string)}
	for {
		b, err := c.readWord()
		if err != nil {
			return nil, err
		}
		if len(b) == 0 {
			return sen, nil
		}
		switch {
		case sen.Word == "":
			sen.Word = string(b)
		case bytes.HasPrefix(b, []byte(".tag=")):
			sen.Tag = string(b[5:])
		case b[0] == '=':
			key, value, _ := strings.Cut(string(b[1:]), "=")
			sen.List = append(sen.List, Pair{key, value})
			sen.Map[key] = value
		case b[0] == '.':
		default:
			return nil, fmt.Errorf("invalid RouterOS sentence word: %#q", b)
		}
	}
}

func (c *Client) readWord() ([]byte, error) {
	n, err := c.readLength()
	if err != nil {
		return nil, err
	}
	if n > maxWordSize {
		return nil, fmt.Errorf("invalid RouterOS sentence word: length %d exceeds limit", n)
	}
	b := make([]byte, n)
	if _, err := io.ReadFull(c.r, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (c *Client) readLength() (int64, error) {
	first, err := c.r.ReadByte()
	if err != nil {
		return 0, err
	}

	var extra int
	var n int64
	switch {
	case first&0x80 == 0x00:
		return int64(first), nil
	case first&0xC0 == 0x80:
		extra, n = 1, int64(first&^0xC0)
	case first&0xE0 == 0xC0:
		extra, n = 2, int64(first&^0xE0)
	case first&0xF0 == 0xE0:
		extra, n = 3, int64(first&^0xF0)
	case first == 0xF0:
		extra = 4
	default:
		return 0, fmt.Errorf("invalid RouterOS sentence word: bad length prefix 0x%02x", first)
	}

	buf := make([]byte, extra)
	if _, err := io.ReadFull(c.r, buf); err != nil {
		return 0, err
	}
	for _, b := range buf {
		n = n<<8 | int64(b)
	}
	return n, nil
}

func encodeLength(l int) []byte {
	n := uint32(l) //nolint:gosec // word sizes are far below 4 GiB
	switch {
	case n < 0x80:
		return binary.BigEndian.AppendUint32(nil, n)[3:]
	case n < 0x4000:
		return binary.BigEndian.AppendUint16(nil, uint16(n|0x8000)) //nolint:gosec // n < 0x4000
	case n < 0x200000:
		return binary.BigEndian.AppendUint32(nil, n|0xC00000)[1:]
	case n < 0x10000000:
		return binary.BigEndian.AppendUint32(nil, n|0xE0000000)
	default:
		return binary.BigEndian.AppendUint32([]byte{0xF0}, n)
	}
}
