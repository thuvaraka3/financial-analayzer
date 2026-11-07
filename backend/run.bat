@echo off
cd /d "%~dp0"
echo Installing Python dependencies...
pip install -r requirements.txt
echo Starting FinSightAI Backend...
python run.py
pause
