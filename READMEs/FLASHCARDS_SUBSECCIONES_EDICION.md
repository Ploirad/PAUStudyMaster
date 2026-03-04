# 📝 Nuevas Funcionalidades de Flashcards

## ✨ Mejoras Implementadas

### 1. **Relación con Subsecciones del Checklist**

Ahora puedes vincular flashcards con subsecciones específicas del checklist para un mejor seguimiento del aprendizaje.

#### Al Crear una Flashcard:

1. **Selecciona Asignatura** → Carga los items del checklist
2. **Selecciona Tema** → Muestra temas del checklist o crear uno nuevo
3. **Selecciona Subsección (Opcional)** → Vincula la flashcard con una subsección específica

**Beneficio:** Cuando domines una flashcard vinculada (score ≥ 90%), la subsección relacionada se marca automáticamente como completada en el checklist.

---

### 2. **Mostrar Subsección Durante el Estudio**

Cuando estudias una flashcard que tiene una subsección asignada:

```
┌─────────────────────────────────────┐
│ ¿Cómo se multiplican dos matrices? │
│                                     │
│ 📚 Subsección: Operaciones básicas │
└─────────────────────────────────────┘
```

Esto te ayuda a:
- Contextualizar la pregunta
- Saber qué parte del temario estás repasando
- Entender la relación con el checklist

---

### 3. **Editar Respuesta Correcta**

Si la respuesta predefinida no te gusta o quieres adaptarla a tu forma de estudiar:

#### Durante la Sesión de Estudio:

1. **Responde la pregunta** y envía tu respuesta
2. **Se muestra la respuesta correcta** con un botón **"Editar"**
3. **Click en Editar** → Aparece un textarea
4. **Modifica la respuesta** como prefieras
5. **Guarda** → La flashcard se actualiza permanentemente

**Ejemplo de uso:**
```
Respuesta original: "París"
Tu preferencia: "París, capital de Francia desde 987"
```

La próxima vez que estudies, verás tu versión personalizada.

---

## 🔧 Cambios Técnicos

### Backend (server.py)

#### **Modelos Actualizados:**

```python
class Flashcard(BaseModel):
    # ... campos existentes ...
    subsection_id: Optional[str] = None  # NUEVO
    subsection_name: Optional[str] = None  # NUEVO

class FlashcardCreate(BaseModel):
    # ... campos existentes ...
    subsection_id: Optional[str] = None  # NUEVO
    subsection_name: Optional[str] = None  # NUEVO

class FlashcardUpdate(BaseModel):  # NUEVO MODELO
    question: Optional[str] = None
    correct_answer: Optional[str] = None
    topic: Optional[str] = None
    subsection_id: Optional[str] = None
    subsection_name: Optional[str] = None
```

#### **Nuevos Endpoints:**

**1. PUT /api/flashcards/{flashcard_id}**
```javascript
// Editar cualquier campo de una flashcard
PUT /api/flashcards/fc_abc123
Body: {
  "correct_answer": "Nueva respuesta personalizada"
}
```

**Modificaciones a Endpoints Existentes:**

**POST /api/flashcards**
- Ahora acepta `subsection_id` y `subsection_name` opcionales
- Guarda la relación con la subsección

**GET /api/flashcard-decks/{deck_id}**
- Devuelve flashcards con información de subsección incluida

---

### Frontend (FlashcardsTab.jsx)

#### **Nueva Lógica en Creación:**

```javascript
// 1. Cargar checklist items al seleccionar asignatura
useEffect(() => {
  if (formData.subject_id) {
    fetchChecklistItems(formData.subject_id);
  }
}, [formData.subject_id]);

// 2. Filtrar subsecciones por tema seleccionado
const getSubsectionsForTopic = () => {
  const item = checklistItems.find(item => item.topic === formData.topic);
  return item?.subsections || [];
};
```

#### **Nueva Lógica de Edición:**

```javascript
const [isEditingAnswer, setIsEditingAnswer] = useState(false);
const [editedAnswer, setEditedAnswer] = useState('');

const handleUpdateAnswer = async (flashcardId, newAnswer) => {
  // Llamada PUT para actualizar
  // Actualiza en el estado local de la sesión
  // Feedback al usuario
};
```

---

## 📖 Flujo de Usuario

### **Crear Flashcard con Subsección**

1. Click en **"+ Nueva Flashcard"**
2. Seleccionar **Asignatura** (ej: Matemáticas)
3. Seleccionar **Tema** (ej: Matrices)
   - Aparecen temas del checklist
   - O puedes crear nuevo tema
4. Si el tema tiene subsecciones, aparece dropdown:
   - **"Operaciones básicas"**
   - **"Matrices especiales"**
   - **"Determinantes"**
   - O **"Sin subsección"**
5. Seleccionar subsección (opcional)
6. Escribir pregunta y respuesta
7. **Crear Flashcard**

**Resultado:** La flashcard queda vinculada a esa subsección.

---

### **Estudiar con Subsecciones**

Durante la sesión de estudio:

```
╔═══════════════════════════════════════╗
║ [X]  Matrices - Matemáticas          ║
║      Tarjeta 3 de 10 | Dominadas: 2  ║
╠═══════════════════════════════════════╣
║ ▓▓▓▓▓░░░░░ 30%                       ║
╠═══════════════════════════════════════╣
║ ¿Cómo se calcula el determinante?    ║
║                                       ║
║ 📚 Subsección: Determinantes         ║  ← NUEVO
║                                       ║
║ ┌───────────────────────────────┐    ║
║ │ Tu respuesta aquí...          │    ║
║ └───────────────────────────────┘    ║
║                                       ║
║ [Comprobar Respuesta]                ║
╚═══════════════════════════════════════╝
```

---

### **Editar Respuesta Correcta**

Después de responder:

```
╔═══════════════════════════════════════╗
║ Respuesta correcta:         [Editar] ║  ← Click aquí
║ ─────────────────────────────────────║
║ El determinante se calcula...        ║
╚═══════════════════════════════════════╝

Después de click:

╔═══════════════════════════════════════╗
║ Respuesta correcta:                  ║
║ ─────────────────────────────────────║
║ ┌───────────────────────────────┐    ║
║ │ El determinante se calcula... │    ║  ← Editable
║ │ [modificas aquí]              │    ║
║ └───────────────────────────────┘    ║
║ [Guardar] [Cancelar]                 ║
╚═══════════════════════════════════════╝
```

---

## 🎯 Casos de Uso

### **Caso 1: Estudiar Matemáticas con Checklist**

1. **Subes un syllabus de Matemáticas**
   - Se crean items del checklist:
     - Matrices (con subsecciones: Operaciones, Tipos, Determinantes)
     - Derivadas (con subsecciones: Reglas, Aplicaciones)

2. **Creas flashcards**
   - Flashcard 1: "¿Cómo sumar matrices?" → Subsección: "Operaciones"
   - Flashcard 2: "¿Qué es matriz identidad?" → Subsección: "Tipos"
   - Flashcard 3: "¿Cómo calcular det 2x2?" → Subsección: "Determinantes"

3. **Estudias las flashcards**
   - Dominas Flashcard 1 (score 92%) → Subsección "Operaciones" se marca completada ✅
   - Dominas Flashcard 2 (score 88%) → Subsección "Tipos" se marca completada ✅
   - Fallas Flashcard 3 (score 65%) → Subsección "Determinantes" sigue pendiente

4. **Resultado en Checklist:**
   ```
   Matrices [66% completado]
   ├─ ✅ Operaciones (completada)
   ├─ ✅ Tipos (completada)
   └─ ⬜ Determinantes (pendiente)
   ```

---

### **Caso 2: Personalizar Respuestas**

**Situación:** Estudias Historia, pero las respuestas son muy formales.

**Flashcard Original:**
- Pregunta: "¿Cuándo comenzó la Revolución Francesa?"
- Respuesta: "1789"

**Tu preferencia:**
```
1789 - Toma de la Bastilla (14 julio)
Contexto: Luis XVI, crisis económica
```

**Proceso:**
1. Respondes la flashcard
2. Ves la respuesta original: "1789"
3. Click en **"Editar"**
4. Modificas a tu versión expandida
5. **Guardar**

**Beneficio:** La próxima vez verás TU versión, más útil para ti.

---

## 🔄 Integración con Checklist

### **Auto-completar Subsecciones**

El sistema de auto-completado YA EXISTE en el backend (implementado previamente).

**Lógica actual:**
```python
# Cuando respondes una flashcard con score ≥ 90%
if flashcard_doc.get('subsection_id'):
    # Busca items del checklist con ese tema
    # Marca la subsección como completada
    # Actualiza el score del topic
```

**Ahora con la nueva funcionalidad:**
- Las flashcards PUEDEN tener `subsection_id`
- Al dominarlas, la subsección se completa automáticamente
- El progreso del checklist se actualiza en tiempo real

---

## 📊 Estadísticas

### **Beneficios Medibles:**

| Métrica | Antes | Ahora |
|---------|-------|-------|
| **Contexto** | ❌ Sin relación con checklist | ✅ Vinculado con subsecciones |
| **Personalización** | ❌ Respuestas fijas | ✅ Respuestas editables |
| **Progreso** | ❌ Solo en flashcards | ✅ Integrado con checklist |
| **Comprensión** | ❌ Sin contexto | ✅ Muestra subsección |

---

## ⚙️ Configuración

### **Desactivar Auto-completado (si lo deseas):**

En `server.py`, línea ~1020-1090, comentar la sección:
```python
# ✨ NUEVA FUNCIONALIDAD: Auto-completar subsecciones
if flashcard_doc.get('subsection_id') and score >= 90.0:
    # ... código de auto-completado
```

### **Cambiar Umbral de Auto-completado:**

Actualmente es 90%. Para cambiarlo:
```python
if score >= 85.0:  # Cambiar de 90.0 a 85.0
```

---

## 🧪 Testing

### **Test 1: Crear Flashcard con Subsección**

1. Crear asignatura "Matemáticas"
2. Subir syllabus que cree item "Matrices" con subsecciones
3. Crear flashcard:
   - Tema: "Matrices"
   - Subsección: "Operaciones básicas"
   - Pregunta: "¿Cómo sumar matrices?"
4. ✅ Verificar que se guarda con subsection_id

### **Test 2: Estudiar y Ver Subsección**

1. Entrar al mazo "Matrices"
2. ✅ Debe mostrar "📚 Subsección: Operaciones básicas"
3. Responder correctamente
4. ✅ Debe auto-completar la subsección en checklist

### **Test 3: Editar Respuesta**

1. Responder flashcard
2. Ver respuesta correcta
3. Click en "Editar"
4. ✅ Debe aparecer textarea
5. Modificar texto
6. Click "Guardar"
7. ✅ Debe actualizar permanentemente
8. Salir y volver
9. ✅ Debe mostrar la nueva respuesta

---

## 🚀 Próximas Mejoras Sugeridas

1. **Editar desde vista de mazos**
   - Ver y editar flashcards sin entrar en sesión

2. **Historial de ediciones**
   - Ver versiones anteriores de respuestas

3. **Compartir respuestas personalizadas**
   - Exportar tus versiones editadas

4. **Sugerencias de IA**
   - IA sugiere mejoras a tus respuestas personalizadas

---

## ✅ Resumen

### **Nuevas Capacidades:**

1. ✅ **Vincular flashcards con subsecciones** del checklist
2. ✅ **Ver subsección durante el estudio** para mejor contexto
3. ✅ **Editar respuestas correctas** para personalizarlas
4. ✅ **Auto-completar subsecciones** al dominar flashcards
5. ✅ **Integración completa** entre flashcards y checklist

### **Archivos Modificados:**

- `backend/server.py`:
  - Modelos: `Flashcard`, `FlashcardCreate`, `FlashcardUpdate` (nuevo)
  - Endpoint: `PUT /api/flashcards/{flashcard_id}` (nuevo)
  - Endpoint: `POST /api/flashcards` (actualizado)

- `frontend/src/components/tabs/FlashcardsTab.jsx`:
  - Selector de subsecciones en creación
  - Display de subsección en sesión
  - Botón y lógica de edición
  - Integración con checklist API

¡Disfruta del sistema mejorado de flashcards! 🎉
