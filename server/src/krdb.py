from datasets import load_dataset
import pymysql

dataset = load_dataset("meal-bbang/Korean_message", split="train")

# print(dataset[0])

conn = pymysql.connect(
    host='localhost',
    user='ajas',
    password='ajas1234',
    database='mydb',
    cursorclass=pymysql.cursors.DictCursor
)
cur = conn.cursor()

for row in dataset:
    content = row['content']
    cls = row['class']
    cur.execute(
        "INSERT INTO sms_dataset (content, label) VALUES (%s, %s)",
        (content, cls)
    )

conn.commit()
cur.close()
conn.close()