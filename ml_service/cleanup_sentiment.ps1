# Sentiment Analysis - Cleanup Script
# Removes unused/empty sentiment analysis files

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🗑️  SENTIMENT ANALYSIS - CLEANUP UNUSED FILES" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$basePath = "e:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service"
Set-Location $basePath

Write-Host "📁 Current Directory: $basePath`n" -ForegroundColor Yellow

# Check if sentiment_analysis folder exists
if (Test-Path "sentiment_analysis") {
    Write-Host "🔍 Found: sentiment_analysis/ folder" -ForegroundColor Yellow
    
    # Check core.py
    if (Test-Path "sentiment_analysis\core.py") {
        $size = (Get-Item "sentiment_analysis\core.py").Length
        if ($size -eq 0) {
            Write-Host "  ❌ core.py is EMPTY (0 bytes) - Deleting..." -ForegroundColor Red
            Remove-Item "sentiment_analysis\core.py" -Force
            Write-Host "  ✅ Deleted: sentiment_analysis\core.py" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  core.py has content ($size bytes) - SKIPPING" -ForegroundColor Yellow
        }
    }
    
    # Check __init__.py
    if (Test-Path "sentiment_analysis\__init__.py") {
        $size = (Get-Item "sentiment_analysis\__init__.py").Length
        if ($size -eq 0) {
            Write-Host "  ❌ __init__.py is EMPTY (0 bytes) - Deleting..." -ForegroundColor Red
            Remove-Item "sentiment_analysis\__init__.py" -Force
            Write-Host "  ✅ Deleted: sentiment_analysis\__init__.py" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  __init__.py has content ($size bytes) - SKIPPING" -ForegroundColor Yellow
        }
    }
    
    # Check if folder is empty
    $remaining = Get-ChildItem "sentiment_analysis" -ErrorAction SilentlyContinue
    if ($remaining.Count -eq 0) {
        Write-Host "`n  📂 sentiment_analysis/ folder is now EMPTY" -ForegroundColor Yellow
        Write-Host "  ❌ Deleting empty folder..." -ForegroundColor Red
        Remove-Item "sentiment_analysis" -Recurse -Force
        Write-Host "  ✅ Deleted: sentiment_analysis/ folder" -ForegroundColor Green
    } else {
        Write-Host "`n  ⚠️  sentiment_analysis/ folder still has files:" -ForegroundColor Yellow
        Get-ChildItem "sentiment_analysis" | ForEach-Object { Write-Host "     - $($_.Name)" -ForegroundColor White }
        Write-Host "  → Keeping folder (not empty)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ sentiment_analysis/ folder not found (already deleted or doesn't exist)" -ForegroundColor Green
}

Write-Host "`n------------------------------------------------------------" -ForegroundColor Cyan

# Check models/SentimentAnalysis.py
if (Test-Path "models\SentimentAnalysis.py") {
    Write-Host "`n🔍 Found: models\SentimentAnalysis.py" -ForegroundColor Yellow
    Write-Host "  ⚠️  Checking if file is imported anywhere..." -ForegroundColor Yellow
    
    # Search for imports (simple check)
    $importFound = Select-String -Path "**\*.py" -Pattern "from models.SentimentAnalysis|import SentimentAnalysis" -ErrorAction SilentlyContinue
    
    if ($importFound) {
        Write-Host "  ⚠️  File IS imported - KEEPING" -ForegroundColor Yellow
        Write-Host "     Found in:" -ForegroundColor White
        $importFound | ForEach-Object { Write-Host "     - $($_.Filename)" -ForegroundColor White }
    } else {
        Write-Host "  ❌ File NOT imported anywhere - Deleting..." -ForegroundColor Red
        # Uncomment next line to actually delete:
        # Remove-Item "models\SentimentAnalysis.py" -Force
        Write-Host "  ⚠️  SKIPPED (uncomment line 62 in script to delete)" -ForegroundColor Yellow
        Write-Host "     Verify manually first: grep -r 'SentimentAnalysis' *.py" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n✅ models\SentimentAnalysis.py not found" -ForegroundColor Green
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "📊 CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Verify new module exists
if (Test-Path "sentiment_module") {
    Write-Host "✅ NEW sentiment_module/ exists" -ForegroundColor Green
    
    $files = @("__init__.py", "analyzer.py", "models.py", "README.md")
    foreach ($file in $files) {
        if (Test-Path "sentiment_module\$file") {
            $size = (Get-Item "sentiment_module\$file").Length
            Write-Host "   ✅ $file ($size bytes)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $file MISSING" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ NEW sentiment_module/ NOT FOUND" -ForegroundColor Red
}

Write-Host "`n✨ Cleanup complete! Check output above for details." -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run: python test_sentiment_module.py" -ForegroundColor White
Write-Host "   2. Test frontend pages (Journal, MoodCheckin, ReflectionWall, Chatbot)" -ForegroundColor White
Write-Host "   3. Restart backend server" -ForegroundColor White

Write-Host "`n============================================================`n" -ForegroundColor Cyan
