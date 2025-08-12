# ITDimenzion Full Backup Script (PowerShell)
# Creates complete backup of both project files and database

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ITDimenzion Full System Backup Tool" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script creará un backup completo del sistema:" -ForegroundColor White
Write-Host "- Código fuente del proyecto" -ForegroundColor Yellow
Write-Host "- Base de datos MySQL" -ForegroundColor Yellow
Write-Host ""

# Get timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"

# Define paths
$scriptDir = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptDir
$backupBaseDir = Join-Path $projectRoot "Backups"
$logFile = Join-Path $backupBaseDir "backup-full-$timestamp.log"

# Create backup base directory
if (-not (Test-Path $backupBaseDir)) {
    New-Item -ItemType Directory -Path $backupBaseDir -Force | Out-Null
}

Write-Host "Iniciando backup completo..." -ForegroundColor Cyan
Write-Host "Timestamp: $timestamp" -ForegroundColor White
Write-Host "Log file: $logFile" -ForegroundColor White
Write-Host ""

# Initialize log file
$logContent = @"
ITDimenzion Full Backup Log
==========================
Start Time: $(Get-Date)
Timestamp: $timestamp

"@
$logContent | Out-File -FilePath $logFile -Encoding UTF8

# Step 1: Project backup
Write-Host "==========================================" -ForegroundColor Green
Write-Host "[1/2] BACKUP DEL PROYECTO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Add-Content -Path $logFile -Value "Starting project backup..."

try {
    $projectBackupScript = Join-Path $scriptDir "backup-project.ps1"
    if (-not (Test-Path $projectBackupScript)) {
        throw "Project backup script not found: $projectBackupScript"
    }
    
    $projectResult = & powershell -ExecutionPolicy Bypass -File $projectBackupScript
    Add-Content -Path $logFile -Value "Project backup completed successfully."
    
    Write-Host ""
    Write-Host "✅ Backup del proyecto completado exitosamente." -ForegroundColor Green
    Write-Host ""
} catch {
    $errorMsg = "ERROR: Project backup failed! $_"
    Add-Content -Path $logFile -Value $errorMsg
    Write-Host ""
    Write-Host "ERROR: El backup del proyecto falló." -ForegroundColor Red
    Write-Host "Consulte el log para más detalles: $logFile" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Step 2: Database backup
Write-Host "==========================================" -ForegroundColor Green
Write-Host "[2/2] BACKUP DE LA BASE DE DATOS" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Add-Content -Path $logFile -Value "Starting database backup..."

try {
    $dbBackupScript = Join-Path $scriptDir "backup-database.ps1"
    if (-not (Test-Path $dbBackupScript)) {
        throw "Database backup script not found: $dbBackupScript"
    }
    
    $dbResult = & powershell -ExecutionPolicy Bypass -File $dbBackupScript
    Add-Content -Path $logFile -Value "Database backup completed successfully."
    
    Write-Host ""
    Write-Host "✅ Backup de la base de datos completado exitosamente." -ForegroundColor Green
    Write-Host ""
} catch {
    $errorMsg = "ERROR: Database backup failed! $_"
    Add-Content -Path $logFile -Value $errorMsg
    Write-Host ""
    Write-Host "ERROR: El backup de la base de datos falló." -ForegroundColor Red  
    Write-Host "Consulte el log para más detalles: $logFile" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Finalization
$finalLog = @"

End Time: $(Get-Date)
Full backup completed successfully.

Created files:
- Project: ITDimenzion_Project_$timestamp.zip
- Database: ITDimenzion_DB_$timestamp.zip
"@
Add-Content -Path $logFile -Value $finalLog

Write-Host "==========================================" -ForegroundColor Green
Write-Host "  BACKUP COMPLETO FINALIZADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Backup completo del sistema finalizado exitosamente." -ForegroundColor Green
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor White
Write-Host "- 📁 Proyecto: $backupBaseDir\Project\ITDimenzion_Project_$timestamp.zip" -ForegroundColor Yellow
Write-Host "- 🗃️ Base de datos: $backupBaseDir\DB\ITDimenzion_DB_$timestamp.zip" -ForegroundColor Yellow
Write-Host "- 📄 Log completo: $logFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ubicación de backups: $backupBaseDir" -ForegroundColor White
Write-Host ""

# Show summary of created files
Write-Host "Resumen de archivos creados:" -ForegroundColor Cyan
$projectZip = Join-Path $backupBaseDir "Project\ITDimenzion_Project_$timestamp.zip"
$dbZip = Join-Path $backupBaseDir "DB\ITDimenzion_DB_$timestamp.zip"

if (Test-Path $projectZip) {
    $projectSize = (Get-Item $projectZip).Length
    Write-Host "- Proyecto: ITDimenzion_Project_$timestamp.zip ($([math]::Round($projectSize/1MB, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "- Proyecto: ❌ No encontrado" -ForegroundColor Red
}

if (Test-Path $dbZip) {
    $dbSize = (Get-Item $dbZip).Length  
    Write-Host "- Base de datos: ITDimenzion_DB_$timestamp.zip ($([math]::Round($dbSize/1MB, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "- Base de datos: ❌ No encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "Para restaurar el sistema:" -ForegroundColor Yellow
Write-Host "1. Extraer ITDimenzion_Project_$timestamp.zip en la ubicación deseada" -ForegroundColor White
Write-Host "2. Ejecutar 'pnpm install' para instalar dependencias" -ForegroundColor White
Write-Host "3. Extraer ITDimenzion_DB_$timestamp.zip" -ForegroundColor White
Write-Host "4. Restaurar base de datos usando el archivo SQL incluido" -ForegroundColor White
Write-Host "5. Configurar variables de entorno" -ForegroundColor White
Write-Host "6. Iniciar con 'pnpm run dev'" -ForegroundColor White
Write-Host ""

# Open backup directory
Start-Process $backupBaseDir

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")