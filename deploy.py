#!/usr/bin/env python3
"""
Deployment script for the MMO RPG Telegram Bot
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path

async def run_command(command: str, cwd: str = None):
    """Run a shell command"""
    print(f"Running: {command}")
    process = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        print(f"Error running command: {command}")
        print(f"STDOUT: {stdout.decode()}")
        print(f"STDERR: {stderr.decode()}")
        return False
    
    print(f"Success: {command}")
    return True

async def setup_environment():
    """Set up the environment"""
    print("Setting up environment...")
    
    # Create necessary directories
    directories = [
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
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")
    
    # Create .env file if it doesn't exist
    if not os.path.exists(".env"):
        env_content = """# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here
WEBHOOK_URL=https://yourdomain.com/webhook
WEBHOOK_SECRET=your_webhook_secret

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mmorpg_bot
REDIS_URL=redis://localhost:6379/0

# Payment Configuration
TELEGRAM_PAYMENT_PROVIDER_TOKEN=your_payment_provider_token

# Security
JWT_SECRET_KEY=your_jwt_secret_key_here
WEBHOOK_SECRET_KEY=your_webhook_secret_key

# CDN Configuration
CDN_BASE_URL=https://cdn.yourdomain.com
SPRITE_BASE_PATH=/sprites

# Game Configuration
MAX_CHARACTERS_PER_USER=3
MAX_INVENTORY_SLOTS=30
BASE_INVENTORY_SLOTS=20
"""
        with open(".env", "w") as f:
            f.write(env_content)
        print("Created .env file - please update with your configuration")

async def install_dependencies():
    """Install Python dependencies"""
    print("Installing dependencies...")
    
    # Install requirements
    success = await run_command("pip install -r requirements.txt")
    if not success:
        print("Failed to install requirements")
        return False
    
    return True

async def setup_database():
    """Set up the database"""
    print("Setting up database...")
    
    # Check if PostgreSQL is running
    success = await run_command("pg_isready")
    if not success:
        print("PostgreSQL is not running. Please start PostgreSQL first.")
        return False
    
    # Create database if it doesn't exist
    await run_command("createdb mmorpg_bot 2>/dev/null || true")
    
    return True

async def run_tests():
    """Run tests"""
    print("Running tests...")
    
    # Create a simple test
    test_content = '''import pytest
import asyncio
from database import init_database
from config import Config

@pytest.mark.asyncio
async def test_database_connection():
    """Test database connection"""
    await init_database(Config.DATABASE_URL)
    # Add more tests here

if __name__ == "__main__":
    pytest.main([__file__])
'''
    
    with open("test_basic.py", "w") as f:
        f.write(test_content)
    
    # Run tests
    success = await run_command("python -m pytest test_basic.py -v")
    
    # Clean up test file
    os.remove("test_basic.py")
    
    return success

async def start_services():
    """Start the services"""
    print("Starting services...")
    
    # Start web server in background
    web_server_process = await asyncio.create_subprocess_shell(
        "python web_server.py",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    # Start bot in background
    bot_process = await asyncio.create_subprocess_shell(
        "python bot.py",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    print("Services started!")
    print("Web server running on port 8080")
    print("Bot is running...")
    
    # Wait for processes
    try:
        await asyncio.gather(
            web_server_process.wait(),
            bot_process.wait()
        )
    except KeyboardInterrupt:
        print("Shutting down services...")
        web_server_process.terminate()
        bot_process.terminate()
        
        await web_server_process.wait()
        await bot_process.wait()

async def main():
    """Main deployment function"""
    print("🚀 MMO RPG Telegram Bot Deployment")
    print("=" * 40)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("Python 3.8+ is required")
        return
    
    # Setup steps
    steps = [
        ("Setting up environment", setup_environment),
        ("Installing dependencies", install_dependencies),
        ("Setting up database", setup_database),
        ("Running tests", run_tests),
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        success = await step_func()
        if not success:
            print(f"❌ {step_name} failed!")
            return
        print(f"✅ {step_name} completed!")
    
    print("\n🎉 Deployment completed successfully!")
    print("\nNext steps:")
    print("1. Update .env file with your configuration")
    print("2. Set up your Telegram bot token")
    print("3. Configure your database connection")
    print("4. Run: python deploy.py --start")
    
    # Check if --start flag is provided
    if "--start" in sys.argv:
        print("\n🚀 Starting services...")
        await start_services()

if __name__ == "__main__":
    asyncio.run(main())
