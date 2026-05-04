from db import get_db

def get_frontend_data():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            # ID 순서대로 모든 상품을 가져옵니다.
            cur.execute("SELECT id, name, price, original_price, discount_percent, tag, image FROM products ORDER BY id")
            products = cur.fetchall()
    finally:
        conn.close()

    items = [
        {
            "id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "originalPrice": p["original_price"],
            "discountPercent": p["discount_percent"],
            "tag": p["tag"],
            "image": p["image"],
        } for p in products
    ]

    # 🌟 [수정] 17개 상품을 영근님의 의도대로 5-4-4-4로 쪼갭니다.
    # 인덱스 슬라이싱: [0:5], [5:9], [9:13], [13:17]
    chunks = [
        items[0:5],   # 첫 번째 섹션 (5개 -> 슬라이더 작동!)
        items[5:9],   # 두 번째 섹션 (4개)
        items[9:13],  # 세 번째 섹션 (4개)
        items[13:17]  # 네 번째 섹션 (4개)
    ]

    section_configs = [
        ("recommend", "장바구니로 바로 클릭! 정착 추천 상품", "처음이면 이 조합부터 시작해보세요"),
        ("weeklyChoroc", "이번주 초록가 아이템!", "지금 많이 담는 인기템"),
        ("weeklyMust", "이번주 장바구니 필수템!", "활용도 높은 상품들로 모아봤어요"),
        ("easyCook", "요리시간 단축템", "빠르게 차려먹는 재료들"),
    ]

    sections = []
    for i, (sec_id, title, subtitle) in enumerate(section_configs):
        chunk = chunks[i] if i < len(chunks) else []
        sections.append({
            "id": sec_id, 
            "type": "productCarousel", 
            "title": title, 
            "subtitle": subtitle, 
            "items": chunk
        })
        
        if i == 0: # 첫 번째 섹션(추천상품) 뒤에 이벤트 배너 고정
            sections.append({
                "id": "eventBanner", 
                "type": "wideBanner",
                "title": "최대 40% 할인 기획, 우리 가족 건강관리템",
                "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80"
            })
    
    return {"sections": sections}

# 나머지 create_product, delete_product_by_id는 그대로 유지