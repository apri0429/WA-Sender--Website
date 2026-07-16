@echo off
setlocal

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Script ini harus dijalankan sebagai Administrator.
    echo Klik kanan file ini, pilih "Run as administrator".
    pause
    exit /b 1
)

echo Menutup semua proses chrome.exe yang macet...
taskkill /F /IM chrome.exe /T

echo Menghapus file lock sesi WhatsApp...
del /f /q "%~dp0sessions\session-wa-sender-akun-wa-3\lockfile" 2>nul
del /f /q "%~dp0sessions\session-wa-sender-akun-wa-3\SingletonLock" 2>nul

echo Merestart service WA-Sender Backend...
net stop "wasenderbackend.exe"
timeout /t 3 /nobreak >nul
net start "wasenderbackend.exe"

echo.
echo Selesai. Tunggu 15-20 detik lalu buka aplikasi dan cek halaman koneksi WhatsApp (mungkin perlu scan ulang QR).
pause
