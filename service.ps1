# WA-Sender Service Manager
# Jalankan sebagai Administrator!

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("install","uninstall","start","stop","restart","status","build-frontend")]
    [string]$Action
)

$BackendDir = "$PSScriptRoot\backend"
$FrontendDir = "$PSScriptRoot\frontend"
$ServiceName = "WA-Sender Backend"

switch ($Action) {
    "install" {
        Write-Host "Installing WA-Sender sebagai Windows Service..." -ForegroundColor Cyan
        Set-Location $BackendDir
        node install-service.js
    }

    "uninstall" {
        Write-Host "Menghapus WA-Sender Windows Service..." -ForegroundColor Yellow
        Set-Location $BackendDir
        node uninstall-service.js
    }

    "start" {
        Write-Host "Memulai service..." -ForegroundColor Green
        Start-Service -Name $ServiceName
        Write-Host "Service berjalan." -ForegroundColor Green
    }

    "stop" {
        Write-Host "Menghentikan service..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName
        Write-Host "Service dihentikan." -ForegroundColor Yellow
    }

    "restart" {
        Write-Host "Merestart service..." -ForegroundColor Cyan
        Restart-Service -Name $ServiceName
        Write-Host "Service direstart." -ForegroundColor Green
    }

    "status" {
        $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($svc) {
            Write-Host "Status: $($svc.Status)" -ForegroundColor $(if ($svc.Status -eq 'Running') {'Green'} else {'Red'})
        } else {
            Write-Host "Service belum diinstall." -ForegroundColor Red
        }
    }

    "build-frontend" {
        Write-Host "Build frontend React..." -ForegroundColor Cyan
        Set-Location $FrontendDir
        npm run build
        Write-Host "Build selesai! File ada di frontend\dist" -ForegroundColor Green
    }
}
