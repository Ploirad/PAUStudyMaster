# 🎴 Sistema de Mazos de Flashcards - Mejoras Implementadas

## ✨ Nuevas Características

### 1. **Sistema de Mazos Organizado**

Las flashcards ahora se agrupan automáticamente en **mazos** por:
- **Asignatura** (ej: Matemáticas, Física)
- **Tema** (ej: Matrices, Derivadas)

Cada mazo muestra:
- ✅ Nombre del tema
- ✅ Asignatura y su color
- ✅ Número total de tarjetas
- ✅ Tarjetas para repasar hoy
- ✅ Tarjetas dominadas (score ≥ 90%)
- ✅ Tiempo hasta próximo repaso

---

### 2. **Priorización Inteligente**

Los mazos se ordenan automáticamente:
1. **Primero:** Mazos que necesitan repaso HOY (marcados con badge rojo)
2. **Después:** Por días hasta el próximo repaso

---

### 3. **Filtros Avanzados**

Puedes filtrar los mazos por:
- 📚 **Asignatura:** Ver solo mazos de una materia específica
- 📅 **Tiempo de repaso:** Mostrar solo los que necesitas repasar hoy
- 🔍 **Búsqueda:** Buscar por nombre del tema

---

### 4. **Sesión de Estudio Mejorada**

Cuando entras a un mazo:

#### Flujo de estudio:
1. **Respondes** la pregunta con tu propia respuesta
2. **IA analiza** tu respuesta y te da un score (0-100%)
3. **Dos caminos:**
   - ✅ **Score ≥ 75%:** Tarjeta dominada, no se vuelve a mostrar en esta sesión
   - ❌ **Score < 75%:** Tarjeta se agrega al final de la cola para repasar

#### Características:
- ✅ Progreso visual en tiempo real
- ✅ Contador de tarjetas dominadas
- ✅ Retroalimentación inmediata de la IA
- ✅ Comparación de tu respuesta vs respuesta correcta
- ✅ Botón X para salir en cualquier momento (arriba a la derecha)

---

### 5. **Repetición Espaciada (Spaced Repetition)**

El sistema usa el método de **repaso activo** para optimizar el aprendizaje:

- **Score ≥ 90%:** Próximo repaso en 3x el intervalo actual
- **Score ≥ 75%:** Próximo repaso en 2x el intervalo actual
- **Score ≥ 60%:** Mismo intervalo
- **Score < 60%:** Intervalo reducido a la mitad

---

## 🎨 Interfaz Visual

### Vista de Mazos (Principal)
```
┌─────────────────────────────────────────┐
│  🎴 Mazos de Flashcards                 │
│  Estudia con repetición espaciada       │
│                         [+ Nueva]       │
├─────────────────────────────────────────┤
│  Filtros:                               │
│  [Asignatura ▼] [Repaso ▼] [Buscar...] │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ Matrices │  │ Derivadas│           │
│  │ Matemát. │  │ Matemát. │           │
│  │ 12 cards │  │ 8 cards  │           │
│  │ ¡Hoy! 🔴 │  │ En 2 días│           │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

### Vista de Sesión de Estudio
```
┌─────────────────────────────────────────┐
│  [X]  Matrices - Matemáticas            │
│       Tarjeta 5 de 12  |  Dominadas: 3  │
├─────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓░░░░░ 42%                      │
├─────────────────────────────────────────┤
│  ❓ ¿Cómo se multiplican dos matrices?  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Tu respuesta:                    │   │
│  │ [escribe aquí...]               │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Comprobar Respuesta]                  │
└─────────────────────────────────────────┘
```

---

## 🔧 Cambios Técnicos

### Backend (server.py)

#### Nuevos Endpoints:

1. **GET /api/flashcard-decks**
   - Devuelve lista de mazos agrupados por asignatura + tema
   - Incluye estadísticas: total, para repasar, dominadas, próximo repaso

2. **GET /api/flashcard-decks/{deck_id}**
   - Devuelve todas las flashcards de un mazo específico
   - deck_id formato: `{subject_id}_{topic}`

#### Correcciones:
- ✅ Arreglada línea 1 (API key pegada al import)

### Frontend (FlashcardsTab.jsx)

#### Nueva Estructura:

1. **Vista de Mazos (Deck Selection)**
   - Grid de tarjetas de mazos
   - Filtros y búsqueda
   - Click en mazo para iniciar sesión

2. **Vista de Sesión (Study Session)**
   - Mostrar pregunta
   - Input para respuesta
   - Calificación con IA
   - Sistema de reintentos para tarjetas falladas
   - Progreso en tiempo real

#### Lógica de Sesión:
```javascript
// Flashcard aprobada (≥75%)
→ Agregar a masteredInSession
→ No mostrar más en esta sesión

// Flashcard fallada (<75%)
→ Agregar a failedCards
→ Mostrar al final de la sesión
```

---

## 📊 Ejemplo de Uso

### Crear Flashcards

1. Click en **"+ Nueva Flashcard"**
2. Selecciona **Asignatura**
3. Escribe **Tema** (ej: "Matrices")
4. Escribe **Pregunta** y **Respuesta**
5. Click en **"Crear Flashcard"**

O usa **"Generar desde Recursos"** para crear automáticamente desde PDFs subidos.

### Estudiar

1. En la vista principal, verás mazos como:
   ```
   📚 Matrices
   Matemáticas
   12 tarjetas | 5 para repasar | 7 dominadas
   ¡Repasar hoy! 🔴
   ```

2. Click en el mazo para empezar

3. Responde cada pregunta

4. La IA califica tu respuesta:
   - ✅ ≥75%: Seguir adelante
   - ❌ <75%: Se repite al final

5. Click en **X** para salir en cualquier momento

---

## 🎯 Umbral de Aprobación

El sistema usa **75%** como umbral:
- **≥75%:** Flashcard dominada en esta sesión
- **<75%:** Necesita más práctica, se repite

Este umbral se puede ajustar en:
```javascript
const PASSING_SCORE = 75; // Línea 16 de FlashcardsTab.jsx
```

---

## 🚀 Próximas Mejoras Sugeridas

1. **Estadísticas globales:**
   - Total de mazos
   - Tarjetas totales estudiadas
   - Racha de días consecutivos

2. **Modos de estudio:**
   - Modo examen (todas las tarjetas sin reintentos)
   - Modo rápido (solo mostrar respuesta, sin escribir)

3. **Exportar/Importar:**
   - Exportar mazos a CSV
   - Compartir mazos con otros usuarios

4. **Recordatorios:**
   - Notificaciones cuando hay mazos para repasar

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: Los mazos no se actualizan
**Solución:** El componente refresca automáticamente al salir de una sesión

### Problema: La IA tarda mucho en responder
**Solución:** Hay un timeout de 30 segundos, después usa fallback de scoring local

### Problema: No aparecen mazos
**Solución:** Verifica que tengas flashcards creadas con tema asignado

---

## ✅ Testing

Para probar el sistema:

1. **Crear flashcards:**
   ```bash
   - Asignatura: Matemáticas
   - Tema: Matrices
   - Pregunta: "¿Qué es una matriz identidad?"
   - Respuesta: "Es una matriz cuadrada con 1 en la diagonal y 0 en el resto"
   ```

2. **Verificar que aparece el mazo "Matrices"**

3. **Iniciar sesión de estudio**

4. **Responder correctamente** (debería dar ≥75%)

5. **Responder incorrectamente** (debería mostrar al final)

6. **Salir con X** (debería volver a vista de mazos)

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que el backend esté corriendo
2. Revisa la consola del navegador (F12)
3. Verifica que Gemini API key esté configurada

¡Disfruta del nuevo sistema de mazos! 🎉
