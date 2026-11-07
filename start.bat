@echo off
title FinSightAI
cls
echo ====================================
echo    FinSightAI - Launch Panel
echo ====================================
echo.

echo [1/3] Installing Python dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt > nul 2>&1
echo Done.

echo [2/3] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install > nul 2>&1
echo Done.

echo [3/3] Starting services...
echo.

start "FinSightAI Backend" cmd /c "cd /d "%~dp0backend" && python run.py"
timeout /t 2 > nul
start "FinSightAI Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Backend running at: http://localhost:5000
echo Frontend running at: http://localhost:3000
echo.
pause
