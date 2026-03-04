#!/usr/bin/env python3
"""
Script de debugging para verificar la configuración de OpenAI API
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
backend_dir = Path(__file__).parent / 'backend'
env_file = backend_dir / '.env'

print("=" * 60)
print("🔍 VERIFICACIÓN DE CONFIGURACIÓN DE OPENAI API")
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
with open(env_file, 'r') as f:
    content = f.read()
    print(content)
print("-" * 60)

# Verificar variables de entorno
print("\n3. Verificando variables de entorno cargadas:")

openai_key = os.environ.get('OPENAI_API_KEY')
emergent_key = os.environ.get('EMERGENT_LLM_KEY')

print(f"\n   OPENAI_API_KEY:")
if openai_key:
    if openai_key == "pon-tu-api-key-aqui":
        print(f"   ❌ Sigue siendo el placeholder")
        print(f"   ⚠️  Debes reemplazarlo con tu API key real")
    else:
        # Mostrar solo los primeros y últimos caracteres
        masked = openai_key[:7] + "..." + openai_key[-4:] if len(openai_key) > 15 else "***"
        print(f"   ✅ Configurada: {masked}")
        print(f"   Longitud: {len(openai_key)} caracteres")
        
        # Verificar formato
        if openai_key.startswith('sk-proj-') or openai_key.startswith('sk-'):
            print(f"   ✅ Formato correcto")
        else:
            print(f"   ⚠️  Formato sospechoso (debe empezar con 'sk-proj-' o 'sk-')")
else:
    print(f"   ❌ No configurada")

print(f"\n   EMERGENT_LLM_KEY:")
if emergent_key:
    masked = emergent_key[:7] + "..." + emergent_key[-4:] if len(emergent_key) > 15 else "***"
    print(f"   ✅ Configurada: {masked}")
else:
    print(f"   ❌ No configurada")

# Intentar hacer una llamada de prueba a OpenAI
print("\n4. Probando conexión con OpenAI API:")
print("-" * 60)

if not openai_key or openai_key == "pon-tu-api-key-aqui":
    print("❌ No se puede probar: API key no configurada correctamente")
else:
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=openai_key)
        
        print("Enviando petición de prueba a OpenAI...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Usar modelo más barato para prueba
            messages=[
                {"role": "user", "content": "Di solo 'funciona'"}
            ],
            max_tokens=10
        )
        
        result = response.choices[0].message.content
        print(f"✅ Respuesta recibida: {result}")
        print("✅ La API key funciona correctamente")
        
    except Exception as e:
        print(f"❌ Error al conectar con OpenAI:")
        print(f"   {type(e).__name__}: {str(e)}")
        
        if "authentication" in str(e).lower() or "api_key" in str(e).lower():
            print("\n⚠️  La API key parece ser inválida")
            print("   - Verifica que copiaste la key completa")
            print("   - Verifica en https://platform.openai.com/api-keys")
        elif "quota" in str(e).lower() or "billing" in str(e).lower():
            print("\n⚠️  Problema con la cuenta de OpenAI")
            print("   - Verifica que tengas créditos disponibles")
            print("   - Revisa en https://platform.openai.com/usage")
        elif "model" in str(e).lower():
            print("\n⚠️  El modelo no está disponible")
            print("   - Puede que no tengas acceso a GPT-4")
            print("   - Intenta con gpt-3.5-turbo")

print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)

# Dar recomendaciones
recommendations = []

if not openai_key or openai_key == "pon-tu-api-key-aqui":
    recommendations.append("⚠️  DEBES configurar OPENAI_API_KEY en el archivo .env")
    recommendations.append(f"   Edita: {env_file}")
    recommendations.append('   Cambia: OPENAI_API_KEY="pon-tu-api-key-aqui"')
    recommendations.append('   Por: OPENAI_API_KEY="sk-proj-tu-key-real"')

if recommendations:
    print("\n🔧 ACCIONES REQUERIDAS:")
    for rec in recommendations:
        print(rec)
    
    print("\n📝 DESPUÉS DE CONFIGURAR:")
    print("1. Guarda el archivo .env")
    print("2. Reinicia el backend (Ctrl+C y vuelve a ejecutar)")
    print("3. Ejecuta este script de nuevo para verificar")
else:
    print("\n✅ Todo parece estar configurado correctamente")

print("\n" + "=" * 60)
