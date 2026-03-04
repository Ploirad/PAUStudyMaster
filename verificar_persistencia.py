#!/usr/bin/env python3
"""
Script de verificación de persistencia de datos
Verifica que MongoDB está guardando datos correctamente en disco
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from datetime import datetime

# Configuración
APP_DIR = Path(__file__).parent
MONGODB_DATA_DIR = APP_DIR / 'data' / 'db'
MONGODB_PORT = 27017
DB_NAME = 'pau_study_master'

def check_data_directory():
    """Verifica el directorio de datos"""
    print("="*60)
    print("   VERIFICACIÓN DE PERSISTENCIA DE DATOS")
    print("="*60)
    print()
    
    print(f"📁 Directorio de datos: {MONGODB_DATA_DIR}")
    print(f"   Existe: {MONGODB_DATA_DIR.exists()}")
    
    if not MONGODB_DATA_DIR.exists():
        print("   ❌ ERROR: El directorio no existe")
        return False
    
    # Listar archivos
    files = list(MONGODB_DATA_DIR.glob('*'))
    print(f"   Archivos encontrados: {len(files)}")
    
    if len(files) == 0:
        print("   ⚠️  ADVERTENCIA: No hay archivos de datos")
        print("   MongoDB no ha guardado nada todavía")
        return False
    
    print("\n   Archivos principales:")
    for f in files[:10]:
        size = f.stat().st_size if f.is_file() else 0
        size_mb = size / (1024 * 1024)
        tipo = "📄" if f.is_file() else "📁"
        print(f"   {tipo} {f.name} ({size_mb:.2f} MB)")
    
    wt_files = list(MONGODB_DATA_DIR.glob('WiredTiger*'))
    collection_files = list(MONGODB_DATA_DIR.glob('collection-*.wt'))
    
    print(f"\n   Archivos WiredTiger: {len(wt_files)}")
    print(f"   Archivos de colecciones: {len(collection_files)}")
    
    if len(wt_files) > 0 or len(collection_files) > 0:
        print("   ✓ MongoDB está usando el directorio correctamente")
        return True
    else:
        print("   ⚠️  No se encontraron archivos de MongoDB típicos")
        return False

def check_mongodb_connection():
    """Verifica conexión y datos en MongoDB"""
    print("\n" + "="*60)
    print("   VERIFICACIÓN DE CONEXIÓN A MONGODB")
    print("="*60)
    print()
    
    try:
        print(f"🔌 Conectando a mongodb://localhost:{MONGODB_PORT}...")
        client = MongoClient(f'mongodb://localhost:{MONGODB_PORT}', serverSelectionTimeoutMS=5000)
        
        client.server_info()
        print("   ✓ Conexión establecida")
        
        db = client[DB_NAME]
        print(f"\n📊 Base de datos: {DB_NAME}")
        
        collections = db.list_collection_names()
        print(f"   Colecciones encontradas: {len(collections)}")
        
        if len(collections) == 0:
            print("   ⚠️  No hay colecciones (base de datos vacía)")
            return True
        
        print("\n   Colecciones y documentos:")
        total_docs = 0
        for coll_name in collections:
            count = db[coll_name].count_documents({})
            total_docs += count
            print(f"   • {coll_name}: {count} documentos")
        
        print(f"\n   Total de documentos: {total_docs}")
        
        if total_docs > 0:
            print("   ✓ Los datos están guardados en MongoDB")
        else:
            print("   ⚠️  MongoDB está vacío (no hay datos)")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"   ❌ ERROR: No se pudo conectar a MongoDB")
        print(f"   Error: {e}")
        return False

def main():
    print("\n")
    dir_ok = check_data_directory()
    conn_ok = check_mongodb_connection()
    
    print("\n" + "="*60)
    print("   RESUMEN")
    print("="*60)
    
    if dir_ok and conn_ok:
        print("\n✅ TODO CORRECTO")
        print("   MongoDB está guardando datos en disco correctamente")
    elif conn_ok and not dir_ok:
        print("\n⚠️  ADVERTENCIA")
        print("   MongoDB conectado pero sin archivos de datos")
    elif not conn_ok:
        print("\n❌ PROBLEMA - MongoDB no está corriendo")
    
    print("\n" + "="*60)
    input("\nPresiona Enter para salir...")

if __name__ == '__main__':
    main()
