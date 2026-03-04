#!/usr/bin/env python3
"""
Script de debugging para verificar la configuración de Google Gemini API
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
backend_dir = Path(__file__).parent / 'backend'
env_file = backend_dir / '.env'

print("=" * 60)
print("🔍 VERIFICACIÓN DE CONFIGURACIÓN DE GOOGLE GEMINI API")
print("=" * 60)

# Verificar que el archivo .env existe
print(f"\n1. Verificando archivo .env...")
print(f"   Ubicación: {env_file}")
print(f"   Existe: {env_file.exists()}")

if not env_file.exists():
    print("\n❌ ERROR: No se encontró el archivo .env")
    print(f"   Debe estar en: {env_file}")
    sys.exit(1)

# Cargar el .env
load_dotenv(env_file)

print("\n2. Contenido del archivo .env:")
print("-" * 60)
try:
    with open(env_file, 'r', encoding='utf-8') as f:
        content = f.read()
        print(content)
except UnicodeDecodeError:
    # Si falla con utf-8, intentar con latin-1
    try:
        with open(env_file, 'r', encoding='latin-1') as f:
            content = f.read()
            print(content)
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
print("-" * 60)

# Verificar variables de entorno
print("\n3. Verificando variables de entorno cargadas:")

gemini_key = os.environ.get('GEMINI_API_KEY')
openai_key = os.environ.get('OPENAI_API_KEY')
emergent_key = os.environ.get('EMERGENT_LLM_KEY')

print(f"\n   GEMINI_API_KEY:")
if gemini_key:
    if gemini_key == "pon-tu-gemini-api-key-aqui":
        print(f"   ❌ Sigue siendo el placeholder")
        print(f"   ⚠️  Debes reemplazarlo con tu API key real de Google AI Studio")
    else:
        # Mostrar solo los primeros y últimos caracteres
        masked = gemini_key[:10] + "..." + gemini_key[-4:] if len(gemini_key) > 15 else "***"
        print(f"   ✅ Configurada: {masked}")
        print(f"   Longitud: {len(gemini_key)} caracteres")
        
        # Verificar formato (las claves de Gemini empiezan con AIza)
        if gemini_key.startswith('AIza'):
            print(f"   ✅ Formato correcto (empieza con AIza)")
        else:
            print(f"   ⚠️  Formato sospechoso (normalmente empieza con 'AIza')")
else:
    print(f"   ❌ No configurada")

print(f"\n   OPENAI_API_KEY:")
if openai_key:
    masked = openai_key[:7] + "..." + openai_key[-4:] if len(openai_key) > 15 else "***"
    print(f"   ✅ Configurada: {masked}")
else:
    print(f"   ❌ No configurada")

print(f"\n   EMERGENT_LLM_KEY:")
if emergent_key:
    masked = emergent_key[:7] + "..." + emergent_key[-4:] if len(emergent_key) > 15 else "***"
    print(f"   ✅ Configurada: {masked}")
else:
    print(f"   ❌ No configurada")

# Intentar hacer una llamada de prueba a Gemini
print("\n4. Probando conexión con Google Gemini API:")
print("-" * 60)

if not gemini_key or gemini_key == "pon-tu-gemini-api-key-aqui":
    print("❌ No se puede probar: API key de Gemini no configurada correctamente")
    print("\n🔧 PRÓXIMOS PASOS:")
    print("   1. Ve a https://aistudio.google.com/apikey")
    print("   2. Crea o copia tu API key")
    print(f"   3. Ábrelo en: {env_file}")
    print('   4. Reemplaza: GEMINI_API_KEY="pon-tu-gemini-api-key-aqui"')
    print('   5. Por: GEMINI_API_KEY="tu-clave-real-aqui"')
    print("   6. Guarda el archivo y ejecuta este script de nuevo")
else:
    try:
        import google.generativeai as genai
        
        print("Configurando Google Gemini...")
        genai.configure(api_key=gemini_key)
        
        print("Enviando petición de prueba a Google Gemini...")
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content("Di solo 'funciona'")
        
        print(f"✅ Respuesta recibida: {response.text}")
        print("✅ La API key de Gemini funciona correctamente")
        
    except ImportError:
        print("❌ Error: google-generativeai no está instalado")
        print("\nInstala con:")
        print("pip install google-generativeai")
    except Exception as e:
        print(f"❌ Error al conectar con Gemini:")
        print(f"   {type(e).__name__}: {str(e)}")
        
        error_str = str(e).lower()
        if "api" in error_str and "key" in error_str:
            print("\n⚠️  La API key parece ser inválida")
            print("   - Verifica que copiaste la key completa")
            print("   - Verifica en https://aistudio.google.com/apikey")
            print("   - Asegúrate de que la API key está habilitada")
        elif "quota" in error_str or "limit" in error_str:
            print("\n⚠️  Problema con la cuota de la API")
            print("   - Verifica que no hayas excedido el límite gratuito")
            print("   - Revisa en https://aistudio.google.com/")

print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)

# Dar recomendaciones
recommendations = []

if not gemini_key or gemini_key == "pon-tu-gemini-api-key-aqui":
    recommendations.append("⚠️  DEBES configurar GEMINI_API_KEY en el archivo .env")
    recommendations.append(f"   Edita: {env_file}")
    recommendations.append('   Cambia: GEMINI_API_KEY="pon-tu-gemini-api-key-aqui"')
    recommendations.append('   Por: GEMINI_API_KEY="AIza-tu-key-real"')
    recommendations.append('   Obtén tu key en: https://aistudio.google.com/apikey')

if recommendations:
    print("\n🔧 ACCIONES REQUERIDAS:")
    for rec in recommendations:
        print(rec)
    
    print("\n📝 DESPUÉS DE CONFIGURAR:")
    print("1. Guarda el archivo .env")
    print("2. Reinicia el backend si está corriendo")
    print("3. Ejecuta este script de nuevo para verificar")
else:
    print("\n✅ Todo parece estar configurado correctamente")
