<div align="center">

<img src="apps/connect/public/favicon.png" alt="NasNetConnect Logo" width="200" />

# NasNetConnect

### Enterprise-Grade MikroTik Router Management Platform

[![CI](https://github.com/stargazer5361/nasnet/actions/workflows/ci.yml/badge.svg)](https://github.com/stargazer5361/nasnet/actions/workflows/ci.yml)
[![Docker](https://github.com/stargazer5361/nasnet/actions/workflows/docker.yml/badge.svg)](https://github.com/stargazer5361/nasnet/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Docker Image Size](https://img.shields.io/badge/Docker%20Image-~5MB-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/r/stargazer5361/nnc)

<br />

**A modern, powerful web interface for managing MikroTik RouterOS devices.**  
**Built with React + Go, deployable anywhere — including directly on your MikroTik router.**

[Features](#-features) •
[Quick Start](#-quick-start) •
[Docker](#-docker-deployment) •
[RouterOS Install](#-mikrotik-routeros-deployment) •
[API Docs](#-api-reference) •
[Contributing](#-contributing)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 Real-time Dashboard
Live system metrics, CPU/memory usage, traffic monitoring, and interface status at a glance.

### 🌐 Network Management
Complete interface configuration, ARP tables, IP addressing, routing, and DHCP management.

### 🔐 VPN Control Center
Full management of IPsec, L2TP, PPTP, WireGuard, OpenVPN, and SSTP tunnels with client monitoring.

### 📡 Wireless Management
WiFi interface control, security profiles, connected clients, and signal monitoring.

</td>
<td width="50%">

### 🛡️ Firewall Configuration
Filter rules, NAT configuration, mangle rules, and connection tracking with visual rule editor.

### 🔍 Router Discovery
Network scanning to auto-detect MikroTik devices across subnets with service identification.

### ⚡ Batch Operations
Execute bulk commands with progress tracking, dry-run mode, and automatic rollback on failure.

### 🔌 Multi-Protocol Support
Connect via REST API, RouterOS API (8728/8729), SSH, or Telnet with automatic fallback.

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and npm
- **Go 1.22+** (for backend development)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/stargazer5361/nasnet.git
cd nasnet

# Install dependencies
npm install

# Start development servers
npm run dev
```

The application will start at `http://localhost:5173` and automatically open in your browser.

### Development with Backend

```bash
# Start both frontend and backend
npm run dev:with-backend
```

> **Note:** The backend (ROSProxy) runs at `localhost:8080` with the frontend automatically proxying API requests.

---

## 📁 Project Structure

<details>
<summary><b>Click to expand full structure</b></summary>

```
nasnet/
├── apps/
│   ├── connect/              # Main frontend application
│   │   ├── src/
│   │   │   ├── app/          # Pages, routes, components
│   │   │   └── lib/          # Utilities, config
│   │   └── vite.config.ts
│   ├── rosproxy/             # Go backend service
│   │   ├── *.go              # API handlers, clients
│   │   └── Dockerfile        # Multi-arch container
│   ├── star-setup-web/       # Setup wizard (web)
│   └── star-setup-docker/    # Setup wizard (container)
│
├── libs/
│   ├── api-client/
│   │   ├── core/             # HTTP client, interceptors
│   │   └── queries/          # React Query hooks (DHCP, VPN, etc.)
│   ├── core/
│   │   ├── types/            # TypeScript definitions
│   │   ├── utils/            # Formatters, validators
│   │   └── constants/        # App constants
│   ├── core-ui-qwik/         # UI component library (1700+ components)
│   ├── features/
│   │   ├── dashboard/        # Dashboard feature
│   │   ├── firewall/         # Firewall management
│   │   ├── logs/             # Log viewer
│   │   ├── wireless/         # WiFi management
│   │   └── router-discovery/ # Network scanner UI
│   ├── ros-cmd-generator/    # RouterOS command builder
│   ├── state/stores/         # Zustand state stores
│   └── ui/                   # Base UI primitives
│
├── .github/workflows/        # CI/CD pipelines
├── nx.json                   # Nx configuration
└── package.json              # Root package
```

</details>

---

## 🐳 Docker Deployment

<div align="center">

[![Docker Pulls](https://img.shields.io/docker/pulls/stargazer5361/nnc?logo=docker)](https://hub.docker.com/r/stargazer5361/nnc)
![Architectures](https://img.shields.io/badge/arch-amd64%20|%20arm64%20|%20arm%2Fv7-blue)
![Image Size](https://img.shields.io/badge/size-~5MB-green)

</div>

### Quick Run

```bash
# Pull and run (host network for router access)
docker run -d --name nasnet --network=host stargazer5361/nnc:latest

# Or with Docker Compose
docker compose up -d
```

### Docker Compose

```yaml
version: "3.8"
services:
  nasnet:
    image: stargazer5361/nnc:latest
    container_name: nasnet
    network_mode: host
    environment:
      - PORT=80
    restart: unless-stopped
```

### Build Locally

```bash
# Build multi-arch image
npm run docker:local

# Build and export as tarball (for RouterOS)
npm run docker:export
```

---

## 📦 MikroTik RouterOS Deployment

Deploy NasNetConnect directly on your MikroTik router using RouterOS containers.

> **Requirements:** RouterOS v7.x with Container package, external storage recommended

### Step 1: Enable Container Mode

```routeros
/system/device-mode/update container=yes
```
*Confirm on device (reset button or cold reboot on x86)*

### Step 2: Setup Container Networking

```routeros
# Create virtual interface
/interface veth add name=veth1 address=192.168.50.2/24 gateway=192.168.50.1

# Create container bridge
/interface bridge add name=containers
/ip address add address=192.168.50.1/24 interface=containers
/interface bridge port add bridge=containers interface=veth1

# Enable NAT
/ip firewall nat add chain=srcnat action=masquerade src-address=192.168.50.0/24
```

### Step 3: Configure Registry

```routeros
/container/config set registry-url=https://registry-1.docker.io tmpdir=disk1/tmp
```

### Step 4: Deploy Container

```routeros
# Add container
/container/add remote-image=joinnasnet/nnc:latest interface=veth1 \
  root-dir=disk1/images/nnc name=nnc start-on-boot=yes logging=yes

# Wait for download, then start
/container/start nnc
```

Access NasNetConnect at `http://192.168.50.2` (or your configured veth address).

<details>
<summary><b>Additional RouterOS Tips</b></summary>

```routeros
# Limit container RAM
/container/config/set memory-high=200M

# Open shell in container
/container/shell nnc

# View container logs
/container/set [find where name=nnc] logging=yes
```

</details>

---

## 📡 API Reference

ROSProxy provides a REST API for all router management operations.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health, memory, uptime |
| `/api/router/proxy` | POST | Proxy requests to RouterOS |
| `/api/scan` | POST | Start subnet scan |
| `/api/scan/auto` | POST | Auto-scan gateway addresses |
| `/api/scan/status` | GET | Get scan progress/results |
| `/api/batch/jobs` | POST | Create batch command job |
| `/api/batch/jobs/{id}` | GET | Get job status |

<details>
<summary><b>Example: Proxy Request to Router</b></summary>

```bash
curl -X POST http://localhost:8080/api/router/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "router_ip": "192.168.88.1",
    "endpoint": "/system/resource",
    "method": "GET",
    "headers": {
      "Authorization": "Basic YWRtaW46cGFzc3dvcmQ="
    }
  }'
```

</details>

<details>
<summary><b>Example: Batch Command Execution</b></summary>

```bash
curl -X POST http://localhost:8080/api/batch/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "router_ip": "192.168.88.1",
    "username": "admin",
    "password": "secret",
    "protocol": "api",
    "commands": [
      "/interface bridge add name=bridge1",
      "/interface bridge port add bridge=bridge1 interface=ether2"
    ],
    "dry_run": false,
    "rollback_enabled": true
  }'
```

</details>

> 📖 **Full API Documentation:** [apps/rosproxy/README.md](apps/rosproxy/README.md)

---

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend dev server (Vite) |
| `npm run dev:with-backend` | Start frontend + backend |
| `npm run build` | Build production bundle |
| `npm run ci` | Run all CI checks (lint, test, build, typecheck) |
| `npm run lint` | Lint all projects |
| `npm run typecheck` | TypeScript type checking |
| `npm run docker:local` | Build Docker image locally |
| `npm run docker:export` | Export Docker image as tarball |

### Environment Configuration

Create `apps/connect/.env.development`:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### Running Tests

```bash
# Run all tests
npx nx run-many -t test

# Run specific project tests
npx nx test connect
npx nx test rosproxy

# E2E tests
npx nx e2e connect-e2e
```

---

## 🔧 Tech Stack

<div align="center">

### Frontend
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

### Backend
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)

### State Management
[![React Query](https://img.shields.io/badge/React_Query-5.x-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Zustand](https://img.shields.io/badge/Zustand-4.x-000000?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![XState](https://img.shields.io/badge/XState-5.x-2C3E50?style=for-the-badge)](https://xstate.js.org/)

### Infrastructure
[![Nx](https://img.shields.io/badge/Nx-22.x-143055?style=for-the-badge&logo=nx&logoColor=white)](https://nx.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Arch-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)

### Testing
[![Vitest](https://img.shields.io/badge/Vitest-1.x-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

</div>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (Prettier + ESLint)
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the MikroTik community**

[![Star on GitHub](https://img.shields.io/github/stars/stargazer5361/nasnet?style=social)](https://github.com/stargazer5361/nasnet)

</div>
