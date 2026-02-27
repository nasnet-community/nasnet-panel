#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "============================================"
echo "    NasNetConnect DevContainer Setup"
echo "============================================"
echo -e "${NC}"

START_TIME=$(date +%s)

step() { echo -e "\n${GREEN}>>${NC} $1"; }
success() { echo -e "${GREEN}OK${NC} $1"; }
warn() { echo -e "${YELLOW}!!${NC} $1"; }

# 1. Validate tools
step "Validating tools..."
echo "  Node.js: $(node --version)"
echo "  npm:     $(npm --version)"
echo "  Go:      $(go version | cut -d' ' -f3)"
command -v docker &>/dev/null && echo "  Docker:  $(docker --version | cut -d' ' -f3 | tr -d ',')" || warn "Docker not available"

# 2. Install npm dependencies
step "Installing npm dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci --loglevel=error
else
    npm install --loglevel=error
fi
success "npm dependencies installed"

# 3. Initialize git hooks (Husky)
step "Setting up git hooks..."
npm run prepare 2>/dev/null || warn "Husky setup skipped"
success "Git hooks configured"

# 4. Download Go modules
step "Downloading Go modules..."
if [ -f "apps/backend/go.mod" ]; then
    cd apps/backend && go mod download && cd ../..
    success "Go modules downloaded"
fi

# 5. Install pinned Go dev tools
step "Installing Go dev tools (pinned versions)..."
GO_TOOLS=(
    "github.com/air-verse/air@v1.61.7"
    "github.com/golangci/golangci-lint/cmd/golangci-lint@v2.1.6"
    "golang.org/x/tools/gopls@v0.18.1"
    "github.com/go-delve/delve/cmd/dlv@v1.24.2"
    "github.com/zricethezav/gitleaks/v8/cmd/gitleaks@v8.21.2"
)
for tool in "${GO_TOOLS[@]}"; do
    name="${tool##*/}"
    name="${name%%@*}"
    echo "  ${name}..."
    go install "${tool}" 2>/dev/null || warn "Failed: ${tool}"
done
success "Go tools installed"

# 6. Run code generation
step "Running code generation..."
npm run codegen --if-present 2>/dev/null || warn "Codegen skipped"

# 7. Verify Nx workspace
step "Verifying Nx workspace..."
npx nx --version &>/dev/null && success "Nx $(npx nx --version)" || warn "Nx not found"

# 8. Pre-install Playwright browsers
step "Pre-installing Playwright (chromium)..."
npx playwright install chromium --with-deps 2>/dev/null || warn "Playwright install skipped"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}Setup complete in ${ELAPSED}s${NC}"
echo ""
echo "  npm run dev:all        Start frontend + backend"
echo "  npm run dev:frontend   Frontend only (port 5173)"
echo "  npm run dev:backend    Backend only (port 8080)"
echo "  npm run codegen        Regenerate types"
echo "  npx nx graph           Visualize dependencies"
echo -e "${BLUE}============================================${NC}"
