@echo off
REM Quick Fix Script for Chatbot Not Responding Issue
REM This installs PyTorch and required dependencies

echo.
echo ========================================
echo  CHATBOT FIX - Installing Dependencies
echo ========================================
echo.

cd /d "E:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service"

echo [1/4] Checking Python version...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found! Please install Python first.
    pause
    exit /b 1
)

echo.
echo [2/4] Upgrading pip...
python -m pip install --upgrade pip
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not upgrade pip, continuing anyway...
)

echo.
echo [3/4] Installing PyTorch and dependencies...
echo This may take 5-10 minutes depending on your internet connection.
echo.

REM Check if CUDA is available
nvidia-smi >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Detected NVIDIA GPU - Installing PyTorch with CUDA support...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
) else (
    echo No GPU detected - Installing PyTorch CPU version...
    pip install torch torchvision torchaudio
)

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install PyTorch!
    echo.
    echo Try manually:
    echo   pip install torch torchvision torchaudio
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Installing remaining ML dependencies...
pip install transformers==4.42.4 peft==0.12.0 accelerate==0.33.0 sentence-transformers==2.2.2 langdetect==1.0.9

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Start backend:  python app.py
echo   2. Wait for: "Loading model Qwen/Qwen2-1.5B-Instruct"
echo   3. Test health: Invoke-RestMethod -Uri "http://localhost:5000/api/chat/health"
echo   4. Start frontend: cd ..\project; npm run dev
echo   5. Open browser: http://localhost:3000/chatbot
echo.

pause
