#!/usr/bin/env python3
"""
Script para probar la conexión a SQL Server
"""
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

def test_sqlserver_connection():
    """Test SQL Server connection"""
    try:
        # Configuración de conexión
        server = os.getenv("SQLSERVER_HOST", "localhost")
        port = os.getenv("SQLSERVER_PORT", "1433")
        database = os.getenv("SQLSERVER_DATABASE", "MarcadorBasket")
        username = os.getenv("SQLSERVER_USERNAME", "sa")
        password = os.getenv("MSSQL_SA_PASSWORD", "")
        
        # String de conexión
        connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server},{port};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes;"
        
        print(f"🔍 Intentando conectar a SQL Server...")
        print(f"   Server: {server}:{port}")
        print(f"   Database: {database}")
        print(f"   Username: {username}")
        
        # Intentar conexión
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Ejecutar una consulta simple
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        
        print("✅ Conexión exitosa a SQL Server!")
        print(f"   Versión: {version[:50]}...")
        
        # Verificar si existe la base de datos
        cursor.execute("SELECT name FROM sys.databases WHERE name = ?", database)
        db_exists = cursor.fetchone()
        
        if db_exists:
            print(f"✅ Base de datos '{database}' encontrada")
        else:
            print(f"⚠️  Base de datos '{database}' no encontrada")
        
        cursor.close()
        conn.close()
        return True
        
    except pyodbc.Error as e:
        print(f"❌ Error de conexión a SQL Server: {e}")
        return False
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

def list_odbc_drivers():
    """List available ODBC drivers"""
    print("🔍 Drivers ODBC disponibles:")
    drivers = pyodbc.drivers()
    for driver in drivers:
        print(f"   • {driver}")
    
    # Check for SQL Server driver specifically
    sql_drivers = [d for d in drivers if 'SQL Server' in d]
    if sql_drivers:
        print(f"✅ Drivers de SQL Server encontrados: {len(sql_drivers)}")
    else:
        print("❌ No se encontraron drivers de SQL Server")

if __name__ == "__main__":
    print("🚀 Prueba de conexión a SQL Server")
    print("=" * 50)
    
    list_odbc_drivers()
    print()
    test_sqlserver_connection()
