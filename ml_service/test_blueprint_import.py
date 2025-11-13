"""
Quick test to verify sentiment_advanced blueprint can be imported
"""
import sys
import os

# Add ml_service to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    print("Testing import of sentiment_advanced blueprint...")
    from app.sentiment_advanced import sentiment_advanced_bp
    print(f"✓ Blueprint imported successfully: {sentiment_advanced_bp}")
    print(f"✓ URL Prefix: {sentiment_advanced_bp.url_prefix}")
    print(f"✓ Name: {sentiment_advanced_bp.name}")
    
    # List routes
    print("\nRegistered routes:")
    for rule in sentiment_advanced_bp.url_prefix or []:
        print(f"  - {rule}")
    
except Exception as e:
    print(f"✗ Import failed: {e}")
    import traceback
    traceback.print_exc()
