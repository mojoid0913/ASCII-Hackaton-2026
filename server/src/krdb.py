from datasets import load_dataset
import pymysql
import os

dataset = load_dataset("meal-bbang/Korean_message", split="train")

# print(dataset[0])

def _cfg(db=None):
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", "rootpassword"),
        "database": db,
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": False,
    }
conn = pymysql.connect(**_cfg(db="smishing_db"))
cur = conn.cursor()

# mydb가 존재하지 않으면 생성
cur.execute("CREATE DATABASE IF NOT EXISTS smishing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
conn.commit()
cur.close()
conn.close()

conn = pymysql.connect(**_cfg(db="smishing_db"))
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS sms_dataset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    label TINYINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")
conn.commit()
for row in dataset:
    content = row['content']
    cls = row['class']
    cur.execute(
        "INSERT INTO sms_dataset (content, label) VALUES (%s, %s)",
        (content, cls)
conn.commit()
cur.close()
conn.close()

