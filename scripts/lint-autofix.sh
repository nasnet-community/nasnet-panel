#!/usr/bin/env bash
# lint-autofix.sh - Automated lint fixing script for NasNetConnect backend
#
# This script attempts to automatically fix common linting issues using golangci-lint's
# auto-fix capabilities. It runs in phases to handle different categories of issues.
#
# Usage:
#   ./scripts/lint-autofix.sh [phase]
#
# Phases:
#   all       - Run all auto-fix phases (default)
#   format    - Fix formatting issues (gofmt, goimports)
#   simple    - Fix simple code improvements (gosimple, unconvert)
#   style     - Fix style issues (whitespace, stylecheck)
#   security  - Fix basic security issues (gosec auto-fixable)
#
# Exit codes:
#   0 - Success
#   1 - Auto-fix failed
#   2 - Invalid phase specified

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="apps/backend"
LOG_DIR="scripts/lint-logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/autofix_${TIMESTAMP}.log"

# Create log directory
mkdir -p "${LOG_DIR}"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE}"
}

# Check if golangci-lint is installed
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v golangci-lint &> /dev/null; then
        log_error "golangci-lint is not installed. Please install it:"
        log_error "  curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b \$(go env GOPATH)/bin"
        exit 1
    fi

    local version=$(golangci-lint version --format short 2>/dev/null || echo "unknown")
    log_success "golangci-lint is installed (version: ${version})"
}

# Phase 1: Format fixes (gofmt, goimports)
phase_format() {
    log_info "Phase 1: Fixing formatting issues..."

    cd "${BACKEND_DIR}"

    # Run gofmt
    log_info "Running gofmt..."
    if find . -name "*.go" -not -path "./generated/*" -exec gofmt -w {} \; 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "gofmt completed"
    else
        log_warning "gofmt had some warnings"
    fi

    # Run goimports
    if command -v goimports &> /dev/null; then
        log_info "Running goimports..."
        if find . -name "*.go" -not -path "./generated/*" -exec goimports -w {} \; 2>&1 | tee -a "${LOG_FILE}"; then
            log_success "goimports completed"
        else
            log_warning "goimports had some warnings"
        fi
    else
        log_warning "goimports not found, skipping (install: go install golang.org/x/tools/cmd/goimports@latest)"
    fi

    cd - > /dev/null
}

# Phase 2: Simple code improvements
phase_simple() {
    log_info "Phase 2: Fixing simple code issues..."

    cd "${BACKEND_DIR}"

    # Fix unconvert issues
    log_info "Fixing unconvert issues..."
    if golangci-lint run --disable-all -E unconvert --fix 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "unconvert fixes applied"
    else
        log_warning "unconvert had some issues"
    fi

    # Fix gosimple issues
    log_info "Fixing gosimple issues..."
    if golangci-lint run --disable-all -E gosimple --fix 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "gosimple fixes applied"
    else
        log_warning "gosimple had some issues"
    fi

    cd - > /dev/null
}

# Phase 3: Style fixes
phase_style() {
    log_info "Phase 3: Fixing style issues..."

    cd "${BACKEND_DIR}"

    # Fix whitespace issues
    log_info "Fixing whitespace issues..."
    if golangci-lint run --disable-all -E whitespace --fix 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "whitespace fixes applied"
    else
        log_warning "whitespace had some issues"
    fi

    cd - > /dev/null
}

# Phase 4: Security fixes (auto-fixable only)
phase_security() {
    log_info "Phase 4: Fixing auto-fixable security issues..."

    cd "${BACKEND_DIR}"

    # Note: Most gosec issues require manual review
    log_info "Running gosec analysis (manual review required for most issues)..."
    if golangci-lint run --disable-all -E gosec 2>&1 | tee -a "${LOG_FILE}" | head -20; then
        log_info "gosec analysis complete (check log for details)"
    else
        log_warning "gosec found issues requiring manual review"
    fi

    cd - > /dev/null
}

# Phase 5: Performance fixes (gocritic auto-fixable)
phase_performance() {
    log_info "Phase 5: Fixing auto-fixable performance issues..."

    cd "${BACKEND_DIR}"

    log_info "Running gocritic with auto-fix..."
    if golangci-lint run --disable-all -E gocritic --fix 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "gocritic auto-fixes applied"
    else
        log_warning "gocritic had some issues requiring manual review"
    fi

    cd - > /dev/null
}

# Count remaining issues
count_issues() {
    log_info "Counting remaining issues..."

    cd "${BACKEND_DIR}"

    local total_issues=$(golangci-lint run 2>&1 | grep -c "^[^#].*\.go:" || echo "0")

    log_info "Total remaining issues: ${total_issues}"

    cd - > /dev/null
}

# Main execution
main() {
    local phase="${1:-all}"

    log_info "=== NasNetConnect Lint Auto-Fix ===="
    log_info "Phase: ${phase}"
    log_info "Log file: ${LOG_FILE}"
    log_info "===================================="

    check_prerequisites

    case "${phase}" in
        format)
            phase_format
            ;;
        simple)
            phase_simple
            ;;
        style)
            phase_style
            ;;
        security)
            phase_security
            ;;
        performance)
            phase_performance
            ;;
        all)
            phase_format
            phase_simple
            phase_style
            phase_security
            phase_performance
            ;;
        *)
            log_error "Invalid phase: ${phase}"
            log_error "Valid phases: all, format, simple, style, security, performance"
            exit 2
            ;;
    esac

    count_issues

    log_success "Auto-fix completed! Check ${LOG_FILE} for details."
    log_info "Next steps:"
    log_info "  1. Review changes: git diff"
    log_info "  2. Run tests: go test ./..."
    log_info "  3. Check progress: ./scripts/lint-progress.sh"
}

# Run main with all arguments
main "$@"
