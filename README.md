# 🥬 CHOROC AI SHOPPING | 초록마을 AI 쇼핑몰

풀스택 쇼핑몰 프로젝트 | FastAPI + MySQL + OpenAI Vision/Chat + AI 상품등록 자동화 + JWT 인증 + 장바구니 동기화 시스템

<br />

---

## 🔗 링크

| 구분 | URL |
|---|---|
| GitHub Pages 화면 확인 | https://imchoi2828-arch.github.io/choroc-ai-shopping/ |
| GitHub Repository | https://github.com/imchoi2828-arch/choroc-ai-shopping |


> ※ GitHub Pages는 정적 호스팅 환경으로 화면 구성 확인 용도입니다.  
> 메인 UI와 기본 상품 화면은 JSON 데이터를 기반으로 확인할 수 있으며,  
> 로그인, 장바구니 서버 동기화, AI 챗봇, AI 상품등록 등 백엔드 기능은 로컬 FastAPI 서버 실행 환경에서 동작합니다.

<br />

---

## 📌 프로젝트 개요

HTML/CSS/Vanilla JavaScript로 제작한 초록마을 쇼핑몰 클론 UI에  
FastAPI 백엔드와 MySQL 데이터베이스를 연동한 풀스택 포트폴리오 프로젝트입니다.

OpenAI Vision 기능을 활용하여 상품 이미지를 분석하고,  
상품명, 가격, 카테고리 정보를 자동 추론하여 관리자 상품등록 페이지에 반영하는  
**AI 기반 상품등록 자동화 시스템**을 핵심 기능으로 구현했습니다.

또한 JWT 기반 로그인 유지, localStorage 기반 장바구니 상태 관리,  
MySQL 장바구니 동기화, FAQ 기반 AI 챗봇 기능을 함께 구성했습니다.

<br />

---

## 🛠️ 기술 스택

| 구분 | 기술 | 역할 |
|---|---|---|
| Frontend | HTML / CSS / JavaScript | 화면 구성 및 사용자 인터페이스 |
| Backend | Python / FastAPI | REST API 서버 및 비즈니스 로직 |
| Database | MySQL / pymysql | 회원 / 상품 / 장바구니 / AI 로그 데이터 관리 |
| AI 분석 | OpenAI Vision | 상품 이미지 분석 및 상품 정보 추론 |
| AI 챗봇 | OpenAI Chat + JSON FAQ | FAQ 기반 고객 상담 및 상품 문의 응답 |
| 인증 | JWT + localStorage | 로그인 상태 유지 및 인증 요청 처리 |
| 보안 | SHA-256 Hash / .env | 비밀번호 해시 처리, API Key 및 DB 정보 보호 |
| 문서화 | PowerPoint | Use Case, ERD, API 명세, 시스템 구조 설계 |

<br />

---

## 📁 프로젝트 구조

```text
choroc-ai-shopping/
├── main.py                 # FastAPI 서버 및 API 엔드포인트
├── db.py                   # MySQL DB 연결 설정
├── config.py               # 환경변수 설정
├── schemas.py              # 요청 / 응답 데이터 스키마
├── category.py             # AI 카테고리 매칭 / 정규화 로직
├── setup.sql               # DB 테이블 생성 SQL
├── .env.example            # 환경변수 예시 파일
├── .gitignore              # Git 업로드 제외 설정
├── README.md               # 프로젝트 소개 문서
│
├── css/
│   ├── common.css          # 공통 스타일
│   ├── main.css            # 메인 페이지 스타일
│   ├── reset.css           # 브라우저 기본 스타일 초기화
│   ├── style.css           # 전체 공통 UI 스타일
│   └── sub.css             # 상품 상세 페이지 스타일
│
├── js/
│   ├── auth.js             # 로그인 상태 및 권한 처리
│   ├── chatbot.js          # AI 챗봇 UI 및 통신 로직
│   ├── login.js            # 회원가입 / 로그인 기능
│   ├── main.js             # 메인 페이지 동적 렌더링
│   ├── sub.js              # 상품 상세 / 장바구니 담기 로직
│   └── ai_register.js      # 관리자 상품등록 / 검색 / 페이징 / CRUD
│
├── json/
│   ├── data.json           # 메인 화면 콘텐츠 데이터
│   └── Chat knowledge.json # FAQ 기반 챗봇 지식 데이터
│
├── img/                    # 상품 이미지 및 업로드 이미지 저장
│
├── services/
│   ├── ai_service.py       # OpenAI Vision / Chat 분석 서비스
│   └── product_service.py  # 상품 데이터 처리 서비스
│
├── index.html              # 메인 페이지
├── sub.html                # 상품 상세 페이지
├── login.html              # 로그인 / 회원가입 페이지
├── cart.html               # 장바구니 페이지
└── ai_register.html        # 관리자 AI 상품등록 페이지
```

<br />

---

## ✨ 주요 기능
<br />
### 👤 회원 시스템

- 회원가입 시 사용자 정보를 MySQL `users` 테이블에 저장
- 비밀번호는 SHA-256 해시 처리 후 저장
- 로그인 성공 시 FastAPI에서 JWT 발급
- 프론트엔드는 JWT를 `localStorage`에 저장
- 인증 요청 시 `Authorization: Bearer Token` 형식으로 서버에 전달
- 로그아웃 시 `choroc_token`, `choroc_user` 삭제

<br />
<img width="1920" height="1040" alt="회원가입 -" src="https://github.com/user-attachments/assets/0eb562a7-16a3-4e81-9ec7-3c977df523f1" />
<br />
<br />
<br />
<img width="1920" height="1040" alt="로그인 -" src="https://github.com/user-attachments/assets/326a7c06-202f-4a40-8b81-2cd208d4e6b1" />
<br />
<br />
<br />
<br />

### 🛒 장바구니

- 비로그인 상태에서도 `localStorage` 기반 장바구니 상태 유지
- 초기 장바구니 기본 상품 2개 세팅
- 상품 상세 페이지에서 수량 선택 후 장바구니 추가
- 로그인 상태에서는 FastAPI를 통해 MySQL `cart_items` 테이블에도 동기화
- 서버에서는 기존 상품이면 수량 `UPDATE`, 처음 담는 상품이면 `INSERT`
- 장바구니 수량 변경, 삭제, 합계 계산, 배송비 계산 구현

<br />
<img width="1920" height="1040" alt="장바구니1-" src="https://github.com/user-attachments/assets/845bf614-6dd9-4d94-93f0-6664075a057e" />
<br />
<br />
<br />
<img width="1920" height="1040" alt="장바구니2 -" src="https://github.com/user-attachments/assets/e0bf780a-86c6-480f-b86d-bebc2a88b8a3" />
<br />
<br />
<br />
<br />

### 🛠️ 관리자 상품 관리

- 관리자 상품등록 페이지 구현
- MySQL `products` 테이블 기반 상품 목록 조회
- 상품명 / 카테고리 기준 검색 기능
- 5개 단위 페이징 처리
- 상품 수정 `PATCH`
- 상품 삭제 `DELETE`
- 관리자 상품등록 자동화 흐름과 연결

<br />
<img width="1920" height="1040" alt="상품등록2 -" src="https://github.com/user-attachments/assets/00fc0a1c-3e08-40c3-a483-c1af9beaa889" />
<br />
<br />
<br />
<br />

### 🤖 AI 상품등록 자동화 시스템

상품 이미지를 업로드하면 OpenAI Vision이 이미지를 분석하여  
상품명, 가격, 카테고리를 자동으로 추론합니다.

```text
상품 이미지 업로드
→ FastAPI로 이미지 전송
→ OpenAI Vision 분석
→ 상품명 / 가격 / 카테고리 추론
→ 분석 결과 입력폼 자동 반영
→ 관리자가 확인 후 상품 등록
→ MySQL products 테이블 저장
→ product_images 이미지 경로 기록
→ admin_action_logs 관리자 작업 기록
→ ai_analysis_logs AI 분석 결과 기록
→ 관리자 상품 리스트 반영
```

<br />
<img width="1920" height="1040" alt="상품등록 -" src="https://github.com/user-attachments/assets/104eee1f-7607-402f-8f5a-6f38d0ac4620" />
<br />
<br />
<br />
<br />

### 💬 FAQ 기반 AI 챗봇

- `json/Chat knowledge.json`의 FAQ 데이터를 기반으로 응답 생성
- OpenAI Chat API 연동
- 최근 대화 내역을 유지하여 자연스러운 응답 흐름 구성
- 벡터 DB 기반 RAG가 아닌, JSON FAQ 데이터를 프롬프트에 주입하는 경량 RAG형 구조

<br />
<img width="1920" height="1040" alt="챗봇 -" src="https://github.com/user-attachments/assets/95ff3d3a-ca12-4eec-b35a-ccd350d1216b" />
<br />
<br />
<br />

---

## 🗄️ DB 구조

본 프로젝트는 MySQL `choroc_db`를 사용합니다.

### 핵심 테이블

| 테이블 | 역할 |
|---|---|
| `users` | 회원가입 / 로그인 사용자 정보 저장 |
| `products` | 상품명, 가격, 카테고리, 이미지 경로 저장 |
| `cart_items` | 사용자별 장바구니 상품 및 수량 저장 |

<br />

### AI 자동화 보강 테이블

| 테이블 | 역할 |
|---|---|
| `ai_analysis_logs` | OpenAI Vision 이미지 분석 결과 기록 |
| `admin_action_logs` | 관리자의 상품 등록 / 수정 / 삭제 작업 이력 저장 |
| `product_images` | 업로드된 상품 이미지 경로 관리 |

<br />

### 주요 SQL 구조

```sql
-- 회원
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(64)  NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 상품
CREATE TABLE products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  price            INT          NOT NULL,
  original_price   INT,
  discount_percent INT,
  tag              VARCHAR(50),
  image            VARCHAR(500)
);

-- 장바구니
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- AI 분석 로그
CREATE TABLE ai_analysis_logs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  original_file   VARCHAR(255),
  image_url       VARCHAR(500),
  predicted_name  VARCHAR(200),
  predicted_price INT,
  predicted_tag   VARCHAR(50),
  raw_response    TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 작업 로그
CREATE TABLE admin_action_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  action_type   VARCHAR(30) NOT NULL,
  product_id    INT,
  product_name  VARCHAR(200),
  product_price INT,
  product_tag   VARCHAR(50),
  memo          VARCHAR(500),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 상품 이미지 관리
CREATE TABLE product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT,
  image_url   VARCHAR(500) NOT NULL,
  is_main     BOOLEAN DEFAULT TRUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

<br />

---

## 🔌 API 엔드포인트

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 및 JWT 발급 |
| GET | `/api/data` | 메인 화면 데이터 조회 |
| GET | `/api/products` | 관리자 상품 목록 조회 |
| POST | `/api/upload-image` | 상품 이미지 업로드 |
| POST | `/api/ai/analyze` | 상품 이미지 AI 분석 |
| POST | `/api/products` | 상품 등록 |
| PATCH | `/api/products/{prod_id}` | 상품 수정 |
| DELETE | `/api/products/{prod_id}` | 상품 삭제 |
| GET | `/api/cart` | 장바구니 조회 |
| POST | `/api/cart` | 장바구니 추가 |
| PATCH | `/api/cart/{item_id}` | 장바구니 수량 수정 |
| DELETE | `/api/cart/{item_id}` | 장바구니 항목 삭제 |
| POST | `/api/chat` | FAQ 기반 AI 챗봇 응답 |

<br />

---

## 🚀 로컬 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/imchoi2828-arch/choroc-ai-shopping.git
cd choroc-ai-shopping
```

<br />

### 2. 가상환경 생성 및 활성화

```bash
python -m venv .venv
.venv\Scripts\activate
```

<br />

### 3. 패키지 설치

```bash
pip install -r requirements.txt
```

<br />

### 4. `.env` 파일 생성

`.env.example` 파일을 참고하여 프로젝트 루트에 `.env` 파일을 생성합니다.

```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
```

> 실제 `.env` 파일은 보안상 GitHub에 업로드하지 않습니다.

<br />

### 5. MySQL DB 생성

MySQL Workbench에서 `setup.sql` 파일을 실행합니다.

<br />

### 6. FastAPI 서버 실행

```bash
uvicorn main:app --reload
```

<br />

### 7. 브라우저 접속

```text
http://127.0.0.1:8000
```

또는 VS Code Live Server로 `index.html`을 실행합니다.

<br />

---

## 📊 시스템 아키텍처

```text
[Browser - HTML / CSS / Vanilla JS]
        │
        │ fetch()
        ▼
[FastAPI Server - main.py]
  ├── 인증 API - JWT 로그인 / 회원가입
  ├── 상품 API - products CRUD
  ├── 장바구니 API - localStorage + MySQL 동기화
  ├── AI 분석 API - OpenAI Vision
  └── AI 챗봇 API - JSON FAQ 기반 응답
        │
        ├── [MySQL DB]
        │     ├── users
        │     ├── products
        │     ├── cart_items
        │     ├── ai_analysis_logs
        │     ├── admin_action_logs
        │     └── product_images
        │
        └── [OpenAI API]
              ├── Vision 분석
              └── Chat 응답
```

<br />

---

<br />

---

## 📎 프로젝트 SLIDE
<br />
<br />
<img width="2560" height="1440" alt="슬라이드1" src="https://github.com/user-attachments/assets/2993790f-80ca-4af6-8087-62337851fb29" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드2" src="https://github.com/user-attachments/assets/751a760e-64b2-4de5-a58d-906a63260e65" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드3" src="https://github.com/user-attachments/assets/e91ac75b-da52-4a8b-abc0-111600db529e" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드4" src="https://github.com/user-attachments/assets/e581489e-6288-4738-a1e9-c8868e24b3db" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드5" src="https://github.com/user-attachments/assets/5f2a4970-25df-4c1c-a4d6-a42a27ec79de" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드6" src="https://github.com/user-attachments/assets/19ba149b-c986-47f0-9193-101dd8a02843" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드7" src="https://github.com/user-attachments/assets/6206a8a9-2da1-4505-92a7-95502435a786" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드8" src="https://github.com/user-attachments/assets/a00b52f2-c5a0-4082-af37-29505202723e" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드9" src="https://github.com/user-attachments/assets/e156c781-efb5-4f8d-aaf1-4995d8d7b23b" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드10" src="https://github.com/user-attachments/assets/96719a1b-a206-48ba-b3b1-dd2128ed2f66" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드11" src="https://github.com/user-attachments/assets/e2ddb26d-4bfa-4a83-82f7-11992e947caf" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드12" src="https://github.com/user-attachments/assets/3025f735-4aae-4a30-9c96-f7dfd46a6cc6" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드13" src="https://github.com/user-attachments/assets/001bf33c-1e92-4a96-a20e-587c8c02d9cf" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드14" src="https://github.com/user-attachments/assets/3b6f3459-f751-4d25-b659-fa9c44c14f8a" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드15" src="https://github.com/user-attachments/assets/dfbb8c35-07a4-40ef-b8b5-27085d93a5ba" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드16" src="https://github.com/user-attachments/assets/90205947-5adb-4dd3-9cfc-9055fa9c2910" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드17" src="https://github.com/user-attachments/assets/36454211-71c4-44b0-bf6d-cd7c9bf2024e" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드18" src="https://github.com/user-attachments/assets/6b83258e-554f-4397-b66b-9cb2076a2e63" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드19" src="https://github.com/user-attachments/assets/e31f85eb-1431-4dc5-ba18-af759a1a3dc0" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드20" src="https://github.com/user-attachments/assets/6f3b25c9-c382-4099-a3f4-5cdeb2b8436e" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드21" src="https://github.com/user-attachments/assets/ae1da9bf-7acb-4a3b-9470-e17c891b695b" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드22" src="https://github.com/user-attachments/assets/9683fef5-8430-43ae-a1f1-81434f056894" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드23" src="https://github.com/user-attachments/assets/4dca4bc0-1ae1-4b85-bef7-3d9d9bfecb25" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드24" src="https://github.com/user-attachments/assets/b1a333ee-1356-4cf8-b6ce-cd6a6fbb2da2" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드25" src="https://github.com/user-attachments/assets/b110b638-1b6d-438e-84eb-5d2b18192327" />
<br />
<br />
<br />
<img width="2560" height="1440" alt="슬라이드26" src="https://github.com/user-attachments/assets/55cebc55-5597-46a9-914b-0558c3b58158" />
<br />
<br />


---

## 🚨 트러블슈팅

### 1. 개발 환경 차이로 인한 DB 연결 오류

학교와 집의 개발 환경 차이로 인해 `.env`, 가상환경, MySQL 연결 설정이 충돌했습니다.

`.env`를 사용하여 DB 접속 정보와 API 키를 코드에서 분리하고,  
가상환경을 재구성하여 실행 환경을 통일했습니다.

<br />

### 2. AI 챗봇 응답 정확도 및 토큰 소모 문제

외부 데이터에 과도하게 의존하면 할루시네이션이 발생하거나 토큰 소모가 증가하는 문제가 있었습니다.

JSON 기반 FAQ 데이터를 프롬프트에 주입하고,  
최근 대화만 유지하는 방식으로 응답 정확도와 비용을 개선했습니다.

<br />

---

## 🔮 향후 개선 계획

- React 기반 리팩토링
- 관리자 페이지 UI/UX 개선
- 상품 이미지 다중 업로드 기능
- AI 분석 정확도 개선
- Vector DB 기반 RAG 구조 고도화
- 배포 환경 구성 및 클라우드 DB 연동

<br />

---

## 🙋‍♂️ 제작자

| 이름 | 역할 |
|---|---|
| 최영근 | Frontend / Backend / DB / AI 기능 구현 |

<br />

---

## ✅ 핵심 요약

> 초록마을 쇼핑몰 클론을 기반으로 FastAPI, MySQL, OpenAI를 연동하여  
> AI 상품등록 자동화, JWT 인증, 장바구니 동기화, FAQ 챗봇 기능을 구현한  
> 실무형 풀스택 포트폴리오 프로젝트입니다.
