param(
  [string]$ST_DIR = "$PSScriptRoot\..\workspace\SillyTavern",
  [string]$ST_BRANCH = "release",
  [string]$ST_REPO = "https://github.com/SillyTavern/SillyTavern.git"
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Resolve-Path "$PSScriptRoot\.."

Write-Host "[LoopTrain] Root: $ROOT_DIR"
Write-Host "[LoopTrain] SillyTavern dir: $ST_DIR"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git is required" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js latest LTS is required" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is required" }

if (-not (Test-Path "$ST_DIR\.git")) {
  New-Item -ItemType Directory -Force -Path (Split-Path $ST_DIR) | Out-Null
  git clone $ST_REPO -b $ST_BRANCH $ST_DIR
} else {
  git -C $ST_DIR fetch origin
  git -C $ST_DIR checkout $ST_BRANCH
  git -C $ST_DIR pull --ff-only
}

Set-Location $ST_DIR

if (-not (Test-Path "$ST_DIR\config.yaml")) {
  if (Test-Path "$ST_DIR\default\config.yaml") {
    Copy-Item "$ST_DIR\default\config.yaml" "$ST_DIR\config.yaml"
  } else {
    npm run init
  }
}

npm install

python "$ROOT_DIR\scripts\patch_config.py" "$ST_DIR\config.yaml" --listen false

Write-Host "[LoopTrain] Installing LoopTrain Extension..."
New-Item -ItemType Directory -Force -Path "$ST_DIR\public\scripts\extensions\third-party" | Out-Null
Remove-Item "$ST_DIR\public\scripts\extensions\third-party\LoopTrain" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$ROOT_DIR\looptrain\st-extension\LoopTrain" "$ST_DIR\public\scripts\extensions\third-party\LoopTrain" -Recurse -Force

Write-Host "[LoopTrain] Installing LoopTrain Server Plugin..."
New-Item -ItemType Directory -Force -Path "$ST_DIR\plugins" | Out-Null
Remove-Item "$ST_DIR\plugins\looptrain" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$ROOT_DIR\looptrain\st-server-plugin\looptrain" "$ST_DIR\plugins\looptrain" -Recurse -Force

Write-Host "[LoopTrain] Preparing import materials..."
Remove-Item "$ST_DIR\looptrain_imports" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$ST_DIR\looptrain_imports" | Out-Null
Copy-Item "$ROOT_DIR\runtime_imports\*" "$ST_DIR\looptrain_imports" -Recurse -Force

Write-Host ""
Write-Host "[LoopTrain] Done."
Write-Host "Next:"
Write-Host "  1) Start ST: powershell -ExecutionPolicy Bypass -File scripts\start_sillytavern.ps1"
Write-Host "  2) Import cards from: $ST_DIR\looptrain_imports\character_cards"
Write-Host "  3) Import world info/book from: $ST_DIR\looptrain_imports\world_info and world_books"
Write-Host "  4) Configure DeepSeek V4 Pro in ST"
Write-Host "  5) Open LoopTrain and switch to 回复：ST LLM"
