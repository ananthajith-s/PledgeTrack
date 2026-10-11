#!/bin/bash

echo "🚀 PledgeTrack MERN App Setup"
echo "=============================="

# Check for required commands
echo "Checking system requirements..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is not installed. Please install Node.js v18+."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "⚠️  npm is not installed. Attempting to install..."; sudo apt install -y npm; }
command -v mongod >/dev/null 2>&1 || { echo "⚠️  MongoDB is not installed. You'll need to install MongoDB separately."; }

echo "✅ System requirements checked"

# Create environment file
echo -e "\n📝 Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update .env with your actual values before starting the server"
else
    echo "✅ .env file already exists"
fi

# Install server dependencies
echo -e "\n📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo -e "\n📦 Installing client dependencies..."
cd client
npm install
cd ..

echo -e "\n🎉 Setup complete!"
echo -e "\n📋 Next steps:"
echo "1. Update .env file with your MongoDB connection string and JWT secret"
echo "2. Start MongoDB service: sudo systemctl start mongod (or appropriate command for your system)"
echo "3. Start backend server: cd server && npm run dev"
echo "4. Start frontend: cd client && npm run dev"
echo "5. Open browser to http://localhost:5173"

echo -e "\n🔧 Available API endpoints:"
echo "   POST /api/auth/register - Register a new user"
echo "   POST /api/auth/login - Login user"
echo "   GET  /api/auth/me - Get current user (requires auth)"
echo "   GET  /api/health - Health check"