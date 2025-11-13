# Quick Fix for Dependency Conflicts
# Resolves numpy and protobuf version conflicts with TensorFlow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Fixing Dependency Conflicts" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location "E:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service"

Write-Host "[1/3] Upgrading conflicting packages..." -ForegroundColor Yellow
Write-Host "  - numpy: 1.24.3 -> >=1.26.0 (required by TensorFlow)" -ForegroundColor Gray
Write-Host "  - protobuf: <5 -> >=5.28.0 (required by TensorFlow)`n" -ForegroundColor Gray

pip install --upgrade "numpy>=1.26.0,<2.0.0" "protobuf>=5.28.0,<6.0.0"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Failed to upgrade packages!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n[2/3] Verifying installations..." -ForegroundColor Yellow
Write-Host "`nNumpy version:" -ForegroundColor Gray
pip show numpy | Select-String "Version"

Write-Host "`nProtobuf version:" -ForegroundColor Gray
pip show protobuf | Select-String "Version"

Write-Host "`n[3/3] Checking for remaining conflicts..." -ForegroundColor Yellow
$checkOutput = pip check 2>&1 | Out-String

if ($checkOutput -match "No broken requirements found") {
    Write-Host "`n✓ No dependency conflicts!" -ForegroundColor Green
} elseif ($checkOutput -match "numpy|protobuf") {
    Write-Host "`nWARNING: Still have conflicts:" -ForegroundColor Yellow
    Write-Host $checkOutput -ForegroundColor Gray
} else {
    Write-Host "`n✓ Numpy and protobuf conflicts resolved!" -ForegroundColor Green
    if ($checkOutput.Length -gt 0) {
        Write-Host "`nOther warnings (can be ignored if not critical):" -ForegroundColor Yellow
        Write-Host $checkOutput -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " ✓ Dependency Fix Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next step: Restart backend" -ForegroundColor Cyan
Write-Host "  cd ml_service" -ForegroundColor Yellow
Write-Host "  python app.py`n" -ForegroundColor Yellow

Read-Host "Press Enter to exit"
