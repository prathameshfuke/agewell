@echo off
title Download Tesseract OCR
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║           Tesseract OCR Download Helper                  ║
echo  ║                                                           ║
echo  ║              For AGEWELL Platform                         ║
echo  ║                                                           ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
echo.

echo  This script will help you download Tesseract OCR 5.5.0
echo.
echo  Tesseract is required for prescription OCR processing.
echo.
echo  ═══════════════════════════════════════════════════════════
echo.

set DOWNLOAD_URL=https://github.com/tesseract-ocr/tesseract/releases/download/5.5.0/tesseract-ocr-w64-setup-5.5.0.20241111.exe
set FILENAME=tesseract-ocr-w64-setup-5.5.0.20241111.exe

echo  What would you like to do?
echo.
echo  [1] Open download page in browser
echo  [2] Download using PowerShell (recommended)
echo  [3] Copy download link to clipboard
echo  [4] View installation guide
echo  [5] Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto browser
if "%choice%"=="2" goto download
if "%choice%"=="3" goto clipboard
if "%choice%"=="4" goto guide
if "%choice%"=="5" goto end

echo Invalid choice. Please try again.
pause
goto start

:browser
echo.
echo Opening download page in browser...
start "" "%DOWNLOAD_URL%"
echo.
echo Download the file and run it to install Tesseract.
echo Install to: C:\Program Files\Tesseract-OCR
echo.
pause
goto end

:download
echo.
echo Downloading Tesseract OCR 5.5.0...
echo This may take a few minutes depending on your connection.
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%USERPROFILE%\Downloads\%FILENAME%'}"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Download complete!
    echo.
    echo File saved to: %USERPROFILE%\Downloads\%FILENAME%
    echo.
    echo Would you like to run the installer now? (Y/N)
    set /p run="Enter choice: "
    
    if /i "%run%"=="Y" (
        echo.
        echo Starting installer...
        start "" "%USERPROFILE%\Downloads\%FILENAME%"
        echo.
        echo IMPORTANT: Install to C:\Program Files\Tesseract-OCR
        echo.
    ) else (
        echo.
        echo You can run the installer later from your Downloads folder.
        echo.
    )
) else (
    echo.
    echo ✗ Download failed!
    echo.
    echo Please try option 1 to download manually from browser.
    echo.
)

pause
goto end

:clipboard
echo.
echo Copying download link to clipboard...
echo.

echo %DOWNLOAD_URL% | clip

echo ✓ Link copied to clipboard!
echo.
echo Paste it in your browser to download.
echo.
pause
goto end

:guide
echo.
echo Opening installation guide...
start "" "%~dp0INSTALL_TESSERACT.md"
echo.
pause
goto end

:end
echo.
echo Thank you for using AGEWELL!
echo.
timeout /t 2 /nobreak >nul
exit
