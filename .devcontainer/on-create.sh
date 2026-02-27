#!/bin/bash
set -e

echo "=== NasNetConnect: One-time container setup ==="

# Trust git directory (Windows/mounted volumes)
git config --global --add safe.directory /workspaces/nasnet 2>/dev/null || true
git config --global --add safe.directory "$(pwd)" 2>/dev/null || true

# Create .env if missing
if [ ! -f "apps/connect/.env.development" ]; then
    cat > apps/connect/.env.development << 'EOF'
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
EOF
    echo "Created apps/connect/.env.development"
fi

# Increase inotify watches for Vite/Nx hot reload
if [ -f /proc/sys/fs/inotify/max_user_watches ]; then
    echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_watches > /dev/null
    echo "inotify watch limit set to 524288"
fi

# Shell aliases
cat >> ~/.bashrc << 'ALIASES'

# NasNetConnect shortcuts
alias dev='npm run dev:all'
alias dev:fe='npm run dev:frontend'
alias dev:be='npm run dev:backend'
alias lint='npm run lint'
alias cg='npm run codegen'
alias ci='npm run ci'
alias be='cd /workspaces/nasnet/apps/backend'
alias fe='cd /workspaces/nasnet/apps/connect'
ALIASES

echo "=== One-time setup complete ==="
