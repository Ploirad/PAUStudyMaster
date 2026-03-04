@echo off
:: Script de inicio rápido para PAU Study Master
:: Este script verifica MongoDB antes de iniciar

echo ================================================
echo    PAU Study Master - Inicio Rapido
echo ================================================
echo.

:: Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no está instalado
    echo Por favor instala Python 3.8 o superior desde python.org
    pause
    exit /b 1
)

:: Ejecutar diagnóstico primero
echo [PASO 1] Ejecutando diagnostico de MongoDB...
echo.
python diagnostico_mongodb.py

if %errorlevel% neq 0 (
    echo.
    echo ERROR: El diagnostico encontro problemas
    echo Por favor resuelve los problemas antes de continuar
    pause
    exit /b 1
)

echo.
echo ================================================
echo [PASO 2] Iniciando aplicacion...
echo ================================================
echo.

:: Iniciar launcher
python launcher.py

if %errorlevel% neq 0 (
    echo.
    echo ERROR: La aplicacion no pudo iniciarse
    echo Revisa pau_study_master.log para mas detalles
    pause
    exit /b 1
)
