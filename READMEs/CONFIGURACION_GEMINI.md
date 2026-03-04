# 🚀 Configuración de Google Gemini para PAU Study Master

Tu aplicación PAU Study Master ha sido migrada exitosamente para usar **Google Gemini** en lugar de OpenAI.

## 📋 ¿Qué se ha cambiado?

### ✅ Cambios realizados:

1. **Instalada biblioteca `emergentintegrations`**: Optimizada para trabajar con múltiples LLMs incluido Gemini
2. **Actualizado `/app/backend/.env`**: Nueva configuración para Gemini API Key
3. **Modificado `/app/backend/server.py`**: Migrado de OpenAI a Gemini usando emergentintegrations
4. **Creados scripts de prueba**:
   - `/app/test_gemini.py` - Para probar las funciones de IA
   - `/app/verificar_gemini.py` - Para verificar la configuración

### 🔧 Modelos utilizados:

- **gemini-2.5-pro**: Para tareas complejas (planes de estudio, análisis de contenido, chat)
- **gemini-2.5-flash**: Para tareas rápidas (scoring de flashcards, respuestas simples)

## 🎯 Pasos para configurar tu API Key

### 1️⃣ Obtener tu API Key de Google Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Create API Key"** o **"Get API Key"**
4. Copia la API Key (empieza con `AIza...`)

### 2️⃣ Configurar la API Key en tu aplicación

Abre el archivo `/app/backend/.env` y reemplaza:

```bash
GEMINI_API_KEY="pon-tu-gemini-api-key-aqui"
```

Por tu clave real:

```bash
GEMINI_API_KEY="AIzaSyC8Nh5pxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3️⃣ Verificar la configuración

Ejecuta el script de verificación:

```bash
cd /app
python3 verificar_gemini.py
```

Deberías ver:
```
✅ La API key de Gemini funciona correctamente
```

### 4️⃣ Probar las funciones de IA

Ejecuta el script de pruebas:

```bash
cd /app
python3 test_gemini.py
```

Este script probará:
- ✅ Llamada simple a Gemini
- ✅ Scoring de flashcards
- ✅ Generación de planes de estudio

### 5️⃣ Reiniciar el backend

Si el backend está corriendo, reinícialo para que cargue la nueva configuración:

```bash
sudo supervisorctl restart backend
```

O si no usas supervisor:

```bash
# Detén el proceso actual y vuelve a ejecutar
python3 /app/backend/server.py
```

## 🎉 ¡Listo!

Tu aplicación PAU Study Master ahora usa Google Gemini para todas las funcionalidades de IA:

- 📚 **Análisis de syllabus**: Extrae temas y subtemas automáticamente
- 🎯 **Scoring de flashcards**: Califica respuestas de estudiantes con IA
- 💬 **Chatbot inteligente**: Asistente de estudio y tutores por materia
- 📅 **Planes de estudio**: Genera planes personalizados diarios
- 📖 **Extracción de preguntas**: De tus recursos PDF

## ⚠️ Solución de problemas

### Error: "API key not configured"
- Verifica que hayas guardado el archivo `.env` después de editarlo
- Reinicia el backend después de cambiar la configuración

### Error: "Invalid API key"
- Verifica que la clave esté completa (sin espacios al inicio/final)
- Verifica que la clave sea válida en [Google AI Studio](https://aistudio.google.com/apikey)

### Error: "Quota exceeded"
- Google Gemini tiene límites gratuitos
- Revisa tu uso en [Google AI Studio](https://aistudio.google.com/)
- Considera configurar facturación si necesitas más requests

## 📊 Cuotas gratuitas de Gemini

Google Gemini ofrece una cuota gratuita generosa:
- **gemini-2.5-flash**: 15 requests/minuto, 1,500 requests/día (gratis)
- **gemini-2.5-pro**: 2 requests/minuto, 50 requests/día (gratis)

Para más información: [Google AI Pricing](https://ai.google.dev/pricing)

## 🆚 Ventajas de Gemini vs OpenAI

✅ **Cuota gratuita más generosa**
✅ **Multimodal nativo** (texto, imágenes, audio, video)
✅ **Mejor rendimiento en español**
✅ **Más rápido en respuestas**
✅ **Integración directa con Google**

## 🔄 ¿Quieres volver a OpenAI?

Si en el futuro quieres usar OpenAI, simplemente:

1. Agrega tu `OPENAI_API_KEY` en el archivo `.env`
2. Elimina o comenta `GEMINI_API_KEY`
3. La aplicación automáticamente usará OpenAI

El código está diseñado para funcionar con ambos servicios.

## 📞 Soporte

Si tienes problemas:
1. Ejecuta `python3 verificar_gemini.py` para diagnóstico
2. Revisa los logs del backend: `tail -f /var/log/supervisor/backend.err.log`
3. Verifica que MongoDB esté corriendo: `sudo systemctl status mongodb`

---

**¡Feliz estudio con IA! 🎓✨**
