@echo off
setlocal

set "PROJECT_DIR=C:\WA-Sender--Website"

echo ========================================
echo  WA Sender - Starting PM2 Services
echo ========================================

cd /d "%PROJECT_DIR%"

:: Stop proses lama kalau ada
pm2 delete wa-backend 2>nul
pm2 delete wa-frontend 2>nul
timeout /t 2 /nobreak >nul

:: Start semua proses dari root ecosystem
pm2 start ecosystem.config.js

:: Simpan supaya bisa di-resurrect
pm2 save

echo.
echo ========================================
echo  Selesai! Backend + Frontend sudah running.
echo ========================================
pm2 list
