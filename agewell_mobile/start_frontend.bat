@echo off
echo ========================================
echo AGEWELL Frontend Server
echo ========================================
echo.

cd /d "%~dp0frontend"

set PATH=D:\Node;%PATH%

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting Vite development server...
echo Frontend will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
