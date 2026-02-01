@echo off
echo ========================================
echo AGEWELL Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

if not exist "venv\Lib\site-packages\flask\" (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo.
)

if not exist "agewell.db" (
    echo Database not found. Would you like to seed sample data? (Y/N)
    set /p SEED="Enter choice: "
    if /i "%SEED%"=="Y" (
        echo Seeding database...
        python seed_data.py
        echo.
    )
)

echo Starting Flask server...
echo Backend will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py

pause
