import pymysql
from config import DB_CONFIG

DB_CONFIG["cursorclass"] = pymysql.cursors.DictCursor

def get_db():
    return pymysql.connect(**DB_CONFIG)