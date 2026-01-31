#!/bin/bash
# =============================================================================
# GraphQL Code Generation Script
# =============================================================================
# This script runs code generation for both TypeScript and Go from the
# GraphQL schema. It ensures generated code stays in sync with the schema.
#
# Usage:
#   ./tools/scripts/codegen.sh         # Run full codegen
#   ./tools/scripts/codegen.sh --check # Check if generated code is in sync
#   ./tools/scripts/codegen.sh --ts    # Run TypeScript codegen only
#   ./tools/scripts/codegen.sh --go    # Run Go codegen only
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Parse arguments
CHECK_ONLY=false
TS_ONLY=false
GO_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --ts|--typescript)
            TS_ONLY=true
            shift
            ;;
        --go|--golang)
            GO_ONLY=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          GraphQL Code Generation Pipeline                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run TypeScript codegen
run_ts_codegen() {
    echo -e "${YELLOW}▶ Running TypeScript code generation...${NC}"

    # Check if graphql-codegen is installed
    if ! command -v npx &> /dev/null || ! npx graphql-codegen --version &> /dev/null 2>&1; then
        echo -e "${RED}Error: graphql-codegen not found. Run 'npm install' first.${NC}"
        return 1
    fi

    npx graphql-codegen --config codegen.ts

    echo -e "${GREEN}✓ TypeScript codegen complete${NC}"
    echo "  Generated files in: libs/api-client/generated/"
}

# Function to run Go codegen
run_go_codegen() {
    echo -e "${YELLOW}▶ Running Go code generation...${NC}"

    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        echo -e "${RED}Error: Go is not installed or not in PATH.${NC}"
        return 1
    fi

    # Check if gqlgen is available
    cd apps/backend

    # Install gqlgen if not present
    if ! go list -m github.com/99designs/gqlgen &> /dev/null 2>&1; then
        echo -e "${YELLOW}  Installing gqlgen...${NC}"
        go get github.com/99designs/gqlgen
    fi

    go generate ./...

    cd "$PROJECT_ROOT"

    echo -e "${GREEN}✓ Go codegen complete${NC}"
    echo "  Generated files in: apps/backend/graph/"
}

# Function to check if generated code is in sync
check_sync() {
    echo -e "${YELLOW}▶ Checking if generated code is in sync...${NC}"

    # Run codegen
    if ! $TS_ONLY && ! $GO_ONLY; then
        run_ts_codegen
        run_go_codegen
    elif $TS_ONLY; then
        run_ts_codegen
    elif $GO_ONLY; then
        run_go_codegen
    fi

    # Check for changes
    if git diff --exit-code libs/api-client/generated/ apps/backend/graph/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Generated code is in sync with schema${NC}"
        return 0
    else
        echo -e "${RED}✗ Generated code is out of sync!${NC}"
        echo ""
        echo "The following files have changes:"
        git diff --name-only libs/api-client/generated/ apps/backend/graph/
        echo ""
        echo -e "${YELLOW}Run 'npm run codegen' and commit the generated files.${NC}"
        return 1
    fi
}

# Main execution
if $CHECK_ONLY; then
    check_sync
elif $TS_ONLY; then
    run_ts_codegen
elif $GO_ONLY; then
    run_go_codegen
else
    # Run both
    run_ts_codegen
    echo ""
    run_go_codegen
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Code generation complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
