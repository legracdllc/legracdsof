$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root '.runtime'
$vitePidFile = Join-Path $runtimeDir 'vite.pid'
$tunnelPidFile = Join-Path $runtimeDir 'tunnel.pid'

function Stop-FromPidFile([string]$pidFile) {
  if (-not (Test-Path $pidFile)) { return }
  $raw = (Get-Content -Path $pidFile -Raw).Trim()
  if (-not $raw) { Remove-Item $pidFile -Force -ErrorAction SilentlyContinue; return }
  $procId = 0
  if ([int]::TryParse($raw, [ref]$procId) -and $procId -gt 0) {
    try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

function Stop-MatchingCloudflaredTunnel {
  $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq 'cloudflared.exe' -and $_.CommandLine -match '--url http://127\.0\.0\.1:5173' }
  foreach ($p in $procs) {
    try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
  }
}

Stop-FromPidFile $vitePidFile
Stop-FromPidFile $tunnelPidFile
Stop-MatchingCloudflaredTunnel

Write-Output 'Stopped mobile dev processes (if they were running).'
