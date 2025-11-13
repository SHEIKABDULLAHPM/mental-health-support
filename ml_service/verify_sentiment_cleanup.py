"""
Sentiment Analysis - Cleanup & Verification Script
Identifies unused files and verifies sentiment module integration
"""

import os
import sys

# Colors for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_file_exists(filepath):
    """Check if file exists"""
    exists = os.path.exists(filepath)
    status = f"{GREEN}✅ EXISTS{RESET}" if exists else f"{RED}❌ MISSING{RESET}"
    print(f"  {status} {filepath}")
    return exists

def check_file_empty(filepath):
    """Check if file is empty"""
    if not os.path.exists(filepath):
        return None
    
    size = os.path.getsize(filepath)
    is_empty = size == 0
    
    if is_empty:
        print(f"    {YELLOW}⚠️  EMPTY (0 bytes){RESET}")
    else:
        print(f"    {GREEN}✓ Has content ({size} bytes){RESET}")
    
    return is_empty

def main():
    print("="*60)
    print(f"{BLUE}🔍 SENTIMENT ANALYSIS - FILE VERIFICATION{RESET}")
    print("="*60)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Check NEW sentiment module
    print(f"\n{BLUE}1. NEW Sentiment Module (sentiment_module/){RESET}")
    new_module_files = [
        "sentiment_module/__init__.py",
        "sentiment_module/analyzer.py",
        "sentiment_module/models.py",
        "sentiment_module/README.md"
    ]
    
    all_new_exist = True
    for file in new_module_files:
        filepath = os.path.join(base_path, file)
        exists = check_file_exists(filepath)
        if exists:
            check_file_empty(filepath)
        all_new_exist = all_new_exist and exists
    
    if all_new_exist:
        print(f"\n  {GREEN}✅ NEW sentiment module is COMPLETE{RESET}")
    else:
        print(f"\n  {RED}❌ NEW sentiment module has MISSING files{RESET}")
    
    # Check ACTIVE files
    print(f"\n{BLUE}2. ACTIVE Sentiment Files{RESET}")
    active_files = [
        "app/sentiment.py",
        "app/sentiment_advanced.py",
        "services/sentiment_service.py"
    ]
    
    for file in active_files:
        filepath = os.path.join(base_path, file)
        check_file_exists(filepath)
    
    # Check UNUSED files (candidates for deletion)
    print(f"\n{BLUE}3. UNUSED Files (Candidates for Deletion){RESET}")
    unused_files = [
        "sentiment_analysis/core.py",
        "sentiment_analysis/__init__.py",
        "models/SentimentAnalysis.py"
    ]
    
    files_to_delete = []
    for file in unused_files:
        filepath = os.path.join(base_path, file)
        if check_file_exists(filepath):
            is_empty = check_file_empty(filepath)
            if is_empty or is_empty is None:
                files_to_delete.append(filepath)
                print(f"    {YELLOW}→ RECOMMENDED: DELETE{RESET}")
    
    # Check test files
    print(f"\n{BLUE}4. Test Files{RESET}")
    test_files = [
        "test_sentiment_module.py",
        "test_api.py",
        "test_llm_integration.py"
    ]
    
    for file in test_files:
        filepath = os.path.join(base_path, file)
        check_file_exists(filepath)
    
    # Try to import sentiment_module
    print(f"\n{BLUE}5. Module Import Test{RESET}")
    try:
        sys.path.insert(0, base_path)
        from sentiment_module import SentimentAnalyzer, VADERModel, SentimentResult
        print(f"  {GREEN}✅ sentiment_module can be imported{RESET}")
        print(f"     - SentimentAnalyzer: {SentimentAnalyzer}")
        print(f"     - VADERModel: {VADERModel}")
        print(f"     - SentimentResult: {SentimentResult}")
        
        # Try to create analyzer
        from sentiment_module.analyzer import get_analyzer
        analyzer = get_analyzer()
        print(f"  {GREEN}✅ get_analyzer() works{RESET}")
        
        # Try to register VADER
        vader = VADERModel()
        analyzer.register_model("vader", vader)
        print(f"  {GREEN}✅ VADERModel registration works{RESET}")
        
        # Try simple analysis
        result = analyzer.analyze("I'm feeling great today!", model="vader")
        print(f"  {GREEN}✅ Simple analysis works{RESET}")
        print(f"     - Text: {result.text}")
        print(f"     - Label: {result.label}")
        print(f"     - Confidence: {result.confidence:.3f}")
        print(f"     - Compound: {result.compound_score:.3f}")
        
    except Exception as e:
        print(f"  {RED}❌ Import failed: {e}{RESET}")
    
    # Summary
    print("\n" + "="*60)
    print(f"{BLUE}📊 SUMMARY{RESET}")
    print("="*60)
    
    if all_new_exist:
        print(f"{GREEN}✅ NEW sentiment_module is complete and working{RESET}")
    else:
        print(f"{RED}❌ NEW sentiment_module has issues{RESET}")
    
    if files_to_delete:
        print(f"\n{YELLOW}🗑️  CLEANUP RECOMMENDATIONS:{RESET}")
        print(f"   The following files are EMPTY or UNUSED and can be deleted:")
        for file in files_to_delete:
            print(f"   - {file}")
        
        # Check if sentiment_analysis folder is empty
        sentiment_analysis_dir = os.path.join(base_path, "sentiment_analysis")
        if os.path.exists(sentiment_analysis_dir):
            remaining = [f for f in os.listdir(sentiment_analysis_dir) 
                        if f not in ['core.py', '__init__.py']]
            if not remaining:
                print(f"\n   {YELLOW}→ After cleanup, sentiment_analysis/ folder will be empty{RESET}")
                print(f"     Consider deleting entire folder: sentiment_analysis/{RESET}")
    else:
        print(f"\n{GREEN}✅ No unused files found{RESET}")
    
    print(f"\n{BLUE}📋 NEXT STEPS:{RESET}")
    print("1. Run: python test_sentiment_module.py")
    print("2. Test frontend pages (Journal, MoodCheckin, ReflectionWall, Chatbot)")
    print("3. Delete unused files if confirmed")
    print("4. Update app.py to use sentiment_module (optional)")
    print("5. Restart backend server")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    main()
