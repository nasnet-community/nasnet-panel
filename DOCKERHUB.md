# NasNetConnect

**Enterprise-Grade MikroTik Router Management Platform**

A modern, powerful web interface for managing MikroTik RouterOS devices. Built with React + Go, deployable anywhere — including directly on your MikroTik router.

[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github)](https://github.com/joinnasnet/nasnet)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## Features

- **Real-time Dashboard** — Live system metrics, CPU/memory, traffic monitoring
- **Network Management** — Interface configuration, ARP tables, DHCP
- **VPN Control** — IPsec, L2TP, PPTP, WireGuard, OpenVPN, SSTP
- **Wireless Management** — WiFi interfaces, security profiles, clients
- **Firewall Configuration** — Filter rules, NAT, connection tracking
- **Router Discovery** — Network scanning, auto-detection
- **Batch Operations** — Bulk commands with rollback support
- **Multi-Protocol** — REST API, SSH, Telnet, RouterOS API

---

## Supported Architectures

| Architecture | Tag |
|--------------|-----|
| x86-64 | `amd64` |
| ARM64 | `arm64` |
| ARMv7 | `arm` |

Multi-arch images are automatically selected based on your platform.

---

## Quick Start

### Docker Run

```bash
docker run -d \
  --name nasnet \
  --network=host \
  -e PORT=80 \
  --restart unless-stopped \
  joinnasnet/nnc:latest
```

> **Note:** `--network=host` is recommended for the container to communicate with RouterOS devices on your local network.

### Docker Compose

```yaml
version: "3.8"
services:
  nasnet:
    image: joinnasnet/nnc:latest
    container_name: nasnet
    network_mode: host
    environment:
      - PORT=80
    restart: unless-stopped
```

### Bridge Network (Alternative)

If you can't use host networking, use bridge mode with port mapping:

```bash
docker run -d \
  --name nasnet \
  -p 8080:80 \
  -e PORT=80 \
  --restart unless-stopped \
  joinnasnet/nnc:latest
```

Access at `http://localhost:8080`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | HTTP server port |
| `GOMAXPROCS` | `1` | Max OS threads |
| `GO_ENV` | `production` | Environment mode |

---

## MikroTik RouterOS Deployment

Deploy directly on your MikroTik router using RouterOS containers (v7.x+).

### 1. Enable Container Mode

```routeros
/system/device-mode/update container=yes
```

### 2. Setup Networking

```routeros
/interface veth add name=veth1 address=192.168.50.2/24 gateway=192.168.50.1
/interface bridge add name=containers
/ip address add address=192.168.50.1/24 interface=containers
/interface bridge port add bridge=containers interface=veth1
/ip firewall nat add chain=srcnat action=masquerade src-address=192.168.50.0/24
```

### 3. Configure Registry

```routeros
/container/config set registry-url=https://registry-1.docker.io tmpdir=disk1/tmp
```

### 4. Deploy Container

```routeros
/container/add remote-image=joinnasnet/nnc:latest interface=veth1 \
  root-dir=disk1/images/nnc name=nnc start-on-boot=yes logging=yes

# Wait for download, then start
/container/start nnc
```

Access at `http://192.168.50.2`

---

## Health Check

The container includes a built-in health check endpoint:

```bash
curl http://localhost/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": 1701878400,
  "memory_mb": 12,
  "version": "production-v2.0",
  "uptime": "2h30m15s"
}
```

---

## Image Details

- **Base:** Scratch (minimal)
- **Size:** ~5MB compressed
- **User:** Non-root
- **Health Check:** Built-in (`/health` endpoint)

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health status |
| `/api/router/proxy` | POST | Proxy to RouterOS API |
| `/api/scan` | POST | Start network scan |
| `/api/scan/status` | GET | Scan progress |
| `/api/batch/jobs` | POST | Create batch job |
| `/api/batch/jobs/{id}` | GET | Job status |

---

## Links

- **Source Code:** [GitHub](https://github.com/joinnasnet/nasnet)
- **Issues:** [GitHub Issues](https://github.com/joinnasnet/nasnet/issues)
- **Full Documentation:** [README](https://github.com/joinnasnet/nasnet#readme)

---

## License

MIT License - see [LICENSE](https://github.com/joinnasnet/nasnet/blob/master/LICENSE) for details.
