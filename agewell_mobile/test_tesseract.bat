@echo off
echo ========================================
echo Testing Tesseract OCR Installation
echo ========================================
echo.

echo Testing local Tesseract installation...
echo.

cd /d "%~dp0Tesseract"

echo Running: tesseract --version
echo.

tesseract.exe --version

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ SUCCESS: Tesseract is working correctly!
    echo.
    echo Location: D:\AGEWELL\Tesseract\tesseract.exe
    echo.
    echo The AGEWELL backend will automatically use this installation.
) else (
    echo.
    echo ✗ ERROR: Tesseract test failed!
    echo.
    echo Please check the installation.
)

echo.
pause
