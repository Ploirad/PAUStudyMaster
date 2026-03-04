@echo off
REM Script de diagnostico para PAU Study Master

echo ==========================================
echo  PAU Study Master - Diagnostico del Sistema
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/8] Verificando Python...
python --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Python no encontrado en PATH
    echo   Asegurate de tener Python 3.8+ instalado
) else (
    echo   [OK] Python encontrado
)

echo.
echo [2/8] Verificando pip...
python -m pip --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] pip no funciona correctamente
) else (
    echo   [OK] pip funciona
)

echo.
echo [3/8] Verificando modulos Python criticos...
python -c "import uvicorn" 2>nul && echo   [OK] uvicorn || echo   [FALLO] uvicorn - INSTALAR CON: pip install uvicorn
python -c "import fastapi" 2>nul && echo   [OK] fastapi || echo   [FALLO] fastapi - INSTALAR CON: pip install fastapi
python -c "import motor" 2>nul && echo   [OK] motor || echo   [FALLO] motor - INSTALAR CON: pip install motor
python -c "import google.generativeai" 2>nul && echo   [OK] google-generativeai || echo   [FALLO] google-generativeai - INSTALAR CON: pip install google-generativeai
python -c "import requests" 2>nul && echo   [OK] requests || echo   [FALLO] requests - INSTALAR CON: pip install requests
python -c "import psutil" 2>nul && echo   [OK] psutil || echo   [FALLO] psutil - INSTALAR CON: pip install psutil
python -c "import PyPDF2" 2>nul && echo   [OK] PyPDF2 || echo   [FALLO] PyPDF2 - INSTALAR CON: pip install PyPDF2

echo.
echo [4/8] Verificando estructura de archivos...
if exist "backend\server.py" (
    echo   [OK] backend\server.py existe
) else (
    echo   [ERROR] backend\server.py NO ENCONTRADO
)

if exist "backend\requirements.txt" (
    echo   [OK] backend\requirements.txt existe
) else (
    echo   [ERROR] backend\requirements.txt NO ENCONTRADO
)

if exist "backend\.env" (
    echo   [OK] backend\.env existe
) else (
    echo   [ADVERTENCIA] backend\.env NO ENCONTRADO - crear desde .env.example
)

if exist "launcher.py" (
    echo   [OK] launcher.py existe
) else (
    echo   [ERROR] launcher.py NO ENCONTRADO
)

echo.
echo [5/8] Verificando MongoDB...
if exist "mongodb\bin\mongod.exe" (
    echo   [OK] MongoDB encontrado en mongodb\bin\mongod.exe
) else (
    echo   [ADVERTENCIA] MongoDB NO encontrado
    echo   Descarga MongoDB Community 7.0 desde:
    echo   https://www.mongodb.com/try/download/community
)

echo.
echo [6/8] Verificando directorios de datos...
if exist "data\db" (
    echo   [OK] data\db existe
) else (
    echo   [ADVERTENCIA] data\db no existe - se creara automaticamente
)

if exist "data\logs" (
    echo   [OK] data\logs existe
) else (
    echo   [ADVERTENCIA] data\logs no existe - se creara automaticamente
)

echo.
echo [7/8] Verificando puertos...
netstat -an | findstr ":27017" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [ADVERTENCIA] Puerto 27017 (MongoDB) ya esta en uso
    echo   Cierra otras instancias de MongoDB antes de ejecutar launcher.py
) else (
    echo   [OK] Puerto 27017 disponible
)

netstat -an | findstr ":8001" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [ADVERTENCIA] Puerto 8001 (Backend) ya esta en uso
    echo   Cierra otras instancias del backend antes de ejecutar launcher.py
) else (
    echo   [OK] Puerto 8001 disponible
)

echo.
echo [8/8] Verificando configuracion API key...
if exist "backend\.env" (
    findstr /C:"GEMINI_API_KEY" backend\.env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        findstr /C:"pon-tu-gemini-api-key-aqui" backend\.env >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo   [ADVERTENCIA] GEMINI_API_KEY aun tiene el valor de ejemplo
            echo   Configura tu API key real en backend\.env
        ) else (
            echo   [OK] GEMINI_API_KEY configurada
        )
    ) else (
        echo   [ADVERTENCIA] GEMINI_API_KEY no encontrada en .env
    )
) else (
    echo   [ERROR] backend\.env no existe
)

echo.
echo ==========================================
echo  Diagnostico completado
echo ==========================================
echo.
echo Resumen de acciones recomendadas:
echo.
echo 1. Si faltan modulos Python:
echo    Ejecuta: instalar_dependencias.bat
echo.
echo 2. Si falta MongoDB:
echo    Descarga: https://www.mongodb.com/try/download/community
echo    Version: 7.0 (ZIP para Windows)
echo    Extrae a: %~dp0mongodb\
echo.
echo 3. Si GEMINI_API_KEY no esta configurada:
echo    Edita: backend\.env
echo    Obten key en: https://aistudio.google.com/apikey
echo.
echo 4. Para instalar todo automaticamente:
echo    Ejecuta: instalar_dependencias.bat
echo.
echo 5. Para iniciar la aplicacion:
echo    Ejecuta: python launcher.py
echo.
pause
