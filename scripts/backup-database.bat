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

:: Get current date and time for backup naming
for /f "tokens=1-4 delims=/ " %%i in ('date /t') do (
    set "BACKUP_DATE=%%k-%%j-%%i"
)
for /f "tokens=1-2 delims=: " %%i in ('time /t') do (
    set "BACKUP_TIME=%%i-%%j"
)

:: Remove spaces and format time properly
set "BACKUP_TIME=%BACKUP_TIME: =0%"
set "BACKUP_TIME=%BACKUP_TIME::=-%"

:: Create backup directory if it doesn't exist
set "PROJECT_ROOT=%~dp0.."
set "BACKUP_DIR=%PROJECT_ROOT%\Backups"
if not exist "%BACKUP_DIR%" (
    echo Creating Backups directory...
    mkdir "%BACKUP_DIR%"
)

:: Set backup file names with timestamp
set "DB_BACKUP_NAME=ITDimenzion_Database_%BACKUP_DATE%_%BACKUP_TIME%.sql"
set "DB_BACKUP_PATH=%BACKUP_DIR%\%DB_BACKUP_NAME%"

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
set "SCHEMA_BACKUP_PATH=%BACKUP_DIR%\ITDimenzion_Schema_%BACKUP_DATE%_%BACKUP_TIME%.sql"
mysqldump -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% --no-data --routines --triggers %DB_NAME% > "%SCHEMA_BACKUP_PATH%"

:: Create backup info file
echo [3/3] Creating backup information file...
set "INFO_FILE=%BACKUP_DIR%\Database_Backup_Info_%BACKUP_DATE%_%BACKUP_TIME%.txt"
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
    echo - Schema Only: ITDimenzion_Schema_%BACKUP_DATE%_%BACKUP_TIME%.sql
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
    echo mysql -u[username] -p[password] [new_database] ^< "ITDimenzion_Schema_%BACKUP_DATE%_%BACKUP_TIME%.sql"
    echo.
) > "%INFO_FILE%"

:: Get backup file size
for %%i in ("%DB_BACKUP_PATH%") do set "BACKUP_SIZE=%%~zi"

:: Completion message
echo.
echo =====================================
echo   DATABASE BACKUP COMPLETED!
echo =====================================
echo.
echo Backup Details:
echo - Full Backup: %DB_BACKUP_NAME% ^(%BACKUP_SIZE% bytes^)
echo - Schema Only: ITDimenzion_Schema_%BACKUP_DATE%_%BACKUP_TIME%.sql
echo - Info File: Database_Backup_Info_%BACKUP_DATE%_%BACKUP_TIME%.txt
echo.
echo Backup Location: %BACKUP_DIR%
echo.
echo To restore database:
echo mysql -u%DB_USER% -p ^< "%DB_BACKUP_PATH%"
echo.

:: Create restore script
set "RESTORE_SCRIPT=%BACKUP_DIR%\restore-database_%BACKUP_DATE%_%BACKUP_TIME%.bat"
(
    echo @echo off
    echo :: ITDimenzion Database Restore Script
    echo :: Generated: %date% %time%
    echo.
    echo echo =====================================
    echo echo   ITDimenzion Database Restore Tool
    echo echo =====================================
    echo echo.
    echo echo This script will restore the database backup from:
    echo echo %DB_BACKUP_NAME%
    echo echo.
    echo echo WARNING: This will overwrite the existing database!
    echo echo.
    echo set /p "CONFIRM=Are you sure you want to continue? ^(y/n^): "
    echo if /i not "%%CONFIRM%%"=="y" ^(
    echo     echo Restore cancelled.
    echo     pause
    echo     exit /b 0
    echo ^)
    echo.
    echo echo Enter MySQL credentials for restore:
    echo set /p "RESTORE_USER=MySQL Username [%DB_USER%]: "
    echo if "%%RESTORE_USER%%"=="" set "RESTORE_USER=%DB_USER%"
    echo.
    echo set /p "RESTORE_PASSWORD=MySQL Password: "
    echo.
    echo echo Restoring database...
    echo mysql -u%%RESTORE_USER%% -p%%RESTORE_PASSWORD%% ^< "%DB_BACKUP_NAME%"
    echo.
    echo if %%errorlevel%% equ 0 ^(
    echo     echo Database restore completed successfully!
    echo ^) else ^(
    echo     echo ERROR: Database restore failed!
    echo ^)
    echo.
    echo pause
) > "%RESTORE_SCRIPT%"

:: Clear password from memory for security
set "DB_PASSWORD="

echo Restore script created: restore-database_%BACKUP_DATE%_%BACKUP_TIME%.bat
echo.

:: Open backup directory
explorer "%BACKUP_DIR%"

pause