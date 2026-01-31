#!/bin/bash
# NasNetConnect DevContainer Post-Create Script
# Runs after the container is created to set up the development environment
#
# This script ensures:
# - npm dependencies are installed
# - Go modules are downloaded
# - Generated files are up to date
# - Environment is validated
#
# Target: npm run dev should work within 30 seconds after this completes (AC-3)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           NasNetConnect DevContainer Setup               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Track timing
START_TIME=$(date +%s)

# Function to print step
step() {
    echo -e "\n${GREEN}▶${NC} $1"
}

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Validate environment
step "Validating development environment..."

echo "  Node.js: $(node --version)"
echo "  npm:     $(npm --version)"
echo "  Go:      $(go version | cut -d' ' -f3)"

if command -v docker &> /dev/null; then
    echo "  Docker:  $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
    warn "Docker not available (Docker-in-Docker may not be enabled)"
fi

if command -v air &> /dev/null; then
    echo "  air:     $(air -v 2>&1 | head -1 || echo 'installed')"
else
    warn "air not found, installing..."
    go install github.com/air-verse/air@latest
fi

# 2. Install npm dependencies
step "Installing npm dependencies..."

if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
    success "node_modules exists, running npm ci for consistency..."
    npm ci --loglevel=error
else
    echo "  Fresh install, this may take a moment..."
    npm install --loglevel=error
fi

success "npm dependencies installed"

# 3. Download Go modules
step "Downloading Go modules..."

if [ -f "apps/backend/go.mod" ]; then
    cd apps/backend
    go mod download
    go mod verify
    cd ../..
    success "Go modules downloaded"
else
    warn "Go module not found at apps/backend/go.mod"
fi

# 4. Run code generation (if codegen script exists)
step "Running code generation..."

if npm run --silent 2>/dev/null | grep -q "codegen"; then
    npm run codegen --if-present || warn "codegen script not found or failed"
    success "Code generation complete"
else
    warn "No codegen script found in package.json (will be added later)"
fi

# 5. Verify Nx workspace
step "Verifying Nx workspace..."

if npx nx --version &> /dev/null; then
    echo "  Nx version: $(npx nx --version)"
    success "Nx workspace verified"
else
    error "Nx not available"
fi

# 6. Trust git directory (for Windows/mounted volumes)
step "Configuring git safe directory..."

git config --global --add safe.directory /workspaces/nasnet 2>/dev/null || true
git config --global --add safe.directory "$(pwd)" 2>/dev/null || true
success "Git safe directory configured"

# 7. Create .env files if they don't exist
step "Checking environment files..."

if [ ! -f "apps/connect/.env.development" ]; then
    cat > apps/connect/.env.development << 'EOF'
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
EOF
    success "Created apps/connect/.env.development"
else
    success "Environment file already exists"
fi

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Setup Complete! (${ELAPSED}s)                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Quick Start Commands:${NC}"
echo ""
echo "  npm run dev:frontend     # Start frontend (port 5173)"
echo "  npm run dev:backend      # Start backend (port 8080)"
echo "  npm run dev:all          # Start both frontend + backend"
echo ""
echo "  npm run lint             # Run linting"
echo "  npm run typecheck        # TypeScript type checking"
echo "  npm run ci               # Run all CI checks"
echo ""
echo "  npx nx graph             # Visualize project dependencies"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
