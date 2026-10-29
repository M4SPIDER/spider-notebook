# Build MSIX from electron-builder output
# Usage: .\scripts\build-msix.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopDir = Split-Path -Parent $scriptDir
$unpackedDir = Join-Path $desktopDir "dist\win-unpacked"
$msixDir = Join-Path $desktopDir "msix"
$imagesDir = Join-Path $msixDir "images"
$outputDir = Join-Path $desktopDir "dist"
$outputFile = Join-Path $outputDir "m4spider-notebook-win-x64.msix"

# Verify win-unpacked exists
if (-not (Test-Path $unpackedDir)) {
  Write-Error "dist\win-unpacked not found. Run 'npm run package:win' first."
  exit 1
}

# Find makeappx.exe
$makeappx = $null
$searchPaths = @(
  "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\makeappx.exe",
  "$env:ProgramFiles\Windows Kits\10\bin\*\x64\makeappx.exe"
)
foreach ($pattern in $searchPaths) {
  $found = Get-Item $pattern -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
  if ($found) { $makeappx = $found.FullName; break }
}

if (-not $makeappx) {
  Write-Error "makeappx.exe not found. Install Windows 10/11 SDK."
  exit 1
}

Write-Host "Using: $makeappx"

# Save AppxManifest.xml before cleaning (if it exists)
$manifestPath = Join-Path $msixDir "AppxManifest.xml"
$manifestBackup = $null
if (Test-Path $manifestPath) {
  $manifestBackup = Get-Content $manifestPath -Raw
}

# Clean msix directory
Write-Host "Preparing MSIX directory..."
Get-ChildItem $msixDir -Exclude "AppxManifest.xml","images","THIRD_PARTY_LICENSES.txt" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Restore AppxManifest.xml if we had a backup
if ($manifestBackup) {
  $manifestBackup | Set-Content $manifestPath -Encoding UTF8
}

# Copy all files from win-unpacked to msix/ (skip locked files like watcher.node)
Write-Host "Copying unpacked files..."
Get-ChildItem -Path "$unpackedDir\*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
  $relative = $_.FullName.Substring($unpackedDir.Length)
  $dest = Join-Path $msixDir $relative
  if ($_.PSIsContainer) {
    New-Item -ItemType Directory -Force -Path $dest -ErrorAction SilentlyContinue | Out-Null
  } else {
    $destDir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Force -Path $destDir -ErrorAction SilentlyContinue | Out-Null
    Copy-Item -Path $_.FullName -Destination $dest -Force -ErrorAction SilentlyContinue
  }
}

# Copy .env to msix root (optional - may not exist if API keys are hardcoded)
$envFile = Join-Path $desktopDir ".env"
if (Test-Path $envFile) {
  Copy-Item -Path $envFile -Destination $msixDir -Force
}

# Create images directory and copy icons for MSIX manifest
New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null
Copy-Item -Path (Join-Path $desktopDir "icons\prod\icon.png") -Destination (Join-Path $imagesDir "icon.png") -Force
Copy-Item -Path (Join-Path $desktopDir "icons\prod\icon.png") -Destination (Join-Path $imagesDir "splash.png") -Force

# Ensure output directory exists
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Remove old msix if exists
if (Test-Path $outputFile) { Remove-Item $outputFile -Force }

# Build MSIX
Write-Host "Building MSIX package..."
& $makeappx pack /d $msixDir /p $outputFile /o
if ($LASTEXITCODE -ne 0) { Write-Error "makeappx pack failed"; exit 1 }

Write-Host "Created: $outputFile"
Write-Host "Done!"
