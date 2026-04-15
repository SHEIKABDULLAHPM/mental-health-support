# Quick Fix Script for Chatbot Not Responding Issue
# This installs PyTorch and required dependencies

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " CHATBOT FIX - Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location "E:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service"

Write-Host "[1/4] Checking Python version..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found! Please install Python first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n[2/4] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Could not upgrade pip, continuing anyway..." -ForegroundColor Yellow
}

Write-Host "`n[3/4] Installing PyTorch and dependencies..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes depending on your internet connection.`n" -ForegroundColor Gray

# Check if CUDA is available
$cudaAvailable = $false
try {
    nvidia-smi 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $cudaAvailable = $true
    }
} catch {
    $cudaAvailable = $false
}

if ($cudaAvailable) {
    Write-Host "✓ Detected NVIDIA GPU - Installing PyTorch with CUDA support..." -ForegroundColor Green
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
} else {
    Write-Host "✓ No GPU detected - Installing PyTorch CPU version..." -ForegroundColor Yellow
    pip install torch torchvision torchaudio
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Failed to install PyTorch!" -ForegroundColor Red
    Write-Host "`nTry manually:" -ForegroundColor Yellow
    Write-Host "  pip install torch torchvision torchaudio`n" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n[4/4] Installing remaining ML dependencies..." -ForegroundColor Yellow
pip install transformers==4.42.4 peft==0.12.0 accelerate==0.33.0 sentence-transformers==2.2.2 langdetect==1.0.9

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Failed to install dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " ✓ Installation Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:  " -NoNewline; Write-Host "python app.py" -ForegroundColor Yellow
Write-Host "  2. Wait for: " -NoNewline; Write-Host '"✓ Loading model Qwen/Qwen2-1.5B-Instruct"' -ForegroundColor Green
Write-Host "  3. Test health: " -NoNewline; Write-Host "Invoke-RestMethod -Uri 'http://localhost:5000/api/chat/health'" -ForegroundColor Yellow
Write-Host "  4. Start frontend: " -NoNewline; Write-Host "cd ..\project; npm run dev" -ForegroundColor Yellow
Write-Host "  5. Open browser: " -NoNewline; Write-Host "http://localhost:3000/chatbot" -ForegroundColor Cyan

Write-Host "`n" -NoNewline
Read-Host "Press Enter to exit"
