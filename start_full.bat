@echo off
echo ========================================
echo   PAU Study Master - Inicio Completo
echo ========================================
echo.

echo [1/2] Iniciando MongoDB y Backend...
echo Esto abrira una nueva ventana
echo.
start cmd /k "python launcher.py"

echo Esperando 10 segundos a que el backend este listo...
timeout /t 10 /nobreak

echo.
echo [2/2] Iniciando Frontend...
echo Esto abrira otra ventana
echo.
cd frontend
start cmd /k "yarn start"

echo.
echo ========================================
echo   APLICACION INICIADA
echo ========================================
echo.
echo Espera a que se abra el navegador automaticamente
echo.
echo IMPORTANTE: Para cerrar correctamente:
echo   1. Cierra la ventana del frontend (Ctrl+C)
echo   2. Cierra la ventana de launcher.py (Ctrl+C)
echo.
echo Presiona cualquier tecla para salir de esta ventana...
pause > nul
