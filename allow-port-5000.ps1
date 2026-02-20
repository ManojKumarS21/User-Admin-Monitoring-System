# PowerShell script to allow port 5000 through Windows Firewall
# Run as Administrator

Write-Host "Adding Windows Firewall rule for port 5000..." -ForegroundColor Cyan

# Remove existing rule if it exists
Remove-NetFirewallRule -DisplayName "Dashboard Backend Port 5000" -ErrorAction SilentlyContinue

# Add new inbound rule for port 5000
New-NetFirewallRule -DisplayName "Dashboard Backend Port 5000" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5000 `
    -Action Allow `
    -Profile Any `
    -Enabled True

Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
Write-Host "Port 5000 is now allowed through Windows Firewall." -ForegroundColor Green
Write-Host ""
Write-Host "Your backend should now be accessible at: http://192.168.0.201:5000" -ForegroundColor Yellow
