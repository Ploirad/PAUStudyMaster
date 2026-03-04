#!/usr/bin/env python3
"""
Script para construir el ejecutable de PAU Study Master
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path

print("="*60)
print("   PAU Study Master - Constructor de Ejecutable")
print("="*60)
print()

# Verificar que estamos en el directorio correcto
BASE_DIR = Path(__file__).parent
os.chdir(BASE_DIR)

print("Paso 1: Verificando dependencias...")

# Verificar que PyInstaller esté instalado
try:
    import PyInstaller
    print("✓ PyInstaller encontrado")
    print(f"  Versión: {PyInstaller.__version__}")
except ImportError:
    print("✗ PyInstaller no encontrado")
    print("Instalando PyInstaller...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
    print("✓ PyInstaller instalado")

# Verificar que psutil esté instalado
try:
    import psutil
    print("✓ psutil encontrado")
except ImportError:
    print("✗ psutil no encontrado")
    print("Instalando psutil...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psutil'])
    print("✓ psutil instalado")

# Verificar que requests esté instalado
try:
    import requests
    print("✓ requests encontrado")
except ImportError:
    print("✗ requests no encontrado")
    print("Instalando requests...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests'])
    print("✓ requests instalado")

print("\nPaso 2: Verificando archivos necesarios...")

# Verificar que el frontend esté compilado
frontend_build = BASE_DIR / 'frontend' / 'build'
if not frontend_build.exists():
    print("✗ Frontend build no encontrado")
    print("Por favor, compila el frontend primero:")
    print("  cd frontend")
    print("  yarn install")
    print("  yarn build")
    sys.exit(1)
else:
    print("✓ Frontend build encontrado")

# Verificar que el backend exista
backend_dir = BASE_DIR / 'backend'
if not (backend_dir / 'server.py').exists():
    print("✗ Backend no encontrado")
    sys.exit(1)
else:
    print("✓ Backend encontrado")

print("\nPaso 3: Construyendo ejecutable con PyInstaller...")

# Preparar las rutas (formato Windows)
backend_path = str(backend_dir).replace('\\', '\\\\')
frontend_path = str(frontend_build).replace('\\', '\\\\')

# Crear spec file en lugar de usar comando directo
spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['launcher.py'],
    pathex=[],
    binaries=[],
    datas=[
        (r'{backend_path}', 'backend'),
        (r'{frontend_path}', 'frontend/build'),
    ],
    hiddenimports=[
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'motor',
        'motor.motor_asyncio',
        'pymongo',
        'PyPDF2',
        'emergentintegrations',
        'psutil',
        'requests',
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='PAUStudyMaster',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # True para ver errores, cambiar a False para producción
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''

# Escribir el spec file
spec_file = BASE_DIR / 'PAUStudyMaster.spec'
print(f"Creando archivo spec: {spec_file}")
with open(spec_file, 'w', encoding='utf-8') as f:
    f.write(spec_content)

# Ejecutar PyInstaller con el spec file
try:
    print("\nEjecutando PyInstaller...")
    print("Esto puede tardar varios minutos...")
    
    cmd = [sys.executable, '-m', 'PyInstaller', '--clean', str(spec_file)]
    
    print(f"Comando: {' '.join(cmd)}\n")
    
    result = subprocess.run(
        cmd,
        check=True,
        capture_output=False,  # Mostrar output en tiempo real
        text=True
    )
    
    print("\n✓ Ejecutable construido exitosamente!")
    
except subprocess.CalledProcessError as e:
    print(f"\n✗ Error al construir ejecutable")
    print(f"Código de error: {e.returncode}")
    print("\nIntenta ejecutar manualmente:")
    print(f"  python -m PyInstaller --clean PAUStudyMaster.spec")
    sys.exit(1)
except Exception as e:
    print(f"\n✗ Error inesperado: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nPaso 4: Preparando distribución...")

# Crear carpeta de distribución
dist_dir = BASE_DIR / 'dist' / 'PAUStudyMaster'
dist_dir.mkdir(parents=True, exist_ok=True)

# Copiar el ejecutable
exe_file = BASE_DIR / 'dist' / 'PAUStudyMaster.exe'
if exe_file.exists():
    shutil.copy2(exe_file, dist_dir / 'PAUStudyMaster.exe')
    print(f"✓ Ejecutable copiado a {dist_dir}")
else:
    print("✗ No se encontró el ejecutable generado")
    print(f"Buscando en: {exe_file}")
    sys.exit(1)

# Copiar README
readme_exe = BASE_DIR / 'README_EXE.md'
if readme_exe.exists():
    shutil.copy2(readme_exe, dist_dir / 'README.md')
    print("✓ README copiado")

# Crear estructura de carpetas necesarias
(dist_dir / 'data' / 'db').mkdir(parents=True, exist_ok=True)
(dist_dir / 'data' / 'logs').mkdir(parents=True, exist_ok=True)
(dist_dir / 'mongodb').mkdir(parents=True, exist_ok=True)

print("\n" + "="*60)
print("   ✓ Construcción completada!")
print("="*60)
print(f"\nEl ejecutable está en: {dist_dir / 'PAUStudyMaster.exe'}")
print("\n⚠️  IMPORTANTE: Antes de distribuir, debes:")
print("1. Descargar MongoDB Community Server portable para Windows")
print("2. Extraerlo en la carpeta 'mongodb' dentro de dist/PAUStudyMaster")
print("3. La estructura debe ser: dist/PAUStudyMaster/mongodb/bin/mongod.exe")
print("\nPuedes descargar MongoDB desde:")
print("https://www.mongodb.com/try/download/community")
print("\nLee README.md en la carpeta dist para más instrucciones.")
print("="*60)
