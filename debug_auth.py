#!/usr/bin/env python3
"""
Script de debugging para identificar el problema del loop de autenticación
"""

import requests
import sys

BACKEND_URL = "http://localhost:8001"

def test_backend():
    """Prueba si el backend está corriendo"""
    print("=" * 60)
    print("TEST 1: Verificando Backend")
    print("=" * 60)
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está corriendo en http://localhost:8001")
            print("   Puedes ver la documentación en: http://localhost:8001/docs")
            return True
        else:
            print(f"⚠️ Backend responde pero con código: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend NO está corriendo")
        print("   Inicia el backend con: uvicorn server:app --reload --host 0.0.0.0 --port 8001")
        return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_auth_endpoint():
    """Prueba el endpoint de autenticación"""
    print("\n" + "=" * 60)
    print("TEST 2: Probando endpoint /api/auth/me SIN cookie")
    print("=" * 60)
    try:
        response = requests.get(f"{BACKEND_URL}/api/auth/me", timeout=5)
        print(f"Código de respuesta: {response.status_code}")
        print(f"Respuesta: {response.text}")
        
        if response.status_code == 401:
            print("✅ Correcto: El endpoint rechaza peticiones sin autenticación")
            return True
        else:
            print("⚠️ Inesperado: El endpoint debería devolver 401 sin cookie")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_with_fake_cookie():
    """Prueba con una cookie falsa"""
    print("\n" + "=" * 60)
    print("TEST 3: Probando endpoint /api/auth/me CON cookie falsa")
    print("=" * 60)
    try:
        cookies = {"session_token": "fake_token_12345"}
        response = requests.get(
            f"{BACKEND_URL}/api/auth/me",
            cookies=cookies,
            timeout=5
        )
        print(f"Código de respuesta: {response.status_code}")
        print(f"Respuesta: {response.text}")
        
        if response.status_code == 401:
            print("✅ Correcto: El endpoint rechaza tokens inválidos")
            return True
        else:
            print("⚠️ Inesperado: El endpoint debería rechazar tokens falsos")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_frontend():
    """Verifica si el frontend está corriendo"""
    print("\n" + "=" * 60)
    print("TEST 4: Verificando Frontend")
    print("=" * 60)
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend está corriendo en http://localhost:3000")
            return True
        else:
            print(f"⚠️ Frontend responde pero con código: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend NO está corriendo")
        print("   Inicia el frontend con:")
        print("   cd app/frontend")
        print("   npm start  (o yarn start)")
        return False
    except Exception as e:
        print(f"❌ Error conectando al frontend: {e}")
        return False

def main():
    print("\n")
    print("*" * 60)
    print("   🔍 PAU Study Master - Debugging de Autenticación")
    print("*" * 60)
    print()
    
    # Ejecutar tests
    backend_ok = test_backend()
    auth_ok = test_auth_endpoint()
    cookie_ok = test_with_fake_cookie()
    frontend_ok = check_frontend()
    
    # Resumen
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"Backend corriendo:        {'✅' if backend_ok else '❌'}")
    print(f"Endpoint /api/auth/me:    {'✅' if auth_ok else '❌'}")
    print(f"Validación de cookies:    {'✅' if cookie_ok else '❌'}")
    print(f"Frontend corriendo:       {'✅' if frontend_ok else '❌'}")
    
    if backend_ok and frontend_ok:
        print("\n" + "=" * 60)
        print("✅ SERVICIOS OK - SIGUIENTE PASO:")
        print("=" * 60)
        print("\n1. Abre el navegador en: http://localhost:3000")
        print("2. Abre DevTools (F12)")
        print("3. Ve a la pestaña Console")
        print("4. Intenta iniciar sesión y observa los logs")
        print("\n5. Si ves un loop, revisa:")
        print("   - Application → Cookies → http://localhost:3000")
        print("   - Busca la cookie 'session_token'")
        print("   - Network → Filtra por 'auth/me'")
        print("   - Mira el código de respuesta (debería ser 200 después del login)")
        print("\n6. Consulta el archivo SOLUCION_LOOP_LOGIN.md para más detalles")
    else:
        print("\n" + "=" * 60)
        print("❌ HAY PROBLEMAS - ACCIÓN REQUERIDA:")
        print("=" * 60)
        if not backend_ok:
            print("\n🔴 BACKEND:")
            print("   cd app/backend")
            print("   uvicorn server:app --reload --host 0.0.0.0 --port 8001")
        if not frontend_ok:
            print("\n🔴 FRONTEND:")
            print("   cd app/frontend")
            print("   npm start")
    
    print("\n" + "=" * 60)
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelado por el usuario")
        sys.exit(1)
