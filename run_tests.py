#!/usr/bin/env python3
"""
Comprehensive test runner for MMO RPG Telegram Bot
"""

import asyncio
import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command: str, cwd: str = None) -> bool:
    """Run a shell command and return success status"""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ Success: {command}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {command}")
        print(f"Exit code: {e.returncode}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        "pytest",
        "pytest-asyncio",
        "pytest-cov",
        "pytest-timeout",
        "pytest-mock"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        install_cmd = f"pip install {' '.join(missing_packages)}"
        if not run_command(install_cmd):
            print("❌ Failed to install missing packages")
            return False
    
    print("✅ All dependencies are available")
    return True

def setup_test_environment():
    """Set up test environment"""
    print("🔧 Setting up test environment...")
    
    # Set test environment variables
    os.environ['TESTING'] = 'true'
    os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_mmorpg_bot'
    os.environ['BOT_TOKEN'] = 'test_token'
    os.environ['JWT_SECRET_KEY'] = 'test_secret_key'
    os.environ['CDN_BASE_URL'] = 'https://test-cdn.example.com'
    
    # Create test directories
    test_dirs = [
        "generated_sprites",
        "generated_cards",
        "assets/sprites",
        "assets/sprites/weapons",
        "assets/sprites/armor",
        "assets/sprites/helmets",
        "assets/sprites/boots",
        "assets/sprites/accessories",
        "logs"
    ]
    
    for directory in test_dirs:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")
    
    print("✅ Test environment set up")
    return True

def run_unit_tests():
    """Run unit tests"""
    print("🧪 Running unit tests...")
    
    cmd = "python -m pytest tests/unit/ -v --tb=short --cov=. --cov-report=term-missing"
    
    if not run_command(cmd):
        print("❌ Unit tests failed")
        return False
    
    print("✅ Unit tests passed")
    return True

def run_integration_tests():
    """Run integration tests"""
    print("🔗 Running integration tests...")
    
    cmd = "python -m pytest tests/integration/ -v --tb=short --cov=. --cov-report=term-missing"
    
    if not run_command(cmd):
        print("❌ Integration tests failed")
        return False
    
    print("✅ Integration tests passed")
    return True

def run_bot_tests():
    """Run bot tests"""
    print("🤖 Running bot tests...")
    
    cmd = "python -m pytest tests/bot/ -v --tb=short --cov=. --cov-report=term-missing"
    
    if not run_command(cmd):
        print("❌ Bot tests failed")
        return False
    
    print("✅ Bot tests passed")
    return True

def run_api_tests():
    """Run API tests"""
    print("🌐 Running API tests...")
    
    cmd = "python -m pytest tests/api/ -v --tb=short --cov=. --cov-report=term-missing"
    
    if not run_command(cmd):
        print("❌ API tests failed")
        return False
    
    print("✅ API tests passed")
    return True

def run_all_tests():
    """Run all tests"""
    print("🚀 Running all tests...")
    
    cmd = "python -m pytest tests/ -v --tb=short --cov=. --cov-report=term-missing --cov-report=html:htmlcov"
    
    if not run_command(cmd):
        print("❌ Some tests failed")
        return False
    
    print("✅ All tests passed")
    return True

def run_specific_tests(test_path: str):
    """Run specific tests"""
    print(f"🎯 Running tests in {test_path}...")
    
    cmd = f"python -m pytest {test_path} -v --tb=short --cov=. --cov-report=term-missing"
    
    if not run_command(cmd):
        print(f"❌ Tests in {test_path} failed")
        return False
    
    print(f"✅ Tests in {test_path} passed")
    return True

def run_coverage_report():
    """Generate coverage report"""
    print("📊 Generating coverage report...")
    
    cmd = "python -m pytest tests/ --cov=. --cov-report=html:htmlcov --cov-report=xml:coverage.xml --cov-report=term-missing"
    
    if not run_command(cmd):
        print("❌ Coverage report generation failed")
        return False
    
    print("✅ Coverage report generated")
    print("📁 HTML report: htmlcov/index.html")
    print("📄 XML report: coverage.xml")
    return True

def run_linting():
    """Run code linting"""
    print("🔍 Running code linting...")
    
    # Run flake8
    flake8_cmd = "flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics"
    if not run_command(flake8_cmd):
        print("❌ Flake8 linting failed")
        return False
    
    # Run black check
    black_cmd = "black --check ."
    if not run_command(black_cmd):
        print("❌ Black formatting check failed")
        return False
    
    # Run mypy
    mypy_cmd = "mypy . --ignore-missing-imports"
    if not run_command(mypy_cmd):
        print("❌ MyPy type checking failed")
        return False
    
    print("✅ Code linting passed")
    return True

def run_performance_tests():
    """Run performance tests"""
    print("⚡ Running performance tests...")
    
    # Run tests with performance markers
    cmd = "python -m pytest tests/ -m slow -v --tb=short --timeout=300"
    
    if not run_command(cmd):
        print("❌ Performance tests failed")
        return False
    
    print("✅ Performance tests passed")
    return True

def main():
    """Main test runner function"""
    parser = argparse.ArgumentParser(description="MMO RPG Telegram Bot Test Runner")
    parser.add_argument("--type", choices=["unit", "integration", "bot", "api", "all"], 
                       default="all", help="Type of tests to run")
    parser.add_argument("--path", help="Specific test path to run")
    parser.add_argument("--coverage", action="store_true", help="Generate coverage report")
    parser.add_argument("--lint", action="store_true", help="Run code linting")
    parser.add_argument("--performance", action="store_true", help="Run performance tests")
    parser.add_argument("--setup-only", action="store_true", help="Only setup test environment")
    parser.add_argument("--no-deps", action="store_true", help="Skip dependency check")
    
    args = parser.parse_args()
    
    print("🎮 MMO RPG Telegram Bot Test Runner")
    print("=" * 50)
    
    # Check dependencies
    if not args.no_deps:
        if not check_dependencies():
            sys.exit(1)
    
    # Setup test environment
    if not setup_test_environment():
        sys.exit(1)
    
    if args.setup_only:
        print("✅ Test environment setup complete")
        return
    
    # Run linting
    if args.lint:
        if not run_linting():
            sys.exit(1)
    
    # Run performance tests
    if args.performance:
        if not run_performance_tests():
            sys.exit(1)
    
    # Run specific tests
    if args.path:
        if not run_specific_tests(args.path):
            sys.exit(1)
    
    # Run tests by type
    elif args.type == "unit":
        if not run_unit_tests():
            sys.exit(1)
    elif args.type == "integration":
        if not run_integration_tests():
            sys.exit(1)
    elif args.type == "bot":
        if not run_bot_tests():
            sys.exit(1)
    elif args.type == "api":
        if not run_api_tests():
            sys.exit(1)
    elif args.type == "all":
        if not run_all_tests():
            sys.exit(1)
    
    # Generate coverage report
    if args.coverage:
        if not run_coverage_report():
            sys.exit(1)
    
    print("\n🎉 All tests completed successfully!")
    print("=" * 50)

if __name__ == "__main__":
    main()
