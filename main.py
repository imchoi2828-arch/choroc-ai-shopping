"""
main.py — 초록마을 FastAPI 백엔드 (완전판)

핵심 설계 원칙
─────────────────────────────────────────────────────
  ✅ GET /api/data      → data.json(틀) + MySQL(알맹이) 합쳐서 반환 (메인화면용)
  ✅ GET /api/products  → DB 상품 목록 8개만 반환 (관리자 페이지 전용)
  ✅ POST/DELETE /api/products → DB CRUD (관리자 페이지 전용)
─────────────────────────────────────────────────────
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from config import DB_CONFIG, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS, OPENAI_API_KEY
from db import get_db
from schemas import SignupReq, LoginReq, CartAddReq, CartUpdateReq, ChatReq
from category import normalize_category
from pydantic import BaseModel
from typing import Optional
import hashlib, jwt, datetime, json, os, base64, shutil
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_DIR = Path("img")
IMG_DIR.mkdir(exist_ok=True)
app.mount("/img", StaticFiles(directory="img"), name="img")

# 🌟 [수정 포인트 1] SEED_PRODUCTS 17개로 확장
# 이유: 메인 페이지 4개 섹션(5-4-4-4)을 꽉 채우기 위해 서버 시작 시 DB에 17개를 넣어줍니다.
SEED_PRODUCTS = [
    # recommend (5개 - 슬라이더 화살표 작동용)
    ('무농약이상 로메인(120g)', 2150, 2400, 10, '냉장', './img/26.webp'),
    ('초록계란이 껍질째 먹는 사과(1.8kg)', 21900, None, None, '냉장', './img/23.webp'),
    ('국내산 해물모둠(250g)', 12900, 15900, 18, '냉동', './img/19.webp'),
    ('유기농 귀리혼합 5곡(1.5kg)', 14500, 18200, 20, '일반', './img/18.webp'),
    ('초록베베 국산콩 순한 비빔간장(180mL)', 7900, None, None, '일반', './img/15.webp'),
    # weeklyChoroc (4개)
    ('맛있는 참치(150g)', 3330, 4170, 20, '일반', './img/8.webp'),
    ('무농약 팝콘옥수수(400g)', 6600, 8900, 25, '일반', './img/22.webp'),
    ('우리밀 칼국수(400g)', 2980, 3800, 21, '일반', './img/7.webp'),
    ('무항생제 한우 등심구이용(냉장)(300g)', 49000, 62000, 20, '냉장', './img/9.webp'),
    # weeklyMust (4개)
    ('까나리액젓(900mL)', 8800, 9700, 10, '일반', './img/25.webp'),
    ('무농약이상 오이(2입)', 3980, 4700, 15, '냉장', './img/4.webp'),
    ('신선한 유기농 우유(900mL)', 6500, None, None, '냉장', './img/3.webp'),
    ('구운 김(20g/10매)', 3950, 4500, 12, '일반', './img/12.webp'),
    # easyCook (4개)
    ('노르웨이 생연어회(150g)', 16900, None, None, '냉장', './img/17.webp'),
    ('노르웨이 생연어필렛(200g)', 17900, None, None, '냉장', './img/16.webp'),
    ('무항생제 한돈 삼겹살구이용(냉장/500g)', 29000, None, None, '냉장', './img/20.webp'),
    ('무항생제 닭볶음탕용(냉장/900g)', 12500, None, None, '냉장', './img/21.webp')
]

# ════════════════════════════════════════════════════
# AI 상품등록 자동화 보조 테이블
# ════════════════════════════════════════════════════
def _ensure_automation_tables(cur):
    """
    AI 상품등록 자동화 과정을 기록하기 위한 보조 테이블 생성.
    기존 기능은 그대로 유지하고, 자동화 이력만 추가로 저장한다.
    """

    # 1. AI 분석 결과 로그
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_analysis_logs (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            original_file   VARCHAR(255),
            image_url       VARCHAR(500),
            predicted_name  VARCHAR(200),
            predicted_price INT,
            predicted_tag   VARCHAR(50),
            raw_response    TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. 관리자 작업 로그
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_action_logs (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            action_type   VARCHAR(30) NOT NULL,
            product_id    INT,
            product_name  VARCHAR(200),
            product_price INT,
            product_tag   VARCHAR(50),
            memo          VARCHAR(500),
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. 상품 이미지 관리 테이블
    cur.execute("""
        CREATE TABLE IF NOT EXISTS product_images (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            product_id  INT,
            image_url   VARCHAR(500) NOT NULL,
            is_main     BOOLEAN DEFAULT TRUE,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    """)


@app.on_event("startup")
def reset_products_on_startup():
    """서버 시작 시 products 테이블을 항상 초기 17개로 리셋"""
    db = get_db()
    try:
        with db.cursor() as cur:
            # ✅ 추가: 자동화 보조 테이블 생성
            _ensure_automation_tables(cur)

            cur.execute("SET FOREIGN_KEY_CHECKS = 0")

            # ✅ 추가: 자동화 보조 테이블도 초기화
            cur.execute("TRUNCATE TABLE product_images")
            cur.execute("TRUNCATE TABLE admin_action_logs")
            cur.execute("TRUNCATE TABLE ai_analysis_logs")

            # 기존 초기화 구조 유지
            cur.execute("TRUNCATE TABLE cart_items")
            cur.execute("TRUNCATE TABLE products")

            cur.execute("SET FOREIGN_KEY_CHECKS = 1")
            cur.execute("ALTER TABLE products AUTO_INCREMENT = 1")
            cur.executemany(
                "INSERT INTO products (name, price, original_price, discount_percent, tag, image) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                SEED_PRODUCTS
            )
        db.commit()
    finally:
        db.close()

class ProductUpdateReq(BaseModel):
    name:  Optional[str] = None
    price: Optional[int] = None
    tag:   Optional[str] = None

# ────────────────────────────────────────────────────
# 유틸
# ────────────────────────────────────────────────────
def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def make_token(user_id: int, name: str, email: str) -> str:
    payload = {
        "sub":   str(user_id),
        "name":  name,
        "email": email,
        "exp":   datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

def current_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="토큰 형식 오류")
    return decode_token(authorization.split(" ", 1)[1])


# ════════════════════════════════════════════════════
# 1. 메인화면 데이터 — (data.json 뼈대 + MySQL 상품 연동)
# ════════════════════════════════════════════════════
DATA_JSON_PATH = os.path.join(os.path.dirname(__file__), "json", "data.json")
if not os.path.exists(DATA_JSON_PATH):
    DATA_JSON_PATH = os.path.join(os.path.dirname(__file__), "data.json")

# 🌟 [수정 포인트 2] get_frontend_data() 스마트 연동
# 이유: index.html이 예전처럼 data.json만 읽는 게 아니라, DB에서 상품을 꺼내서 합쳐서 주도록 바꿨습니다.
@app.get("/api/data")
def get_frontend_data():
    # 1. 디자인 틀(로고, 배너 등) 로드
    try:
        with open(DATA_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="data.json 파일을 찾을 수 없습니다.")

    # 2. MySQL에서 최신 상품 가져오기
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM products ORDER BY id ASC")
            db_items = cur.fetchall()
    finally:
        db.close()

    # 3. 프론트엔드가 요구하는 카멜케이스(camelCase) 형식으로 변환
    formatted_items = []
    for p in db_items:
        formatted_items.append({
            "id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "originalPrice": p["original_price"],
            "discountPercent": p["discount_percent"],
            "tag": p["tag"],
            "image": p["image"]
        })

    # 4. 각 섹션에 순서대로 상품 꽂아넣기 (5-4-4-4 구조)
    for sec in data.get("sections", []):
        if sec["id"] == "recommend":
            sec["items"] = formatted_items[0:5]    # 첫 섹션은 5개! (슬라이더용)
        elif sec["id"] == "weeklyChoroc":
            sec["items"] = formatted_items[5:9]    # 4개
        elif sec["id"] == "weeklyMust":
            sec["items"] = formatted_items[9:13]   # 4개
        elif sec["id"] == "easyCook":
            sec["items"] = formatted_items[13:17]  # 4개

    return data


# ════════════════════════════════════════════════════
# 2. 관리자 상품 CRUD — DB 전용
# ════════════════════════════════════════════════════

@app.get("/api/products")
def get_products():
    """관리자 페이지: 최신 상품 8개만 불러오기"""
    # 🌟 [유지 포인트] LIMIT 8
    # 이유: 창고(DB)에 상품이 100개가 넘어도, 관리자 표에는 최근 등록/수정된 8개만 띄웁니다.
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM products ORDER BY id DESC LIMIT 8")
            return {"items": cur.fetchall()}
    finally:
        db.close()


@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    ext      = Path(file.filename).suffix or ".jpg"
    filename = f"upload_{datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')}{ext}"
    with open(IMG_DIR / filename, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"http://127.0.0.1:8000/img/{filename}"}


@app.post("/api/products")
def add_product(name: str, price: int, tag: str = "일반", image: str = ""):
    db = get_db()
    try:
        with db.cursor() as cur:
            # ✅ 추가: 자동화 보조 테이블 확인
            _ensure_automation_tables(cur)

            # 기존 핵심 기능 유지: products 테이블에 최종 상품 저장
            cur.execute(
                "INSERT INTO products (name, price, tag, image) VALUES (%s, %s, %s, %s)",
                (name, price, normalize_category(tag), image)
            )

            # ✅ 추가: 방금 등록된 상품 id 가져오기
            product_id = cur.lastrowid

            # ✅ 추가: 상품 이미지 경로 기록
            if image:
                cur.execute(
                    """
                    INSERT INTO product_images (product_id, image_url, is_main)
                    VALUES (%s, %s, %s)
                    """,
                    (product_id, image, True)
                )

            # ✅ 추가: 관리자 상품 등록 로그 기록
            cur.execute(
                """
                INSERT INTO admin_action_logs
                (action_type, product_id, product_name, product_price, product_tag, memo)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    "CREATE",
                    product_id,
                    name,
                    price,
                    normalize_category(tag),
                    "관리자 상품 등록"
                )
            )

        db.commit()
        return {"message": "등록 완료", "name": name}
    finally:
        db.close()


@app.patch("/api/products/{prod_id}")
def update_product(prod_id: int, req: ProductUpdateReq):
    db = get_db()
    try:
        with db.cursor() as cur:
            # ✅ 추가: 자동화 보조 테이블 확인
            _ensure_automation_tables(cur)

            cur.execute("SELECT * FROM products WHERE id = %s", (prod_id,))
            old_product = cur.fetchone()

            if not old_product:
                raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

            fields, values = [], []

            if req.name is not None:
                fields.append("name=%s")
                values.append(req.name)

            if req.price is not None:
                fields.append("price=%s")
                values.append(req.price)

            if req.tag is not None:
                fields.append("tag=%s")
                values.append(normalize_category(req.tag))

            if not fields:
                return {"message": "변경사항 없음"}

            values.append(prod_id)

            # 기존 핵심 기능 유지: 상품 수정
            cur.execute(f"UPDATE products SET {', '.join(fields)} WHERE id=%s", values)

            # ✅ 추가: 수정 후 상품 정보 다시 조회
            cur.execute("SELECT * FROM products WHERE id = %s", (prod_id,))
            new_product = cur.fetchone()

            # ✅ 추가: 관리자 수정 로그 기록
            cur.execute(
                """
                INSERT INTO admin_action_logs
                (action_type, product_id, product_name, product_price, product_tag, memo)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    "UPDATE",
                    prod_id,
                    new_product.get("name") if new_product else old_product.get("name"),
                    new_product.get("price") if new_product else old_product.get("price"),
                    new_product.get("tag") if new_product else old_product.get("tag"),
                    "관리자 상품 수정"
                )
            )

        db.commit()
        return {"message": f"상품 {prod_id}번 수정 완료"}
    finally:
        db.close()


@app.delete("/api/products/{prod_id}")
def delete_product(prod_id: int):
    db = get_db()
    try:
        with db.cursor() as cur:
            # ✅ 추가: 자동화 보조 테이블 확인
            _ensure_automation_tables(cur)

            # ✅ 추가: 삭제 전 상품 정보 조회
            cur.execute("SELECT * FROM products WHERE id = %s", (prod_id,))
            product = cur.fetchone()

            if not product:
                raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

            # ✅ 추가: 관리자 삭제 로그 기록
            # products 삭제 전에 기록해야 상품명/가격/카테고리를 남길 수 있음
            cur.execute(
                """
                INSERT INTO admin_action_logs
                (action_type, product_id, product_name, product_price, product_tag, memo)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    "DELETE",
                    product.get("id"),
                    product.get("name"),
                    product.get("price"),
                    product.get("tag"),
                    "관리자 상품 삭제"
                )
            )

            # 기존 핵심 기능 유지: 장바구니 데이터 먼저 정리
            cur.execute("DELETE FROM cart_items WHERE product_id = %s", (prod_id,))

            # 기존 핵심 기능 유지: 상품 삭제
            # product_images는 FK ON DELETE CASCADE로 자동 삭제됨
            cur.execute("DELETE FROM products WHERE id = %s", (prod_id,))

        db.commit()
        return {"message": f"상품 {prod_id}번이 삭제되었습니다."}
    finally:
        db.close()


# ════════════════════════════════════════════════════
# 3. AI 상품 이미지 분석 (OpenAI Vision)
# ════════════════════════════════════════════════════

@app.post("/api/ai/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not OPENAI_API_KEY:
        result = {
            "name":  "AI 분석 상품 (테스트)",
            "price": 9900,
            "tag":   "일반",
            "memo":  "OPENAI_API_KEY가 설정되지 않아 더미 데이터를 반환합니다.",
        }

        # ✅ 추가: 더미 분석 결과도 로그에 저장
        db = get_db()
        try:
            with db.cursor() as cur:
                _ensure_automation_tables(cur)
                cur.execute(
                    """
                    INSERT INTO ai_analysis_logs
                    (original_file, image_url, predicted_name, predicted_price, predicted_tag, raw_response)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        file.filename,
                        "",
                        result.get("name"),
                        result.get("price"),
                        result.get("tag"),
                        json.dumps(result, ensure_ascii=False)
                    )
                )
            db.commit()
        finally:
            db.close()

        return result

    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        image_bytes = await file.read()
        b64 = base64.b64encode(image_bytes).decode()
        mime = file.content_type or "image/jpeg"

        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}"},
                    },
                    {
                        "type": "text",
                        "text": (
                            "이 상품 이미지를 분석해서 JSON으로만 답해줘. "
                            "형식: {\"name\": \"상품명\", \"price\": 가격(숫자), \"tag\": \"카테고리\"} "
                            "카테고리는 냉장/냉동/일반 중 하나. 다른 말은 하지 마."
                        ),
                    },
                ],
            }],
            max_tokens=200,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        result["tag"] = normalize_category(result.get("tag", "일반"))

        # ✅ 추가: AI 분석 결과 로그 저장
        db = get_db()
        try:
            with db.cursor() as cur:
                _ensure_automation_tables(cur)
                cur.execute(
                    """
                    INSERT INTO ai_analysis_logs
                    (original_file, image_url, predicted_name, predicted_price, predicted_tag, raw_response)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        file.filename,
                        "",
                        result.get("name"),
                        result.get("price"),
                        result.get("tag"),
                        json.dumps(result, ensure_ascii=False)
                    )
                )
            db.commit()
        finally:
            db.close()

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 분석 실패: {str(e)}")


# ════════════════════════════════════════════════════
# 4. 인증 (회원가입 / 로그인)
# ════════════════════════════════════════════════════

@app.post("/api/auth/signup")
def signup(req: SignupReq):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (req.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
            cur.execute(
                "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
                (req.name, req.email, hash_pw(req.password))
            )
            user_id = cur.lastrowid
        db.commit()

        token = make_token(user_id, req.name, req.email)
        return {
            "token": token,
            "user":  {"id": user_id, "name": req.name, "email": req.email},
        }
    finally:
        db.close()


@app.post("/api/auth/login")
def login(req: LoginReq):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT * FROM users WHERE email = %s AND password = %s",
                (req.email, hash_pw(req.password))
            )
            user = cur.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")

        token = make_token(user["id"], user["name"], user["email"])
        return {
            "token": token,
            "user":  {"id": user["id"], "name": user["name"], "email": user["email"]},
        }
    finally:
        db.close()


# ════════════════════════════════════════════════════
# 5. 장바구니
# ════════════════════════════════════════════════════

def _ensure_cart_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cart_items (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            product_id INT NOT NULL,
            quantity   INT NOT NULL DEFAULT 1,
            FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    """)


def _resolve_cart_product_id(cur, product_id: int) -> int:
    """
    프론트 data.json/sub.html의 상품 ID는 101, 102처럼 구성되어 있고,
    MySQL products 테이블의 기본 상품 ID는 1, 2처럼 AUTO_INCREMENT로 구성되어 있다.
    장바구니 서버 저장 시 101~117을 1~17로 매핑하여 cart_items와 products의 FK 관계를 유지한다.
    """
    cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
    row = cur.fetchone()
    if row:
        return row["id"]

    if 101 <= int(product_id) <= 117:
        mapped_id = int(product_id) - 100
        cur.execute("SELECT id FROM products WHERE id = %s", (mapped_id,))
        row = cur.fetchone()
        if row:
            return row["id"]

    raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

@app.get("/api/cart")
def get_cart(user=Depends(current_user)):
    db = get_db()
    try:
        with db.cursor() as cur:
            _ensure_cart_table(cur)
            cur.execute("""
                SELECT ci.id, ci.quantity,
                       p.id AS product_id, p.name, p.price, p.image, p.tag
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.user_id = %s
            """, (int(user["sub"]),))
            rows = cur.fetchall()

        items = [{
            "id":         r["id"],
            "product_id": r["product_id"],
            "name":       r["name"],
            "price":      r["price"],
            "image":      r["image"] or "",
            "tag":        r["tag"] or "",
            "quantity":   r["quantity"],
        } for r in rows]

        return {"items": items}
    finally:
        db.close()


@app.post("/api/cart")
def add_to_cart(req: CartAddReq, user=Depends(current_user)):
    db = get_db()
    try:
        uid = int(user["sub"])
        with db.cursor() as cur:
            _ensure_cart_table(cur)

            # 프론트 상품 ID(101~117)를 MySQL 실제 상품 ID(1~17)로 변환
            product_id = _resolve_cart_product_id(cur, int(req.product_id))

            cur.execute(
                "SELECT id, quantity FROM cart_items WHERE user_id=%s AND product_id=%s",
                (uid, product_id)
            )
            existing = cur.fetchone()
            if existing:
                cur.execute(
                    "UPDATE cart_items SET quantity=%s WHERE id=%s",
                    (existing["quantity"] + req.quantity, existing["id"])
                )
            else:
                cur.execute(
                    "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, %s)",
                    (uid, product_id, req.quantity)
                )
        db.commit()
        return {"message": "장바구니에 담았습니다."}
    finally:
        db.close()


@app.patch("/api/cart/{item_id}")
def update_cart(item_id: int, req: CartUpdateReq, user=Depends(current_user)):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "UPDATE cart_items SET quantity=%s WHERE id=%s AND user_id=%s",
                (req.quantity, item_id, int(user["sub"]))
            )
        db.commit()
        return {"message": "수량이 변경되었습니다."}
    finally:
        db.close()


@app.delete("/api/cart/{item_id}")
def delete_cart(item_id: int, user=Depends(current_user)):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "DELETE FROM cart_items WHERE id=%s AND user_id=%s",
                (item_id, int(user["sub"]))
            )
        db.commit()
        return {"message": "삭제되었습니다."}
    finally:
        db.close()


# ════════════════════════════════════════════════════
# 6. AI 챗봇
# ════════════════════════════════════════════════════

KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "json", "Chat_knowledge.json")
if not os.path.exists(KNOWLEDGE_PATH):
    KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "Chat_knowledge.json")


def load_knowledge() -> str:
    try:
        with open(KNOWLEDGE_PATH, encoding="utf-8") as f:
            data = json.load(f)
        faqs = data.get("faqs", [])
        return "\n".join(f"Q: {d['q']}\nA: {d['a']}" for d in faqs)
    except Exception:
        return ""


@app.post("/api/chat")
def chat(req: ChatReq):
    if not OPENAI_API_KEY:
        return {"reply": "AI 챗봇을 사용하려면 .env에 OPENAI_API_KEY를 설정해주세요."}

    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        knowledge = load_knowledge()
        system_prompt = f"""당신은 초록마을 온라인 쇼핑몰의 친절한 AI 상담원입니다.
아래 FAQ를 참고하여 고객 질문에 답변하세요. 모르면 솔직하게 말하세요.

[FAQ]
{knowledge}"""

        messages = [{"role": "system", "content": system_prompt}]
        for h in req.history[-10:]:
            if h.get("role") in ("user", "assistant"):
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": req.message})

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        return {"reply": resp.choices[0].message.content}

    except Exception as e:
        return {"reply": f"오류가 발생했어요: {str(e)}"}