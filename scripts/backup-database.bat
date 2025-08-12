@echo off
setlocal enabledelayedexpansion

:: ITDimenzion Database Backup Script
:: Creates complete backup of MySQL database

echo.
echo =====================================
echo   ITDimenzion Database Backup Tool
echo =====================================
echo.

:: Check if MySQL is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL client not found in PATH!
    echo Please ensure MySQL is installed and accessible from command line.
    echo.
    echo Install MySQL or add it to your PATH:
    echo - Download from: https://dev.mysql.com/downloads/mysql/
    echo - Or install via Chocolatey: choco install mysql
    echo.
    pause
    exit /b 1
)

:: Función para obtener fecha y hora en formato YYYY-MM-DD-hh-mm-ss
call :GetTimestamp TIMESTAMP

:: Definir las rutas segun especificacion
set "PROJECT_ROOT=%~dp0.."
set "BACKUP_BASE_DIR=%PROJECT_ROOT%\Backups"
set "BACKUP_DIR=%BACKUP_BASE_DIR%\DB"
set "TEMP_DIR=%BACKUP_DIR%\temp_db_%TIMESTAMP%"
set "DB_BACKUP_NAME=ITDimenzion_DB_%TIMESTAMP%.sql"
set "SCHEMA_BACKUP_NAME=ITDimenzion_Schema_%TIMESTAMP%.sql"
set "DB_BACKUP_PATH=%TEMP_DIR%\%DB_BACKUP_NAME%"
set "SCHEMA_BACKUP_PATH=%TEMP_DIR%\%SCHEMA_BACKUP_NAME%"
set "FINAL_ZIP_PATH=%BACKUP_DIR%\ITDimenzion_DB_%TIMESTAMP%.zip"

:: Crear la estructura de directorios si no existe
echo Verificando estructura de directorios...
if not exist "%BACKUP_BASE_DIR%" (
    echo Creando directorio base: %BACKUP_BASE_DIR%
    mkdir "%BACKUP_BASE_DIR%"
)
if not exist "%BACKUP_DIR%" (
    echo Creando directorio de base de datos: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)
if not exist "%TEMP_DIR%" (
    echo Creando directorio temporal: %TEMP_DIR%
    mkdir "%TEMP_DIR%"
)

echo Current time: %date% %time%
echo Database backup will be saved to: %DB_BACKUP_PATH%
echo.

:: Default database configuration (can be overridden by environment variables)
set "DB_HOST=localhost"
set "DB_PORT=3306"
set "DB_NAME=itdimenzion_db"
set "DB_USER=root"

:: Check for environment variables from .env file
if exist "%PROJECT_ROOT%\backend\.env" (
    echo Reading database configuration from backend/.env...
    for /f "tokens=1,2 delims==" %%a in ('type "%PROJECT_ROOT%\backend\.env" ^| findstr /i "DATABASE"') do (
        set "ENV_LINE=%%a=%%b"
        if "%%a"=="DB_HOST" set "DB_HOST=%%b"
        if "%%a"=="DB_PORT" set "DB_PORT=%%b"
        if "%%a"=="DB_NAME" set "DB_NAME=%%b"
        if "%%a"=="DB_USER" set "DB_USER=%%b"
        if "%%a"=="DATABASE_URL" (
            echo Found DATABASE_URL, parsing connection string...
            :: Parse DATABASE_URL if needed
        )
    )
)

echo Database Configuration:
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo.

:: Prompt for password securely
echo Please enter the MySQL password for user '%DB_USER%':
set /p "DB_PASSWORD="

:: Test database connection
echo Testing database connection...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% -e "USE %DB_NAME%;" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Cannot connect to database!
    echo Please check your credentials and ensure:
    echo 1. MySQL server is running
    echo 2. Database '%DB_NAME%' exists
    echo 3. User '%DB_USER%' has access permissions
    echo 4. Password is correct
    echo.
    pause
    exit /b 1
)

echo Database connection successful!
echo.

:: Create database backup
echo [1/3] Creating database structure and data backup...
mysqldump -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% --routines --triggers --single-transaction --lock-tables=false --databases %DB_NAME% > "%DB_BACKUP_PATH%"

if %errorlevel% neq 0 (
    echo ERROR: Database backup failed!
    pause
    exit /b 1
)

:: Create schema-only backup
echo [2/3] Creating schema-only backup...
mysqldump -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% --no-data --routines --triggers %DB_NAME% > "%SCHEMA_BACKUP_PATH%"

if %errorlevel% neq 0 (
    echo ERROR: Schema backup failed!
    goto :cleanup_and_exit
)

:: Create backup info file
echo [3/3] Creating backup information file...
set "INFO_FILE=%TEMP_DIR%\Database_Backup_Info_%TIMESTAMP%.txt"
(
    echo ITDimenzion Database Backup Information
    echo ======================================
    echo.
    echo Backup Date: %date%
    echo Backup Time: %time%
    echo.
    echo Database Information:
    echo - Host: %DB_HOST%
    echo - Port: %DB_PORT%
    echo - Database Name: %DB_NAME%
    echo - User: %DB_USER%
    echo.
    echo Backup Files Created:
    echo - Full Backup: %DB_BACKUP_NAME%
    echo - Schema Only: %SCHEMA_BACKUP_NAME%
    echo - ZIP Archive: ITDimenzion_DB_%TIMESTAMP%.zip
    echo.
    echo Backup Contents:
    echo - All database tables with data
    echo - Stored procedures and functions
    echo - Triggers and constraints
    echo - User permissions and grants
    echo.
    echo To restore this backup:
    echo.
    echo Method 1 - Complete Restore:
    echo mysql -u[username] -p[password] ^< "%DB_BACKUP_NAME%"
    echo.
    echo Method 2 - Restore to specific database:
    echo mysql -u[username] -p[password] [database_name] ^< "%DB_BACKUP_NAME%"
    echo.
    echo Method 3 - Using MySQL Workbench:
    echo 1. Open MySQL Workbench
    echo 2. Connect to your MySQL server
    echo 3. Go to Server ^> Data Import
    echo 4. Select "Import from Self-Contained File"
    echo 5. Browse and select: %DB_BACKUP_NAME%
    echo 6. Click "Start Import"
    echo.
    echo Schema-only restore ^(for development setup^):
    echo mysql -u[username] -p[password] [new_database] ^< "%SCHEMA_BACKUP_NAME%"
    echo.
    echo To extract ZIP backup:
    echo 1. Extract ITDimenzion_DB_%TIMESTAMP%.zip
    echo 2. Use the SQL files for database restoration
    echo.
) > "%INFO_FILE%"

:: Compress all backup files into ZIP
echo [4/4] Compressing backup files...
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%FINAL_ZIP_PATH%' -CompressionLevel Optimal"

if %errorlevel% neq 0 (
    echo ERROR: Failed to create ZIP archive using PowerShell.
    goto :cleanup_and_exit
)

:: Clean up temporary directory
rmdir /s /q "%TEMP_DIR%"

:: Get backup file size
for %%i in ("%FINAL_ZIP_PATH%") do set "BACKUP_SIZE=%%~zi"

:: Completion message
echo.
echo =====================================
echo   DATABASE BACKUP COMPLETED!
echo =====================================
echo.
echo Backup Details:
echo - ZIP Archive: ITDimenzion_DB_%TIMESTAMP%.zip ^(%BACKUP_SIZE% bytes^)
echo - Contains: Full backup, Schema only, Info file
echo.
echo Backup Location: %BACKUP_DIR%
echo.
echo To restore database:
echo 1. Extract ITDimenzion_DB_%TIMESTAMP%.zip
echo 2. mysql -u%DB_USER% -p ^< "%DB_BACKUP_NAME%"
echo.

:: Clear password from memory for security
set "DB_PASSWORD="

:: Open backup directory
explorer "%BACKUP_DIR%"

pause
goto :eof

:cleanup_and_exit
:: Cleanup temporary files on error
if exist "%TEMP_DIR%" (
    echo Cleaning up temporary files...
    rmdir /s /q "%TEMP_DIR%"
)
:: Clear password from memory for security
set "DB_PASSWORD="
pause
exit /b 1

:GetTimestamp
:: Function to get timestamp in YYYY-MM-DD-hh-mm-ss format
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do (
    if not "%%I"=="" set "dt=%%I"
)
set "YEAR=%dt:~0,4%"
set "MONTH=%dt:~4,2%"
set "DAY=%dt:~6,2%"
set "HOUR=%dt:~8,2%"
set "MINUTE=%dt:~10,2%"
set "SECOND=%dt:~12,2%"
set "%1=%YEAR%-%MONTH%-%DAY%-%HOUR%-%MINUTE%-%SECOND%"
goto :eof