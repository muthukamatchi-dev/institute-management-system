import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="institute_db"
    )
    cursor = conn.cursor()
    
    print("--- TENANTS ---")
    cursor.execute("SELECT id, tenant_name, tenant_code, subdomain, status FROM tenants")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- USERS ---")
    cursor.execute("SELECT id, username, email, tenant_id, role_id, status FROM users")
    for row in cursor.fetchall():
        print(row)
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
