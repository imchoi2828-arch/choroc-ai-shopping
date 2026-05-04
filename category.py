CATEGORY_MAP = {
    "과일": "냉장",
    "채소": "냉장",
    "소고기": "냉장",
    "돼지고기": "냉장",
    "수산": "냉동",
    "냉동": "냉동",
}

def normalize_category(ai_keyword: str) -> str:
    if not ai_keyword: return "일반"
    for key, official in CATEGORY_MAP.items():
        if key in ai_keyword: return official
    return "일반"