@echo off
REM Voice Emotion Detection - ML Service Startup Script (Windows)

echo ========================================
echo   Voice Emotion Detection ML Service
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo [+] Python detected
python --version
echo.

REM Navigate to ml_service directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo [*] Creating virtual environment...
    python -m venv venv
    echo [+] Virtual environment created
    echo.
)

REM Activate virtual environment
echo [*] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo [*] Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ========================================
echo [+] Setup complete!
echo ========================================
echo.

REM Start the Flask service
echo [*] Starting ML Service on http://localhost:5000
echo.
echo Press Ctrl+C to stop the service
echo.

python app.py

pause
