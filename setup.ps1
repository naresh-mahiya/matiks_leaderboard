# Quick Setup Script for Matiks Leaderboard

Write-Host "🏆 Matiks Leaderboard - Quick Setup" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Go
try {
    $goVersion = go version
    Write-Host "✅ Go installed: $goVersion" -ForegroundColor Green
    $goInstalled = $true
} catch {
    Write-Host "⚠️  Go not found. Backend will need Go 1.21+ to run." -ForegroundColor Yellow
    Write-Host "   Download from: https://go.dev/dl/" -ForegroundColor Yellow
    $goInstalled = $false
}

Write-Host "`n📦 Installing dependencies...`n" -ForegroundColor Yellow

# Frontend setup
Write-Host "Setting up frontend..." -ForegroundColor Cyan
Set-Location frontend
if (Test-Path "node_modules") {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend installation failed" -ForegroundColor Red
        exit 1
    }
}

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created frontend/.env (using localhost:8080)" -ForegroundColor Green
}

Set-Location ..

# Backend setup
if ($goInstalled) {
    Write-Host "`nSetting up backend..." -ForegroundColor Cyan
    Set-Location backend
    
    go mod download
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend dependencies installation had issues" -ForegroundColor Yellow
    }
    
    # Create .env if not exists
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "⚠️  Created backend/.env - PLEASE UPDATE DATABASE_URL!" -ForegroundColor Yellow
    }
    
    Set-Location ..
}

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "=============`n" -ForegroundColor Cyan

Write-Host "1. Set up Neon DB:" -ForegroundColor White
Write-Host "   - Go to https://neon.tech and create a free account" -ForegroundColor Gray
Write-Host "   - Create a new project" -ForegroundColor Gray
Write-Host "   - Copy the connection string" -ForegroundColor Gray
Write-Host "   - Update backend/.env with your DATABASE_URL`n" -ForegroundColor Gray

Write-Host "2. Run the database schema:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   psql YOUR_DATABASE_URL -f schema.sql`n" -ForegroundColor Gray

if ($goInstalled) {
    Write-Host "3. Start the backend:" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   go run main.go`n" -ForegroundColor Gray
} else {
    Write-Host "3. Install Go and start the backend:" -ForegroundColor White
    Write-Host "   - Download Go from https://go.dev/dl/" -ForegroundColor Gray
    Write-Host "   - Then: cd backend && go run main.go`n" -ForegroundColor Gray
}

Write-Host "4. Start the frontend (in a new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run web`n" -ForegroundColor Gray

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md - Project overview" -ForegroundColor Gray
Write-Host "   - DEPLOYMENT.md - Deployment guide" -ForegroundColor Gray
Write-Host "   - backend/README.md - Backend docs" -ForegroundColor Gray
Write-Host "   - frontend/README.md - Frontend docs`n" -ForegroundColor Gray

Write-Host "🚀 Happy coding!" -ForegroundColor Green
