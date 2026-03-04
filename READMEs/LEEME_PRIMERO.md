# 🚀 INICIO RÁPIDO - PAU Study Master

## ⚡ Para empezar AHORA MISMO:

### 1️⃣ PRIMER PASO - Diagnóstico

Abre **CMD** o **PowerShell** en la carpeta de la app y ejecuta:

```bash
python diagnostico_mongodb.py
```

Este script te dirá **exactamente** qué falta o qué está mal.

---

### 2️⃣ Si MongoDB NO está instalado

El diagnóstico te dirá que falta `mongodb/bin/mongod.exe`

**Solución rápida:**

1. Descarga MongoDB 7.0 Community (ZIP): https://www.mongodb.com/try/download/community
2. Extrae el ZIP
3. Renombra la carpeta a `mongodb`
4. Cópiala dentro de la carpeta de tu app
5. Verifica que exista: `app/mongodb/bin/mongod.exe`

---

### 3️⃣ Si faltan DLLs

El diagnóstico te dirá "Error al ejecutar mongod.exe"

**Solución:**

Descarga e instala Visual C++ Redistributable:
- https://aka.ms/vs/17/release/vc_redist.x64.exe

---

### 4️⃣ Iniciar la aplicación

Una vez que el diagnóstico diga "✅ TODO ESTÁ CORRECTO":

```bash
python launcher.py
```

En otra terminal:

```bash
cd frontend
yarn install
yarn start
```

Abre tu navegador en: **http://localhost:3000**

---

## 📁 Archivos Importantes

- **`diagnostico_mongodb.py`** - Ejecuta PRIMERO para ver qué falta
- **`launcher.py`** - Inicia MongoDB y Backend
- **`SOLUCION_MONGODB_NO_INICIA.md`** - Guía completa de solución de problemas
- **`inicio_rapido.bat`** - Script automático para Windows

---

## 🆘 Si MongoDB NO Inicia

Lee el archivo:
```
SOLUCION_MONGODB_NO_INICIA.md
```

Tiene soluciones para TODOS los problemas comunes:
- MongoDB no instalado
- Faltan DLLs
- Puerto en uso
- Archivo lock corrupto
- Permisos
- Antivirus bloqueando
- Y más...

---

## ✅ Verificación Rápida

MongoDB está funcionando si ves:

1. ✅ Una ventana de consola abierta con logs de MongoDB
2. ✅ Mensaje: "Waiting for connections"
3. ✅ Archivos creados en `data/db/` (WiredTiger, etc.)

---

## 📱 Estructura de Carpetas Correcta

```
tu_app/
├── launcher.py
├── diagnostico_mongodb.py
├── inicio_rapido.bat
├── mongodb/                    ← Debes descargar esto
│   └── bin/
│       ├── mongod.exe         ← Archivo obligatorio
│       └── mongo.exe
├── data/
│   ├── db/                    ← MongoDB guarda datos aquí
│   └── logs/                  ← Logs de MongoDB
├── backend/
│   ├── server.py
│   └── .env
└── frontend/
    ├── src/
    └── package.json
```

---

## 🎯 Orden de Ejecución

1. **PRIMERO:** `python diagnostico_mongodb.py` (verificar)
2. **SEGUNDO:** `python launcher.py` (MongoDB + Backend)
3. **TERCERO:** `cd frontend && yarn start` (Frontend)
4. **CUARTO:** Abre http://localhost:3000

---

## 💾 Persistencia de Datos

Tus datos se guardan en: `data/db/`

**Para cerrar correctamente:**

1. Cierra el frontend (Ctrl+C)
2. Cierra launcher.py (Ctrl+C)
3. Espera a que MongoDB termine de escribir

**NUNCA cierres la ventana directamente** - Usa Ctrl+C

---

## 🔑 API Keys

Edita `backend/.env` y agrega tu Gemini API Key:

```env
GEMINI_API_KEY="tu-api-key-aqui"
```

Consigue tu key en: https://aistudio.google.com/apikey

---

**¿Problemas?** → Lee `SOLUCION_MONGODB_NO_INICIA.md`

**¡Listo para estudiar y aprobar la PAU!** 🎓✨
