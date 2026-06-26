from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:InternDB1@localhost:5432/lms_db"

engine = create_engine(DATABASE_URL)

try:
    conn = engine.connect()
    print("DB Connected Successfully")
    conn.close()
except Exception as e:
    print(e)