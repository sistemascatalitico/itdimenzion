# ITDimenzion Database Backup Script (PowerShell)
# Creates complete backup of MySQL database

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ITDimenzion Database Backup Tool" -ForegroundColor Cyan  
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is available
try {
    $mysqlVersion = mysql --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL not found"
    }
    Write-Host "MySQL client encontrado: $($mysqlVersion.Split("`n")[0])" -ForegroundColor Green
} catch {
    Write-Host "ERROR: MySQL client no encontrado en PATH!" -ForegroundColor Red
    Write-Host "Instala MySQL o agregalo a tu PATH:" -ForegroundColor Yellow
    Write-Host "- Descargar de: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
    Write-Host "- O instalar via Chocolatey: choco install mysql" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Get timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"

# Define paths
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupBaseDir = Join-Path $projectRoot "Backups"
$backupDir = Join-Path $backupBaseDir "DB"
$tempDir = Join-Path $backupDir "temp_db_$timestamp"
$dbBackupName = "ITDimenzion_DB_$timestamp.sql"
$schemaBackupName = "ITDimenzion_Schema_$timestamp.sql"
$dbBackupPath = Join-Path $tempDir $dbBackupName
$schemaBackupPath = Join-Path $tempDir $schemaBackupName
$finalZipPath = Join-Path $backupDir "ITDimenzion_DB_$timestamp.zip"

# Create directory structure
Write-Host "Verificando estructura de directorios..." -ForegroundColor Yellow
@($backupBaseDir, $backupDir, $tempDir) | ForEach-Object {
    if (-not (Test-Path $_)) {
        Write-Host "Creando directorio: $_" -ForegroundColor Green
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Write-Host "Timestamp actual: $(Get-Date)" -ForegroundColor White
Write-Host "Backup de BD se guardara en: $dbBackupPath" -ForegroundColor White
Write-Host ""

# Default database configuration
$dbHost = "localhost"
$dbPort = "3306" 
$dbName = "itdimenzion_db"
$dbUser = "root"

# Check for environment variables from .env file
$envFile = Join-Path $projectRoot "backend\.env"
if (Test-Path $envFile) {
    Write-Host "Leyendo configuracion de base de datos desde backend/.env..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^DB_HOST=(.*)$") { $dbHost = $matches[1] }
        if ($_ -match "^DB_PORT=(.*)$") { $dbPort = $matches[1] }
        if ($_ -match "^DB_NAME=(.*)$") { $dbName = $matches[1] }
        if ($_ -match "^DB_USER=(.*)$") { $dbUser = $matches[1] }
    }
}

Write-Host "Configuracion de Base de Datos:" -ForegroundColor White
Write-Host "- Host: $dbHost" -ForegroundColor White
Write-Host "- Puerto: $dbPort" -ForegroundColor White  
Write-Host "- Base de datos: $dbName" -ForegroundColor White
Write-Host "- Usuario: $dbUser" -ForegroundColor White
Write-Host ""

# Prompt for password securely
$dbPassword = Read-Host "Ingrese la contrasena de MySQL para el usuario '$dbUser'" -AsSecureString
$dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# Test database connection
Write-Host "Probando conexion a la base de datos..." -ForegroundColor Yellow
try {
    $testResult = mysql -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain -e "USE $dbName;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "Conexion a la base de datos exitosa!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: No se pudo conectar a la base de datos!" -ForegroundColor Red
    Write-Host "Verifica lo siguiente:" -ForegroundColor Yellow
    Write-Host "1. El servidor MySQL esta ejecutandose" -ForegroundColor Yellow
    Write-Host "2. La base de datos '$dbName' existe" -ForegroundColor Yellow
    Write-Host "3. El usuario '$dbUser' tiene permisos de acceso" -ForegroundColor Yellow
    Write-Host "4. La contrasena es correcta" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# Create database backup
Write-Host "[1/3] Creando backup de estructura y datos de la base de datos..." -ForegroundColor Cyan
try {
    & mysqldump -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain --routines --triggers --single-transaction --lock-tables=false --databases $dbName | Out-File -FilePath $dbBackupPath -Encoding UTF8
    if ($LASTEXITCODE -ne 0) {
        throw "Database backup failed"
    }
    Write-Host "Backup completo creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "ERROR: El backup de la base de datos fallo!" -ForegroundColor Red
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force  
    }
    exit 1
}

# Create schema-only backup  
Write-Host "[2/3] Creando backup solo de estructura..." -ForegroundColor Cyan
try {
    & mysqldump -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain --no-data --routines --triggers $dbName | Out-File -FilePath $schemaBackupPath -Encoding UTF8
    if ($LASTEXITCODE -ne 0) {
        throw "Schema backup failed"
    }
    Write-Host "Backup de esquema creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "ERROR: El backup del esquema fallo!" -ForegroundColor Red
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    exit 1
}

# Create backup info file
Write-Host "[3/3] Creando archivo de informacion del backup..." -ForegroundColor Cyan
$infoContent = @"
ITDimenzion Database Backup Information
======================================

Backup Date: $(Get-Date -Format "yyyy-MM-dd")
Backup Time: $(Get-Date -Format "HH:mm:ss")

Database Information:
- Host: $dbHost
- Port: $dbPort  
- Database Name: $dbName
- User: $dbUser

Backup Files Created:
- Full Backup: $dbBackupName
- Schema Only: $schemaBackupName
- ZIP Archive: ITDimenzion_DB_$timestamp.zip

Backup Contents:
- All database tables with data
- Stored procedures and functions  
- Triggers and constraints
- User permissions and grants

To restore this backup:

Method 1 - Complete Restore:
mysql -u[username] -p[password] < "$dbBackupName"

Method 2 - Restore to specific database:
mysql -u[username] -p[password] [database_name] < "$dbBackupName"

Method 3 - Using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to Server > Data Import
4. Select "Import from Self-Contained File"
5. Browse and select: $dbBackupName  
6. Click "Start Import"

Schema-only restore (for development setup):
mysql -u[username] -p[password] [new_database] < "$schemaBackupName"

To extract ZIP backup:
1. Extract ITDimenzion_DB_$timestamp.zip
2. Use the SQL files for database restoration
"@

$infoFile = Join-Path $tempDir "Database_Backup_Info_$timestamp.txt"
$infoContent | Out-File -FilePath $infoFile -Encoding UTF8

# Compress all backup files into ZIP
Write-Host "[4/4] Comprimiendo archivos de backup..." -ForegroundColor Cyan
try {
    Compress-Archive -Path "$tempDir\*" -DestinationPath $finalZipPath -CompressionLevel Optimal -Force
    Write-Host "Archivo ZIP creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Fallo al crear archivo ZIP: $_" -ForegroundColor Red
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    exit 1
}

# Clean up temporary directory
Remove-Item $tempDir -Recurse -Force

# Get backup file size
$backupSize = (Get-Item $finalZipPath).Length

# Clear password from memory for security
$dbPasswordPlain = $null

# Completion message
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  DATABASE BACKUP COMPLETADO!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Detalles del Backup:" -ForegroundColor White
Write-Host "- Archivo ZIP: ITDimenzion_DB_$timestamp.zip ($([math]::Round($backupSize/1MB, 2)) MB)" -ForegroundColor White
Write-Host "- Contiene: Backup completo, Solo esquema, Archivo de info" -ForegroundColor White
Write-Host ""
Write-Host "Ubicacion del backup: $backupDir" -ForegroundColor White
Write-Host ""
Write-Host "Para restaurar la base de datos:" -ForegroundColor Yellow
Write-Host "1. Extrae ITDimenzion_DB_$timestamp.zip" -ForegroundColor Yellow
Write-Host "2. mysql -u$dbUser -p < `"$dbBackupName`"" -ForegroundColor Yellow
Write-Host ""

# Open backup directory
Start-Process $backupDir

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")