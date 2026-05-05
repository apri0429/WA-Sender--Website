@echo off
cd /d "%~dp0"
echo Starting WA Sender with PM2...
pm2 delete wa-sender-backend 2>nul
timeout /t 2 /nobreak >nul
pm2 start ecosystem.config.js
pm2 save
echo Done! WA Sender is running.
pm2 list
pause
