#!/bin/bash

echo "Setting up Data Vault Platform..."

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services..."
sleep 10


### =============================================


# Deploy smart contracts
echo "🎯 ==========================================="
echo "🎯       SMART CONTRACT DEPLOYMENT SCRIPT"
echo "🎯 ==========================================="

echo "🔨 Starting contract setup..."
cd contracts

echo "🌐 Starting local Hardhat network in the background..."
npx hardhat node &
HARDHAT_PID=$!
echo "📝 Hardhat node started with PID: $HARDHAT_PID"

echo "⏳ Waiting for local network to initialize..."
sleep 5

echo "🚀 Deploying contracts to local network..."
npx hardhat run scripts/deploy.js --network localhost --show-stack-traces

# Check if deployment succeeded
if [ $? -ne 0 ]; then
    echo "❌ Contract deployment failed!"
    echo "🛑 Stopping Hardhat network..."
    kill $HARDHAT_PID 2>/dev/null
    exit 1
fi

echo "✅ Contracts successfully deployed!"

# Create backend contracts directory
echo "📁 Creating backend contracts directory..."
mkdir -p ../backend/contracts
echo "📂 Directory structure created: ../backend/contracts/"

# Copy ABI
echo "📋 Copying contract ABI to backend..."
if [ -f artifacts/contracts/IPRightsRegistry.sol/IPRightsRegistry.json ]; then
    cp artifacts/contracts/IPRightsRegistry.sol/IPRightsRegistry.json ../backend/contracts/
    echo "✅ ABI file copied successfully"
else
    echo "❌ ABI file not found at artifacts/contracts/IPRightsRegistry.sol/IPRightsRegistry.json"
    echo "🛑 Stopping Hardhat network..."
    kill $HARDHAT_PID 2>/dev/null
    exit 1
fi

# Verify
echo "🔍 Verifying copied files..."
if [ -f ../backend/contracts/IPRightsRegistry.json ]; then
    echo "✅ Verification successful: ABI copied to backend/contracts/"
    echo "📊 File details:"
    ls -la ../backend/contracts/
    echo "📄 File content type:"
    file ../backend/contracts/IPRightsRegistry.json
else
    echo "❌ Verification failed: ABI file not found in backend"
    echo "🛑 Stopping Hardhat network..."
    kill $HARDHAT_PID 2>/dev/null
    exit 1
fi

# Compile contracts (optional - usually done before deployment)
echo "📝 Re-compiling contracts to ensure everything is up to date..."
npx hardhat compile

# Check if compilation succeeded
if [ $? -eq 0 ]; then
    echo "✅ Compilation completed successfully"
else
    echo "⚠️  Compilation had issues, but continuing..."
fi

echo "🛑 Stopping Hardhat network..."
kill $HARDHAT_PID 2>/dev/null
echo "🌐 Hardhat network stopped"

echo "🎉 ==========================================="
echo "🎉     CONTRACT SETUP COMPLETED SUCCESSFULLY!"
echo "🎉 ==========================================="
echo "📋 Summary:"
echo "   - Local network started and stopped"
echo "   - Contracts deployed to localhost"
echo "   - ABI copied to backend/contracts/"
echo "   - Ready for backend development!"
echo "==========================================="


# Install backend dependencies
echo "Setting up backend..."
if [ -d "backend" ]; then
  echo "Setting up backend..."
  cd backend
  npm install
  cd ..
else
  echo "⚠️ Skipping backend: no backend/ folder found"
fi

# Install frontend dependencies
echo "Setting up frontend..."
if [ -d "frontend" ]; then
  echo "Setting up frontend..."
  cd frontend
  npm install
  cd ..
else
  echo "⚠️ Skipping frontend: no frontend/ folder found"
fi
echo "✅ Setup complete!"
echo "To start the application:"
echo "  1. Backend: cd backend && npm run dev"
echo "  2. Frontend: cd frontend && npm run dev"
echo "  3. Hardhat: Already running (PID: $HARDHAT_PID)"
