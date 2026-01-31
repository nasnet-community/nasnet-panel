# DevContainer Troubleshooting Guide

This guide covers common issues when using the NasNetConnect DevContainer across different platforms.

## Quick Fixes

### Container Won't Start

1. **Ensure Docker is running**
   - Windows/macOS: Check Docker Desktop is running
   - Linux: Run `sudo systemctl status docker`

2. **Try rebuilding the container**
   - VS Code: Command Palette → "Dev Containers: Rebuild Container"
   - CLI: `devcontainer build --workspace-folder .`

3. **Check Docker resources**
   - Minimum: 2 CPU cores, 4GB RAM
   - Recommended: 4 CPU cores, 8GB RAM

## Platform-Specific Issues

### Windows

#### WSL 2 Backend Required
The DevContainer requires WSL 2 as the Docker backend for optimal performance.

```powershell
# Check WSL version
wsl --list --verbose

# If using WSL 1, upgrade to WSL 2
wsl --set-version <distro-name> 2
```

#### Slow File Performance
Windows file system mounts can be slow. The DevContainer uses named volumes for `node_modules` to mitigate this.

If you experience slowness:
1. Clone the repository inside WSL: `\\wsl$\Ubuntu\home\<user>\projects\`
2. Open VS Code from WSL: `code .` (inside the WSL terminal)

#### Line Ending Issues
Git may convert line endings. Configure:
```bash
git config --global core.autocrlf input
```

#### Path Too Long Errors
Enable long paths in Windows:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### macOS

#### Docker Desktop Resource Limits
Increase Docker Desktop resources:
1. Docker Desktop → Preferences → Resources
2. Set: CPUs: 4+, Memory: 8GB+, Disk: 64GB+

#### VirtioFS for Better Performance
Enable VirtioFS file sharing:
1. Docker Desktop → Preferences → General
2. Enable "Use VirtioFS for file sharing" (macOS 12.5+)

#### Apple Silicon (M1/M2/M3)
The DevContainer supports ARM64 architecture natively. If you see architecture warnings:
```bash
# Force platform (usually not needed)
export DOCKER_DEFAULT_PLATFORM=linux/arm64
```

### Linux

#### Docker Permissions
Add your user to the docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### SELinux Issues (Fedora/RHEL)
If you encounter permission errors:
```bash
# Check SELinux status
getenforce

# Temporarily set to permissive
sudo setenforce 0

# Or add :Z to volume mounts in devcontainer.json
```

#### Rootless Docker
If using rootless Docker, ensure the container can access the Docker socket:
```bash
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
```

## Common Error Messages

### "Error: ENOSPC: no space left on device"

Docker ran out of space. Clean up:
```bash
# Remove unused images and containers
docker system prune -a

# Remove unused volumes
docker volume prune
```

### "Error: ENOMEM: not enough memory"

Increase Docker memory allocation in Docker Desktop settings.

### "npm ERR! code ENOENT" during post-create

The volume mount for node_modules may have issues:
```bash
# Remove the volume and rebuild
docker volume rm nasnet-node-modules
# Then rebuild the DevContainer
```

### "Permission denied" when running npm/go commands

Ensure the container is running as the correct user:
```json
// In devcontainer.json
"remoteUser": "vscode"
```

### "Docker-in-Docker not working"

The Docker-in-Docker feature requires:
1. Docker Desktop with WSL 2 (Windows) or native (Linux/macOS)
2. The container must be privileged (handled by the feature)

Check if Docker is accessible inside the container:
```bash
docker --version
docker ps
```

### VS Code Extensions Not Installing

Extensions may fail to install if:
1. Network is slow/restricted
2. Extension IDs are incorrect

Try manually installing from the Extensions sidebar.

## Performance Optimization

### Faster npm install

```bash
# Use npm ci instead of npm install (in post-create.sh)
npm ci --prefer-offline

# Or use pnpm (faster)
npm install -g pnpm
pnpm install
```

### Reduce Startup Time

1. Use pre-built image from GHCR (when available)
2. Enable Docker BuildKit caching
3. Use VirtioFS on macOS

### Hot Reload Issues

If Vite hot reload isn't working:
```bash
# Check if ports are forwarded
netstat -tlnp | grep 5173

# Ensure file watchers work
echo 1048576 | sudo tee /proc/sys/fs/inotify/max_user_watches
```

## Getting Help

1. **Check logs**: View > Output > Dev Containers
2. **Rebuild without cache**: "Dev Containers: Rebuild Container Without Cache"
3. **Open an issue**: [GitHub Issues](https://github.com/stargazer5361/nasnet/issues)

## Testing DevContainer Manually

```bash
# Build the DevContainer image locally
docker build -t nasnet-devcontainer -f .devcontainer/Dockerfile .

# Run interactively
docker run -it --rm \
  -v $(pwd):/workspaces/nasnet \
  -w /workspaces/nasnet \
  nasnet-devcontainer \
  bash

# Inside container, test:
node --version  # Should be 20.x
go version      # Should be 1.24+
npm run dev:all # Should start servers
```
