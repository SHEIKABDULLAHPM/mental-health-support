# 🔧 Fix for 404 Error on /api/sentiment/v2/health

## Problem
The endpoint `/api/sentiment/v2/health` returns 404 because the `sentiment_advanced_bp` blueprint failed to import when the Flask server started.

## Root Cause
The import path in `app/sentiment_advanced.py` was using relative imports (`from ..services.sentiment_service`) which failed because `services` is at the `ml_service` level, not inside `app`.

## Solution Applied
✅ Fixed the import path in `app/sentiment_advanced.py`:
- Changed from: `from ..services.sentiment_service import ...`
- Changed to: Using `sys.path` to add parent directory and `from services.sentiment_service import ...`

✅ Added better error logging in `app.py` to show import failures

## Next Steps - RESTART THE SERVER

### Option 1: Using PowerShell Terminal
```powershell
# Stop the current Flask server (Ctrl+C in the terminal where it's running)

# Navigate to ml_service directory
cd 'E:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service'

# Start the server
python app.py
```

You should see this output:
```
✓ Advanced sentiment API (v2) registered successfully
✓ Blueprint URL prefix: /api/sentiment/v2
```

### Option 2: Test the Import First
Before restarting, verify the import works:

```powershell
cd 'E:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service'
python test_blueprint_import.py
```

This should show:
```
✓ Blueprint imported successfully
✓ URL Prefix: /api/sentiment/v2
```

## After Restarting

Test the endpoint again:
```powershell
curl http://localhost:5000/api/sentiment/v2/health
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "service": "Sentiment Analysis Service",
    "version": "2.0",
    "models_available": {
      "vader": true,
      "classical": true,
      "bilstm": true,
      "ensemble": true
    }
  }
}
```

## If Still Getting 404

Check the Flask startup logs for this message:
```
✓ Advanced sentiment API (v2) registered successfully
```

If you see `✗ sentiment_advanced blueprint unavailable:` instead, the error message will show what's wrong with the import.

## Quick Troubleshooting

1. **Stop the Flask server** (very important - old code is still running!)
2. **Check Python can find the services module:**
   ```powershell
   cd ml_service
   python -c "from services.sentiment_service import get_sentiment_service; print('OK')"
   ```
3. **Restart Flask server:** `python app.py`
4. **Test endpoint:** `curl http://localhost:5000/api/sentiment/v2/health`

---

**The fix is applied in the code. You just need to restart the Flask server!**
