# NasNetConnect

Enterprise-grade MikroTik router management platform with React frontend and Go backend.

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- Go 1.22+ (for backend development)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd NasNet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will start at `http://localhost:5173` and automatically open in your browser.

### Available Scripts

- `npm run dev` - Start the frontend development server (React + Vite)
- `npm run dev:verbose` - Start dev server with verbose logging
- `npm run dev:with-backend` - Start both frontend and backend in parallel
- `npm run build` - Build production bundle
- `npm run ci` - Run all CI checks (lint, test, build, typecheck)

### Environment Configuration

Create `apps/connect/.env.development` for local development:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

See `apps/connect/.env.example` for all available environment variables.

### Development Features

- ⚡ **Hot Module Replacement (HMR)** - Instant feedback on code changes
- 🔍 **TypeScript Error Overlay** - TypeScript errors displayed in browser
- 🔄 **API Proxy** - Automatic proxy to backend at localhost:8080
- 📦 **Nx Monorepo** - Organized library structure with caching

### Troubleshooting

**Port 5173 already in use:**
```bash
npm run dev -- --port 3000
```

**API proxy not working:**
- Ensure backend (rosproxy) is running at localhost:8080
- Check `VITE_API_URL` in your `.env.development` file
- Verify proxy configuration in `apps/connect/vite.config.ts`

---

## Deploy on MikroTik RouterOS (stargazer5361/nnc)

Follow these steps to enable RouterOS containers and install the `stargazer5361/nnc` container. Commands are intended for RouterOS v7.x and should be executed on the router. Use an external disk (e.g., `disk1`) for container storage.

### 0) Install the Container package (if missing)

If your router does not yet have the `container` package installed, use one of the following methods:

- GUI (RouterOS 7.18+): System → Packages
  - Click "Check For Updates" to load available packages (they appear disabled and available)
  - Select the `container` package, click "Enable"
  - Click "Apply Changes"; the device will reboot and install the package

- Manual download:
  - Determine your device architecture (System → Resources → architecture-name)
  - Download the correct packages archive for your architecture from MikroTik downloads (RouterOS section)
  - Extract and upload the `container-*.npk` file to the router (Winbox/WebFig/SFTP)
  - Reboot the router to install; optionally name the file `container.auto.npk` to auto-install on upload
  - Verify install: check Log after reboot and/or run `/system package print`

### 1) Enable container mode (physical confirmation required)

```bash
/system/device-mode/update container=yes flagging-enabled=no traffic-gen=yes install-any-version=yes partitions=yes routerboard=yes
```

After running, confirm on the device (reset button or cold reboot on x86) as required by RouterOS. Ensure the `container` package is installed and use fast external storage for images/volumes.

### 2) Prepare Bridge with NAT networking (recommended)

```bash
/interface veth add name=veth1 address=192.168.50.2/24 gateway=192.168.50.1
/interface bridge add name=containers
/ip address add address=192.168.50.1/24 interface=containers
/interface bridge port add bridge=containers interface=veth1
/ip firewall nat add chain=srcnat action=masquerade src-address=192.168.50.0/24
```

This is equivalent to Docker "bridge" networking. One `veth` can be used by multiple containers.

### 3) Configure registry and temp directory

```bash
/container/config set registry-url=https://registry-1.docker.io tmpdir=disk1/tmp
```

Keep `tmpdir` and images on external storage (e.g., `disk1`) to avoid wearing out internal flash.


### 4) Add and start the container

```bash
/container/add remote-image=stargazer5361/nnc:latest interface=veth1 \
  root-dir=disk1/images/nnc name=nnc start-on-boot=yes logging=yes

# Wait for download/extraction to complete (status should become "stopped")
/container/print

# Start the container
/container/start nnc
```


### 5) Tips

- Limit RAM (soft limit):

  ```bash
  /container/config/set memory-high=200M
  ```

- Open a shell in the running container:

  ```bash
  /container/shell nnc
  ```

- Enable container logs output:

  ```bash
  /container/set [find where name=nnc] logging=yes
  ```

### 6) References

- [MikroTik Container docs](https://help.mikrotik.com/docs/spaces/ROS/pages/84901929/Container)
- [MikroTik Packages (install container)](https://help.mikrotik.com/docs/spaces/ROS/pages/40992872/Packages)
- [Docker Hub (nnc)](https://hub.docker.com/r/stargazer5361/nnc)
