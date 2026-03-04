# 📝 PAU Study Master - Guía de Persistencia de Datos

## 🎯 Problema Solucionado

**Antes:** Los datos se perdían al cerrar el frontend porque MongoDB no estaba configurado para persistir datos en disco.

**Ahora:** MongoDB guarda todos los datos de forma permanente en la carpeta `data/db/`.

---

## 🚀 Inicio Rápido

### Opción 1: Inicio Automático (Recomendado)

Simplemente ejecuta:
```bash
start_full.bat
```

Esto iniciará automáticamente MongoDB, Backend y Frontend en el orden correcto.

### Opción 2: Inicio Manual

**Terminal 1 - Backend:**
```bash
python launcher.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

---

## 🛑 Cierre Correcto (MUY IMPORTANTE)

Para que los datos persistan, **debes cerrar en este orden**:

### 1️⃣ Primero: Cierra el Frontend
- Ve a la terminal donde corre `yarn start`
- Presiona `Ctrl+C`
- Espera a que termine

### 2️⃣ Segundo: Cierra el Backend/MongoDB
- Ve a la terminal donde corre `launcher.py`
- Presiona `Ctrl+C`
- Espera a que aparezca "Todos los procesos terminados"

⚠️ **NUNCA cierres las ventanas directamente (con la X)** - esto puede causar pérdida de datos.

---

## ✅ Verificar que los Datos se Guardan

### Método 1: Script de Verificación

```bash
python verificar_persistencia.py
```

Este script te mostrará:
- ✅ Archivos creados en `data/db/`
- ✅ Número de colecciones y documentos
- ✅ Estado de conexión a MongoDB

### Método 2: Verificación Manual

1. Abre la carpeta `data/db/`
2. Deberías ver archivos como:
   - `WiredTiger`
   - `WiredTiger.wt`
   - `collection-*.wt`
   - `index-*.wt`

Si ves estos archivos, **tus datos están guardados** ✅

---

## 🧪 Prueba de Persistencia

### Paso a Paso:

1. **Inicia la aplicación**
   ```bash
   python launcher.py
   cd frontend && yarn start
   ```

2. **Agrega datos**
   - Regístrate con Google
   - Crea una asignatura
   - Agrega un examen o flashcard

3. **Verifica que se guardó**
   ```bash
   python verificar_persistencia.py
   ```
   Deberías ver documentos en las colecciones.

4. **Cierra correctamente**
   - Ctrl+C en frontend
   - Ctrl+C en launcher.py

5. **Reinicia la aplicación**
   ```bash
   python launcher.py
   cd frontend && yarn start
   ```

6. **Verifica tus datos**
   - Inicia sesión de nuevo
   - Tus datos deberían estar ahí ✅

---

## 🔧 Cambios Técnicos Realizados

### 1. MongoDB Configurado con Journaling

En `launcher.py`, MongoDB ahora inicia con:
```python
'--storageEngine', 'wiredTiger',  # Almacenamiento persistente
'--journal',                       # Journaling activado
```

El **journaling** asegura que todas las operaciones se escriben en disco de forma segura.

### 2. Cierre Limpio de MongoDB

La función `cleanup()` ahora:
- Espera hasta 10 segundos para que MongoDB cierre limpiamente
- Da 2 segundos adicionales para flush de datos
- Verifica que los archivos existen después del cierre

### 3. Verificación de Permisos

Se verifica que el directorio `data/db/` tiene permisos de escritura antes de iniciar MongoDB.

### 4. Base de Datos Consistente

El nombre de la base de datos se corrigió a `pau_study_master` en todos lados.

---

## 🐛 Solución de Problemas

### ❌ Problema: data/db está vacío

**Causa:** MongoDB no puede escribir en el directorio.

**Solución:**
1. Ejecuta como **Administrador**:
   - Click derecho en `launcher.py`
   - "Ejecutar como administrador"

2. Verifica permisos de la carpeta `data/`

3. Desactiva temporalmente el antivirus (puede bloquear mongod.exe)

### ❌ Problema: Los datos aún se pierden

**Diagnóstico:**

1. **Verifica logs de MongoDB:**
   ```bash
   type data\logs\mongod.log
   ```
   Busca errores relacionados con escritura.

2. **Verifica que MongoDB usa el directorio correcto:**
   ```bash
   python verificar_persistencia.py
   ```

3. **Revisa el log de launcher:**
   ```bash
   type pau_study_master.log
   ```

### ❌ Problema: "PermissionError" al iniciar

**Causa:** Otra instancia de MongoDB está corriendo.

**Solución:**
1. Abre el Administrador de Tareas
2. Busca procesos `mongod.exe`
3. Cierra todos los procesos de MongoDB
4. Reinicia `launcher.py`

### ❌ Problema: MongoDB no inicia

**Posibles causas:**

1. **Falta Visual C++ Redistributable:**
   - Descarga e instala: https://aka.ms/vs/17/release/vc_redist.x64.exe

2. **Puerto 27017 ocupado:**
   - Cierra otras instancias de MongoDB
   - O cambia el puerto en `launcher.py`

3. **Archivos corruptos en data/db:**
   - Elimina todo en `data/db/`
   - Reinicia MongoDB (empezará con BD limpia)

---

## 📊 ¿Qué Datos se Guardan?

Todas las colecciones persisten en `pau_study_master`:

- ✅ `users` - Tu información de usuario
- ✅ `user_sessions` - Sesiones activas
- ✅ `subjects` - Asignaturas creadas
- ✅ `exams` - Exámenes programados
- ✅ `flashcards` - Tarjetas de estudio
- ✅ `checklist_items` - Listas de verificación
- ✅ `schedules` - Horarios subidos
- ✅ `syllabi` - Programas de estudio
- ✅ `resources` - Recursos subidos
- ✅ `chat_messages` - Historial de chat
- ✅ `study_plans` - Planes de estudio

---

## 💡 Consejos

### ✅ Buenas Prácticas:

1. **Cierra siempre en orden:** Frontend primero, luego launcher
2. **Usa Ctrl+C** para cerrar, nunca la X de la ventana
3. **Verifica persistencia** después de agregar datos importantes
4. **Haz backups** de la carpeta `data/db/` periódicamente

### ✅ Backup de Datos:

Para hacer backup de tus datos:

```bash
# Copia toda la carpeta data/db
xcopy data\db data\db_backup\ /E /I /H /Y
```

Para restaurar:
```bash
# Cierra MongoDB primero
# Luego copia el backup
xcopy data\db_backup data\db\ /E /I /H /Y
```

---

## 📞 ¿Necesitas Ayuda?

Si sigues teniendo problemas:

1. Ejecuta `python verificar_persistencia.py`
2. Revisa los logs en `pau_study_master.log`
3. Verifica que `data/db/` tiene archivos
4. Asegúrate de cerrar en el orden correcto

---

**¡Listo!** Ahora tus datos persisten correctamente y nunca se perderán al cerrar la aplicación. 🎉
