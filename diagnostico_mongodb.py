#!/usr/bin/env python3
"""
Script de Diagnóstico MongoDB para PAU Study Master
Este script te ayuda a identificar por qué MongoDB no inicia
"""

import os
import sys
import subprocess
from pathlib import Path
import socket

print("="*70)
print("   🔍 DIAGNÓSTICO MONGODB - PAU Study Master")
print("="*70)
print()

# Determinar directorio base
if getattr(sys, 'frozen', False):
    APP_DIR = Path(os.path.dirname(sys.executable))
else:
    APP_DIR = Path(__file__).parent

MONGODB_DIR = APP_DIR / 'mongodb'
MONGODB_DATA_DIR = APP_DIR / 'data' / 'db'
MONGODB_LOGS_DIR = APP_DIR / 'data' / 'logs'
MONGODB_PORT = 27017

print("📁 PASO 1: Verificando estructura de carpetas")
print("-" * 70)

# Verificar carpeta mongodb
if not MONGODB_DIR.exists():
    print(f"❌ Carpeta MongoDB NO existe: {MONGODB_DIR}")
    print("\n   SOLUCIÓN:")
    print("   1. Descarga MongoDB 7.0 Community Server (ZIP)")
    print("   2. URL: https://www.mongodb.com/try/download/community")
    print("   3. Extrae el ZIP y copia la carpeta 'mongodb' aquí:")
    print(f"      {MONGODB_DIR}")
    print()
else:
    print(f"✅ Carpeta MongoDB existe: {MONGODB_DIR}")

# Verificar bin
bin_dir = MONGODB_DIR / 'bin'
if not bin_dir.exists():
    print(f"❌ Carpeta bin NO existe: {bin_dir}")
else:
    print(f"✅ Carpeta bin existe: {bin_dir}")

# Verificar mongod.exe
mongod_exe = MONGODB_DIR / 'bin' / 'mongod.exe'
if not mongod_exe.exists():
    print(f"❌ mongod.exe NO encontrado: {mongod_exe}")
    print("\n   PROBLEMA: Este es el archivo principal de MongoDB")
    print("   SOLUCIÓN: Descarga MongoDB Community Server 7.0")
    print()
else:
    print(f"✅ mongod.exe encontrado: {mongod_exe}")
    # Obtener tamaño
    size_mb = mongod_exe.stat().st_size / (1024 * 1024)
    print(f"   Tamaño: {size_mb:.2f} MB")

# Verificar directorios de datos
print()
print("📦 PASO 2: Verificando directorios de datos")
print("-" * 70)

if not MONGODB_DATA_DIR.exists():
    print(f"⚠️  data/db NO existe: {MONGODB_DATA_DIR}")
    print("   Creando directorios...")
    try:
        MONGODB_DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"   ✅ Creado: {MONGODB_DATA_DIR}")
    except Exception as e:
        print(f"   ❌ Error al crear: {e}")
else:
    print(f"✅ data/db existe: {MONGODB_DATA_DIR}")
    files = list(MONGODB_DATA_DIR.glob('*'))
    print(f"   Archivos/carpetas dentro: {len(files)}")
    if len(files) > 0:
        print("   Primeros 5 archivos:")
        for f in files[:5]:
            print(f"     - {f.name}")

if not MONGODB_LOGS_DIR.exists():
    print(f"⚠️  data/logs NO existe: {MONGODB_LOGS_DIR}")
    try:
        MONGODB_LOGS_DIR.mkdir(parents=True, exist_ok=True)
        print(f"   ✅ Creado: {MONGODB_LOGS_DIR}")
    except Exception as e:
        print(f"   ❌ Error al crear: {e}")
else:
    print(f"✅ data/logs existe: {MONGODB_LOGS_DIR}")

# Verificar permisos de escritura
print()
print("🔐 PASO 3: Verificando permisos de escritura")
print("-" * 70)

try:
    test_file = MONGODB_DATA_DIR / '.test_permisos'
    test_file.write_text('test')
    test_file.unlink()
    print(f"✅ Permisos de escritura OK en: {MONGODB_DATA_DIR}")
except Exception as e:
    print(f"❌ NO se puede escribir en: {MONGODB_DATA_DIR}")
    print(f"   Error: {e}")
    print("\n   SOLUCIÓN:")
    print("   1. Ejecuta este script como Administrador")
    print("   2. O mueve la aplicación a una carpeta con permisos (ej: Documentos)")

# Verificar puerto
print()
print("🌐 PASO 4: Verificando puerto 27017")
print("-" * 70)

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    result = s.connect_ex(('localhost', MONGODB_PORT))
    if result == 0:
        print(f"⚠️  Puerto {MONGODB_PORT} YA ESTÁ EN USO")
        print("   MongoDB puede estar corriendo ya")
        print("\n   SOLUCIÓN:")
        print("   1. Abre el Administrador de Tareas")
        print("   2. Busca 'mongod.exe' y termínalo")
        print("   3. O reinicia tu PC")
    else:
        print(f"✅ Puerto {MONGODB_PORT} está disponible")

# Verificar archivo mongod.lock
print()
print("🔒 PASO 5: Verificando archivo mongod.lock")
print("-" * 70)

lock_file = MONGODB_DATA_DIR / 'mongod.lock'
if lock_file.exists():
    try:
        content = lock_file.read_text().strip()
        if content:
            print(f"⚠️  mongod.lock contiene datos: {content}")
            print("   Esto indica que MongoDB no se cerró correctamente")
            print("\n   SOLUCIÓN:")
            print("   1. Elimina el archivo manualmente:")
            print(f"      {lock_file}")
            print("   2. O selecciona 'Reparar' cuando ejecutes launcher.py")
        else:
            print("✅ mongod.lock existe pero está vacío (OK)")
    except Exception as e:
        print(f"⚠️  No se pudo leer mongod.lock: {e}")
else:
    print("✅ mongod.lock no existe (primera ejecución)")

# Verificar DLLs necesarias
print()
print("📚 PASO 6: Verificando dependencias (DLLs)")
print("-" * 70)

if sys.platform == 'win32' and mongod_exe.exists():
    print("Intentando ejecutar mongod.exe --version...")
    try:
        result = subprocess.run(
            [str(mongod_exe), '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("✅ mongod.exe puede ejecutarse correctamente")
            version_lines = result.stdout.split('\n')[:3]
            for line in version_lines:
                if line.strip():
                    print(f"   {line}")
        else:
            print("❌ mongod.exe falló al ejecutarse")
            print(f"   Error: {result.stderr}")
    except FileNotFoundError:
        print("❌ Falta alguna DLL de Visual C++")
        print("\n   SOLUCIÓN:")
        print("   Descarga e instala Visual C++ Redistributable:")
        print("   https://aka.ms/vs/17/release/vc_redist.x64.exe")
    except subprocess.TimeoutExpired:
        print("⚠️  mongod.exe no responde (puede ser normal)")
    except Exception as e:
        print(f"❌ Error al ejecutar: {e}")

# Revisar logs anteriores
print()
print("📋 PASO 7: Revisando logs anteriores")
print("-" * 70)

mongod_log = MONGODB_LOGS_DIR / 'mongod.log'
if mongod_log.exists():
    print(f"✅ Log encontrado: {mongod_log}")
    print("   Últimas 10 líneas del log:")
    print()
    try:
        with open(mongod_log, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for line in lines[-10:]:
                print(f"   {line.rstrip()}")
    except Exception as e:
        print(f"   ❌ No se pudo leer: {e}")
else:
    print("ℹ️  No hay logs anteriores (primera ejecución)")

# Resumen final
print()
print("="*70)
print("   📊 RESUMEN DEL DIAGNÓSTICO")
print("="*70)

issues = []
solutions = []

if not mongod_exe.exists():
    issues.append("❌ MongoDB no está instalado")
    solutions.append("Descarga MongoDB 7.0 Community Server (ZIP) y extráelo en la carpeta 'mongodb'")

if lock_file.exists() and lock_file.read_text().strip():
    issues.append("⚠️  Shutdown no limpio anterior")
    solutions.append(f"Elimina el archivo: {lock_file}")

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    if s.connect_ex(('localhost', MONGODB_PORT)) == 0:
        issues.append(f"⚠️  Puerto {MONGODB_PORT} en uso")
        solutions.append("Cierra MongoDB desde el Administrador de Tareas")

if issues:
    print("\n🔴 PROBLEMAS DETECTADOS:")
    for issue in issues:
        print(f"   {issue}")
    print("\n💡 SOLUCIONES:")
    for i, sol in enumerate(solutions, 1):
        print(f"   {i}. {sol}")
else:
    print("\n✅ TODO ESTÁ CORRECTO")
    print("   MongoDB debería iniciarse sin problemas")
    print("\n   Ejecuta: python launcher.py")

print()
print("="*70)
print("\nPresiona Enter para cerrar...")
input()
