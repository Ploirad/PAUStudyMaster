# PAU Study Master - Guía de Instalación y Uso

## 🚀 Inicio Rápido

### Paso 1: Instalar Dependencias

**Opción A - Script Automático (Recomendado):**
```
Haz doble clic en: instalar_dependencias.bat
```

**Opción B - Manual:**
```cmd
# Abre CMD o PowerShell en esta carpeta y ejecuta:
python -m pip install -r backend\requirements.txt
python -m pip install requests psutil
```

### Paso 2: Descargar MongoDB

1. Ve a: https://www.mongodb.com/try/download/community
2. Descarga: **MongoDB Community Server 7.0** (ZIP para Windows)
   - ⚠️ **IMPORTANTE**: Descarga versión 7.0, NO 8.x (tiene bugs)
   - ⚠️ **IMPORTANTE**: Descarga el ZIP, NO el instalador MSI
3. Extrae el contenido
4. Copia la carpeta extraída dentro de este directorio con el nombre `mongodb`

La estructura final debe ser:
```
pau_study_master/
├── launcher.py
├── backend/
├── mongodb/          ← Carpeta que debes crear
│   └── bin/
│       ├── mongod.exe
│       └── mongo.exe
└── data/
```

### Paso 3: Configurar API Key de Gemini

1. Ve a: https://aistudio.google.com/apikey
2. Crea o copia tu API key (es gratis)
3. Abre el archivo: `backend\.env`
4. Reemplaza:
   ```
   GEMINI_API_KEY="pon-tu-gemini-api-key-aqui"
   ```
   Por:
   ```
   GEMINI_API_KEY="tu-clave-real-aqui"
   ```
5. Guarda el archivo

### Paso 4: ¡Ejecutar!

```cmd
python launcher.py
```

O simplemente haz doble clic en `launcher.py`

La aplicación se abrirá automáticamente en tu navegador en:
- **http://localhost:3000** (Frontend - la aplicación)
- **http://localhost:8001/api** (Backend - API)

---

## 🔧 Solución de Problemas

### Error: "No module named uvicorn"

**Causa:** Las dependencias de Python no están instaladas.

**Solución:**
```cmd
# Ejecuta este comando:
python -m pip install -r backend\requirements.txt
```

O ejecuta: `instalar_dependencias.bat`

### Error: "MongoDB no encontrado"

**Causa:** No has descargado MongoDB o no está en la ubicación correcta.

**Solución:**
1. Descarga MongoDB 7.0 ZIP desde: https://www.mongodb.com/try/download/community
2. Extrae el ZIP
3. Copia la carpeta resultante a `mongodb/` dentro de esta carpeta
4. Verifica que existe: `mongodb\bin\mongod.exe`

### Error: "Puerto 27017 ya está en uso"

**Causa:** Ya tienes MongoDB corriendo en tu sistema.

**Solución:**
```cmd
# Opción 1: Cierra MongoDB existente
taskkill /F /IM mongod.exe

# Opción 2: Usa el MongoDB que ya tienes corriendo
# Solo ejecuta: ejecutar_backend_solo.bat
```

### Error: "Backend no responde"

**Solución:**
1. Ejecuta: `diagnostico.bat` para ver qué falta
2. Revisa los logs:
   - `backend_stderr.log` - Errores del backend
   - `backend_stdout.log` - Salida del backend
   - `pau_study_master.log` - Log general

### Error relacionado con PowerShell

Si ves: `cannot be loaded because running scripts is disabled`

**Solución:**
```powershell
# Abre PowerShell como Administrador y ejecuta:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📝 Scripts Útiles

| Script | Descripción |
|--------|-------------|
| `instalar_dependencias.bat` | Instala todas las dependencias Python automáticamente |
| `diagnostico.bat` | Verifica que todo esté configurado correctamente |
| `ejecutar_backend_solo.bat` | Ejecuta solo el backend (útil si MongoDB ya está corriendo) |
| `launcher.py` | **PRINCIPAL** - Inicia toda la aplicación |

---

## 📂 Estructura del Proyecto

```
pau_study_master/
├── launcher.py                      # Inicia MongoDB + Backend + Frontend
├── instalar_dependencias.bat       # Instala dependencias automáticamente
├── diagnostico.bat                  # Verifica configuración
├── ejecutar_backend_solo.bat       # Solo backend (sin launcher)
│
├── backend/
│   ├── server.py                    # Código del backend
│   ├── requirements.txt             # Dependencias Python
│   └── .env                         # Configuración (API keys, etc.)
│
├── mongodb/                         # ← DEBES DESCARGAR ESTO
│   └── bin/
│       └── mongod.exe
│
├── data/
│   ├── db/                          # Base de datos (se crea automáticamente)
│   └── logs/                        # Logs de MongoDB
│
└── frontend/
    └── build/                       # Frontend compilado (ya incluido)
```

---

## ⚙️ Configuración Avanzada

### Variables de Entorno (backend/.env)

```env
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="pau_study_master"
CORS_ORIGINS="*"

# Google Gemini API
GEMINI_API_KEY="tu-clave-aqui"

# Opcional: OpenAI
OPENAI_API_KEY=""

# Opcional: Emergent LLM Key
EMERGENT_LLM_KEY=""
```

### Cambiar Puertos

Edita `launcher.py`:
```python
MONGODB_PORT = 27017  # Cambiar si necesitas otro puerto
BACKEND_PORT = 8001   # Cambiar si necesitas otro puerto
```

### Ejecutar sin Launcher (Manual)

**Terminal 1 - MongoDB:**
```cmd
mongodb\bin\mongod.exe --dbpath data\db --port 27017
```

**Terminal 2 - Backend:**
```cmd
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

**Terminal 3 - Frontend (si tienes el código fuente):**
```cmd
cd frontend
npm start
```

---

## 🧪 Verificar que Todo Funciona

### 1. Verificar instalación:
```cmd
diagnostico.bat
```

### 2. Probar backend:
```cmd
# Con la app corriendo, abre el navegador en:
http://localhost:8001/api/
```

Deberías ver:
```json
{"message":"PAU Study Master API - Powered by Google Gemini"}
```

### 3. Probar MongoDB:
```cmd
# Con la app corriendo, ejecuta:
mongodb\bin\mongo.exe --port 27017
```

Deberías ver el shell de MongoDB.

### 4. Probar Gemini API:
```cmd
cd app_final
python verificar_gemini.py
```

---

## 🛑 Detener la Aplicación

**Desde el launcher:**
- Presiona `Ctrl+C` en la terminal

**Manualmente:**
```cmd
# Cerrar MongoDB
taskkill /F /IM mongod.exe

# Cerrar backend
taskkill /F /IM python.exe
```

---

## 📚 Recursos Adicionales

- **Documentación de MongoDB:** https://www.mongodb.com/docs/
- **Documentación de FastAPI:** https://fastapi.tiangolo.com/
- **Google Gemini API:** https://ai.google.dev/docs
- **Obtener API Key de Gemini:** https://aistudio.google.com/apikey

---

## ❓ Preguntas Frecuentes

### ¿Necesito internet para usar la app?

Sí, la aplicación necesita internet para:
- Llamadas a la API de Google Gemini (IA)
- Solo la funcionalidad de IA requiere internet
- La base de datos es local y no necesita internet

### ¿Los datos se guardan localmente?

Sí, todos tus datos se guardan en la carpeta `data/db/` en tu computadora.
Nadie más tiene acceso a tus datos.

### ¿Gemini API es gratis?

Sí, Google ofrece un nivel gratuito generoso de Gemini API.
Ver límites en: https://ai.google.dev/pricing

### ¿Puedo usar OpenAI en vez de Gemini?

Sí, edita `backend/.env` y configura:
```env
OPENAI_API_KEY="tu-clave-openai"
GEMINI_API_KEY=""  # Déjalo vacío
```

### ¿Funciona en Mac/Linux?

El launcher actual está diseñado para Windows.
Para Mac/Linux, ejecuta manualmente los comandos (ver sección "Ejecutar sin Launcher").

---

## 🐛 Reportar Problemas

Si encuentras un bug o tienes problemas:

1. Ejecuta `diagnostico.bat` y guarda el resultado
2. Revisa los logs en `pau_study_master.log`
3. Toma una captura de pantalla del error
4. Reporta con todos estos detalles

---

## 📄 Licencia y Créditos

PAU Study Master - Tu asistente inteligente para aprobar la PAU
Desarrollado con ❤️ usando:
- FastAPI
- React
- MongoDB
- Google Gemini AI

---

**¿Listo para empezar? Ejecuta:**
```cmd
python launcher.py
```

¡Buena suerte con tus estudios! 🎓
