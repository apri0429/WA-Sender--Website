# install-startup.ps1
# Jalankan SEKALI sebagai Administrator untuk daftarkan PM2 ke Windows startup
# Cara: klik kanan file ini > "Run with PowerShell"

$taskName = "WA-Sender PM2 Startup"
$vbsPath  = "C:\WA-Sender--Website\start-pm2-silent.vbs"
$action   = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`""
$trigger  = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

# Hapus task lama kalau ada
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Daftar task baru
Register-ScheduledTask `
    -TaskName $taskName `
    -Action   $action   `
    -Trigger  $trigger  `
    -Settings $settings `
    -RunLevel Highest   `
    -Force

Write-Host ""
Write-Host "BERHASIL! Task Scheduler sudah dibuat." -ForegroundColor Green
Write-Host "Nama task : $taskName"                  -ForegroundColor Cyan
Write-Host "Script    : $vbsPath"                   -ForegroundColor Cyan
Write-Host ""
Write-Host "PM2 (backend + frontend) akan otomatis start setiap login Windows." -ForegroundColor Yellow
