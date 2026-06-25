# PowerShell script to backup .env to scripts\backups\.env.YYYYMMDD_HHMMSS
Param()
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'
$backupDir = Join-Path $root 'scripts\backups'
if (-not (Test-Path $envFile)) {
    Write-Host ".env not found at $envFile"
    exit 1
}
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $backupDir ".env.$ts"
Copy-Item -Path $envFile -Destination $backup -Force
# Restrict permissions: owners only
try {
    $acl = Get-Acl $backup
    $acl.SetAccessRuleProtection($true, $false)
    $acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) }
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser,'FullControl','Allow')
    $acl.AddAccessRule($rule)
    Set-Acl -Path $backup -AclObject $acl
} catch {
    # If ACL manipulation fails, ignore but proceed
}
Write-Host "Backed up $envFile -> $backup"
