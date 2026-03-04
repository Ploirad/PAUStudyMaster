# 🔧 Solución al Problema de Persistencia de Datos

## Problema Identificado

Los datos se perdían porque MongoDB no estaba configurado correctamente para persistir datos en disco. Los datos solo existían en memoria.

## Cambios Realizados

### 1. **Configuración Mejorada de MongoDB** (`launcher.py`)

Se agregaron las siguientes opciones críticas al comando de MongoDB:

```python
'--storageEngine', 'wiredTiger',  # Motor de almacenamiento explícito
'--journal',  # Habilitar journaling para persistencia
'--noauth'  # Sin autenticación para desarrollo local
```

**¿Por qué esto soluciona el problema?**
- `--journal`: Activa el journaling, que asegura que los datos se escriban en disco de forma segura
- `--storageEngine wiredTiger`: Usa explícitamente WiredTiger, el motor de almacenamiento persistente de MongoDB

### 2. **Verificación de Permisos**

Se agregó verificación de que el directorio `data/db` tiene permisos de escritura antes de iniciar MongoDB.

### 3. **Cierre Limpio de MongoDB**

Se mejoró la función `cleanup()` para:
- Cerrar MongoDB de forma limpia (usando `terminate()` en lugar de `kill()`)
- Esperar hasta 10 segundos para que MongoDB complete la escritura
- Dar 2 segundos adicionales para flush final de datos
- Verificar que los archivos existen después del cierre

### 4. **Logging Mejorado**

Se agregaron logs para:
- Ver qué archivos crea MongoDB en `data/db`
- Confirmar que los datos se están guardando
- Detectar problemas de persistencia

### 5. **Base de Datos Consistente**

Se cambió `DB_NAME` de `"test_database"` a `"pau_study_master"` en el archivo `.env` del backend para usar el nombre correcto.

## Cómo Usar la Aplicación Ahora

### **Inicio Correcto:**

```bash
# Paso 1: Inicia launcher.py (MongoDB + Backend)
python launcher.py

# Paso 2: En otra terminal, inicia el frontend
cd frontend
yarn start
```

### **Cierre Correcto:**

**IMPORTANTE:** Para que los datos persistan, debes cerrar en este orden:

1. **Primero:** Cierra el frontend (Ctrl+C en la terminal de yarn)
2. **Segundo:** Cierra launcher.py (Ctrl+C en la terminal de launcher.py)

Esto asegura que MongoDB tenga tiempo de escribir todos los datos en disco.

### **Verificar que los Datos se Guardan:**

Después de registrarte y agregar algunos datos, ejecuta:

```bash
python verificar_persistencia.py
```

Este script te mostrará:
- ✅ Si hay archivos de datos en `data/db`
- ✅ Cuántos documentos hay en cada colección
- ✅ Si MongoDB está guardando correctamente

## ¿Qué Deberías Ver en `data/db`?

Después de usar la aplicación, deberías ver archivos como:

```
data/db/
├── WiredTiger
├── WiredTiger.lock
├── WiredTiger.turtle
├── WiredTiger.wt
├── collection-*.wt  (tus colecciones)
├── index-*.wt       (índices)
└── _mdb_catalog.wt
```

Si ves estos archivos, **tus datos están guardados en disco** ✅

## Solución de Problemas

### Si aún se pierden los datos:

1. **Verifica permisos:**
   ```bash
   # En Windows, ejecuta como Administrador
   # Click derecho en launcher.py → "Ejecutar como administrador"
   ```

2. **Verifica que MongoDB crea archivos:**
   - Después de iniciar, verifica que existen archivos en `data/db/`
   - Deberías ver al menos archivos `WiredTiger*`

3. **Cierra de forma limpia:**
   - NUNCA cierres la ventana directamente
   - SIEMPRE usa Ctrl+C para cerrar los procesos
   - Espera a que aparezca el mensaje de cierre

4. **Ejecuta el script de verificación:**
   ```bash
   python verificar_persistencia.py
   ```

5. **Revisa los logs:**
   ```bash
   # Ver log de launcher
   type pau_study_master.log
   
   # Ver log de MongoDB
   type data\logs\mongod.log
   ```

### Si el directorio data/db está vacío:

Esto significa que MongoDB NO está usando ese directorio. Posibles causas:

1. **Permisos insuficientes** → Ejecuta como administrador
2. **Antivirus bloqueando** → Agrega excepción para mongod.exe
3. **MongoDB usa otra ubicación** → Verifica los logs

## Qué Hacer Ahora

1. ✅ **Prueba la aplicación:**
   - Inicia con `python launcher.py`
   - Inicia frontend con `yarn start`
   - Regístrate y agrega datos
   
2. ✅ **Verifica persistencia:**
   - Ejecuta `python verificar_persistencia.py`
   - Verifica que hay archivos en `data/db/`
   
3. ✅ **Prueba reinicio:**
   - Cierra TODO (frontend primero, luego launcher)
   - Reinicia la aplicación
   - Verifica que tus datos siguen ahí

## Resumen de la Solución

**Antes:** MongoDB corría sin journaling → Datos solo en memoria → Se perdían al cerrar

**Ahora:** MongoDB con journaling activado → Datos se escriben en disco → Persisten después de cerrar

---

**¿Tienes problemas?** Ejecuta `python verificar_persistencia.py` y revisa los logs en `pau_study_master.log`
