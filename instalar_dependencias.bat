@echo off
REM Script para instalar dependencias de PAU Study Master
REM Ejecuta este archivo antes de usar launcher.py

echo ==========================================
echo  PAU Study Master - Instalador de Dependencias
echo ==========================================
echo.
echo Este script instalara todas las dependencias necesarias
echo para que PAU Study Master funcione correctamente.
echo.
echo NOTA: Esto puede tardar 3-5 minutos dependiendo de tu conexion.
echo.
pause

cd /d "%~dp0"

echo.
echo ==========================================
echo Paso 1: Actualizando pip...
echo ==========================================
python -m pip install --upgrade pip
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: No se pudo actualizar pip
    echo Intenta ejecutar este script como Administrador
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Paso 2: Instalando dependencias del backend...
echo ==========================================
python -m pip install -r backend\requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo al instalar dependencias del backend
    echo Revisa tu conexion a internet
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Paso 3: Instalando dependencias del launcher...
echo ==========================================
python -m pip install requests psutil
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo al instalar requests y psutil
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Paso 4: Verificando instalacion de uvicorn...
echo ==========================================
python -m pip show uvicorn
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: uvicorn no esta instalado correctamente
    echo Intentando reinstalar...
    python -m pip install --force-reinstall uvicorn==0.25.0
)

echo.
echo ==========================================
echo Verificacion final...
echo ==========================================
echo.
echo Verificando modulos clave:

python -c "import uvicorn; print('  [OK] uvicorn')" 2>nul || echo   [FALLO] uvicorn
python -c "import fastapi; print('  [OK] fastapi')" 2>nul || echo   [FALLO] fastapi
python -c "import motor; print('  [OK] motor')" 2>nul || echo   [FALLO] motor
python -c "import google.generativeai; print('  [OK] google-generativeai')" 2>nul || echo   [FALLO] google-generativeai
python -c "import requests; print('  [OK] requests')" 2>nul || echo   [FALLO] requests
python -c "import psutil; print('  [OK] psutil')" 2>nul || echo   [FALLO] psutil

echo.
echo ==========================================
echo  Instalacion completada con exito!
echo ==========================================
echo.
echo Pasos siguientes:
echo   1. Asegurate de tener MongoDB descargado en la carpeta 'mongodb\'
echo   2. Configura tu GEMINI_API_KEY en backend\.env
echo   3. Ejecuta launcher.py para iniciar la aplicacion
echo.
echo Para ejecutar PAU Study Master:
echo   python launcher.py
echo.
pause
