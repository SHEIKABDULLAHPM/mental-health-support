@echo off
REM Minimal startup for ML Service (sentiment + recommendations only)

echo ========================================
echo   ML Service - Minimal Start
echo   (sentiment + recommendations)
echo ========================================
echo.

REM Use script directory
cd /d "%~dp0"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed. Please install Python 3.9+.
    pause
    exit /b 1
)

echo [+] Python detected
python --version
echo.

REM Create venv if missing
if not exist "venv" (
    echo [*] Creating virtual environment...
    python -m venv venv
)

echo [*] Activating virtual environment...
call venv\Scripts\activate.bat

echo [*] Installing minimal dependencies...
python -m pip install --upgrade pip
pip install flask flask-cors python-dotenv requests numpy pandas vaderSentiment

echo.
echo ========================================
echo [+] Minimal setup complete. Starting server...
echo ========================================
echo.
set FLASK_DEBUG=false
set PORT=5000

python app.py
