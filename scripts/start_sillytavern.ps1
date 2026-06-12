param(
  [string]$ST_DIR = "$PSScriptRoot\..\workspace\SillyTavern"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $ST_DIR)) { throw "SillyTavern not found. Run scripts\setup_windows.ps1 first." }
Set-Location $ST_DIR
if (Test-Path "$ST_DIR\Start.bat") {
  & "$ST_DIR\Start.bat"
} else {
  npm run start
}
