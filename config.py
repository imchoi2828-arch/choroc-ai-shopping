import os
from dotenv import load_dotenv

load_dotenv() 

# DB 설정
DB_CONFIG = {
    "host":        "localhost",
    "port":        3306,
    "user":        "root",
    "password":    os.getenv("DB_PASSWORD"),
    "database":    "choroc_db",
    "charset":     "utf8mb4",
}

# JWT 설정
JWT_SECRET       = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM    = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

# OpenAI 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 마스터 계정 설정
MASTER_EMAIL    = "qwer10287@naver.com"
MASTER_PASSWORD = "123456"
MASTER_NAME     = "관리자"