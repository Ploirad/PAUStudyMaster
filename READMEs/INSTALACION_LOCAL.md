# 🚀 Instalación Local en Windows

## ✅ Solución al error de `emergentintegrations`

El error ocurría porque `emergentintegrations` es una librería exclusiva de Emergent Cloud que no está disponible en PyPI.

**Se ha creado `requirements_local.txt`** sin esta dependencia para que puedas ejecutar la app localmente.

---

## 📋 Pasos de instalación

### 1️⃣ Instalar dependencias de Python

```bash
cd app/backend
pip install -r requirements_local.txt
```

### 2️⃣ Configurar tu API Key de OpenAI

**Opción A: Editar el archivo `.env`**
```bash
# Abre el archivo app/backend/.env y cambia esta línea:
OPENAI_API_KEY="tu-api-key-aqui"
```

**Opción B: Usar el nuevo archivo `.env.local`**
```bash
# 1. Copia .env.local a .env
cp app/backend/.env.local app/backend/.env

# 2. Edita app/backend/.env y pon tu API key
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxx"
```

🔑 **Consigue tu API Key aquí:** https://platform.openai.com/api-keys

### 3️⃣ Instalar MongoDB localmente

Si no tienes MongoDB instalado:

**Windows:**
- Descarga: https://www.mongodb.com/try/download/community
- O usa MongoDB Atlas (gratis): https://www.mongodb.com/cloud/atlas

**Si usas MongoDB Atlas:**
Cambia `MONGO_URL` en `.env`:
```
MONGO_URL="mongodb+srv://usuario:password@cluster.mongodb.net/nombre_db"
```

### 4️⃣ Ejecutar el backend

```bash
cd app/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

El backend estará en: http://localhost:8001

### 5️⃣ Instalar y ejecutar el frontend

```bash
cd app/frontend
npm install
# o
yarn install

# Ejecutar
npm start
# o
yarn start
```

El frontend estará en: http://localhost:3000

---

## ⚙️ Configuración del archivo `.env`

Tu archivo `app/backend/.env` debe verse así:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"

# ⚠️ IMPORTANTE: Pon tu API key aquí
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxx"
```

---

## 🔍 Verificar que todo funciona

1. **Backend:** Abre http://localhost:8001/docs
2. **Frontend:** Abre http://localhost:3000
3. **MongoDB:** Verifica que esté corriendo en el puerto 27017

---

## ❓ Problemas comunes

### Error: "LLM API key not configured"
- Verifica que `OPENAI_API_KEY` esté configurada en `.env`
- Reinicia el servidor backend

### Error de MongoDB
- Verifica que MongoDB esté corriendo
- Comprueba que `MONGO_URL` en `.env` sea correcta

### Puerto 8001 ocupado
```bash
# Usa otro puerto
uvicorn server:app --reload --port 8002
```

---

## 📦 Archivos creados

- ✅ `requirements_local.txt` - Sin emergentintegrations
- ✅ `.env.local` - Plantilla de configuración local

---

## 🎯 Resumen

**¿Dónde poner la API Key de OpenAI?**
👉 En el archivo: `app/backend/.env`
👉 Línea: `OPENAI_API_KEY="tu-api-key-aqui"`

**¿Dónde conseguir la API Key?**
👉 https://platform.openai.com/api-keys
