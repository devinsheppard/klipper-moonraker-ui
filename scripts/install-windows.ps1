[CmdletBinding()]
param(
  [string]$Target = "C:\forgeui",
  [int]$NodeMajor = 20,
  [switch]$SkipSystemDeps,
  [switch]$SkipDeps,
  [switch]$SkipBuild,
  [switch]$NoBackup,
  [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Usage {
  @"
Forge UI Windows CLI installer

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1 [options]

Options:
  -Target <path>         Install directory (default: C:\forgeui)
  -NodeMajor <version>   Node major version required (default: 20)
  -SkipSystemDeps        Skip system dependency bootstrap (node/npm)
  -SkipDeps              Skip npm dependency install
  -SkipBuild             Skip npm build step (requires existing dist\)
  -NoBackup              Replace target without creating a backup copy
  -Help                  Show this help message

Examples:
  powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1 -Target "C:\forgeui"
  powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1 -Target "C:\inetpub\wwwroot\forgeui"
"@
}

if ($Help) {
  Show-Usage
  exit 0
}

function Write-Log([string]$Message) {
  Write-Host "[forgeui-install] $Message"
}

function Fail([string]$Message) {
  throw "[forgeui-install] ERROR: $Message"
}

function Test-Command([string]$Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-NodePath {
  $candidateDirs = @(
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
  ) | Where-Object { $_ -and (Test-Path $_) }

  foreach ($dir in $candidateDirs) {
    if ($env:Path -notlike "*$dir*") {
      $env:Path = "$dir;$env:Path"
    }
  }
}

function Get-NodeMajorVersion {
  if (-not (Test-Command "node")) {
    return $null
  }

  try {
    $raw = (& node -v).Trim()
    if (-not $raw) { return $null }
    if ($raw.StartsWith("v")) { $raw = $raw.Substring(1) }
    $majorToken = $raw.Split(".")[0]
    $major = 0
    if ([int]::TryParse($majorToken, [ref]$major)) {
      return $major
    }
    return $null
  } catch {
    return $null
  }
}

function Node-And-NpmReady {
  if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
    return $false
  }

  $major = Get-NodeMajorVersion
  if ($null -eq $major) {
    return $false
  }

  return $major -ge $NodeMajor
}

function Invoke-External {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $false)][string[]]$Arguments = @()
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    Fail "Command failed: $FilePath $($Arguments -join ' ') (exit $LASTEXITCODE)"
  }
}

function Ensure-SystemDependencies {
  Refresh-NodePath

  if (Node-And-NpmReady) {
    $nodeVer = (& node -v).Trim()
    $npmVer = (& npm -v).Trim()
    Write-Log "System dependencies already present (node $nodeVer, npm $npmVer)."
    return
  }

  if ($SkipSystemDeps) {
    Fail "System dependencies are missing and -SkipSystemDeps was set."
  }

  if (Test-Command "winget") {
    Write-Log "Installing Node.js LTS via winget..."
    Invoke-External -FilePath "winget" -Arguments @(
      "install",
      "--id", "OpenJS.NodeJS.LTS",
      "-e",
      "--accept-package-agreements",
      "--accept-source-agreements",
      "--silent"
    )
  } elseif (Test-Command "choco") {
    Write-Log "Installing Node.js LTS via chocolatey..."
    Invoke-External -FilePath "choco" -Arguments @("install", "nodejs-lts", "-y", "--no-progress")
  } else {
    Fail "Could not bootstrap dependencies: install winget or chocolatey, or manually install Node.js >= $NodeMajor and npm."
  }

  Refresh-NodePath

  if (-not (Node-And-NpmReady)) {
    Fail "Dependency installation finished but node/npm are still unavailable in PATH. Open a new shell and try again."
  }

  $installedMajor = Get-NodeMajorVersion
  if ($null -eq $installedMajor -or $installedMajor -lt $NodeMajor) {
    $nodeVer = (& node -v).Trim()
    Fail "Detected node $nodeVer, but node >= $NodeMajor is required."
  }

  $finalNodeVer = (& node -v).Trim()
  $finalNpmVer = (& npm -v).Trim()
  Write-Log "System dependencies installed (node $finalNodeVer, npm $finalNpmVer)."
}

$ScriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot = Split-Path -Parent $ScriptDir
$PackageJson = Join-Path $RepoRoot "package.json"

if (-not (Test-Path $PackageJson)) {
  Fail "package.json not found in $RepoRoot"
}

Ensure-SystemDependencies

Set-Location $RepoRoot

if (-not $SkipDeps) {
  if (Test-Path (Join-Path $RepoRoot "package-lock.json")) {
    Write-Log "Installing dependencies with npm ci..."
    Invoke-External -FilePath "npm" -Arguments @("ci")
  } else {
    Write-Log "Installing dependencies with npm install..."
    Invoke-External -FilePath "npm" -Arguments @("install")
  }
} else {
  Write-Log "Skipping dependency install (-SkipDeps)."
}

if (-not $SkipBuild) {
  Write-Log "Building production dist..."
  Invoke-External -FilePath "npm" -Arguments @("run", "build")
} else {
  Write-Log "Skipping build (-SkipBuild)."
}

$DistDir = Join-Path $RepoRoot "dist"
$DistIndex = Join-Path $DistDir "index.html"
if (-not (Test-Path $DistDir)) {
  Fail "dist\ directory not found. Re-run without -SkipBuild or build first."
}
if (-not (Test-Path $DistIndex)) {
  Fail "dist\index.html not found. Build appears incomplete."
}

$resolvedTarget = [System.IO.Path]::GetFullPath($Target)
$targetParent = Split-Path -Parent $resolvedTarget
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$resolvedTarget.bak.$timestamp"

Write-Log "Preparing install target: $resolvedTarget"

if (-not (Test-Path $targetParent)) {
  New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
}

if (Test-Path $resolvedTarget) {
  if (-not $NoBackup) {
    Write-Log "Backing up existing install to: $backupPath"
    Move-Item -Path $resolvedTarget -Destination $backupPath -Force
  } else {
    Write-Log "Removing existing target (-NoBackup)."
    Remove-Item -Path $resolvedTarget -Recurse -Force
  }
}

New-Item -ItemType Directory -Path $resolvedTarget -Force | Out-Null
Write-Log "Copying dist\ to target..."
Get-ChildItem -Path $DistDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $resolvedTarget -Recurse -Force
}

Write-Log "Install complete."
Write-Log "Installed path: $resolvedTarget"
if (-not $NoBackup) {
  Write-Log "Backup path: $backupPath (only created when a prior install existed)"
}
Write-Log "Next step: point your web server or Moonraker UI path to $resolvedTarget"
