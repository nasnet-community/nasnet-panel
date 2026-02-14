@echo off
echo ================================================================
echo VLAN Auto-Allocation Codegen Fix Script
echo ================================================================
echo.
echo This script will attempt to unlock files and run codegen.
echo.
echo Step 1: Closing VS Code Go extension processes...
taskkill /F /IM gopls.exe >nul 2>&1
taskkill /F /IM go.exe >nul 2>&1
echo Done.
echo.
echo Step 2: Waiting 3 seconds for file locks to release...
timeout /t 3 >nul
echo.
echo Step 3: Running ent codegen...
cd apps\backend
go generate .\ent
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================================
    echo FAILED: Ent codegen still blocked by file locks
    echo ================================================================
    echo.
    echo Manual steps to fix:
    echo 1. Close VS Code completely
    echo 2. Close any other IDEs or editors
    echo 3. Wait 10 seconds
    echo 4. Run: cd apps/backend ^&^& go generate .\ent
    echo.
    pause
    exit /b 1
)
echo.
echo ================================================================
echo SUCCESS: Ent codegen completed!
echo ================================================================
echo.
echo Generated files in: apps\backend\ent\
echo.
echo Next: Run tests to verify
echo   cd apps\backend
echo   go test .\internal\network\... -v
echo.
pause
