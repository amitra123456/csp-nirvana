# Windows Task Scheduler Setup for CSP-Nirvana Daily 3:35 PM Run
$taskName = "CSP_Nirvana_Daily_335PM_Update"
$pythonExe = (Get-Command python).Source
$scriptPath = "$PSScriptRoot\daily_335pm_update.py"

Write-Host "Registering Windows Scheduled Task: $taskName" -ForegroundColor Cyan
Write-Host "Python Executable: $pythonExe"
Write-Host "Target Script: $scriptPath"

# Trigger Monday through Friday at 3:35 PM (15:35)
$action = New-ScheduledTaskAction -Execute $pythonExe -Argument "`"$scriptPath`"" -WorkingDirectory "$PSScriptRoot\.."
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday -At 3:35PM
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Daily 3:35 PM Alpaca Data Download and CSP-Nirvana Simulation" -Force

Write-Host "Task successfully registered to run Monday-Friday at 3:35 PM EST!" -ForegroundColor Green
