@echo off
echo ================================
echo  VIT HACKATHON - POTATO CROP AI
echo ================================
echo.
echo Starting AI-Powered Potato Crop Management System...
echo.

echo [1/3] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo [2/3] Installing dependencies...
cd "C:\Users\Sanjay\Desktop\VIT HACKATHON\potato-crop-ai\web_dashboard"
call npm install

echo [3/3] Starting React dashboard...
echo.
echo Dashboard will open at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
call npm start

pause
