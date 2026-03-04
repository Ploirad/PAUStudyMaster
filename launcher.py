#!/usr/bin/env python3
"""
PAU Study Master - Launcher Principal
Este script inicia toda la aplicación (MongoDB + Backend + Frontend)
"""

import os
import sys
import time
import subprocess
import signal
import webbrowser
import logging
from pathlib import Path
import psutil
import socket

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pau_study_master.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Obtener directorio base
if getattr(sys, 'frozen', False):
    # Ejecutando como exe empaquetado
    BASE_DIR = Path(sys._MEIPASS)
    APP_DIR = Path(os.path.dirname(sys.executable))
else:
    # Ejecutando como script
    BASE_DIR = Path(__file__).parent
    APP_DIR = BASE_DIR

# Configuración
MONGODB_DIR = APP_DIR / 'mongodb'
MONGODB_DATA_DIR = APP_DIR / 'data' / 'db'
MONGODB_LOGS_DIR = APP_DIR / 'data' / 'logs'
BACKEND_DIR = BASE_DIR / 'backend'
FRONTEND_BUILD_DIR = BASE_DIR / 'frontend' / 'build'

MONGODB_PORT = 27017
BACKEND_PORT = 8001
# Frontend será servido por el backend, no necesita puerto separado

# Procesos globales
processes = []

def check_port_available(port):
    """Verifica si un puerto está disponible"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def kill_process_on_port(port):
    """Mata cualquier proceso usando el puerto especificado"""
    try:
        for proc in psutil.process_iter(['pid', 'name', 'connections']):
            try:
                connections = proc.info.get('connections', [])
                if connections:
                    for conn in connections:
                        if hasattr(conn, 'laddr') and conn.laddr.port == port:
                            logger.info(f"Matando proceso {proc.info['name']} (PID: {proc.info['pid']}) en puerto {port}")
                            psutil.Process(proc.info['pid']).kill()
                            time.sleep(1)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception as e:
        logger.warning(f"Error al limpiar puerto {port}: {e}")

def setup_mongodb():
    """Configura MongoDB portable"""
    logger.info("Configurando MongoDB...")
    
    # Crear directorios necesarios
    MONGODB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    MONGODB_LOGS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Verificar si MongoDB portable existe
    mongodb_exe = MONGODB_DIR / 'bin' / 'mongod.exe'
    
    print("\n" + "="*60)
    print("   VERIFICACIÓN DE MONGODB")
    print("="*60)
    print(f"Buscando MongoDB en: {mongodb_exe}")
    print(f"Carpeta MongoDB existe: {MONGODB_DIR.exists()}")
    print(f"Carpeta bin existe: {(MONGODB_DIR / 'bin').exists()}")
    print(f"mongod.exe existe: {mongodb_exe.exists()}")
    
    if not mongodb_exe.exists():
        print("\n❌ ERROR: MongoDB no encontrado")
        print("="*60)
        print("\n📥 NECESITAS DESCARGAR MONGODB:")
        print("\n1. Ve a: https://www.mongodb.com/try/download/community")
        print("2. Descarga: MongoDB Community Server 7.0 (ZIP, no MSI)")
        print("   ⚠️  IMPORTANTE: Descarga versión 7.0, NO 8.x (tiene bugs)")
        print("3. Extrae el contenido del ZIP")
        print(f"4. Copia la carpeta extraída a: {MONGODB_DIR}")
        print("\n   La estructura debe quedar así:")
        print(f"   {APP_DIR}/")
        print("   ├── PAUStudyMaster.exe")
        print("   └── mongodb/")
        print("       └── bin/")
        print("           ├── mongod.exe  ← Este archivo es obligatorio")
        print("           └── mongo.exe")
        print("\n5. Vuelve a ejecutar PAUStudyMaster.exe")
        print("="*60)
        print("\nPresiona Enter para cerrar...")
        input()
        return False
    
    # Verificar si hay un archivo de lock corrupto
    lock_file = MONGODB_DATA_DIR / 'mongod.lock'
    if lock_file.exists():
        try:
            with open(lock_file, 'r') as f:
                content = f.read().strip()
            
            if content:  # Archivo de lock no vacío = shutdown no limpio
                print("\n⚠️  ADVERTENCIA: Detectado shutdown no limpio anterior")
                print("="*60)
                print("\nMongoDB no se cerró correctamente la última vez.")
                print("Esto puede causar crashes durante el inicio.")
                print("\n¿Deseas limpiar la base de datos? (recomendado)")
                print("NOTA: Esto borrará TODOS los datos de la aplicación.")
                print("\nOpciones:")
                print("  [L] Limpiar y empezar de cero (RECOMENDADO)")
                print("  [R] Intentar reparar (puede fallar)")
                print("  [C] Cancelar e intentar sin cambios")
                
                choice = input("\nElige una opción [L/R/C]: ").strip().upper()
                
                if choice == 'L':
                    print("\n🧹 Limpiando base de datos...")
                    import shutil
                    try:
                        # Eliminar todo en data/db
                        for item in MONGODB_DATA_DIR.iterdir():
                            if item.is_file():
                                item.unlink()
                            elif item.is_dir():
                                shutil.rmtree(item)
                        print("✓ Base de datos limpiada")
                        print("  Todos los datos han sido eliminados.")
                        print("  La aplicación empezará con una BD limpia.")
                    except Exception as e:
                        print(f"❌ Error al limpiar: {e}")
                        print("Intenta eliminar manualmente la carpeta:")
                        print(f"  {MONGODB_DATA_DIR}")
                        input("\nPresiona Enter para cerrar...")
                        return False
                
                elif choice == 'R':
                    print("\n🔧 Intentando reparación...")
                    print("Eliminando archivo de lock...")
                    try:
                        lock_file.unlink()
                        print("✓ Archivo de lock eliminado")
                        print("  MongoDB intentará recuperarse automáticamente")
                    except Exception as e:
                        print(f"❌ Error: {e}")
                        input("\nPresiona Enter para cerrar...")
                        return False
                
                else:  # C o cualquier otra cosa
                    print("\n⚠️  Continuando sin cambios...")
                    print("  Si MongoDB crashea, vuelve a ejecutar y elige [L]")
        
        except Exception as e:
            logger.warning(f"No se pudo leer mongod.lock: {e}")
    
    print("✓ MongoDB encontrado correctamente")
    print("="*60 + "\n")
    return True

def start_mongodb():
    """Inicia MongoDB"""
    logger.info("Iniciando MongoDB...")
    
    if not setup_mongodb():
        return None
    
    # Limpiar puerto si está en uso
    if not check_port_available(MONGODB_PORT):
        logger.warning(f"Puerto {MONGODB_PORT} en uso, limpiando...")
        kill_process_on_port(MONGODB_PORT)
        time.sleep(2)
    
    mongodb_exe = MONGODB_DIR / 'bin' / 'mongod.exe'
    mongodb_log = MONGODB_LOGS_DIR / 'mongod.log'
    
    # IMPORTANTE: Verificar que el directorio de datos existe y tiene permisos
    logger.info(f"Directorio de datos MongoDB: {MONGODB_DATA_DIR}")
    logger.info(f"Directorio existe: {MONGODB_DATA_DIR.exists()}")
    logger.info(f"Es directorio: {MONGODB_DATA_DIR.is_dir()}")
    
    # Asegurar que el directorio tiene los permisos correctos
    try:
        test_file = MONGODB_DATA_DIR / '.test_write'
        test_file.write_text('test')
        test_file.unlink()
        logger.info("✓ Permisos de escritura verificados en directorio de datos")
    except Exception as e:
        logger.error(f"❌ No se puede escribir en {MONGODB_DATA_DIR}: {e}")
        print(f"\n❌ ERROR: No hay permisos de escritura en {MONGODB_DATA_DIR}")
        print("Solución: Ejecuta como administrador o cambia los permisos de la carpeta")
        print("\nPresiona Enter para cerrar...")
        input()
        return None
    
    cmd = [
        str(mongodb_exe),
        '--dbpath', str(MONGODB_DATA_DIR),
        '--port', str(MONGODB_PORT),
        '--logpath', str(mongodb_log),
        '--bind_ip', '127.0.0.1',
        '--storageEngine', 'wiredTiger',  # Motor de almacenamiento explícito
        '--noauth'  # Sin autenticación para desarrollo local
    ]
    
    try:
        logger.info(f"Ejecutando: {' '.join(cmd)}")
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        processes.append(process)
        logger.info(f"MongoDB iniciado en puerto {MONGODB_PORT} (PID: {process.pid})")
        logger.info(f"MongoDB guardará datos en: {MONGODB_DATA_DIR}")
        
        # Esperar a que MongoDB esté listo
        print("\n⏳ Esperando a que MongoDB inicie (esto puede tardar 30 segundos)...")
        for i in range(30):
            if not check_port_available(MONGODB_PORT):
                logger.info("✓ MongoDB está listo y escuchando")
                
                # Verificar que MongoDB realmente puede escribir
                time.sleep(2)  # Dar tiempo para que cree archivos iniciales
                
                # Verificar archivos en data/db
                files_in_data = list(MONGODB_DATA_DIR.glob('*'))
                logger.info(f"Archivos en {MONGODB_DATA_DIR}: {len(files_in_data)} archivos/carpetas")
                
                if len(files_in_data) == 0:
                    logger.warning("⚠️ ADVERTENCIA: MongoDB no ha creado archivos en data/db todavía")
                else:
                    logger.info(f"✓ MongoDB ha creado archivos de datos correctamente")
                    for f in files_in_data[:5]:  # Mostrar primeros 5
                        logger.info(f"  - {f.name}")
                
                print(f"✓ MongoDB está listo. Datos se guardan en: {MONGODB_DATA_DIR}")
                return process
            
            # Verificar si el proceso sigue vivo
            if process.poll() is not None:
                # El proceso terminó
                stdout, stderr = process.communicate()
                logger.error("❌ MongoDB se cerró inesperadamente")
                logger.error(f"Código de salida: {process.returncode}")
                if stdout:
                    logger.error(f"STDOUT: {stdout.decode('utf-8', errors='ignore')}")
                if stderr:
                    logger.error(f"STDERR: {stderr.decode('utf-8', errors='ignore')}")
                
                # Revisar el log
                if mongodb_log.exists():
                    with open(mongodb_log, 'r', encoding='utf-8', errors='ignore') as f:
                        log_content = f.read()
                        logger.error(f"Últimas líneas del log:\n{log_content[-1000:]}")
                
                print("\n❌ MongoDB no pudo iniciar. Posibles causas:")
                print("   1. Falta algún archivo DLL (instala Visual C++ Redistributable)")
                print("   2. Antivirus bloqueando mongod.exe")
                print("   3. Permisos insuficientes (ejecuta como administrador)")
                print(f"\nRevisa el log completo en: {mongodb_log}")
                print("\nPresiona Enter para cerrar...")
                input()
                return None
            
            time.sleep(1)
            if i % 5 == 0:
                print(f"   Esperando... ({i+1}/30 segundos)")
        
        logger.error("MongoDB no pudo iniciar en 30 segundos")
        logger.error("El proceso está corriendo pero no responde en el puerto")
        
        # Intentar matar el proceso
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            try:
                process.kill()
            except:
                pass
        
        print("\n❌ MongoDB no respondió a tiempo. Intenta:")
        print("   1. Ejecutar como administrador")
        print("   2. Revisar el log en:", mongodb_log)
        print("   3. Cerrar otras instancias de MongoDB")
        print("\nPresiona Enter para cerrar...")
        input()
        return None
        
    except Exception as e:
        logger.error(f"Error al iniciar MongoDB: {e}")
        import traceback
        traceback.print_exc()
        print("\nPresiona Enter para cerrar...")
        input()
        return None

def start_backend():
    """Inicia el backend FastAPI"""
    logger.info("Iniciando backend FastAPI...")
    
    # Limpiar puerto si está en uso
    if not check_port_available(BACKEND_PORT):
        logger.warning(f"Puerto {BACKEND_PORT} en uso, limpiando...")
        kill_process_on_port(BACKEND_PORT)
        time.sleep(2)
    
    # Configurar variables de entorno
    env = os.environ.copy()
    env['MONGO_URL'] = f'mongodb://localhost:{MONGODB_PORT}'
    env['DB_NAME'] = 'pau_study_master'
    env['CORS_ORIGINS'] = '*'
    
    # Cargar EMERGENT_LLM_KEY desde .env si existe
    env_file = BACKEND_DIR / '.env'
    if env_file.exists():
        logger.info(f"Cargando variables de entorno desde {env_file}")
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip().strip('"')
    else:
        logger.warning(f"Archivo .env no encontrado en {env_file}")
    
    server_py = BACKEND_DIR / 'server.py'
    logger.info(f"Buscando server.py en: {server_py}")
    logger.info(f"BACKEND_DIR existe: {BACKEND_DIR.exists()}")
    logger.info(f"server.py existe: {server_py.exists()}")
    
    if not server_py.exists():
        logger.error(f"Backend server.py no encontrado en {server_py}")
        logger.error(f"Contenido de BACKEND_DIR:")
        try:
            for item in BACKEND_DIR.iterdir():
                logger.error(f"  - {item}")
        except Exception as e:
            logger.error(f"  Error listando directorio: {e}")
        print("\n❌ No se encontró server.py. Presiona Enter para cerrar...")
        input()
        return None
    
    try:
        cmd = [sys.executable, '-m', 'uvicorn', 'server:app', '--host', '0.0.0.0', '--port', str(BACKEND_PORT)]
        logger.info(f"Ejecutando comando: {' '.join(cmd)}")
        logger.info(f"Directorio de trabajo: {BACKEND_DIR}")
        
        # Crear logs de stdout/stderr
        stdout_log = APP_DIR / 'backend_stdout.log'
        stderr_log = APP_DIR / 'backend_stderr.log'
        
        with open(stdout_log, 'w') as stdout_f, open(stderr_log, 'w') as stderr_f:
            process = subprocess.Popen(
                cmd,
                cwd=str(BACKEND_DIR),
                env=env,
                stdout=stdout_f,
                stderr=stderr_f,
                creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
            )
        
        processes.append(process)
        logger.info(f"Backend iniciado en puerto {BACKEND_PORT} (PID: {process.pid})")
        logger.info(f"Logs del backend en: {stdout_log} y {stderr_log}")
        
        # Esperar a que el backend esté listo
        print("\n⏳ Esperando a que el backend esté listo...")
        print("   Esto puede tardar 30-60 segundos en la primera ejecución...")
        print(f"   Logs en: {stdout_log} y {stderr_log}\n")
        
        import requests
        max_attempts = 60
        for i in range(max_attempts):
            try:
                # Intentar conectar al endpoint raíz
                response = requests.get(f'http://localhost:{BACKEND_PORT}/', timeout=2)
                if response.status_code in [200, 404, 307]:
                    logger.info("✓ Backend está listo y respondiendo")
                    print(f"   ✓ Backend listo después de {i+1} segundos\n")
                    time.sleep(2)
                    return process
            except requests.exceptions.ConnectionError:
                # Puerto no responde aún
                pass
            except Exception as e:
                logger.debug(f"Error verificando backend: {e}")
            
            # Verificar que el proceso siga vivo
            if process.poll() is not None:
                logger.error("❌ Backend se cerró inesperadamente")
                logger.error(f"Código de salida: {process.returncode}")
                
                # Leer los logs
                print("\n❌ El backend falló al iniciar. Revisando logs...\n")
                try:
                    with open(stdout_log, 'r', encoding='utf-8', errors='ignore') as f:
                        stdout_content = f.read()
                        if stdout_content:
                            print("=== STDOUT ===")
                            print(stdout_content[-1000:])  # Últimas 1000 caracteres
                            logger.error(f"STDOUT: {stdout_content}")
                except Exception as e:
                    logger.error(f"No se pudo leer stdout: {e}")
                
                try:
                    with open(stderr_log, 'r', encoding='utf-8', errors='ignore') as f:
                        stderr_content = f.read()
                        if stderr_content:
                            print("\n=== STDERR ===")
                            print(stderr_content[-1000:])
                            logger.error(f"STDERR: {stderr_content}")
                except Exception as e:
                    logger.error(f"No se pudo leer stderr: {e}")
                
                print("\n❌ Revisa pau_study_master.log para más detalles.")
                print("\nPresiona Enter para cerrar...")
                input()
                return None
            
            time.sleep(1)
            if i % 10 == 0 and i > 0:
                print(f"   Esperando... ({i}/{max_attempts} segundos)")
                # Mostrar últimas líneas del log cada 10 segundos
                try:
                    with open(stderr_log, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        if lines:
                            print(f"   Última línea del log: {lines[-1].strip()}")
                except:
                    pass
        
        logger.error(f"Backend no respondió después de {max_attempts} segundos")
        print(f"\n❌ Backend no respondió después de {max_attempts} segundos.")
        print("\n¿Deseas continuar de todas formas? [S/N]: ", end='')
        choice = input().strip().upper()
        
        if choice == 'S':
            logger.warning("Usuario eligió continuar sin backend listo")
            return process
        else:
            logger.info("Usuario canceló la ejecución")
            process.terminate()
            return None
        
    except Exception as e:
        logger.error(f"Error al iniciar backend: {e}")
        import traceback
        traceback.print_exc()
        print("\nPresiona Enter para cerrar...")
        input()
        return None

def open_browser():
    """Abre el navegador web"""
    # IMPORTANTE: Abrir el frontend en puerto 3000, no el backend
    url = 'http://localhost:3000'
    logger.info(f"Abriendo navegador en {url}")
    
    print("\n⏳ Esperando 5 segundos adicionales antes de abrir el navegador...")
    time.sleep(5)
    
    print(f"🌐 Abriendo {url} en tu navegador...\n")
    webbrowser.open(url)

def cleanup(signum=None, frame=None):
    """Limpia y cierra todos los procesos"""
    logger.info("\n\nCerrando PAU Study Master...")
    
    # Cerrar MongoDB de forma limpia primero (muy importante para persistencia)
    mongodb_closed = False
    for process in processes:
        try:
            # Intentar identificar si es MongoDB por el comando
            if process.poll() is None:  # Proceso sigue vivo
                logger.info(f"Cerrando proceso PID {process.pid}...")
                
                # Para MongoDB, usar terminate() que envía SIGTERM (cierre limpio)
                process.terminate()
                
                # Esperar hasta 10 segundos para cierre limpio
                try:
                    process.wait(timeout=10)
                    logger.info(f"Proceso {process.pid} cerrado limpiamente")
                    mongodb_closed = True
                except subprocess.TimeoutExpired:
                    logger.warning(f"Proceso {process.pid} no respondió, forzando cierre...")
                    process.kill()
                    process.wait(timeout=5)
        except Exception as e:
            logger.error(f"Error al terminar proceso: {e}")
            try:
                process.kill()
            except:
                pass
    
    if mongodb_closed:
        # Dar tiempo adicional para que MongoDB haga flush final
        logger.info("Esperando a que MongoDB complete escritura de datos...")
        time.sleep(2)
    
    # Verificar archivos en data/db
    try:
        files_in_data = list(MONGODB_DATA_DIR.glob('*'))
        logger.info(f"\n📊 Verificación final: {len(files_in_data)} archivos en {MONGODB_DATA_DIR}")
        if len(files_in_data) > 0:
            logger.info("✓ Los datos han sido guardados en disco")
        else:
            logger.warning("⚠️ ADVERTENCIA: No se encontraron archivos de datos. Los datos pueden no haberse guardado.")
    except Exception as e:
        logger.error(f"Error verificando archivos: {e}")
    
    logger.info("Todos los procesos terminados. ¡Hasta pronto!")
    sys.exit(0)

def main():
    """Función principal"""
    print("="*60)
    print("   PAU Study Master - Launcher")
    print("   Tu asistente inteligente para aprobar la PAU")
    print("="*60)
    print()
    
    # Registrar manejador de señales
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    try:
        # 1. Iniciar MongoDB
        logger.info("Paso 1/2: Iniciando MongoDB...")
        mongodb_process = start_mongodb()
        if not mongodb_process:
            logger.error("No se pudo iniciar MongoDB. Abortando.")
            return 1
        
        # 2. Iniciar Backend (que incluye el frontend)
        logger.info("Paso 2/2: Iniciando Backend (incluye Frontend)...")
        backend_process = start_backend()
        if not backend_process:
            logger.error("No se pudo iniciar el backend. Abortando.")
            cleanup()
            return 1
        
        # Abrir navegador
        open_browser()
        
        print("\n" + "="*60)
        print("   ✅ PAU Study Master está corriendo!")
        print("="*60)
        print(f"\n   🌐 Aplicación (Frontend): http://localhost:3000")
        print(f"   🔧 API (Backend):         http://localhost:{BACKEND_PORT}/api")
        print(f"   📊 MongoDB:               mongodb://localhost:{MONGODB_PORT}")
        print("\n   ⚠️  IMPORTANTE: Usa http://localhost:3000 para acceder a la app")
        print("   Presiona Ctrl+C para detener la aplicación")
        print("="*60 + "\n")
        
        # Mantener el script corriendo
        while True:
            time.sleep(1)
            # Verificar que los procesos sigan vivos
            for process in processes:
                if process.poll() is not None:
                    logger.error(f"Un proceso ha terminado inesperadamente (PID: {process.pid})")
                    cleanup()
                    return 1
    
    except KeyboardInterrupt:
        logger.info("\nInterrupción de teclado detectada")
        cleanup()
        return 0
    except Exception as e:
        logger.error(f"Error fatal: {e}")
        cleanup()
        return 1

if __name__ == '__main__':
    sys.exit(main())
