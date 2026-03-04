# Soluciones a Problemas Comunes - PAU Study Master

## Error: "No module named uvicorn"

### Causa
El Python que estás usando (`C:\Python314\python.exe`) no tiene instaladas las dependencias necesarias.

### Soluciones (en orden de preferencia)

---

## ✅ SOLUCIÓN 1: Instalar dependencias globalmente (MÁS FÁCIL)

1. **Abre PowerShell o CMD como Administrador**
   - Presiona Windows + X
   - Selecciona "Terminal (Admin)" o "PowerShell (Admin)"

2. **Navega a la carpeta del backend:**
   ```cmd
   cd ruta\a\tu\app_final\backend
   ```

3. **Instala las dependencias:**
   ```cmd
   C:\Python314\python.exe -m pip install -r requirements.txt
   ```

4. **Espera a que termine** (puede tardar 2-3 minutos)

5. **Ejecuta de nuevo launcher.py:**
   ```cmd
   cd ..
   C:\Python314\python.exe launcher.py
   ```

---

## ✅ SOLUCIÓN 2: Usar un entorno virtual (RECOMENDADO PARA DESARROLLO)

1. **Abre PowerShell o CMD en la carpeta app_final:**
   ```cmd
   cd ruta\a\tu\app_final
   ```

2. **Crea un entorno virtual:**
   ```cmd
   C:\Python314\python.exe -m venv venv
   ```

3. **Activa el entorno virtual:**
   ```cmd
   # En PowerShell:
   .\venv\Scripts\Activate.ps1
   
   # En CMD:
   .\venv\Scripts\activate.bat
   ```

4. **Instala las dependencias:**
   ```cmd
   pip install -r backend\requirements.txt
   pip install requests psutil
   ```

5. **Ejecuta el launcher:**
   ```cmd
   python launcher.py
   ```

---

## ✅ SOLUCIÓN 3: Script de instalación automático

Crea un archivo `instalar_dependencias.bat` con este contenido:

```batch
@echo off
echo ==========================================
echo  Instalando dependencias de PAU Study Master
echo ==========================================
echo.

cd /d "%~dp0"

echo Paso 1: Instalando dependencias del backend...
C:\Python314\python.exe -m pip install --upgrade pip
C:\Python314\python.exe -m pip install -r backend\requirements.txt

echo.
echo Paso 2: Instalando dependencias del launcher...
C:\Python314\python.exe -m pip install requests psutil

echo.
echo ==========================================
echo  Instalacion completada!
echo ==========================================
echo.
echo Ahora puedes ejecutar: launcher.py
echo.
pause
```

Guarda el archivo, haz doble clic en él, y espera a que termine.

---

## Verificar que uvicorn está instalado

Ejecuta esto en CMD o PowerShell:

```cmd
C:\Python314\python.exe -m pip list | findstr uvicorn
```

Deberías ver algo como:
```
uvicorn    0.25.0
```

Si no aparece, instálalo manualmente:
```cmd
C:\Python314\python.exe -m pip install uvicorn
```

---

## Error al abrir PowerShell scripts

Si al activar el entorno virtual ves el error:
```
cannot be loaded because running scripts is disabled on this system
```

**Solución:**
1. Abre PowerShell como Administrador
2. Ejecuta:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Confirma con "Y"
4. Intenta de nuevo

---

## Notas adicionales

### ¿Por qué pasa esto?
- Python en Windows puede tener múltiples instalaciones
- Cada instalación tiene sus propios paquetes instalados
- El `launcher.py` usa `sys.executable` que apunta a tu Python global
- Si ese Python no tiene los paquetes, falla

### ¿Qué paquetes necesita el launcher?
```
uvicorn==0.25.0
fastapi==0.110.1
motor==3.3.1
pymongo==4.5.0
google-generativeai==0.8.6
python-dotenv==1.2.1
PyPDF2==3.0.1
httpx==0.28.1
requests>=2.31.0
psutil>=5.9.0
```

### Alternativa: Ejecutar sin launcher

Si sigues teniendo problemas, puedes ejecutar manualmente:

1. **Inicia MongoDB** (si tienes MongoDB instalado globalmente):
   ```cmd
   mongod --dbpath ruta\a\tu\app_final\data\db --port 27017
   ```

2. **Inicia el backend** (en otra terminal):
   ```cmd
   cd ruta\a\tu\app_final\backend
   C:\Python314\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8001
   ```

3. **Abre el navegador:**
   - Ve a `http://localhost:8001` o `http://localhost:3000` (dependiendo de tu configuración)

---

## ¿Necesitas más ayuda?

Revisa los logs:
- `pau_study_master.log` - Log general de la aplicación
- `backend_stderr.log` - Errores del backend
- `backend_stdout.log` - Salida del backend

Si el error persiste, asegúrate de:
1. ✅ Tener Python 3.8 o superior instalado
2. ✅ Tener MongoDB descargado en la carpeta `mongodb/`
3. ✅ Haber configurado tu `GEMINI_API_KEY` en `backend/.env`
4. ✅ Tener permisos de administrador (en algunos casos)
