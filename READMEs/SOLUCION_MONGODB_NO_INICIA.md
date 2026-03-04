# 🔧 Solución: MongoDB No Inicia en Windows

## Problema
Al ejecutar `launcher.py`, MongoDB no se abre y la aplicación no funciona.

---

## 🔍 Paso 1: Ejecutar Diagnóstico

**Ejecuta este archivo primero:**
```bash
python diagnostico_mongodb.py
```

Este script te dirá exactamente qué está mal.

---

## ❌ Problemas Comunes y Soluciones

### 1️⃣ **"MongoDB no está instalado"**

**Síntoma:** No existe la carpeta `mongodb/bin/mongod.exe`

**Solución:**

1. Ve a: https://www.mongodb.com/try/download/community
2. Selecciona:
   - **Version:** 7.0.x (NO 8.x)
   - **Platform:** Windows
   - **Package:** ZIP (NO MSI)
3. Descarga el archivo ZIP
4. Extrae el ZIP (obtendrás una carpeta como `mongodb-win32-...`)
5. **Renombra** esa carpeta a `mongodb`
6. **Mueve** la carpeta aquí:
   ```
   tu_app/
   ├── launcher.py
   └── mongodb/          ← Aquí debe estar
       └── bin/
           ├── mongod.exe
           └── mongo.exe
   ```

**Verificar que quedó bien:**
```
tu_app/mongodb/bin/mongod.exe  ← Este archivo DEBE existir
```

---

### 2️⃣ **"Falta alguna DLL" o "Error al ejecutar mongod.exe"**

**Síntoma:** MongoDB se cierra inmediatamente o dice que faltan archivos

**Solución:**

1. **Instala Visual C++ Redistributable 2015-2022:**
   - Descarga: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Ejecuta el instalador
   - Reinicia tu PC

2. Si persiste, también instala:
   - Visual C++ Redistributable 2013: https://www.microsoft.com/es-es/download/details.aspx?id=40784

**Verificar:** Después de instalar, ejecuta en CMD:
```bash
cd mongodb\bin
mongod.exe --version
```
Deberías ver la versión de MongoDB.

---

### 3️⃣ **"Puerto 27017 ya está en uso"**

**Síntoma:** Mensaje de que el puerto está ocupado

**Soluciones:**

**Opción A - Terminar MongoDB existente:**
1. Abre **Administrador de Tareas** (Ctrl + Shift + Esc)
2. Ve a la pestaña **Detalles**
3. Busca `mongod.exe`
4. Click derecho → **Finalizar tarea**
5. Vuelve a ejecutar `launcher.py`

**Opción B - Usar netstat:**
```bash
netstat -ano | findstr :27017
taskkill /PID [número] /F
```

**Opción C - Reiniciar PC** (más fácil)

---

### 4️⃣ **"Shutdown no limpio" o archivo `mongod.lock`**

**Síntoma:** MongoDB dice que no se cerró correctamente

**Solución Fácil:**

Cuando ejecutes `launcher.py`, te preguntará:
```
¿Deseas limpiar la base de datos?
[L] Limpiar y empezar de cero (RECOMENDADO)
[R] Intentar reparar
[C] Cancelar
```

Selecciona **L** si no te importa perder los datos actuales.

**Solución Manual:**

1. Cierra launcher.py si está corriendo
2. Elimina manualmente:
   ```
   data/db/mongod.lock
   ```
3. Vuelve a ejecutar `launcher.py`

**Solución Completa (si nada funciona):**

1. Cierra launcher.py
2. **Elimina completamente la carpeta:**
   ```
   data/db/
   ```
3. Vuelve a ejecutar `launcher.py` (creará la carpeta de nuevo)

⚠️ **ADVERTENCIA:** Esto borrará TODOS tus datos

---

### 5️⃣ **"No hay permisos de escritura"**

**Síntoma:** Error de permisos en la carpeta `data/db`

**Soluciones:**

**Opción A - Ejecutar como Administrador:**
1. Click derecho en `launcher.py`
2. "Ejecutar como administrador"

**Opción B - Cambiar permisos:**
1. Click derecho en la carpeta `data`
2. Propiedades → Seguridad → Editar
3. Dale permisos de "Control total" a tu usuario

**Opción C - Mover la aplicación:**
Mueve toda la carpeta de la app a:
```
C:\Users\TuUsuario\Documents\PAUStudyMaster\
```
(Las carpetas de Documentos tienen menos restricciones)

---

### 6️⃣ **"Antivirus bloqueando mongod.exe"**

**Síntoma:** MongoDB inicia pero se cierra inmediatamente

**Solución:**

Agrega una excepción en tu antivirus:

**Windows Defender:**
1. Configuración de Windows
2. Privacidad y seguridad → Seguridad de Windows
3. Protección contra virus y amenazas
4. Administrar configuración
5. Exclusiones → Agregar exclusión
6. Carpeta → Selecciona tu carpeta `mongodb`

**Otros antivirus:**
Busca "agregar excepción" o "lista blanca" en la configuración.

---

### 7️⃣ **MongoDB inicia pero crashea después**

**Síntoma:** MongoDB arranca pero se cierra solo después de unos segundos

**Causa probable:** Base de datos corrupta

**Solución:**

1. **Cierra todo** (launcher.py y cualquier mongod.exe)

2. **Limpia la base de datos:**
   ```bash
   # En Windows CMD
   cd tu_app
   rmdir /s /q data\db
   mkdir data\db
   ```

3. **Vuelve a iniciar:**
   ```bash
   python launcher.py
   ```

---

## ✅ Verificación Final

Una vez que MongoDB inicie correctamente, verifica:

1. **Una ventana de CMD/consola se abre** con logs de MongoDB
2. **El log dice:** `Waiting for connections`
3. **Archivos en `data/db/`:**
   ```
   data/db/
   ├── WiredTiger
   ├── WiredTiger.lock
   ├── WiredTiger.turtle
   └── (otros archivos .wt)
   ```

Si ves esto, **MongoDB está funcionando correctamente** ✅

---

## 🆘 Si Nada Funciona

### Opción 1: Logs Detallados

1. Revisa el log de MongoDB:
   ```
   data/logs/mongod.log
   ```
   
2. Revisa el log de launcher:
   ```
   pau_study_master.log
   ```

3. Busca mensajes de error al final de los archivos

### Opción 2: Instalación Limpia

1. **Elimina todo:**
   ```bash
   rmdir /s /q mongodb
   rmdir /s /q data
   ```

2. **Descarga MongoDB de nuevo** (sigue Problema 1️⃣)

3. **Ejecuta:**
   ```bash
   python launcher.py
   ```

### Opción 3: Usa MongoDB Atlas (Cloud)

Si no puedes hacer funcionar MongoDB local:

1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Crea un cluster gratis (M0)
4. Obtén tu connection string
5. Edita `backend/.env`:
   ```
   MONGO_URL="mongodb+srv://usuario:password@cluster.mongodb.net/"
   DB_NAME="pau_study_master"
   ```
6. **IMPORTANTE:** Ya NO necesitas ejecutar MongoDB local
7. Solo ejecuta el backend y frontend

---

## 📞 Contacto

Si después de seguir todos estos pasos MongoDB sigue sin funcionar:

1. Ejecuta: `python diagnostico_mongodb.py`
2. Copia TODA la salida del diagnóstico
3. Incluye también los últimos 50 líneas de:
   - `pau_study_master.log`
   - `data/logs/mongod.log`

---

## 📝 Checklist Rápido

Antes de pedir ayuda, verifica que hayas:

- [ ] Descargado MongoDB 7.0 Community (ZIP, no MSI)
- [ ] Copiado la carpeta a `mongodb/`
- [ ] Instalado Visual C++ Redistributable
- [ ] Ejecutado `diagnostico_mongodb.py`
- [ ] Intentado ejecutar como Administrador
- [ ] Cerrado otros procesos de MongoDB
- [ ] Revisado que el antivirus no bloquee
- [ ] Limpiado `data/db/` y probado de nuevo

---

## 🎯 Inicio Rápido (Si Ya Tienes Todo Instalado)

```bash
# Método 1: Script automático
inicio_rapido.bat

# Método 2: Manual
python launcher.py
```

En otra terminal:
```bash
cd frontend
yarn start
```

Luego abre: http://localhost:3000

---

**¡Con estas soluciones, MongoDB debería funcionar correctamente!** 🚀
