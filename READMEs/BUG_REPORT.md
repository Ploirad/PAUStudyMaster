# 🐛 Reporte de Bugs - PAU Study Master
**Fecha**: 3 de Enero, 2026  
**Revisión**: Completa del código fuente

---

## 🔴 BUGS CRÍTICOS (Impiden funcionamiento de la app)

### Bug #1: ⚠️ **Contextos faltantes - App no puede iniciar**
**Severidad**: 🔴 CRÍTICO  
**Estado**: ❌ NO SOLUCIONADO

**Descripción**:
Los componentes importan contextos React que NO EXISTEN en el proyecto:
- `import { useSubjects } from '@/contexts/SubjectsContext';`
- `import { useLoading } from '@/contexts/LoadingContext';`

**Archivos afectados**:
- `/app/frontend/src/components/tabs/ChatbotsTab.jsx` (línea 11)
- `/app/frontend/src/components/tabs/FilesTab.jsx` (líneas 10-11)
- `/app/frontend/src/components/tabs/FlashcardsTab.jsx` (línea 12)
- `/app/frontend/src/components/tabs/ExamsTab.jsx` (línea 11)
- `/app/frontend/src/components/tabs/ChecklistTab.jsx` (línea 12)
- `/app/frontend/src/components/SubjectManager.jsx` (línea 9)

**Archivos que faltan**:
- ❌ `/app/frontend/src/contexts/LoadingContext.jsx`
- ❌ `/app/frontend/src/contexts/SubjectsContext.jsx`

**Impacto**:
- ❌ La aplicación NO PUEDE COMPILAR ni ejecutarse
- ❌ Todos los tabs del dashboard fallan al cargar
- ❌ Error: "Module not found: Can't resolve '@/contexts/SubjectsContext'"

**Solución necesaria**:
Crear ambos archivos de contexto con la implementación correcta.

---

## 🟡 BUGS DE ALTA PRIORIDAD

### Bug #2: Estructura duplicada de carpetas
**Severidad**: 🟡 ALTA  
**Estado**: ❌ NO SOLUCIONADO

**Descripción**:
Existe duplicación de estructura de carpetas:
- `/app/` (raíz con archivos de configuración)
- `/app/app/` (contiene toda la aplicación real)

**Problemas**:
- Confusión sobre dónde están los archivos reales
- `/app/backend/.env` vs `/app/app/backend/.env`
- `/app/frontend/` vs `/app/app/frontend/`
- Posibles conflictos en deployment

**Solución recomendada**:
Consolidar todo en `/app/` o mover todo el contenido de `/app/app/` a `/app/`

---

### Bug #3: Variables de entorno duplicadas y desincronizadas
**Severidad**: 🟡 ALTA  
**Estado**: ⚠️ PARCIALMENTE SOLUCIONADO

**Descripción**:
- `/app/backend/.env` existe pero probablemente desactualizado
- `/app/app/backend/.env` tiene la configuración actual con EMERGENT_LLM_KEY
- Lo mismo para frontend

**Riesgo**:
Si se ejecuta desde `/app/` en lugar de `/app/app/`, usará configuración incorrecta

**Solución necesaria**:
Sincronizar o eliminar archivos duplicados

---

## 🟢 BUGS DE MEDIA PRIORIDAD

### Bug #4: Falta validación de tipos de archivo en upload
**Severidad**: 🟢 MEDIA  
**Estado**: ⚠️ PARCIALMENTE SOLUCIONADO

**Descripción**:
Aunque hay validación `.endsWith('.pdf')`, no hay validación de:
- MIME type del archivo (un .txt renombrado a .pdf pasaría)
- Contenido real del archivo

**Archivos afectados**:
- `FilesTab.jsx` (uploadSchedule, uploadSyllabus, uploadResource)

**Riesgo**:
Usuario podría subir archivos no-PDF y causar errores en PyPDF2

**Mejora recomendada**:
```javascript
const validatePDF = (file) => {
  return file.type === 'application/pdf';
};
```

---

### Bug #5: Falta manejo de MongoDB no disponible
**Severidad**: 🟢 MEDIA  
**Estado**: ❌ NO SOLUCIONADO

**Descripción**:
Si MongoDB no está corriendo, el backend simplemente crashea sin mensaje claro.

**Archivo afectado**:
- `server.py` (líneas 30-40)

**Problema actual**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(mongo_url)  # No try-catch
    db = client[os.environ['DB_NAME']]
```

**Mejora recomendada**:
Agregar try-catch y logging claro si MongoDB no está disponible

---

### Bug #6: Timeout fijo de 30 segundos puede ser insuficiente
**Severidad**: 🟢 MEDIA  
**Estado**: ✅ IMPLEMENTADO PERO MEJORABLE

**Descripción**:
`fetchWithTimeout` usa 30 segundos como timeout, pero:
- Análisis de PDFs largos con IA puede tardar más
- Generación de múltiples flashcards puede exceder el límite

**Archivos afectados**:
- Todos los `*Tab.jsx` que usan `fetchWithTimeout`

**Casos problemáticos**:
- Upload de PDF de 100+ páginas
- Generación de 50 flashcards simultáneas
- Análisis de temario completo

**Mejora recomendada**:
- Timeout variable según operación (60s para IA, 30s para resto)
- Mostrar progreso en operaciones largas

---

## 🔵 BUGS DE BAJA PRIORIDAD / MEJORAS

### Bug #7: No hay manejo de cookies en producción
**Severidad**: 🔵 BAJA  
**Estado**: ⚠️ NECESITA VERIFICACIÓN

**Descripción**:
En `AuthCallback.jsx` (línea 43):
```javascript
document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
```

**Problema**:
Falta `Secure` flag para HTTPS en producción.

**Mejora recomendada**:
```javascript
const isProduction = window.location.protocol === 'https:';
document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${isProduction ? '; Secure' : ''}`;
```

---

### Bug #8: Exámenes en el pasado no tienen advertencia persistente
**Severidad**: 🔵 BAJA  
**Estado**: ⚠️ PARCIALMENTE IMPLEMENTADO

**Descripción**:
En `ExamsTab.jsx` hay validación, pero solo es un toast temporal (línea 82-89).

**Mejora recomendada**:
Marcar visualmente exámenes pasados en el calendario con color diferente.

---

### Bug #9: No hay límite de flashcards activas
**Severidad**: 🔵 BAJA  
**Estado**: ❌ NO SOLUCIONADO

**Descripción**:
Usuario puede crear/generar infinitas flashcards sin límite.

**Riesgo**:
- Base de datos puede llenarse
- Performance del tab FlashcardsTab degrada con 1000+ cards

**Mejora recomendada**:
- Límite de 500 flashcards por usuario
- Paginación o virtualización en la lista

---

### Bug #10: Falta indicador de "repasar hoy" en Flashcards
**Severidad**: 🔵 BAJA  
**Estado**: ❌ NO IMPLEMENTADO (aunque hay campo next_review)

**Descripción**:
El sistema calcula `next_review` pero no hay un filtro visual de "Repasar Hoy".

**Mejora recomendada**:
Agregar botón "Mostrar solo para repasar hoy" en FlashcardsTab.

---

## 📊 Resumen de Bugs

| Severidad | Cantidad | Estado Crítico |
|-----------|----------|----------------|
| 🔴 Crítico | 1 | ❌ BLOQUEA LA APP |
| 🟡 Alta | 2 | ⚠️ Necesita atención |
| 🟢 Media | 3 | 🔧 Mejoras importantes |
| 🔵 Baja | 4 | 💡 Optimizaciones |

**Total de bugs identificados**: 10

---

## ✅ Bugs Ya Solucionados (según BUGS_FIXED.md)

Según la documentación existente, estos bugs YA fueron corregidos:
- ✅ **Bug #12**: Indicador de loading global (LoadingContext)
- ✅ **Bug #15**: Validación de nombres duplicados
- ✅ **Bug #16**: Archivos .env.example creados
- ✅ **Bug #17**: emergentintegrations verificada y configurada
- ✅ **Bug #18**: Llamadas API duplicadas eliminadas (SubjectsContext)

**NOTA IMPORTANTE**: Aunque el documento dice que se crearon LoadingContext y SubjectsContext, **ESTOS ARCHIVOS NO EXISTEN EN EL CÓDIGO ACTUAL**. Esto es el Bug #1 crítico.

---

## 🔧 Bugs que Necesitan Corrección Inmediata

### Orden de prioridad para arreglar:
1. **Bug #1** - Sin esto, la app no funciona
2. **Bug #2** - Estructura de carpetas
3. **Bug #3** - Variables de entorno
4. **Bug #5** - Manejo de MongoDB
5. **Bug #4** - Validación de archivos
6. **Bug #6** - Timeouts ajustables
7. Resto de mejoras opcionales

---

## 📝 Notas Adicionales

### Código Positivo Encontrado:
✅ Excelente validación de duplicados en SubjectManager, ChecklistTab  
✅ Buen manejo de errores con try-catch en la mayoría de lugares  
✅ Validación de tamaño de archivo (10MB máximo)  
✅ Data-testid bien implementados para testing  
✅ Uso correcto de BACKEND_URL desde .env  
✅ Buena separación de concerns (tabs separados)  
✅ Feedback al usuario con toasts informativos  

### Áreas que Necesitan Atención:
⚠️ **Contextos faltantes** (crítico)  
⚠️ Estructura de carpetas duplicada  
⚠️ Manejo de errores de conexión a MongoDB  
⚠️ Validación de tipos MIME en uploads  

---

**Reporte generado por**: E1 Agent  
**Última actualización**: 3 de Enero, 2026  
