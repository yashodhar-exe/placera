import psycopg2
import sys

connection_strings = [
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres:admin@localhost:5432/postgres",
    "postgresql://postgres:root@localhost:5432/postgres",
    "postgresql://postgres:password@localhost:5432/postgres",
    "postgresql://postgres@localhost:5432/postgres",
]

success = False
for conn_str in connection_strings:
    try:
        print(f"Trying connection: {conn_str.replace(conn_str.split('@')[0].split(':')[-1], '****') if ':' in conn_str.split('@')[0] else conn_str}")
        conn = psycopg2.connect(conn_str)
        print(f"--> Success! Connected using: {conn_str}")
        conn.close()
        success = True
        break
    except Exception as e:
        print(f"--> Failed: {e}")

if not success:
    print("Could not connect to PostgreSQL with any common credentials.")
    sys.exit(1)
sys.exit(0)
