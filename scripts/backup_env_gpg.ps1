Param(
    [string]$Recipient = $env:GPG_RECIPIENT,
    [switch]$Symmetric
)
# PowerShell: creates GPG-encrypted backup of .env -> scripts\backups\.env.YYYYMMDD_HHMMSS.gpg
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'
$backupDir = Join-Path $root 'scripts\backups'
if (-not (Test-Path $envFile)) { Write-Error ".env not found at $envFile"; exit 1 }
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$out = Join-Path $backupDir ".env.$ts.gpg"
if ($Symmetric) {
    & gpg --yes --output $out --symmetric $envFile
} elseif ($Recipient) {
    & gpg --yes --output $out --encrypt --recipient $Recipient $envFile
} else {
    # default to symmetric
    & gpg --yes --output $out --symmetric $envFile
}
# restrict permissions if possible
try { icacls $out /inheritance:r /grant:r "$env:USERNAME:F" | Out-Null } catch { }
Write-Host "Backed up (encrypted) $envFile -> $out"
