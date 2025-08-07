@echo off
setlocal enabledelayedexpansion

:: ITDimenzion Project Backup Script
:: Creates complete backup of project files with timestamp

echo.
echo =====================================
echo   ITDimenzion Project Backup Tool
echo =====================================
echo.

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

:: Set backup file name with timestamp
set "BACKUP_NAME=ITDimenzion_Backup_%BACKUP_DATE%_%BACKUP_TIME%"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

echo Current time: %date% %time%
echo Backup location: %BACKUP_PATH%
echo.

:: Create backup directory
mkdir "%BACKUP_PATH%"

:: Copy project files (excluding node_modules, .git, dist, build, etc.)
echo [1/5] Copying project source code...
robocopy "%PROJECT_ROOT%" "%BACKUP_PATH%\project" /E /XD node_modules .git dist build .next .nuxt target bin obj Backups /XF *.log *.tmp .env .env.local .DS_Store Thumbs.db /NFL /NDL /NJH /NJS /nc /ns /np

:: Copy important config files
echo [2/5] Copying configuration files...
if exist "%PROJECT_ROOT%\package.json" copy "%PROJECT_ROOT%\package.json" "%BACKUP_PATH%\project\" >nul
if exist "%PROJECT_ROOT%\pnpm-lock.yaml" copy "%PROJECT_ROOT%\pnpm-lock.yaml" "%BACKUP_PATH%\project\" >nul
if exist "%PROJECT_ROOT%\.gitignore" copy "%PROJECT_ROOT%\.gitignore" "%BACKUP_PATH%\project\" >nul
if exist "%PROJECT_ROOT%\README.md" copy "%PROJECT_ROOT%\README.md" "%BACKUP_PATH%\project\" >nul
if exist "%PROJECT_ROOT%\CLAUDE.md" copy "%PROJECT_ROOT%\CLAUDE.md" "%BACKUP_PATH%\project\" >nul

:: Create backup info file
echo [3/5] Creating backup information file...
(
    echo ITDimenzion Project Backup Information
    echo ======================================
    echo.
    echo Backup Date: %date%
    echo Backup Time: %time%
    echo Backup Location: %BACKUP_PATH%
    echo.
    echo Included in this backup:
    echo - Complete project source code
    echo - Frontend React application
    echo - Backend Node.js application
    echo - Database schema and scripts
    echo - Configuration files
    echo - Documentation files
    echo.
    echo Excluded from backup:
    echo - node_modules directories
    echo - .git repository data
    echo - Build artifacts ^(dist, build^)
    echo - Environment files ^(.env^)
    echo - Log files and temporary files
    echo.
    echo To restore:
    echo 1. Extract project folder to desired location
    echo 2. Run 'pnpm install' in root directory
    echo 3. Configure environment variables
    echo 4. Restore database using database backup
    echo 5. Run 'pnpm start' to launch development servers
    echo.
) > "%BACKUP_PATH%\BACKUP_INFO.txt"

:: Get project size info
echo [4/5] Calculating backup size...
for /f "tokens=3" %%i in ('dir "%BACKUP_PATH%" /s /-c ^| find "File(s)"') do set "BACKUP_SIZE=%%i"

:: Create quick restore script
echo [5/5] Creating restore script...
(
    echo @echo off
    echo :: ITDimenzion Project Restore Script
    echo echo Restoring ITDimenzion project...
    echo echo.
    echo if not exist "project" ^(
    echo     echo ERROR: project folder not found!
    echo     echo Make sure you're running this from the backup directory.
    echo     pause
    echo     exit /b 1
    echo ^)
    echo.
    echo echo [1/4] Copying project files...
    echo set "RESTORE_PATH=%%cd%%\restored_project"
    echo if exist "%%RESTORE_PATH%%" rmdir /s /q "%%RESTORE_PATH%%"
    echo robocopy "%%cd%%\project" "%%RESTORE_PATH%%" /E /NFL /NDL /NJH /NJS /nc /ns /np
    echo.
    echo echo [2/4] Installing dependencies...
    echo cd "%%RESTORE_PATH%%"
    echo pnpm install
    echo.
    echo echo [3/4] Setting up environment...
    echo echo Please configure your .env files in backend directory
    echo echo.
    echo echo [4/4] Restore complete!
    echo echo Project restored to: %%RESTORE_PATH%%
    echo echo.
    echo echo Next steps:
    echo echo 1. Configure environment variables ^(.env files^)
    echo echo 2. Restore database using database backup
    echo echo 3. Run 'pnpm run dev' in backend directory
    echo echo 4. Run 'pnpm start' in frontend directory
    echo echo.
    echo pause
) > "%BACKUP_PATH%\RESTORE.bat"

:: Completion message
echo.
echo =====================================
echo    BACKUP COMPLETED SUCCESSFULLY!
echo =====================================
echo.
echo Backup Details:
echo - Location: %BACKUP_PATH%
echo - Size: %BACKUP_SIZE% bytes
echo - Files included: Project source code, configurations, documentation
echo.
echo To restore this backup:
echo 1. Navigate to: %BACKUP_PATH%
echo 2. Run: RESTORE.bat
echo.
echo Note: Database backup should be created separately using backup-database.bat
echo.

:: Open backup directory
explorer "%BACKUP_PATH%"

pause