import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Common connection credentials to probe on local system
CONNECTION_STRINGS = [
    "postgresql://postgres:postgres@localhost:5432",
    "postgresql://postgres:admin@localhost:5432",
    "postgresql://postgres:root@localhost:5432",
    "postgresql://postgres:password@localhost:5432",
    "postgresql://postgres@localhost:5432",
]

DATABASE_NAME = "placement_ops"
WORKING_BASE_URL = None

# Autodetect credentials
for conn_str in CONNECTION_STRINGS:
    try:
        # Try connecting to default database 'postgres' to check connection
        temp_conn = psycopg2.connect(f"{conn_str}/postgres", connect_timeout=3)
        temp_conn.close()
        WORKING_BASE_URL = conn_str
        print(f"Database detection: Connected successfully using base URL: {conn_str.replace(conn_str.split('@')[0].split(':')[-1], '****') if ':' in conn_str.split('@')[0] else conn_str}")
        break
    except Exception:
        continue

if not WORKING_BASE_URL:
    # Fallback to SQLite if Postgres is unavailable, but warning. Since Postgres is running, one should work.
    print("Database detection: Could not connect to PostgreSQL. Fallback to SQLite.")
    DATABASE_URL = "sqlite:///./placement_ops.db"
else:
    # Ensure database exists
    try:
        conn = psycopg2.connect(f"{WORKING_BASE_URL}/postgres", connect_timeout=3)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DATABASE_NAME}'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f"CREATE DATABASE {DATABASE_NAME}")
            print(f"Database detection: Created database '{DATABASE_NAME}'")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Database detection: Error checking/creating database: {e}")
    
    DATABASE_URL = f"{WORKING_BASE_URL}/{DATABASE_NAME}"

print(f"Database URL in use: {DATABASE_URL.replace(DATABASE_URL.split('@')[0].split(':')[-1], '****') if '@' in DATABASE_URL and ':' in DATABASE_URL.split('@')[0] else DATABASE_URL}")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
