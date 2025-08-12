@echo off
setlocal enabledelayedexpansion

:: ITDimenzion Full Backup Script
:: Creates complete backup of both project files and database

echo.
echo =========================================
echo   ITDimenzion Full System Backup Tool
echo =========================================
echo.
echo Este script creará un backup completo del sistema:
echo - Código fuente del proyecto
echo - Base de datos MySQL
echo.

:: Función para obtener fecha y hora en formato YYYY-MM-DD-hh-mm-ss
call :GetTimestamp TIMESTAMP

:: Definir las rutas segun especificacion
set "PROJECT_ROOT=%~dp0.."
set "BACKUP_BASE_DIR=%PROJECT_ROOT%\Backups"
set "LOG_FILE=%BACKUP_BASE_DIR%\backup-full-%TIMESTAMP%.log"

:: Crear la estructura de directorios si no existe
echo Verificando estructura de directorios...
if not exist "%BACKUP_BASE_DIR%" (
    echo Creando directorio base: %BACKUP_BASE_DIR%
    mkdir "%BACKUP_BASE_DIR%"
)
if not exist "%BACKUP_BASE_DIR%\Project" (
    echo Creando directorio de proyecto: %BACKUP_BASE_DIR%\Project
    mkdir "%BACKUP_BASE_DIR%\Project"
)
if not exist "%BACKUP_BASE_DIR%\DB" (
    echo Creando directorio de base de datos: %BACKUP_BASE_DIR%\DB
    mkdir "%BACKUP_BASE_DIR%\DB"
)

echo.
echo Iniciando backup completo...
echo Timestamp: %TIMESTAMP%
echo Log file: %LOG_FILE%
echo.

:: Inicializar log file
(
    echo ITDimenzion Full Backup Log
    echo ==========================
    echo Start Time: %date% %time%
    echo Timestamp: %TIMESTAMP%
    echo.
) > "%LOG_FILE%"

:: Paso 1: Backup del proyecto
echo ==========================================
echo [1/2] BACKUP DEL PROYECTO
echo ==========================================
echo.

echo Starting project backup... >> "%LOG_FILE%"
call "%~dp0backup-project.bat" >> "%LOG_FILE%" 2>&1

if %errorlevel% neq 0 (
    echo ERROR: Project backup failed! >> "%LOG_FILE%"
    echo.
    echo ERROR: El backup del proyecto falló.
    echo Consulte el log para más detalles: %LOG_FILE%
    echo.
    pause
    exit /b 1
)

echo Project backup completed successfully. >> "%LOG_FILE%"
echo.
echo ✅ Backup del proyecto completado exitosamente.
echo.

:: Paso 2: Backup de la base de datos
echo ==========================================
echo [2/2] BACKUP DE LA BASE DE DATOS
echo ==========================================
echo.

echo Starting database backup... >> "%LOG_FILE%"
call "%~dp0backup-database.bat" >> "%LOG_FILE%" 2>&1

if %errorlevel% neq 0 (
    echo ERROR: Database backup failed! >> "%LOG_FILE%"
    echo.
    echo ERROR: El backup de la base de datos falló.
    echo Consulte el log para más detalles: %LOG_FILE%
    echo.
    pause
    exit /b 1
)

echo Database backup completed successfully. >> "%LOG_FILE%"
echo.
echo ✅ Backup de la base de datos completado exitosamente.
echo.

:: Finalización
(
    echo.
    echo End Time: %date% %time%
    echo Full backup completed successfully.
    echo.
    echo Created files:
    echo - Project: ITDimenzion_Project_%TIMESTAMP%.zip
    echo - Database: ITDimenzion_DB_%TIMESTAMP%.zip
    echo.
) >> "%LOG_FILE%"

echo ==========================================
echo   BACKUP COMPLETO FINALIZADO
echo ==========================================
echo.
echo ✅ Backup completo del sistema finalizado exitosamente.
echo.
echo Archivos creados:
echo - 📁 Proyecto: %BACKUP_BASE_DIR%\Project\ITDimenzion_Project_%TIMESTAMP%.zip
echo - 🗃️ Base de datos: %BACKUP_BASE_DIR%\DB\ITDimenzion_DB_%TIMESTAMP%.zip
echo - 📄 Log completo: %LOG_FILE%
echo.
echo Ubicación de backups: %BACKUP_BASE_DIR%
echo.

:: Mostrar resumen de archivos
echo Resumen de archivos creados:
if exist "%BACKUP_BASE_DIR%\Project\ITDimenzion_Project_%TIMESTAMP%.zip" (
    for %%i in ("%BACKUP_BASE_DIR%\Project\ITDimenzion_Project_%TIMESTAMP%.zip") do (
        echo - Proyecto: %%~nxi ^(%%~zi bytes^)
    )
) else (
    echo - Proyecto: ❌ No encontrado
)

if exist "%BACKUP_BASE_DIR%\DB\ITDimenzion_DB_%TIMESTAMP%.zip" (
    for %%i in ("%BACKUP_BASE_DIR%\DB\ITDimenzion_DB_%TIMESTAMP%.zip") do (
        echo - Base de datos: %%~nxi ^(%%~zi bytes^)
    )
) else (
    echo - Base de datos: ❌ No encontrado
)

echo.
echo Para restaurar el sistema:
echo 1. Extraer ITDimenzion_Project_%TIMESTAMP%.zip en la ubicación deseada
echo 2. Ejecutar 'pnpm install' para instalar dependencias
echo 3. Extraer ITDimenzion_DB_%TIMESTAMP%.zip
echo 4. Restaurar base de datos usando el archivo SQL incluido
echo 5. Configurar variables de entorno
echo 6. Iniciar con 'pnpm start'
echo.

:: Abrir directorio de backups
explorer "%BACKUP_BASE_DIR%"

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