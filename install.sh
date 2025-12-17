#!/bin/bash

# ===========================================
# Toddler Schedule App - Installation Script
# ===========================================

set -e

echo "🍼 Toddler Schedule App Installer"
echo "=================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. You have $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

echo ""
echo "✅ Backend installation complete!"
echo ""

# Ask about React frontend
echo "Would you like to set up the React frontend? (y/n)"
read -r SETUP_FRONTEND

if [ "$SETUP_FRONTEND" = "y" ] || [ "$SETUP_FRONTEND" = "Y" ]; then
    echo ""
    echo "📦 Setting up React frontend..."
    
    # Create React app in client folder
    npx create-react-app client --template default
    
    # Copy the main component
    cp toddler-schedule-v2.jsx client/src/App.jsx
    cp api-client.js client/src/api.js
    
    # Update the App.jsx imports
    sed -i "1s/^/import { DB } from '.\/api';\n/" client/src/App.jsx 2>/dev/null || \
    sed -i '' "1s/^/import { DB } from '.\/api';\n/" client/src/App.jsx
    
    # Install client dependencies
    cd client
    npm install
    cd ..
    
    echo ""
    echo "✅ Frontend installation complete!"
fi

echo ""
echo "=========================================="
echo "🎉 Installation Complete!"
echo "=========================================="
echo ""
echo "To start the app:"
echo ""
echo "  1. Start the backend server:"
echo "     npm start"
echo ""
if [ "$SETUP_FRONTEND" = "y" ] || [ "$SETUP_FRONTEND" = "Y" ]; then
echo "  2. In another terminal, start the frontend:"
echo "     cd client && npm start"
echo ""
echo "  3. Open http://localhost:3000 in your browser"
else
echo "  2. Open the toddler-schedule-v2.jsx in Claude.ai artifacts"
echo "     or set up a React project manually"
fi
echo ""
echo "For Home Assistant integration, see home-assistant-config.yaml"
echo ""
