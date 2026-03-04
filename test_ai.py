#!/usr/bin/env python3
"""
Script para probar directamente las funciones de IA usando Google Gemini
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
backend_dir = Path(__file__).parent / 'backend'
env_file = backend_dir / '.env'
load_dotenv(env_file)

# Agregar backend al path
sys.path.insert(0, str(backend_dir))

async def test_gemini_functions():
    print("=" * 60)
    print("🧪 PRUEBA DE FUNCIONES DE IA CON GOOGLE GEMINI")
    print("=" * 60)
    
    try:
        import google.generativeai as genai
        
        # Configurar cliente
        GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
        
        api_key = GEMINI_API_KEY or OPENAI_API_KEY or EMERGENT_LLM_KEY
        using_gemini = bool(GEMINI_API_KEY)
        
        print(f"\n1. Configuración:")
        print(f"   GEMINI_API_KEY: {'✅ Configurada' if GEMINI_API_KEY else '❌ No configurada'}")
        print(f"   OPENAI_API_KEY: {'✅ Configurada' if OPENAI_API_KEY else '❌ No configurada'}")
        print(f"   EMERGENT_LLM_KEY: {'✅ Configurada' if EMERGENT_LLM_KEY else '❌ No configurada'}")
        print(f"   API Key en uso: {api_key[:10] if api_key else 'Ninguna'}...")
        print(f"   Usando: {'Google Gemini' if using_gemini else 'OpenAI/Emergent'}")
        
        if not api_key:
            print("\n❌ ERROR: No hay API key configurada")
            print("\n🔧 SOLUCIÓN:")
            print(f"   1. Abre el archivo: {env_file}")
            print("   2. Reemplaza 'pon-tu-gemini-api-key-aqui' con tu clave real")
            print("   3. Consigue tu clave en: https://aistudio.google.com/apikey")
            return
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Test 1: Llamada simple
        print("\n2. Test 1: Llamada simple a Gemini")
        print("-" * 60)
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content("Di solo 'funciona'")
            
            print(f"✅ Respuesta: {response.text}")
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {str(e)}")
            return
        
        # Test 2: Scoring de flashcard
        print("\n3. Test 2: Scoring de flashcard")
        print("-" * 60)
        try:
            question = "¿Cuál es la capital de Francia?"
            correct_answer = "París"
            user_answer = "París"
            
            prompt = f"""Eres una IA educativa que califica respuestas de flashcards.
            
Pregunta: {question}
Respuesta Correcta: {correct_answer}
Respuesta del Estudiante: {user_answer}

Califica la respuesta del estudiante de 0-100 y proporciona retroalimentación breve. Devuelve SOLO un objeto JSON:
{{"score": <número 0-100>, "feedback": "<retroalimentación breve>"}}
"""
            
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction="Eres una IA educativa que califica respuestas de estudiantes. Siempre devuelve JSON válido."
            )
            response = model.generate_content(prompt)
            result_text = response.text
            
            print(f"✅ Respuesta de IA: {result_text}")
            
            # Intentar parsear JSON
            import json
            try:
                parsed = json.loads(result_text)
                print(f"✅ JSON válido - Score: {parsed.get('score')}, Feedback: {parsed.get('feedback')}")
            except:
                print(f"⚠️  La respuesta no es JSON válido")
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {str(e)}")
        
        # Test 3: Generar plan de estudio
        print("\n4. Test 3: Generar plan de estudio")
        print("-" * 60)
        try:
            prompt = """Crea un plan de estudio para hoy. Incluye:
1. 3 horas de estudio disponibles
2. Materias: Matemáticas y Física
3. Examen de Matemáticas en 3 días

Sé breve (máximo 100 palabras)."""
            
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction="Eres un experto en planificación de estudios."
            )
            response = model.generate_content(prompt)
            
            print(f"✅ Plan generado:")
            print(response.text)
        except Exception as e:
            print(f"❌ Error: {type(e).__name__}: {str(e)}")
        
        print("\n" + "=" * 60)
        print("✅ TODAS LAS PRUEBAS COMPLETADAS")
        print("=" * 60)
        
    except ImportError as e:
        print(f"\n❌ Error de importación: {e}")
        print("Asegúrate de que 'google-generativeai' está instalado:")
        print("pip install google-generativeai")
    except Exception as e:
        print(f"\n❌ Error inesperado: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_gemini_functions())
