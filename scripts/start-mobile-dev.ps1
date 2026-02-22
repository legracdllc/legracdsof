$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$runtimeDir = Join-Path $root '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

$viteLog = Join-Path $runtimeDir 'vite.log'
$viteErrLog = Join-Path $runtimeDir 'vite.err.log'
$tunnelLog = Join-Path $runtimeDir 'tunnel.log'
$tunnelErrLog = Join-Path $runtimeDir 'tunnel.err.log'
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

function Get-LanIPv4 {
  $all = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object InterfaceMetric
  if ($all.Count -gt 0) { return $all[0].IPAddress }
  return $null
}

function Wait-ForPort([int]$port, [int]$timeoutSec) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    $hit = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($hit) { return $true }
    Start-Sleep -Milliseconds 300
  }
  return $false
}

function Find-TunnelUrl([string]$logPath, [int]$timeoutSec) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  $rx = 'https://[a-z0-9-]+\.trycloudflare\.com'
  while ((Get-Date) -lt $deadline) {
    if (Test-Path $logPath) {
      $text = Get-Content -Path $logPath -Raw -ErrorAction SilentlyContinue
      if ($text -match $rx) { return $Matches[0] }
    }
    Start-Sleep -Milliseconds 400
  }
  return $null
}

Stop-FromPidFile $vitePidFile
Stop-FromPidFile $tunnelPidFile
Stop-MatchingCloudflaredTunnel

if (Test-Path $viteLog) { Remove-Item $viteLog -Force }
if (Test-Path $viteErrLog) { Remove-Item $viteErrLog -Force }
if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force }
if (Test-Path $tunnelErrLog) { Remove-Item $tunnelErrLog -Force }

$viteProc = Start-Process `
  -FilePath 'cmd.exe' `
  -ArgumentList '/c', 'npm.cmd run dev' `
  -WorkingDirectory $root `
  -RedirectStandardOutput $viteLog `
  -RedirectStandardError $viteErrLog `
  -WindowStyle Hidden `
  -PassThru
Set-Content -Path $vitePidFile -Value $viteProc.Id

if (-not (Wait-ForPort -port 5173 -timeoutSec 30)) {
  throw 'Vite did not start on port 5173 within 30 seconds.'
}

$cloudflared = Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'
if (-not (Test-Path $cloudflared)) {
  $found = (Get-Command cloudflared -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
  if ($found) { $cloudflared = $found }
}
if (-not (Test-Path $cloudflared)) {
  throw 'cloudflared.exe not found. Install Cloudflare Tunnel first.'
}

$cfArgs = @(
  'tunnel',
  '--url', 'http://127.0.0.1:5173',
  '--loglevel', 'info'
)
$tunnelProc = Start-Process `
  -FilePath $cloudflared `
  -ArgumentList $cfArgs `
  -WorkingDirectory $root `
  -RedirectStandardOutput $tunnelLog `
  -RedirectStandardError $tunnelErrLog `
  -WindowStyle Hidden `
  -PassThru
Set-Content -Path $tunnelPidFile -Value $tunnelProc.Id

$lanIp = Get-LanIPv4
$tunnelUrl = Find-TunnelUrl -logPath $tunnelLog -timeoutSec 25

Write-Output ''
Write-Output 'Mobile dev is running.'
Write-Output "Admin (local):    http://127.0.0.1:5173/login"
Write-Output "Employee (local): http://127.0.0.1:5173/employee/login"
if ($lanIp) {
  Write-Output "Admin (LAN):      http://$lanIp`:5173/login"
  Write-Output "Employee (LAN):   http://$lanIp`:5173/employee/login"
}
if ($tunnelUrl) {
  Write-Output "Admin (tunnel):   $tunnelUrl/login"
  Write-Output "Employee (tunnel): $tunnelUrl/employee/login"
} else {
  Write-Output 'Tunnel URL not detected yet. Check .runtime/tunnel.log in a few seconds.'
}
Write-Output ''
Write-Output "Stop everything with: npm run dev:mobile:stop"
