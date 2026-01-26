# Protocol & Communication Patterns

## SSH Table Parsing

```go
type TableParser struct {
    columnDetector *ColumnDetector
    valueParser    *ValueParser
}

func (p *TableParser) Parse(output string) ([]map[string]string, error) {
    lines := strings.Split(output, "\n")

    // Detect columns from header or spacing
    columns := p.columnDetector.Detect(lines[0])

    var results []map[string]string
    for _, line := range lines[1:] {
        if strings.TrimSpace(line) == "" {
            continue
        }

        row := make(map[string]string)
        for _, col := range columns {
            value := p.extractValue(line, col)
            row[col.Name] = p.valueParser.Parse(value, col.Type)
        }
        results = append(results, row)
    }

    return results, nil
}

// MikroTik-specific table format
// Flags: X - disabled; R - running
// 0 X  ether1       ether  1500  00:11:22:33:44:55
// 1 R  ether2       ether  1500  00:11:22:33:44:56

func (p *TableParser) ParseMikroTik(output string) ([]MikroTikRow, error) {
    // Handle flag column parsing
    // Handle dynamic column detection
}
```

## Connection Pool Management

```go
type ConnectionPool struct {
    mu          sync.RWMutex
    connections map[DeviceID]*PooledConnection
    maxIdle     int
    maxOpen     int
    idleTimeout time.Duration
}

type PooledConnection struct {
    conn        Connection
    protocol    Protocol
    lastUsed    time.Time
    inUse       bool
    healthCheck *HealthChecker
}

func (p *ConnectionPool) Acquire(deviceID DeviceID, platform PlatformType) (Connection, error) {
    p.mu.Lock()
    defer p.mu.Unlock()

    // Check for existing healthy connection
    if pc, ok := p.connections[deviceID]; ok && !pc.inUse {
        if pc.healthCheck.IsHealthy() {
            pc.inUse = true
            pc.lastUsed = time.Now()
            return pc.conn, nil
        }
        // Close unhealthy connection
        pc.conn.Close()
        delete(p.connections, deviceID)
    }

    // Create new connection with protocol fallback
    conn, protocol, err := p.createConnection(deviceID, platform)
    if err != nil {
        return nil, err
    }

    p.connections[deviceID] = &PooledConnection{
        conn:        conn,
        protocol:    protocol,
        lastUsed:    time.Now(),
        inUse:       true,
        healthCheck: NewHealthChecker(conn),
    }

    return conn, nil
}
```

---
