#!/usr/bin/env bash
# lint-progress.sh - Track linting progress for NasNetConnect backend
#
# This script generates a comprehensive report of linting issues, categorized by
# linter and severity. It helps track progress on the lint cleanup initiative.
#
# Usage:
#   ./scripts/lint-progress.sh [options]
#
# Options:
#   --json         Output in JSON format
#   --summary      Show only summary (default)
#   --detailed     Show detailed breakdown
#   --linter NAME  Show issues for specific linter only
#   --compare FILE Compare with previous report
#
# Exit codes:
#   0 - Success
#   1 - Error occurred

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="apps/backend"
REPORT_DIR="scripts/lint-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORT_DIR}/report_${TIMESTAMP}.json"

# Create report directory
mkdir -p "${REPORT_DIR}"

# Parse command line arguments
OUTPUT_FORMAT="summary"
SPECIFIC_LINTER=""
COMPARE_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --summary)
            OUTPUT_FORMAT="summary"
            shift
            ;;
        --detailed)
            OUTPUT_FORMAT="detailed"
            shift
            ;;
        --linter)
            SPECIFIC_LINTER="$2"
            shift 2
            ;;
        --compare)
            COMPARE_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Helper functions
print_header() {
    echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}"
}

print_subheader() {
    echo -e "\n${CYAN}$1${NC}"
}

print_metric() {
    local label="$1"
    local value="$2"
    local color="${3:-$NC}"
    printf "  %-30s %s%6s%s\n" "$label:" "$color" "$value" "$NC"
}

# Generate lint report
generate_report() {
    echo -e "${BLUE}Analyzing lint issues...${NC}"

    cd "${BACKEND_DIR}"

    # Run golangci-lint and capture output
    local lint_output=$(golangci-lint run --out-format=json 2>&1 || true)

    # Save raw output
    echo "${lint_output}" > "${REPORT_FILE}"

    echo -e "${GREEN}Report generated: ${REPORT_FILE}${NC}"

    cd - > /dev/null
}

# Count issues by linter
count_by_linter() {
    local report="$1"

    if [[ ! -f "${report}" ]]; then
        echo "Report file not found: ${report}"
        return 1
    fi

    cd "${BACKEND_DIR}"

    # Extract issues and count by linter
    golangci-lint run --out-format=tab 2>&1 | grep -oP '(?<=\().*?(?=\))' | sort | uniq -c | sort -rn || echo "0 total"

    cd - > /dev/null
}

# Display summary report
display_summary() {
    print_header "NasNetConnect Backend - Lint Progress Report"

    echo -e "\n${BOLD}Generated:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${BOLD}Directory:${NC} ${BACKEND_DIR}"

    cd "${BACKEND_DIR}"

    print_subheader "Issue Count by Linter"

    # Count issues per linter
    local errcheck_count=$(golangci-lint run --disable-all -E errcheck 2>&1 | grep -c "\.go:" || echo "0")
    local gocritic_count=$(golangci-lint run --disable-all -E gocritic 2>&1 | grep -c "\.go:" || echo "0")
    local revive_count=$(golangci-lint run --disable-all -E revive 2>&1 | grep -c "\.go:" || echo "0")
    local unused_count=$(golangci-lint run --disable-all -E unused 2>&1 | grep -c "\.go:" || echo "0")
    local gosec_count=$(golangci-lint run --disable-all -E gosec 2>&1 | grep -c "\.go:" || echo "0")
    local govet_count=$(golangci-lint run --disable-all -E govet 2>&1 | grep -c "\.go:" || echo "0")
    local staticcheck_count=$(golangci-lint run --disable-all -E staticcheck 2>&1 | grep -c "\.go:" || echo "0")
    local godot_count=$(golangci-lint run --disable-all -E godot 2>&1 | grep -c "\.go:" || echo "0")

    # Color code based on severity
    local error_color="${RED}"
    local warning_color="${YELLOW}"
    local info_color="${NC}"

    print_metric "errcheck (unchecked errors)" "${errcheck_count}" "${error_color}"
    print_metric "gocritic (performance)" "${gocritic_count}" "${warning_color}"
    print_metric "revive (style)" "${revive_count}" "${warning_color}"
    print_metric "unused (dead code)" "${unused_count}" "${warning_color}"
    print_metric "gosec (security)" "${gosec_count}" "${error_color}"
    print_metric "govet (correctness)" "${govet_count}" "${error_color}"
    print_metric "staticcheck (bugs)" "${staticcheck_count}" "${error_color}"
    print_metric "godot (comments)" "${godot_count}" "${info_color}"

    local total=$((errcheck_count + gocritic_count + revive_count + unused_count + gosec_count + govet_count + staticcheck_count + godot_count))

    print_subheader "Summary"
    print_metric "Total Issues" "${total}" "${BOLD}"

    # Calculate progress based on initial counts (from Tech Spec)
    local initial_total=2000  # Approximate from Tech Spec Story 1.3
    local fixed=$((initial_total - total))
    local progress=$((fixed * 100 / initial_total))

    print_metric "Fixed Issues" "${fixed}" "${GREEN}"
    print_metric "Progress" "${progress}%" "${GREEN}"

    print_subheader "Priority Categories"

    # Critical: errcheck, gosec, govet, staticcheck
    local critical=$((errcheck_count + gosec_count + govet_count + staticcheck_count))
    print_metric "Critical (must fix)" "${critical}" "${error_color}"

    # High: gocritic, unused
    local high=$((gocritic_count + unused_count))
    print_metric "High (should fix)" "${high}" "${warning_color}"

    # Medium: revive, godot
    local medium=$((revive_count + godot_count))
    print_metric "Medium (nice to fix)" "${medium}" "${info_color}"

    print_subheader "Next Steps"

    if [[ ${critical} -gt 0 ]]; then
        echo -e "  ${RED}▸${NC} Fix critical issues first (errcheck, gosec, govet, staticcheck)"
    elif [[ ${high} -gt 0 ]]; then
        echo -e "  ${YELLOW}▸${NC} Fix high-priority issues (gocritic, unused)"
    elif [[ ${medium} -gt 0 ]]; then
        echo -e "  ${BLUE}▸${NC} Fix medium-priority issues (revive, godot)"
    else
        echo -e "  ${GREEN}✓${NC} All issues resolved!"
    fi

    echo -e "\n${BOLD}Run Details:${NC}"
    echo -e "  Full report: ${REPORT_FILE}"
    echo -e "  Auto-fix:    ./scripts/lint-autofix.sh"
    echo -e "  Detailed:    ./scripts/lint-progress.sh --detailed"

    cd - > /dev/null
}

# Display detailed report
display_detailed() {
    display_summary

    print_subheader "Detailed Issue Breakdown"

    cd "${BACKEND_DIR}"

    if [[ -n "${SPECIFIC_LINTER}" ]]; then
        echo -e "\n${BOLD}Issues for: ${SPECIFIC_LINTER}${NC}"
        golangci-lint run --disable-all -E "${SPECIFIC_LINTER}" 2>&1 | head -50
    else
        echo -e "\n${BOLD}Top 20 Issues:${NC}"
        golangci-lint run 2>&1 | grep "\.go:" | head -20
    fi

    cd - > /dev/null
}

# Display JSON report
display_json() {
    cd "${BACKEND_DIR}"

    golangci-lint run --out-format=json 2>&1 || true

    cd - > /dev/null
}

# Compare with previous report
compare_reports() {
    if [[ ! -f "${COMPARE_FILE}" ]]; then
        echo -e "${RED}Error: Comparison file not found: ${COMPARE_FILE}${NC}"
        exit 1
    fi

    print_header "Comparing with Previous Report"

    # This is a simplified comparison - in production, you'd parse JSON and do detailed diff
    echo -e "${YELLOW}Note: Detailed comparison requires JSON parsing${NC}"
    echo -e "Previous report: ${COMPARE_FILE}"
    echo -e "Current report:  ${REPORT_FILE}"
}

# Main execution
main() {
    # Generate fresh report
    generate_report

    # Display based on format
    case "${OUTPUT_FORMAT}" in
        summary)
            display_summary
            ;;
        detailed)
            display_detailed
            ;;
        json)
            display_json
            ;;
    esac

    # Compare if requested
    if [[ -n "${COMPARE_FILE}" ]]; then
        compare_reports
    fi
}

# Run main
main
