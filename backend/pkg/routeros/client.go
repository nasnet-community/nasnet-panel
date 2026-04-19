package routeros

import (
	"fmt"
	"time"

	ros "github.com/go-routeros/routeros/v3"
)

type Client struct {
	conn *ros.Client
}

type ConnectionConfig struct {
	Address  string
	Username string
	Password string
	Port     int
	Timeout  int
}

func NewClient(config ConnectionConfig) (*Client, error) {
	if config.Port == 0 {
		config.Port = 8728
	}
	config.Timeout = 3

	address := fmt.Sprintf("%s:%d", config.Address, config.Port)

	conn, err := ros.DialTimeout(address, config.Username, config.Password, time.Second*time.Duration(config.Timeout))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RouterOS: %w", err)
	}

	return &Client{conn: conn}, nil
}

func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *Client) Execute(command string, args ...string) (*ros.Reply, error) {
	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := make([]string, 0, len(args)+1)
	sentence = append(sentence, command)
	sentence = append(sentence, args...)

	return c.conn.Run(sentence...)
}

func (c *Client) Query(path string, args ...string) (*ros.Reply, error) {
	sentence := []string{path + "/print"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Add(path string, args ...string) (*ros.Reply, error) {
	sentence := []string{path + "/add"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Set(path string, args ...string) (*ros.Reply, error) {
	sentence := []string{path + "/set"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Remove(path string, args ...string) (*ros.Reply, error) {
	sentence := []string{path + "/remove"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Enable(path string, id string) (*ros.Reply, error) {
	return c.Execute(path+"/enable", "=.id="+id)
}

func (c *Client) Disable(path string, id string) (*ros.Reply, error) {
	return c.Execute(path+"/disable", "=.id="+id)
}

func (c *Client) Comment(path string, id string, comment string) (*ros.Reply, error) {
	return c.Set(path, "=.id="+id, "comment="+comment)
}

func (c *Client) GetFirst(path string, args ...string) (map[string]string, error) {
	reply, err := c.Query(path, args...)
	if err != nil {
		return nil, err
	}

	if len(reply.Re) == 0 {
		return nil, fmt.Errorf("no results found")
	}

	return reply.Re[0].Map, nil
}

func (c *Client) GetAll(path string, args ...string) ([]map[string]string, error) {
	reply, err := c.Query(path, args...)
	if err != nil {
		return nil, err
	}

	results := make([]map[string]string, 0)
	for _, re := range reply.Re {
		results = append(results, re.Map)
	}

	return results, nil
}

func (c *Client) GetByID(path string, id string) (map[string]string, error) {
	return c.GetFirst(path, "?=.id="+id)
}

func (c *Client) Context() *ros.Client {
	return c.conn
}

func extractRetID(reply *ros.Reply) string {
	if reply == nil || len(reply.Re) == 0 {
		return ""
	}

	for _, pair := range reply.Re[0].List {
		if pair.Key == "ret" {
			return pair.Value
		}
	}
	return ""
}
