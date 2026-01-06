# Android SDK and Android Studio Configuration Checker
# Script checks Android SDK and Android Studio configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android SDK & Studio Configuration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Android SDK
Write-Host "1. Checking Android SDK..." -ForegroundColor Yellow
$sdkPath = $env:ANDROID_SDK_ROOT
if ([string]::IsNullOrEmpty($sdkPath)) {
    $sdkPath = $env:ANDROID_HOME
}
if ([string]::IsNullOrEmpty($sdkPath)) {
    $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
}

if (Test-Path $sdkPath) {
    Write-Host "   [OK] Android SDK found at: $sdkPath" -ForegroundColor Green
    
    # Check platform-tools
    $platformTools = Join-Path $sdkPath "platform-tools"
    if (Test-Path $platformTools) {
        Write-Host "   [OK] Platform tools found" -ForegroundColor Green
        $adb = Join-Path $platformTools "adb.exe"
        if (Test-Path $adb) {
            Write-Host "   [OK] ADB found" -ForegroundColor Green
        }
    } else {
        Write-Host "   [ERROR] Platform tools not found" -ForegroundColor Red
    }
    
    # Check emulator
    $emulator = Join-Path $sdkPath "emulator\emulator.exe"
    if (Test-Path $emulator) {
        Write-Host "   [OK] Emulator found" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Available AVDs:" -ForegroundColor Yellow
        & $emulator -list-avds | ForEach-Object {
            Write-Host "     - $_" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   [ERROR] Emulator not found" -ForegroundColor Red
    }
    
    # Check system-images
    $systemImages = Join-Path $sdkPath "system-images"
    if (Test-Path $systemImages) {
        $images = Get-ChildItem $systemImages -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "android-\d+" } | Select-Object -First 5
        if ($images) {
            Write-Host "   [OK] System images found" -ForegroundColor Green
        } else {
            Write-Host "   [WARNING] System images folder exists but no images found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [WARNING] System images folder not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Android SDK not found" -ForegroundColor Red
    Write-Host "   Please install Android SDK or set ANDROID_SDK_ROOT" -ForegroundColor Yellow
}

Write-Host ""

# Check Environment Variables
Write-Host "2. Checking Environment Variables..." -ForegroundColor Yellow
if ($env:ANDROID_SDK_ROOT) {
    Write-Host "   [OK] ANDROID_SDK_ROOT = $env:ANDROID_SDK_ROOT" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] ANDROID_SDK_ROOT not set" -ForegroundColor Red
}

if ($env:ANDROID_HOME) {
    Write-Host "   [OK] ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "   [INFO] ANDROID_HOME not set (optional)" -ForegroundColor Yellow
}

Write-Host ""

# Check Android Studio
Write-Host "3. Checking Android Studio..." -ForegroundColor Yellow
$studioPaths = @(
    "C:\Program Files\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe",
    "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe",
    "$env:ProgramFiles\Android\Android Studio\bin\studio64.exe"
)

$studioFound = $false
foreach ($path in $studioPaths) {
    if (Test-Path $path) {
        Write-Host "   [OK] Android Studio found at: $path" -ForegroundColor Green
        $studioFound = $true
        break
    }
}

if (-not $studioFound) {
    Write-Host "   [WARNING] Android Studio not found in common locations" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
