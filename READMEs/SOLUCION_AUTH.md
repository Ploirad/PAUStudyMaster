# 🔐 Solución al Error de Autenticación: "Not Found"

## ❌ El Problema

Estás accediendo a: `http://localhost:8001/auth/callback`
- **Puerto 8001 = Backend (FastAPI)** - Solo APIs, no tiene interfaz web
- El backend NO tiene una ruta `/auth/callback`, solo tiene `/api/auth/session`

## ✅ La Solución

Debes acceder a: `http://localhost:3000`
- **Puerto 3000 = Frontend (React)** - Tiene la interfaz web y el callback de auth

---

## 🎯 Pasos para iniciar sesión correctamente:

### 1️⃣ Asegúrate de que AMBOS servicios estén corriendo

**Terminal 1 - Backend:**
```bash
cd app/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```
✅ Deberías ver: `Uvicorn running on http://0.0.0.0:8001`

**Terminal 2 - Frontend:**
```bash
cd app/frontend
npm start
# o
yarn start
```
✅ Deberías ver: `Compiled successfully! On your network: http://localhost:3000`

### 2️⃣ Accede al frontend (NO al backend)

🌐 **Abre tu navegador en:** http://localhost:3000

❌ **NO abras:** http://localhost:8001 (esto es solo para APIs)

### 3️⃣ Inicia sesión

1. En `http://localhost:3000` verás la página de login
2. Haz clic en "Iniciar sesión con Google"
3. Completa la autenticación de Google
4. Serás redirigido a `http://localhost:3000/auth/callback` (correcto ✅)
5. El frontend procesará el callback y te llevará al dashboard

---

## 🔍 ¿Por qué ocurrió este error?

### Flujo INCORRECTO (lo que hiciste):
```
1. Usuario entra a http://localhost:8001 (backend)
2. Backend intenta mostrar una página web → ❌ Not Found
3. Backend solo sirve APIs en /api/*
```

### Flujo CORRECTO:
```
1. Usuario entra a http://localhost:3000 (frontend) ✅
2. Frontend muestra página de login
3. Usuario hace clic en "Iniciar sesión"
4. Se redirige a Google Auth
5. Google Auth redirige a http://localhost:3000/auth/callback ✅
6. Frontend procesa el callback
7. Frontend llama a http://localhost:8001/api/auth/session (API del backend)
8. Backend devuelve los datos del usuario
9. Usuario ve el dashboard
```

---

## 📊 Resumen de Puertos

| Servicio | Puerto | URL | Propósito |
|----------|--------|-----|-----------|
| **Frontend (React)** | 3000 | http://localhost:3000 | Interfaz web - **USA ESTA** |
| **Backend (FastAPI)** | 8001 | http://localhost:8001 | Solo APIs - No acceder directamente |

---

## 🧪 Verificar que todo funciona

### 1. Verificar Backend (en terminal o navegador):
```bash
curl http://localhost:8001/docs
```
O abre: http://localhost:8001/docs
✅ Deberías ver la documentación de FastAPI

### 2. Verificar Frontend:
Abre: http://localhost:3000
✅ Deberías ver la página de login de "PAU Study Master"

---

## 🆘 Problemas Comunes

### "Cannot connect to backend"
- Verifica que el backend esté corriendo en puerto 8001
- Verifica que MongoDB esté corriendo
- Revisa los logs del backend

### "Frontend no carga"
- Verifica que instalaste las dependencias: `npm install` o `yarn install`
- Revisa que el puerto 3000 no esté ocupado
- Mira los logs en la terminal del frontend

### "Authentication failed"
- Verifica que `OPENAI_API_KEY` esté configurada en `backend/.env`
- Verifica que MongoDB esté corriendo y accesible

---

## 🎉 Una vez que todo funcione:

1. **Accede siempre a:** http://localhost:3000
2. **Nunca accedas directamente a:** http://localhost:8001 (solo para consultar APIs en /docs)
3. El frontend se comunicará automáticamente con el backend

---

## 📱 URLs Importantes

- **App (Frontend):** http://localhost:3000
- **API Docs (Backend):** http://localhost:8001/docs
- **Login Page:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard

¡Ahora sí deberías poder iniciar sesión correctamente! 🚀
