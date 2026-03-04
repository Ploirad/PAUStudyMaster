# PAU Study Master 📚

**Tu asistente inteligente para aprobar la PAU con éxito**

## 🎯 Descripción

PAU Study Master es una aplicación educativa completa diseñada para ayudar a los estudiantes de bachillerato a prepararse para la PAU (Prueba de Acceso a la Universidad). La app combina inteligencia artificial con metodologías de estudio probadas como el recuerdo activo y la repetición espaciada.

## ✨ Características Principales

### 1. 🤖 Chatbots Inteligentes
- **Chatbot Padre**: Genera planes de estudio personalizados basados en:
  - Tu horario diario
  - Tus temarios y exámenes
  - Espaciado de repetición
  - Fecha actual y tiempo disponible
  
- **Chatbots por Asignatura**: Un chatbot especializado para cada materia que:
  - Resuelve dudas específicas
  - Ofrece recursos de estudio
  - Genera exámenes de práctica
  - Corrige automáticamente

### 2. 📤 Gestión de Archivos
- **Horario Diario**: Sube tu horario (PDF) para que el chatbot calcule tus horas disponibles
- **Temarios**: Sube temarios (PDF) y la IA extraerá automáticamente:
  - Todos los temas principales
  - Subtemas
  - Generación automática de flashcards y checklist

### 3. 📅 Agenda de Exámenes
- Calendario mensual interactivo
- Añade exámenes de PAU y evaluaciones
- Edita fechas, horas y notas
- Recordatorios visuales
- El chatbot padre usa esta información para priorizar estudios

### 4. 🎴 Flashcards con IA
- Mazos personalizados por asignatura y tema
- **Scoring Inteligente**: La IA analiza tus respuestas y te da:
  - Puntuación de 0-100%
  - Feedback detallado
  - Recomendaciones
- **Espaciado de Repetición**: Programa automática de revisiones basado en tu rendimiento
- Progreso y estadísticas en tiempo real

### 5. ✅ Checklist de Contenidos
- Lista interactiva de todos los temas por asignatura
- **Sistema de Bloqueo**: Un tema no se marca como "sabido" hasta lograr >75% en flashcards
- **Indicadores de Repaso**: Te dice cuándo debes repasar cada tema (ej: "Repasar en 3 días")
- Barra de progreso general
- Integración con flashcards

## 🔧 Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno para Python
- **MongoDB**: Base de datos NoSQL para almacenar datos
- **Motor**: Driver async de MongoDB
- **OpenAI GPT-5.1**: Para todos los chatbots y análisis con IA
- **PyPDF2**: Extracción de texto de PDFs
- **Emergent Auth**: Sistema de autenticación con Google OAuth

### Frontend
- **React 19**: Biblioteca de UI moderna
- **React Router**: Navegación entre páginas
- **Shadcn/UI**: Componentes de interfaz elegantes
- **Tailwind CSS**: Estilos responsivos
- **Lucide React**: Iconos

### IA y Análisis
- **Emergent LLM Key**: Clave universal para acceder a GPT-5.1
- **emergentintegrations**: Librería personalizada para integración con LLMs

## 🚀 Cómo Usar la Aplicación

### 1. Iniciar Sesión
1. Haz clic en "Iniciar sesión con Google"
2. Autoriza con tu cuenta de Google
3. Serás redirigido al dashboard

### 2. Configurar Asignaturas
1. Haz clic en "Gestionar Asignaturas" en el header
2. Puedes:
   - Añadir las 5 predefinidas (Matemáticas, Física, Filosofía, Inglés, Geografía)
   - Crear asignaturas personalizadas
   - Editar nombres, iconos y colores
   - Eliminar asignaturas

### 3. Subir Archivos
1. Ve a la pestaña "Archivos"
2. Sube tu horario diario (PDF)
3. Sube temarios por asignatura (PDF)
4. La IA extraerá automáticamente los temas

### 4. Usar Chatbots
1. Ve a la pestaña "Chatbots"
2. **Chatbot Padre**:
   - Indica la fecha de hoy
   - Pregunta: "¿Qué debo estudiar hoy?"
   - Recibe un plan personalizado
3. **Chatbots de Asignatura**:
   - Selecciona una asignatura
   - Haz preguntas específicas
   - Pide exámenes de práctica

### 5. Crear Flashcards
1. Ve a la pestaña "Flashcards"
2. Haz clic en "Nueva Flashcard"
3. Completa:
   - Asignatura
   - Tema
   - Pregunta
   - Respuesta correcta
4. Para responder:
   - Lee la pregunta
   - Escribe tu respuesta
   - La IA la puntuará automáticamente (0-100%)
   - Recibirás feedback detallado

### 6. Gestionar Checklist
1. Ve a la pestaña "Checklist"
2. Verás todos los temas por asignatura
3. Para marcar un tema como completado:
   - Debes lograr >75% en flashcards de ese tema
   - El sistema te lo bloqueará hasta alcanzar ese puntaje
4. Observa los indicadores de "Repasar en X días"

### 7. Agenda de Exámenes
1. Ve a la pestaña "Agenda"
2. Haz clic en "Añadir Examen"
3. Completa:
   - Asignatura
   - Título del examen
   - Fecha y hora
   - Notas (opcional)
4. Los exámenes aparecerán en el calendario
5. Haz clic en un examen para editarlo

## 📊 Algoritmo de Espaciado de Repetición

La app usa un algoritmo inteligente para programar revisiones:

- **Score ≥90%**: Próximo repaso en 3x días
- **Score ≥75%**: Próximo repaso en 2x días
- **Score ≥60%**: Próximo repaso en 1x días
- **Score <60%**: Próximo repaso en la mitad de días

Ejemplo:
- Última revisión hace 2 días con 85% → Próximo repaso en 4 días
- Última revisión hace 2 días con 50% → Próximo repaso en 1 día

## 🔐 Seguridad y Privacidad

- **Autenticación segura** con Google OAuth
- **Sesiones persistentes** de 7 días
- **Cookies httpOnly** para proteger tokens
- **Datos privados** por usuario (nadie más puede ver tu información)

## 🎨 Interfaz y Navegación

La app tiene 5 pestañas principales en la parte superior:
1. **💬 Chatbots**: Interactúa con la IA
2. **📤 Archivos**: Sube horarios y temarios
3. **📅 Agenda**: Gestiona tus exámenes
4. **🎴 Flashcards**: Practica con recuerdo activo
5. **✅ Checklist**: Sigue tu progreso

## 🌟 Consejos de Uso

1. **Sube tus archivos primero**: El chatbot padre funciona mejor con tu horario y temarios
2. **Usa el chatbot padre diariamente**: Pregúntale cada mañana qué estudiar
3. **Sé consistente con flashcards**: El espaciado funciona mejor con práctica regular
4. **Revisa el checklist semanalmente**: Te ayuda a ver tu progreso general
5. **Actualiza tu agenda**: Mantén tus exámenes al día para mejor planificación

## 🐛 Solución de Problemas

### No puedo iniciar sesión
- Asegúrate de tener una cuenta de Google
- Verifica que permites pop-ups en tu navegador

### No veo mis asignaturas
- Haz clic en "Gestionar Asignaturas" para añadirlas

### El chatbot no responde
- Verifica tu conexión a internet
- Recarga la página

### Las flashcards no se puntúan
- Asegúrate de escribir una respuesta antes de enviar
- Espera unos segundos, la IA necesita tiempo para analizar

## 📝 Notas Técnicas

### Variables de Entorno

**Backend** (`/app/backend/.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-e81D70d3082085088E
```

**Frontend** (`/app/frontend/.env`):
```
REACT_APP_BACKEND_URL=https://studypau.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### Arquitectura

```
PAU Study Master
├── Backend (FastAPI + MongoDB)
│   ├── Autenticación (Emergent Auth)
│   ├── API REST (10+ endpoints)
│   ├── IA Integration (GPT-5.1)
│   └── PDF Analysis
└── Frontend (React)
    ├── Login/Auth Flow
    ├── Dashboard
    ├── 5 Tabs principales
    └── SubjectManager
```

## 🎓 Metodología de Estudio

Esta app está basada en técnicas probadas:

1. **Recuerdo Activo**: En lugar de solo leer, te obliga a recordar información (flashcards)
2. **Repetición Espaciada**: Revisas material justo antes de olvidarlo (algoritmo inteligente)
3. **Planificación Personalizada**: El chatbot padre adapta el plan a TU horario y exámenes
4. **Feedback Inmediato**: La IA te corrige al instante y te explica por qué

## 🚀 Próximas Actualizaciones (Potenciales)

- [ ] Estadísticas avanzadas y gráficos de progreso
- [ ] Exportar planes de estudio a PDF
- [ ] Modo oscuro
- [ ] Notificaciones push reales
- [ ] Compartir flashcards con otros usuarios
- [ ] Integración con calendario de Google

## 📄 Licencia

Este proyecto fue creado para uso educativo.

## 👨‍💻 Soporte

Si tienes problemas o sugerencias, puedes:
1. Revisar la sección de "Solución de Problemas"
2. Contactar al equipo de desarrollo
3. Recargar la aplicación

---

**¡Mucha suerte en tus estudios y en la PAU! 🎓✨**
