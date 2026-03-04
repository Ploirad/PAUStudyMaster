# 🚀 Guía para Construir el Ejecutable de PAU Study Master

Esta guía te ayudará a crear un archivo `.exe` auto-contenido de PAU Study Master para Windows.

## 📋 Requisitos Previos

### Software Necesario:
1. **Python 3.8+** instalado
2. **Node.js 16+** y **Yarn** instalados
3. **MongoDB Community Server** (portable)

### Verificar Instalaciones:

```bash
python --version  # Debe mostrar 3.8 o superior
node --version    # Debe mostrar 16.0 o superior
yarn --version    # Debe mostrar 1.22 o superior
```

## 🐞 Paso 1: Corregir Bugs Críticos

**IMPORTANTE**: Antes de construir el ejecutable, asegúrate de que todos los bugs críticos estén corregidos.

### Verificar que los contextos existan:

```bash
ls frontend/src/contexts/
```

Deberías ver:
- `LoadingContext.jsx`
- `SubjectsContext.jsx`

Si no existen, **ya los hemos creado en esta sesión**.

## 📦 Paso 2: Compilar el Frontend

```bash
cd frontend
yarn install
yarn build
cd ..
```

Esto creará la carpeta `frontend/build` con los archivos estáticos.

## 🐍 Paso 3: Instalar Dependencias de Python

Instala las dependencias del backend + herramientas de empaquetado:

```bash
cd backend
pip install -r requirements.txt
cd ..

# Instalar herramientas adicionales
pip install pyinstaller psutil requests
```

## 📧 Paso 4: Descargar MongoDB Portable

1. Ve a: https://www.mongodb.com/try/download/community
2. Descarga la versión **portable/ZIP** (no MSI)
3. Extrae el contenido
4. Crea la carpeta `mongodb` en el directorio del proyecto
5. Copia el contenido extraído a `mongodb/`

La estructura debe quedar:
```
PAUStudyMaster/
├── mongodb/
│   └── bin/
│       ├── mongod.exe
│       ├── mongo.exe
│       └── ...
```

## 🔨 Paso 5: Ejecutar el Script de Construcción
```bash
python build_exe.py
```

Este script:
1. Verificará todas las dependencias
2. Compilará el ejecutable con PyInstaller
3. Empaquetará el backend, frontend y MongoDB
4. Creará la carpeta `dist/PAUStudyMaster` con todo listo

**Tiempo estimado**: 3-5 minutos

## 📋 Paso 6: Prueba Local

Antes de distribuir, prueba el ejecutable:

```bash
cd dist/PAUStudyMaster
PAUStudyMaster.exe
```

Verifica que:
- ✅ MongoDB inicia correctamente
- ✅ Backend inicia sin errores
- ✅ Frontend carga en el navegador
- ✅ Puedes iniciar sesión
- ✅ Todas las funcionalidades funcionan

## 📦 Paso 7: Crear Paquete de Distribución
### Opción A: ZIP Simple

```bash
# Desde la carpeta del proyecto
cd dist
# Crear ZIP
Compress-Archive -Path PAUStudyMaster -DestinationPath PAUStudyMaster_v1.0.0.zip
```

### Opción B: Instalador con Inno Setup (Recomendado)

1. Descarga Inno Setup: https://jrsoftware.org/isdl.php
2. Crea un script `.iss` (ver ejemplo abajo)
3. Compila el instalador

**Ejemplo de script Inno Setup** (`installer.iss`):

```ini
[Setup]
AppName=PAU Study Master
AppVersion=1.0.0
DefaultDirName={pf}\PAUStudyMaster
DefaultGroupName=PAU Study Master
OutputDir=installers
OutputBaseFilename=PAUStudyMaster_Setup_v1.0.0
Compression=lzma2
SolidCompression=yes

[Files]
Source: "dist\PAUStudyMaster\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\PAU Study Master"; Filename: "{app}\PAUStudyMaster.exe"
Name: "{commondesktop}\PAU Study Master"; Filename: "{app}\PAUStudyMaster.exe"

[Run]
Filename: "{app}\PAUStudyMaster.exe"; Description: "Iniciar PAU Study Master"; Flags: nowait postinstall skipifsilent
```

## 📊 Tamaño Estimado del Paquete

- **Con MongoDB**: ~150-200 MB
- **Sin MongoDB**: ~80-100 MB

## ⚠️ Problemas Comunes

### Error: "No module named 'uvicorn'"

**Solución**: Añade a `build_exe.py`:
```python
'--hidden-import=uvicorn.logging',
'--hidden-import=uvicorn.loops',
'--hidden-import=uvicorn.protocols',
```

### Error: "MongoDB no inicia"

**Solución**: Verifica que:
1. La carpeta `mongodb/bin` existe
2. `mongod.exe` está presente
3. Tienes permisos de escritura en `data/db`

### El ejecutable es demasiado grande

**Solución**: Usa `--onefile` con cuidado. Considera:
- Distribuir MongoDB por separado
- Usar `--exclude-module` para módulos no usados
- Comprimir con UPX (incluido en PyInstaller)

### Error: "Frontend no carga"

**Solución**: 
1. Verifica que `yarn build` se completó
2. Asegúrate de que `frontend/build` existe
3. Revisa que las rutas en PyInstaller sean correctas

## 🛠️ Optimizaciones Avanzadas

### Reducir Tamaño del Ejecutable

```python
# En build_exe.py, añade:
'--exclude-module=matplotlib',
'--exclude-module=scipy',
'--exclude-module=pandas',  # Si no se usan
'--upx-dir=/path/to/upx',  # Compresión UPX
```

### Firma Digital (Opcional pero Recomendado)

Para evitar advertencias de Windows Defender:

1. Obtén un certificado de código
2. Firma el ejecutable con `signtool`:

```bash
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com dist/PAUStudyMaster/PAUStudyMaster.exe
```

## 📝 Checklist Final

Antes de distribuir, verifica:

- [ ] Todos los bugs críticos corregidos
- [ ] Frontend compilado (`yarn build`)
- [ ] Ejecutable prueba local exitosa
- [ ] MongoDB incluido o instrucciones claras
- [ ] README.md actualizado
- [ ] Versión documentada
- [ ] Logs de prueba revisados
- [ ] Sin datos de prueba sensibles
- [ ] `.env` con valores por defecto seguros

## 🚀 Distribución

### Opciones de Distribución:

1. **Google Drive / Dropbox**: Sube el ZIP
2. **GitHub Releases**: Si el proyecto es público
3. **Mega / MediaFire**: Para archivos grandes
4. **Sitio web propio**: Host directo

### Incluir en el Paquete:

```
PAUStudyMaster_v1.0.0/
├── PAUStudyMaster.exe
├── README.md           # Instrucciones de uso
├── LICENSE.txt         # Licencia
├── CHANGELOG.md        # Historial de cambios
└── mongodb/            # (opcional) MongoDB portable
```

## 🔄 Actualizaciones Futuras

Para versiones nuevas:

1. Actualiza `AppVersion` en el script de Inno Setup
2. Documenta cambios en `CHANGELOG.md`
3. Reconstruye con `python build_exe.py`
4. Prueba exhaustivamente
5. Redistribuye

---

## 🆘 Soporte

Si tienes problemas durante la construcción:

1. Revisa los logs de PyInstaller en `build/PAUStudyMaster/`
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de usar Python 64-bit
4. Intenta con `--onedir` en lugar de `--onefile` para debugging

---

**¡Buena suerte con la construcción! 👍**
