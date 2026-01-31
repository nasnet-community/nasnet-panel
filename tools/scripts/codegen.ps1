# =============================================================================
# GraphQL Code Generation Script (PowerShell)
# =============================================================================
# This script runs code generation for both TypeScript and Go from the
# GraphQL schema. It ensures generated code stays in sync with the schema.
#
# Usage:
#   .\tools\scripts\codegen.ps1         # Run full codegen
#   .\tools\scripts\codegen.ps1 -Check  # Check if generated code is in sync
#   .\tools\scripts\codegen.ps1 -TsOnly # Run TypeScript codegen only
#   .\tools\scripts\codegen.ps1 -GoOnly # Run Go codegen only
# =============================================================================

param(
    [switch]$Check,
    [switch]$TsOnly,
    [switch]$GoOnly
)

$ErrorActionPreference = "Stop"

# Get the project root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

Set-Location $ProjectRoot

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║          GraphQL Code Generation Pipeline                   ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

function Run-TsCodegen {
    Write-Host "▶ Running TypeScript code generation..." -ForegroundColor Yellow

    # Check if graphql-codegen is available
    try {
        npx graphql-codegen --version | Out-Null
    }
    catch {
        Write-Host "Error: graphql-codegen not found. Run 'npm install' first." -ForegroundColor Red
        return $false
    }

    npx graphql-codegen --config codegen.ts

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: TypeScript codegen failed" -ForegroundColor Red
        return $false
    }

    Write-Host "✓ TypeScript codegen complete" -ForegroundColor Green
    Write-Host "  Generated files in: libs/api-client/generated/"
    return $true
}

function Run-GoCodegen {
    Write-Host "▶ Running Go code generation..." -ForegroundColor Yellow

    # Check if Go is installed
    try {
        go version | Out-Null
    }
    catch {
        Write-Host "Error: Go is not installed or not in PATH." -ForegroundColor Red
        return $false
    }

    Push-Location "apps/backend"

    try {
        # Install gqlgen if not present
        $gqlgenInstalled = go list -m github.com/99designs/gqlgen 2>$null
        if (-not $gqlgenInstalled) {
            Write-Host "  Installing gqlgen..." -ForegroundColor Yellow
            go get github.com/99designs/gqlgen
        }

        go generate ./...

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Go codegen failed" -ForegroundColor Red
            return $false
        }
    }
    finally {
        Pop-Location
    }

    Write-Host "✓ Go codegen complete" -ForegroundColor Green
    Write-Host "  Generated files in: apps/backend/graph/"
    return $true
}

function Check-Sync {
    Write-Host "▶ Checking if generated code is in sync..." -ForegroundColor Yellow

    # Run codegen
    if (-not $TsOnly -and -not $GoOnly) {
        if (-not (Run-TsCodegen)) { return $false }
        if (-not (Run-GoCodegen)) { return $false }
    }
    elseif ($TsOnly) {
        if (-not (Run-TsCodegen)) { return $false }
    }
    elseif ($GoOnly) {
        if (-not (Run-GoCodegen)) { return $false }
    }

    # Check for changes
    $diff = git diff --name-only libs/api-client/generated/ apps/backend/graph/ 2>$null

    if (-not $diff) {
        Write-Host "✓ Generated code is in sync with schema" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "✗ Generated code is out of sync!" -ForegroundColor Red
        Write-Host ""
        Write-Host "The following files have changes:"
        Write-Host $diff
        Write-Host ""
        Write-Host "Run 'npm run codegen' and commit the generated files." -ForegroundColor Yellow
        return $false
    }
}

# Main execution
$success = $true

if ($Check) {
    $success = Check-Sync
}
elseif ($TsOnly) {
    $success = Run-TsCodegen
}
elseif ($GoOnly) {
    $success = Run-GoCodegen
}
else {
    # Run both
    $success = Run-TsCodegen
    Write-Host ""
    if ($success) {
        $success = Run-GoCodegen
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
if ($success) {
    Write-Host "Code generation complete!" -ForegroundColor Green
}
else {
    Write-Host "Code generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
