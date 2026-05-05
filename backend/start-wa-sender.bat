@echo off
cd /d "%~dp0"
echo Starting WA Sender with PM2...
pm2 start ecosystem.config.js
pm2 save
echo Done! WA Sender is running.
pause
