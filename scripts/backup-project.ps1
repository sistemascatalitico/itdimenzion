# ITDimenzion Project Backup Script (PowerShell)
# Creates complete backup of project files in ZIP format with timestamp

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ITDimenzion Project Backup Tool" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get timestamp in YYYY-MM-DD-HH-MM-SS format
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"

# Define paths
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupBaseDir = Join-Path $projectRoot "Backups"
$backupDir = Join-Path $backupBaseDir "Project"
$tempDir = Join-Path $backupDir "temp_backup_$timestamp"
$backupName = "ITDimenzion_Project_$timestamp.zip"
$backupPath = Join-Path $backupDir $backupName

# Create directory structure
Write-Host "Verificando estructura de directorios..." -ForegroundColor Yellow
if (-not (Test-Path $backupBaseDir)) {
    Write-Host "Creando directorio base: $backupBaseDir" -ForegroundColor Green
    New-Item -ItemType Directory -Path $backupBaseDir -Force | Out-Null
}
if (-not (Test-Path $backupDir)) {
    Write-Host "Creando directorio de proyecto: $backupDir" -ForegroundColor Green
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

Write-Host "Ubicacion del backup: $backupPath" -ForegroundColor White
Write-Host ""

# Create temporary directory
Write-Host "Creando directorio temporal para la compresion..." -ForegroundColor Yellow
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy project files
Write-Host "[1/4] Copiando el codigo fuente del proyecto..." -ForegroundColor Cyan
$projectTempDir = Join-Path $tempDir "project"
New-Item -ItemType Directory -Path $projectTempDir -Force | Out-Null

# Define exclusions
$excludeDirs = @("node_modules", ".git", "dist", "build", ".next", ".nuxt", "target", "bin", "obj", "Backups", ".vscode", ".idea")
$excludeFiles = @("*.log", "*.tmp", ".env*", ".DS_Store", "Thumbs.db")

# Copy files using PowerShell (safer than robocopy for ZIP creation)
$excludePattern = $excludeDirs -join '|'
$excludeFilePattern = ($excludeFiles | ForEach-Object { $_.Replace('*', '.*').Replace('.', '\.') }) -join '|'

Get-ChildItem $projectRoot -Recurse | Where-Object {
    $relativePath = $_.FullName.Substring($projectRoot.Length + 1)
    $pathParts = $relativePath.Split('\')
    
    # Exclude directories
    $excludeDir = $false
    foreach ($dir in $excludeDirs) {
        if ($pathParts -contains $dir) {
            $excludeDir = $true
            break
        }
    }
    
    # Exclude problematic files and patterns
    $excludeFile = $_.Name -match $excludeFilePattern -or 
                   $_.Name -in @('nul', 'NUL', 'CON', 'con', 'PRN', 'prn', 'AUX', 'aux') -or
                   $_.Name -match '^(COM|LPT)[1-9]$'
    
    -not $excludeDir -and -not $excludeFile
} | ForEach-Object {
    $relativePath = $_.FullName.Substring($projectRoot.Length + 1)
    $destPath = Join-Path $projectTempDir $relativePath
    $destDir = Split-Path $destPath -Parent
    
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    if ($_.PSIsContainer -eq $false) {
        Copy-Item $_.FullName $destPath -Force
    }
}

# Copy important config files
Write-Host "[2/4] Copiando archivos de configuracion..." -ForegroundColor Cyan
$configFiles = @("package.json", "pnpm-lock.yaml", ".gitignore", "README.md", "CLAUDE.md")
foreach ($file in $configFiles) {
    $sourcePath = Join-Path $projectRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $projectTempDir -Force
    }
}

# Create backup info file
Write-Host "[3/4] Creando archivo de informacion del backup..." -ForegroundColor Cyan
$infoContent = @"
ITDimenzion Project Backup Information
======================================

Backup Date: $(Get-Date -Format "yyyy-MM-dd")
Backup Time: $(Get-Date -Format "HH:mm:ss")
Backup Location: $backupPath

Included in this backup:
- Complete project source code
- Frontend React application  
- Backend Node.js application
- Database schema and scripts
- Configuration files
- Documentation files

Excluded from backup:
- node_modules directories
- .git repository data
- Build artifacts (dist, build)
- Environment files (.env)
- Log files and temporary files

To restore:
1. Extract the ZIP file content to desired location
2. Run 'pnpm install' in the root directory
3. Configure environment variables
4. Restore database using database backup
5. Run 'pnpm run dev' to launch development servers
"@

$infoFile = Join-Path $tempDir "BACKUP_INFO.txt"
$infoContent | Out-File -FilePath $infoFile -Encoding UTF8

# Create ZIP file
Write-Host "[4/4] Comprimiendo archivos en ZIP..." -ForegroundColor Cyan
try {
    Compress-Archive -Path "$tempDir\*" -DestinationPath $backupPath -CompressionLevel Optimal -Force
    Write-Host "ZIP creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Fallo al crear archivo ZIP: $_" -ForegroundColor Red
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    exit 1
}

# Clean up temp directory
Write-Host "Limpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item $tempDir -Recurse -Force

# Verify ZIP was created
if (-not (Test-Path $backupPath)) {
    Write-Host ""
    Write-Host "ERROR: Fallo al crear el archivo ZIP." -ForegroundColor Red
    exit 1
}

# Get backup size
$backupSize = (Get-Item $backupPath).Length

# Success message
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   BACKUP COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Detalles del Backup:" -ForegroundColor White
Write-Host "- Ubicacion: $backupPath" -ForegroundColor White
Write-Host "- Tamano: $([math]::Round($backupSize/1MB, 2)) MB" -ForegroundColor White  
Write-Host "- Archivos incluidos: Codigo, configuraciones, documentacion" -ForegroundColor White
Write-Host ""
Write-Host "Para restaurar este backup:" -ForegroundColor Yellow
Write-Host "1. Navega a: $backupDir" -ForegroundColor Yellow
Write-Host "2. Descomprime el archivo .zip" -ForegroundColor Yellow
Write-Host "3. Sigue las instrucciones del archivo BACKUP_INFO.txt" -ForegroundColor Yellow
Write-Host ""
Write-Host "Nota: El backup de la base de datos debe crearse por separado." -ForegroundColor Magenta
Write-Host ""

# Open backup directory
Start-Process $backupDir

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")