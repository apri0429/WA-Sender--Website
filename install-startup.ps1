# install-startup.ps1
# Jalankan script ini SEKALI sebagai Administrator untuk daftarkan PM2 ke Windows startup
# Cara: klik kanan > "Run with PowerShell" ATAU lewat terminal admin

$taskName = "WA-Sender PM2 Startup"
$vbsPath  = 'c:\Users\IT\Documents\WEBSITE\WA-Sender  Website\start-pm2-silent.vbs'
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
Write-Host "✅ Task Scheduler berhasil dibuat!" -ForegroundColor Green
Write-Host "   Nama task : $taskName"           -ForegroundColor Cyan
Write-Host "   Script    : $vbsPath"            -ForegroundColor Cyan
Write-Host ""
Write-Host "PM2 akan otomatis start setiap kali Windows login." -ForegroundColor Yellow
Write-Host ""
Write-Host "Untuk cek: buka Task Scheduler > Task Scheduler Library" -ForegroundColor Gray
