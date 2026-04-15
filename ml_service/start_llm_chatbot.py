#!/usr/bin/env python3
"""
LLM Chatbot Startup Script
Comprehensive startup helper for the LLM-integrated mental health chatbot
"""

import subprocess
import sys
import time
import os
import requests
from pathlib import Path

def print_banner():
    """Print startup banner"""
    print("""
██╗     ██╗     ███╗   ███╗     ██████╗██╗  ██╗ █████╗ ████████╗██████╗  ██████╗ ████████╗
██║     ██║     ████╗ ████║    ██╔════╝██║  ██║██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝
██║     ██║     ██╔████╔██║    ██║     ███████║███████║   ██║   ██████╔╝██║   ██║   ██║   
██║     ██║     ██║╚██╔╝██║    ██║     ██╔══██║██╔══██║   ██║   ██╔══██╗██║   ██║   ██║   
███████╗███████╗██║ ╚═╝ ██║    ╚██████╗██║  ██║██║  ██║   ██║   ██████╔╝╚██████╔╝   ██║   
╚══════╝╚══════╝╚═╝     ╚═╝     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝    ╚═╝   
                                                                                            
            Mental Health Chatbot with LLaMA-3.2-1B Integration
    """)

def check_prerequisites():
    """Check system prerequisites"""
    print("🔍 Checking Prerequisites...")
    
    # Check Python
    try:
        python_version = sys.version_info
        if python_version.major >= 3 and python_version.minor >= 8:
            print(f"✅ Python {python_version.major}.{python_version.minor} - OK")
        else:
            print(f"❌ Python version {python_version.major}.{python_version.minor} - Need Python 3.8+")
            return False
    except:
        print("❌ Python not found")
        return False
    
    # Check Node.js (for frontend)
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()} - OK")
        else:
            print("❌ Node.js not found")
            return False
    except:
        print("❌ Node.js not found")
        return False
    
    # Check if Ollama is available
    try:
        result = subprocess.run(['ollama', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Ollama {result.stdout.strip()} - OK")
        else:
            print("⚠️  Ollama not found - will use fallback model")
    except:
        print("⚠️  Ollama not found - will use fallback model")
    
    return True

def install_python_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python Dependencies...")
    
    try:
        ml_service_path = Path(__file__).parent
        requirements_path = ml_service_path / "requirements.txt"
        
        if requirements_path.exists():
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_path)
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Python dependencies installed")
                return True
            else:
                print(f"❌ Failed to install Python dependencies: {result.stderr}")
                return False
        else:
            print("❌ requirements.txt not found")
            return False
    except Exception as e:
        print(f"❌ Error installing Python dependencies: {str(e)}")
        return False

def install_frontend_dependencies():
    """Install frontend dependencies"""
    print("📦 Installing Frontend Dependencies...")
    
    try:
        project_path = Path(__file__).parent.parent / "project"
        
        if project_path.exists():
            result = subprocess.run(['npm', 'install'], cwd=project_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Frontend dependencies installed")
                return True
            else:
                print(f"❌ Failed to install frontend dependencies: {result.stderr}")
                return False
        else:
            print("❌ Project directory not found")
            return False
    except Exception as e:
        print(f"❌ Error installing frontend dependencies: {str(e)}")
        return False

def setup_ollama():
    """Setup Ollama and pull model"""
    print("🤖 Setting up Ollama...")
    
    try:
        # Check if Ollama service is running
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                print("✅ Ollama service is running")
            else:
                print("⚠️  Ollama service may not be running")
        except:
            print("⚠️  Ollama service is not running - starting it...")
            # Try to start Ollama service
            subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(5)  # Wait for service to start
        
        # Check if model exists
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
        if result.returncode == 0:
            models = result.stdout
            if 'llama3.2:1b' in models:
                print("✅ LLaMA-3.2-1B model is available")
                return True
            else:
                print("📥 Pulling LLaMA-3.2-1B model...")
                pull_result = subprocess.run(['ollama', 'pull', 'llama3.2:1b'], capture_output=True, text=True)
                if pull_result.returncode == 0:
                    print("✅ LLaMA-3.2-1B model pulled successfully")
                    return True
                else:
                    print(f"❌ Failed to pull model: {pull_result.stderr}")
                    return False
        else:
            print("❌ Failed to check Ollama models")
            return False
    except Exception as e:
        print(f"⚠️  Ollama setup failed: {str(e)} - using fallback")
        return False

def start_ml_service():
    """Start the ML service"""
    print("🚀 Starting ML Service...")
    
    try:
        ml_service_path = Path(__file__).parent
        app_path = ml_service_path / "app.py"
        
        if app_path.exists():
            # Start ML service in background
            process = subprocess.Popen([
                sys.executable, str(app_path)
            ], cwd=ml_service_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait a bit for service to start
            time.sleep(5)
            
            # Check if service is running
            try:
                response = requests.get("http://localhost:5000/api/health", timeout=10)
                if response.status_code == 200:
                    print("✅ ML Service started successfully")
                    return process
                else:
                    print("❌ ML Service health check failed")
                    process.terminate()
                    return None
            except:
                print("❌ ML Service is not responding")
                process.terminate()
                return None
        else:
            print("❌ app.py not found")
            return None
    except Exception as e:
        print(f"❌ Error starting ML service: {str(e)}")
        return None

def start_frontend():
    """Start the frontend development server"""
    print("🌐 Starting Frontend...")
    
    try:
        project_path = Path(__file__).parent.parent / "project"
        
        if project_path.exists():
            # Start frontend in background
            process = subprocess.Popen([
                'npm', 'run', 'dev'
            ], cwd=project_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait a bit for service to start
            time.sleep(10)
            
            # Check if frontend is running
            try:
                response = requests.get("http://localhost:5173", timeout=10)
                if response.status_code == 200:
                    print("✅ Frontend started successfully")
                    return process
                else:
                    print("⚠️  Frontend may still be starting...")
                    return process
            except:
                print("⚠️  Frontend is starting...")
                return process
        else:
            print("❌ Project directory not found")
            return None
    except Exception as e:
        print(f"❌ Error starting frontend: {str(e)}")
        return None

def run_tests():
    """Run integration tests"""
    print("🧪 Running Integration Tests...")
    
    try:
        test_script = Path(__file__).parent / "test_llm_integration.py"
        
        if test_script.exists():
            result = subprocess.run([sys.executable, str(test_script)], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Integration tests passed")
                return True
            else:
                print("⚠️  Some tests failed - check output above")
                print(result.stdout)
                return False
        else:
            print("⚠️  Test script not found")
            return False
    except Exception as e:
        print(f"❌ Error running tests: {str(e)}")
        return False

def main():
    """Main startup routine"""
    print_banner()
    
    print("🚀 Starting LLM Mental Health Chatbot Setup...")
    print("=" * 60)
    
    # Check prerequisites
    if not check_prerequisites():
        print("❌ Prerequisites check failed. Please install required software.")
        return False
    
    # Install dependencies
    if not install_python_dependencies():
        print("❌ Failed to install Python dependencies")
        return False
    
    if not install_frontend_dependencies():
        print("❌ Failed to install frontend dependencies")
        return False
    
    # Setup Ollama (optional)
    setup_ollama()
    
    print("\n" + "=" * 60)
    print("🚀 Starting Services...")
    
    # Start ML service
    ml_process = start_ml_service()
    if not ml_process:
        print("❌ Failed to start ML service")
        return False
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("❌ Failed to start frontend")
        ml_process.terminate()
        return False
    
    print("\n" + "=" * 60)
    print("🧪 Running Tests...")
    
    # Run tests
    run_tests()
    
    print("\n" + "=" * 60)
    print("🎉 Startup Complete!")
    print(f"""
Services are running:
📊 ML Service:    http://localhost:5000
🌐 Frontend:      http://localhost:5173
🤖 LLM API:       http://localhost:5000/api/llm

API Endpoints:
• Health Check:   GET  /api/llm/health
• Start Chat:     POST /api/llm/chat/start
• Send Message:   POST /api/llm/chat/send
• Get History:    GET  /api/llm/chat/conversation/<id>

To stop services:
• Press Ctrl+C in each terminal
• Or kill processes manually

Enjoy your LLM-powered mental health chatbot! 🧠✨
    """)
    
    # Keep processes running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        ml_process.terminate()
        frontend_process.terminate()
        print("✅ Services stopped")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)