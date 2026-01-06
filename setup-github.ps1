# Script thiết lập kết nối với GitHub
# Chạy script này sau khi đã tạo repository trên GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$true)]
    [string]$RepositoryName,
    
    [Parameter(Mandatory=$false)]
    [string]$BranchName = "main"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is configured
Write-Host "1. Checking Git configuration..." -ForegroundColor Yellow
$gitName = git config --global user.name
$gitEmail = git config --global user.email

if ([string]::IsNullOrEmpty($gitName)) {
    Write-Host "   [WARNING] Git user.name not configured" -ForegroundColor Yellow
    $name = Read-Host "   Enter your name for Git commits"
    git config --global user.name $name
    Write-Host "   [OK] Git user.name set to: $name" -ForegroundColor Green
} else {
    Write-Host "   [OK] Git user.name: $gitName" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($gitEmail)) {
    Write-Host "   [WARNING] Git user.email not configured" -ForegroundColor Yellow
    $email = Read-Host "   Enter your email for Git commits"
    git config --global user.email $email
    Write-Host "   [OK] Git user.email set to: $email" -ForegroundColor Green
} else {
    Write-Host "   [OK] Git user.email: $email" -ForegroundColor Green
}

Write-Host ""

# Check if repository is initialized
Write-Host "2. Checking Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "   [OK] Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "   [INFO] Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "   [OK] Git repository initialized" -ForegroundColor Green
}

Write-Host ""

# Check remote
Write-Host "3. Checking remote repository..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null

if ($remote) {
    Write-Host "   [INFO] Remote already exists: $remote" -ForegroundColor Yellow
    $change = Read-Host "   Do you want to change it? (y/n)"
    if ($change -eq "y" -or $change -eq "Y") {
        git remote remove origin
        $remote = $null
    }
}

if (-not $remote) {
    Write-Host "   [INFO] Adding remote repository..." -ForegroundColor Yellow
    
    # Ask for protocol
    Write-Host ""
    Write-Host "   Choose connection method:" -ForegroundColor Cyan
    Write-Host "   1. HTTPS (easier, requires token)" -ForegroundColor White
    Write-Host "   2. SSH (more secure, requires SSH key)" -ForegroundColor White
    $method = Read-Host "   Enter choice (1 or 2)"
    
    if ($method -eq "1") {
        $remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"
    } else {
        $remoteUrl = "git@github.com:$GitHubUsername/$RepositoryName.git"
    }
    
    git remote add origin $remoteUrl
    Write-Host "   [OK] Remote added: $remoteUrl" -ForegroundColor Green
}

Write-Host ""

# Show current status
Write-Host "4. Current repository status:" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add files to staging:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor White
Write-Host ""
Write-Host "2. Commit changes:" -ForegroundColor Yellow
Write-Host "   git commit -m 'Initial commit'" -ForegroundColor White
Write-Host ""
Write-Host "3. Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git push -u origin $BranchName" -ForegroundColor White
Write-Host ""
Write-Host "Or use Cursor's Source Control panel (Ctrl+Shift+G)" -ForegroundColor Cyan
Write-Host ""

