#!/bin/bash

echo "🔄 Restarting ASL Market Backend..."

# Kill existing backend process
echo "🛑 Stopping existing backend..."
pkill -f "asl-market-backend" || true

# Build backend
echo "🔨 Building backend..."
cd backend
go build -o asl-market-backend

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Backend built successfully"
    
    # Start backend in background
    echo "🚀 Starting backend..."
    nohup ./asl-market-backend > backend.log 2>&1 &
    
    echo "✅ Backend started! Check backend.log for logs"
    echo "📋 Backend PID: $!"
else
    echo "❌ Backend build failed!"
    exit 1
fi

cd ..

# Optional: Seed available products
echo "🌱 Would you like to seed available products? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🌱 Seeding available products..."
    cd backend/scripts
    go run run_seed_available_products.go
    cd ../..
    echo "✅ Seeding completed!"
fi

echo "🎉 All done! Backend is running with database middleware."