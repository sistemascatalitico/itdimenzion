@echo off
setlocal enabledelayedexpansion

:: ITDimenzion Project Backup Script
:: Crea un backup completo de los archivos del proyecto en un archivo ZIP con marca de tiempo.

echo.
echo =====================================
echo    ITDimenzion Project Backup Tool
echo =====================================
echo.

:: Función para obtener fecha y hora en formato YYYY-MM-DD-hh-mm-ss
call :GetTimestamp TIMESTAMP

:: Definir las rutas segun especificacion
set "PROJECT_ROOT=%~dp0.."
set "BACKUP_BASE_DIR=%PROJECT_ROOT%\Backups"
set "BACKUP_DIR=%BACKUP_BASE_DIR%\Project"
set "TEMP_DIR=%BACKUP_DIR%\temp_backup_%TIMESTAMP%"
set "BACKUP_NAME=ITDimenzion_Project_%TIMESTAMP%.zip"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

:: Crear la estructura de directorios si no existe
echo Verificando estructura de directorios...
if not exist "%BACKUP_BASE_DIR%" (
    echo Creando directorio base: %BACKUP_BASE_DIR%
    mkdir "%BACKUP_BASE_DIR%"
)
if not exist "%BACKUP_DIR%" (
    echo Creando directorio de proyecto: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

echo Ubicacion del backup: %BACKUP_PATH%
echo.

:: --- Nuevos pasos para crear el ZIP ---
:: 1. Crear un directorio temporal para copiar los archivos.
echo Creando el directorio temporal para la compresion...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: 2. Copiar los archivos a la carpeta temporal.
echo [1/5] Copiando el codigo fuente del proyecto...
robocopy "%PROJECT_ROOT%" "%TEMP_DIR%\project" /E /XD node_modules .git dist build .next .nuxt target bin obj Backups .vscode .idea /XF *.log *.tmp .env .env.local .DS_Store Thumbs.db /NFL /NDL /NJH /NJS /nc /ns /np

:: Copiar archivos de configuracion importantes
echo [2/5] Copiando archivos de configuracion...
if exist "%PROJECT_ROOT%\package.json" copy "%PROJECT_ROOT%\package.json" "%TEMP_DIR%\project\" >NUL 2>&1
if exist "%PROJECT_ROOT%\pnpm-lock.yaml" copy "%PROJECT_ROOT%\pnpm-lock.yaml" "%TEMP_DIR%\project\" >NUL 2>&1
if exist "%PROJECT_ROOT%\.gitignore" copy "%PROJECT_ROOT%\.gitignore" "%TEMP_DIR%\project\" >NUL 2>&1
if exist "%PROJECT_ROOT%\README.md" copy "%PROJECT_ROOT%\README.md" "%TEMP_DIR%\project\" >NUL 2>&1
if exist "%PROJECT_ROOT%\CLAUDE.md" copy "%PROJECT_ROOT%\CLAUDE.md" "%TEMP_DIR%\project\" >NUL 2>&1

:: Crear el archivo de informacion de backup
echo [3/5] Creando el archivo de informacion del backup...
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
    echo 1. Extract the content of the zip file to the desired location
    echo 2. Run 'pnpm install' in the root directory
    echo 3. Configure environment variables
    echo 4. Restore database using a database backup
    echo 5. Run 'pnpm start' to launch development servers
    echo.
) > "%TEMP_DIR%\BACKUP_INFO.txt"

:: 3. Comprimir la carpeta temporal en un archivo ZIP usando PowerShell nativo
echo [4/5] Comprimiendo archivos en un ZIP...
powershell -Command "& { try { Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%BACKUP_PATH%' -CompressionLevel Optimal -Force; exit 0 } catch { Write-Error $_.Exception.Message; exit 1 } }"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo al crear el archivo ZIP usando PowerShell.
    echo Verifique que PowerShell esté disponible y tenga permisos necesarios.
    echo.
    goto :cleanup_and_exit
)

:: 4. Eliminar el directorio temporal
echo Limpiando archivos temporales...
rmdir /s /q "%TEMP_DIR%"

:: 5. Verificar que el archivo ZIP se creo correctamente
if not exist "%BACKUP_PATH%" (
    echo.
    echo ERROR: Fallo al crear el archivo ZIP.
    echo Asegurate de que PowerShell este disponible y tenga permisos necesarios.
    echo.
    pause
    exit /b 1
)

:: Obtener el tamano del ZIP
echo [5/5] Calculando el tamano del backup...
for %%F in ("%BACKUP_PATH%") do set "BACKUP_SIZE=%%~zF"

:: Creando el script de restauracion (ya no es necesario en el ZIP)
:: He quitado esta parte para simplificar, ya que ahora se extrae el ZIP.

:: Mensaje de finalizacion
echo.
echo =====================================
echo    BACKUP COMPLETADO EXITOSAMENTE!
echo =====================================
echo.
echo Detalles del Backup:
echo - Ubicacion: %BACKUP_PATH%
echo - Tamano: %BACKUP_SIZE% bytes
echo - Archivos incluidos: Codigo, configuraciones, documentacion
echo.
echo Para restaurar este backup:
echo 1. Navega a: %BACKUP_DIR%
echo 2. Descomprime el archivo .zip
echo 3. Sigue las instrucciones del archivo BACKUP_INFO.txt
echo.
echo Nota: El backup de la base de datos debe crearse por separado.
echo.

:: Abrir el directorio del backup
explorer "%BACKUP_DIR%"

pause
goto :eof

:cleanup_and_exit
:: Limpieza de archivos temporales en caso de error
if exist "%TEMP_DIR%" (
    echo Limpiando archivos temporales...
    rmdir /s /q "%TEMP_DIR%"
)
pause
exit /b 1

:GetTimestamp
:: Función para obtener timestamp en formato YYYY-MM-DD-hh-mm-ss
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