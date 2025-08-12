@echo off
setlocal enabledelayedexpansion

echo ITDimenzion Test Backup Script
echo ==============================
echo.

:: Test timestamp function
call :GetTimestamp TIMESTAMP
echo Generated timestamp: %TIMESTAMP%

:: Test paths
set "PROJECT_ROOT=%~dp0.."
set "BACKUP_BASE_DIR=%PROJECT_ROOT%\Backups"
echo Project Root: %PROJECT_ROOT%
echo Backup Base Dir: %BACKUP_BASE_DIR%

:: Test directory creation
if not exist "%BACKUP_BASE_DIR%" (
    echo Creating backup base directory...
    mkdir "%BACKUP_BASE_DIR%"
) else (
    echo Backup base directory exists
)

if not exist "%BACKUP_BASE_DIR%\Project" (
    echo Creating project directory...
    mkdir "%BACKUP_BASE_DIR%\Project"
) else (
    echo Project directory exists
)

echo Test completed successfully
pause
goto :eof

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