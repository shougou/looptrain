param(
  [string]$ST_DIR = "$PSScriptRoot\..\workspace\SillyTavern"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $ST_DIR)) { throw "ST_DIR missing: $ST_DIR" }
if (-not (Test-Path "$ST_DIR\config.yaml")) { throw "config.yaml missing" }
$config = Get-Content "$ST_DIR\config.yaml" -Raw
if ($config -notmatch "enableServerPlugins:\s*true") { throw "enableServerPlugins is not true" }
if (-not (Test-Path "$ST_DIR\public\scripts\extensions\third-party\LoopTrain\index.js")) { throw "LoopTrain extension missing" }
if (-not (Test-Path "$ST_DIR\plugins\looptrain\index.js")) { throw "LoopTrain server plugin missing" }
node --check "$ST_DIR\public\scripts\extensions\third-party\LoopTrain\index.js"
node --check "$ST_DIR\plugins\looptrain\engine.js"
Write-Host "OK: ST source runtime structure is ready."
