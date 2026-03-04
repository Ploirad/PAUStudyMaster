@echo off
REM Script para ejecutar solo el backend (sin MongoDB integrado)
REM Util para debugging o cuando MongoDB ya esta corriendo

echo ==========================================
echo  PAU Study Master - Backend
echo ==========================================
echo.
echo Este script inicia SOLO el backend.
echo Asegurate de que MongoDB este corriendo en puerto 27017.
echo.
pause

cd /d "%~dp0\backend"

echo Iniciando backend en http://localhost:8001 ...
echo.
echo Presiona Ctrl+C para detener
echo.

python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

pause
