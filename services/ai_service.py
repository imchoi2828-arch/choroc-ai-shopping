import json, base64
from config import OPENAI_API_KEY
from category import normalize_category
from openai import OpenAI

def get_chat_response(message: str, history: list):
    client = OpenAI(api_key=OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "친절한 초록마을 상담원입니다."}] + history + [{"role": "user", "content": message}]
    )
    return {"reply": resp.choices[0].message.content}

def analyze_product_image(image_bytes: bytes, db_connection):
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "이미지를 분석하여 {'name': '이름', 'category': '카테고리'} 형식의 JSON으로 답해줘."},
            {"role": "user", "content": [{"type": "text", "text": "분석해줘."}, {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}]}
        ],
        response_format={ "type": "json_object" }
    )
    
    res = json.loads(response.choices[0].message.content)
    # 기존 DB 매칭 로직 추가 가능
    return {"id": None, "name": res['name'], "price": 0, "category": normalize_category(res['category']), "confidence": 0.95}