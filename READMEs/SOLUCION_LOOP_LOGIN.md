# 🔄 Solución al Loop Infinito Login ↔ Dashboard

## 🔍 Problema

La aplicación está haciendo un loop infinito entre `/login` y `/dashboard`:
- Login → Dashboard → Login → Dashboard → ...

## 🎯 Causas Posibles

### 1. **Cookie no se está guardando correctamente**
El archivo `AuthCallback.jsx` guarda el `session_token` en una cookie:
```javascript
document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
```

### 2. **Las verificaciones de autenticación fallan**
- `Login.jsx` verifica si hay sesión → si hay, va a Dashboard
- `Dashboard.jsx` verifica si hay sesión → si no hay, va a Login
- Si la cookie no se lee bien, ocurre el loop

---

## ✅ Soluciones

### Solución 1: Verificar cookies en el navegador

1. **Abre las DevTools** (F12)
2. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
3. Mira **Cookies** → `http://localhost:3000`
4. Busca la cookie `session_token`

**Si NO aparece la cookie:**
- El problema está en `AuthCallback.jsx` - la cookie no se guarda

**Si SÍ aparece la cookie:**
- El problema está en cómo el backend la lee

---

### Solución 2: Verificar llamadas a `/api/auth/me`

1. Abre **DevTools** (F12) → pestaña **Network**
2. Recarga la página
3. Busca la llamada a `/api/auth/me`
4. Mira la respuesta:

**Si devuelve 200 OK:**
- ✅ La autenticación funciona, pero hay un bug en el frontend

**Si devuelve 401 Unauthorized:**
- ❌ El backend no está leyendo la cookie correctamente

---

### Solución 3: Limpiar caché y cookies

A veces las cookies viejas causan problemas:

1. **Chrome:**
   - Presiona `Ctrl + Shift + Del`
   - Selecciona "Cookies y otros datos de sitios"
   - Elige "Última hora"
   - Haz clic en "Borrar datos"

2. **Firefox:**
   - Presiona `Ctrl + Shift + Del`
   - Selecciona "Cookies"
   - Elige "Última hora"
   - Haz clic en "Limpiar ahora"

3. **Recarga la página** con `Ctrl + F5` (recarga forzada)

---

### Solución 4: Verificar el backend

El backend lee la cookie de dos formas:

1. **Desde las cookies del navegador** (automático con `credentials: 'include'`)
2. **Desde el header `Authorization`** (manual)

Verifica en `server.py` línea 233-249 la función `get_current_user`:

```python
async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> User:
    # Obtener session_token de cookie o header
    session_token = request.cookies.get('session_token') if request else None
    
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
        else:
            session_token = authorization
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
```

**Asegúrate que `request.cookies.get('session_token')` está funcionando.**

---

### Solución 5: Modo de prueba sin autenticación

Si quieres probar la app sin el sistema de autenticación temporalmente:

1. **Comenta la verificación en `Dashboard.jsx`** (líneas 27-47):

```javascript
// Comentar temporalmente para debugging
/*
useEffect(() => {
  if (location.state?.user) return;
  
  const checkAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Not authenticated');
      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      navigate('/login');
    }
  };
  
  checkAuth();
}, [location.state, navigate]);
*/

// Agregar temporalmente:
useEffect(() => {
  setUser({ name: "Usuario de Prueba", email: "test@test.com", user_id: "test123" });
  setIsAuthenticated(true);
}, []);
```

2. **Navega directamente a:** `http://localhost:3000/dashboard`

⚠️ **IMPORTANTE:** Esto es solo para debugging. Debes revertir los cambios después.

---

## 🔧 Debugging Paso a Paso

### Paso 1: Abrir DevTools Console

Agrega estos `console.log` en `AuthCallback.jsx` línea 40-45:

```javascript
const data = await response.json();
console.log('✅ Auth data received:', data);
console.log('📦 Session token:', data.session_token);

// Set cookie manually with better compatibility
document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
console.log('🍪 Cookie set:', document.cookie);
```

### Paso 2: Verificar en Login.jsx

Agrega este `console.log` en `Login.jsx` línea 15-24:

```javascript
const checkAuth = async () => {
  try {
    console.log('🔍 Checking auth in Login...');
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include'
    });
    console.log('📡 Auth response status:', response.status);
    if (response.ok) {
      console.log('✅ Already logged in, redirecting to dashboard');
      navigate('/dashboard');
    } else {
      console.log('❌ Not authenticated, staying on login');
    }
  } catch (error) {
    console.log('⚠️ Auth check failed:', error);
  }
};
```

### Paso 3: Verificar en Dashboard.jsx

Agrega logs en `Dashboard.jsx` línea 31-44:

```javascript
const checkAuth = async () => {
  try {
    console.log('🔍 Checking auth in Dashboard...');
    console.log('🍪 Current cookies:', document.cookie);
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include'
    });
    console.log('📡 Auth response status:', response.status);
    if (!response.ok) throw new Error('Not authenticated');
    const userData = await response.json();
    console.log('✅ User data received:', userData);
    setUser(userData);
    setIsAuthenticated(true);
  } catch (error) {
    console.log('❌ Auth failed, redirecting to login:', error);
    setIsAuthenticated(false);
    navigate('/login');
  }
};
```

### Paso 4: Revisar los logs

Mira la consola del navegador y busca el patrón:
```
🔍 Checking auth in Dashboard...
🍪 Current cookies: session_token=xxxxx
📡 Auth response status: 401
❌ Auth failed, redirecting to login
🔍 Checking auth in Login...
📡 Auth response status: 401
❌ Not authenticated, staying on login
```

Esto te dirá exactamente dónde está fallando.

---

## 🎯 Solución Definitiva

Una vez identificado el problema, probablemente necesitarás:

### Opción A: El backend no lee las cookies

Modifica `server.py` para mejor debugging:

```python
async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> User:
    # Debug
    logging.info(f"🍪 Cookies recibidas: {request.cookies if request else 'None'}")
    
    session_token = request.cookies.get('session_token') if request else None
    logging.info(f"🔑 Session token: {session_token}")
    
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
        else:
            session_token = authorization
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Resto del código...
```

### Opción B: Problema con SameSite

Si estás usando Chrome, prueba cambiar la cookie en `AuthCallback.jsx`:

```javascript
// Cambiar de:
document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

// A:
document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
```

⚠️ **Nota:** Esto requiere HTTPS. Para desarrollo local, usa `SameSite=Lax`.

---

## 📞 Si nada funciona

Contacta al desarrollador con:
1. Captura de pantalla de DevTools → Network → `/api/auth/me`
2. Captura de DevTools → Application → Cookies
3. Logs de la consola del navegador
4. Logs del backend (`backend_stderr.log`)

---

## ✅ Verificación Final

Una vez solucionado, deberías poder:

1. ✅ Ir a `http://localhost:3000`
2. ✅ Hacer clic en "Iniciar sesión con Google"
3. ✅ Ser redirigido a Google Auth
4. ✅ Volver a `http://localhost:3000/auth/callback`
5. ✅ Ser redirigido a `http://localhost:3000/dashboard`
6. ✅ Ver el dashboard sin loops
7. ✅ Recargar la página y seguir autenticado

Si esto funciona, ¡el problema está resuelto! 🎉
