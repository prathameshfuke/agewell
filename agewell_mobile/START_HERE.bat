@echo off
title AGEWELL - Quick Start
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║              AGEWELL Platform - Quick Start               ║
echo  ║                                                           ║
echo  ║     Elderly Medication and Wellness Management System     ║
echo  ║                                                           ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
echo.

echo  What would you like to do?
echo.
echo  [1] Start Backend Server (Flask)
echo  [2] Start Frontend Server (React)
echo  [3] Start Both Servers
echo  [4] Seed Database with Sample Data
echo  [5] Test Tesseract OCR
echo  [6] View Documentation
echo  [7] Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto seed
if "%choice%"=="5" goto test_tesseract
if "%choice%"=="6" goto docs
if "%choice%"=="7" goto end

echo Invalid choice. Please try again.
pause
goto start

:backend
echo.
echo Starting Backend Server...
start "AGEWELL Backend" cmd /k "%~dp0start_backend.bat"
echo.
echo Backend server started in a new window!
echo Access at: http://localhost:5000
pause
goto end

:frontend
echo.
echo Starting Frontend Server...
start "AGEWELL Frontend" cmd /k "%~dp0start_frontend.bat"
echo.
echo Frontend server started in a new window!
echo Access at: http://localhost:3000
pause
goto end

:both
echo.
echo Starting Both Servers...
echo.
start "AGEWELL Backend" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "AGEWELL Frontend" cmd /k "%~dp0start_frontend.bat"
echo.
echo Both servers started in separate windows!
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Wait for both servers to start, then open:
echo http://localhost:3000 in your browser
echo.
pause
goto end

:seed
echo.
echo Seeding Database with Sample Data...
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python seed_data.py
) else (
    echo Virtual environment not found!
    echo Please run option 1 or 3 first to set up the backend.
)
echo.
pause
goto end

:test_tesseract
echo.
echo Testing Tesseract OCR...
start "Tesseract Test" cmd /k "%~dp0test_tesseract.bat"
echo.
echo Test started in a new window!
pause
goto end

:docs
echo.
echo Opening Documentation...
start "" "%~dp0README.md"
start "" "%~dp0SETUP_GUIDE.md"
start "" "%~dp0PROJECT_SUMMARY.md"
echo.
pause
goto end

:end
echo.
echo Thank you for using AGEWELL!
echo.
timeout /t 2 /nobreak >nul
exit
