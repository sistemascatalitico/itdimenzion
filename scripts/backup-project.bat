@echo off
setlocal enabledelayedexpansion

:: ITDimenzion Project Backup Script
:: Crea un backup completo de los archivos del proyecto en un archivo ZIP con marca de tiempo.

echo.
echo =====================================
echo    ITDimenzion Project Backup Tool
echo =====================================
echo.

:: Obtener la fecha y hora actual para nombrar el backup
for /f "tokens=1-4 delims=/ " %%i in ('date /t') do (
    set "BACKUP_DATE=%%k-%%j-%%i"
)
for /f "tokens=1-2 delims=: " %%i in ('time /t') do (
    set "BACKUP_TIME=%%i-%%j"
)

:: Eliminar espacios y formatear la hora correctamente
set "BACKUP_TIME=%BACKUP_TIME: =0%"
set "BACKUP_TIME=%BACKUP_TIME::=-%"

:: Definir las rutas
set "PROJECT_ROOT=%~dp0.."
set "BACKUP_DIR=%PROJECT_ROOT%\Backups"
set "TEMP_DIR=%PROJECT_ROOT%\Backups\temp_backup"
set "BACKUP_NAME=ITDimenzion_Backup_%BACKUP_DATE%_%BACKUP_TIME%.zip"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

:: Crear el directorio de backups si no existe
if not exist "%BACKUP_DIR%" (
    echo Creando el directorio Backups...
    mkdir "%BACKUP_DIR%"
)

echo Ubicaci% BACKUP_PATH%n del backup: %BACKUP_PATH%
echo.

:: --- Nuevos pasos para crear el ZIP ---
:: 1. Crear un directorio temporal para copiar los archivos.
echo Creando el directorio temporal para la compresi% B%n...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: 2. Copiar los archivos a la carpeta temporal.
echo [1/5] Copiando el c%d%digo fuente del proyecto...
robocopy "%PROJECT_ROOT%" "%TEMP_DIR%\project" /E /XD node_modules .git dist build .next .nuxt target bin obj Backups /XF *.log *.tmp .env .env.local .DS_Store Thumbs.db /NFL /NDL /NJH /NJS /nc /ns /np

:: Copiar archivos de configuraci%n importantes
echo [2/5] Copiando archivos de configuraci%n...
if exist "%PROJECT_ROOT%\package.json" copy "%PROJECT_ROOT%\package.json" "%TEMP_DIR%\project\" >nul
if exist "%PROJECT_ROOT%\pnpm-lock.yaml" copy "%PROJECT_ROOT%\pnpm-lock.yaml" "%TEMP_DIR%\project\" >nul
if exist "%PROJECT_ROOT%\.gitignore" copy "%PROJECT_ROOT%\.gitignore" "%TEMP_DIR%\project\" >nul
if exist "%PROJECT_ROOT%\README.md" copy "%PROJECT_ROOT%\README.md" "%TEMP_DIR%\project\" >nul
if exist "%PROJECT_ROOT%\CLAUDE.md" copy "%PROJECT_ROOT%\CLAUDE.md" "%TEMP_DIR%\project\" >nul

:: Crear el archivo de informaci%n de backup
echo [3/5] Creando el archivo de informaci%n del backup...
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

:: 3. ¡Ahora, comprimir la carpeta temporal en un archivo ZIP!
echo [4/5] Comprimiendo archivos en un ZIP...
:: Reemplaza la siguiente l%nea con el comando de tu herramienta de compresi%n.
:: Ejemplo para 7-Zip:
"C:\Program Files\7-Zip\7z.exe" a -tzip "%BACKUP_PATH%" "%TEMP_DIR%\*" > nul
:: Si 7z.exe est% en tu PATH, la l%nea ser%a m%s simple:
:: 7z.exe a -tzip "%BACKUP_PATH%" "%TEMP_DIR%\*" > nul
::
:: Si usas WinRAR:
:: "C:\Program Files\WinRAR\Rar.exe" a -ep1 "%BACKUP_PATH%" "%TEMP_DIR%\*"

:: 4. Eliminar el directorio temporal
echo Limpiando archivos temporales...
rmdir /s /q "%TEMP_DIR%"

:: 5. Verificar que el archivo ZIP se cre% correctamente
if not exist "%BACKUP_PATH%" (
    echo.
    echo ERROR: Fallo al crear el archivo ZIP.
    echo Aseg%rate de que 7-Zip o tu herramienta de compresi%n est% instalada y su ruta es correcta.
    echo.
    pause
    exit /b 1
)

:: Obtener el tama%o del ZIP
echo [5/5] Calculando el tama%o del backup...
for %%F in ("%BACKUP_PATH%") do set "BACKUP_SIZE=%%~zF"

:: Creando el script de restauraci%n (ya no es necesario en el ZIP)
:: He quitado esta parte para simplificar, ya que ahora se extrae el ZIP.

:: Mensaje de finalizaci%n
echo.
echo =====================================
echo    BACKUP COMPLETADO EXITOSAMENTE!
echo =====================================
echo.
echo Detalles del Backup:
echo - Ubicaci%n: %BACKUP_PATH%
echo - Tama%o: %BACKUP_SIZE% bytes
echo - Archivos incluidos: C%d%digo, configuraciones, documentaci%n
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