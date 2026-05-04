-- ══════════════════════════════════════════════════
-- choroc_db 초기 설정 SQL
-- ══════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS choroc_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE choroc_db;

-- ── 1. products ──
CREATE TABLE IF NOT EXISTS products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  price            INT          NOT NULL,
  original_price   INT,
  discount_percent INT,
  tag              VARCHAR(50),
  image            VARCHAR(500)
);

-- ── 2. users ──
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(64)  NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. cart_items (FK: users, products) ──
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── 4. AI 분석 로그 테이블 ──
-- 역할: OpenAI Vision이 이미지를 분석한 결과를 기록
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  original_file   VARCHAR(255),
  image_url       VARCHAR(500),
  predicted_name  VARCHAR(200),
  predicted_price INT,
  predicted_tag   VARCHAR(50),
  raw_response    TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. 관리자 작업 로그 테이블 ──
-- 역할: 관리자가 상품을 등록/수정/삭제한 기록을 저장
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  action_type   VARCHAR(30) NOT NULL,
  product_id    INT,
  product_name  VARCHAR(200),
  product_price INT,
  product_tag   VARCHAR(50),
  memo          VARCHAR(500),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── 6. 상품 이미지 관리 테이블 ──
-- 역할: 업로드된 상품 이미지 경로를 상품과 연결하여 저장
CREATE TABLE IF NOT EXISTS product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT,
  image_url   VARCHAR(500) NOT NULL,
  is_main     BOOLEAN DEFAULT TRUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── 7. 기존 상품 초기화 후 샘플 데이터 삽입 ──
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_images;
TRUNCATE TABLE admin_action_logs;
TRUNCATE TABLE ai_analysis_logs;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

-- data.json 기준 17개 (섹션 순서: recommend×5, weeklyChoroc×4, weeklyMust×4, easyCook×4)
INSERT INTO products (name, price, original_price, discount_percent, tag, image) VALUES
-- recommend (5개)
('무농약이상 로메인(120g)',               2150,  2400,  10,   '냉장', './img/26.webp'),
('초록계란이 껍질째 먹는 사과(1.8kg)',   21900, NULL,  NULL, '냉장', './img/23.webp'),
('국내산 해물모둠(250g)',                12900, 15900, 18,   '냉동', './img/19.webp'),
('유기농 귀리혼합 5곡(1.5kg)',           14500, 18200, 20,   '일반', './img/18.webp'),
('초록베베 국산콩 순한 비빔간장(180mL)', 7900,  NULL,  NULL, '일반', './img/15.webp'),
-- weeklyChoroc (4개)
('맛있는 참치(150g)',                     3330,  4170,  20,   '일반', './img/8.webp'),
('무농약 팝콘옥수수(400g)',               6600,  8900,  25,   '일반', './img/22.webp'),
('우리밀 칼국수(400g)',                   2980,  3800,  21,   '일반', './img/7.webp'),
('무항생제 한우 등심구이용(냉장)(300g)',  49000, 62000, 20,   '냉장', './img/9.webp'),
-- weeklyMust (4개)
('까나리액젓(900mL)',                     8800,  9700,  10,   '일반', './img/25.webp'),
('무농약이상 오이(2입)',                   3980,  4700,  15,   '냉장', './img/4.webp'),
('신선한 유기농 우유(900mL)',              6500,  NULL,  NULL, '냉장', './img/3.webp'),
('구운 김(20g/10매)',                      3950,  4500,  12,   '일반', './img/12.webp'),
-- easyCook (4개)
('노르웨이 생연어회(150g)',               16900, NULL,  NULL, '냉장', './img/17.webp'),
('노르웨이 생연어필렛(200g)',             17900, NULL,  NULL, '냉장', './img/16.webp'),
('무항생제 한돈 삼겹살구이용(냉장/500g)', 29000, NULL,  NULL, '냉장', './img/20.webp'),
('무항생제 닭볶음탕용(냉장/900g)',        12500, NULL,  NULL, '냉장', './img/21.webp');