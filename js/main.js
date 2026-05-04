// ============================================================
// main.js  ─  메인 페이지 전용 스크립트
// ============================================================
// 이 파일이 하는 일:
//   1. 로컬에서는 FastAPI 서버에서 데이터 가져오기
//   2. GitHub Pages에서는 json/data.json으로 화면 확인용 데이터 가져오기
//   3. 헤더/히어로/섹션/푸터 각각 렌더링
//   4. 캐러셀(슬라이더) 동작
// ============================================================

// ── 숫자 → 원화 포맷 (예: 2150 → "2,150원") ──
function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

// ── 화면 너비에 따라 카드 몇 개 보일지 결정 ──
function visibleCount() {
  const w = window.innerWidth;
  if (w <= 640) return 2;
  if (w <= 980) return 3;
  return 4;
}

// ─────────────────────────────────────────────
// 데이터 불러오기
// 1. GitHub Pages 환경이면 FastAPI 요청을 건너뛰고 바로 json/data.json 사용
// 2. 로컬 환경이면 FastAPI /api/data 먼저 사용
// 3. 로컬에서도 FastAPI가 꺼져 있으면 json/data.json으로 대체
// ─────────────────────────────────────────────
async function loadData() {
  const isGitHubPages = location.hostname.includes("github.io");

  // GitHub Pages에서는 FastAPI 서버가 없으므로
  // 처음부터 정적 JSON 데이터를 사용해서 로딩을 빠르게 처리
  if (isGitHubPages) {
    console.log("✅ GitHub Pages 환경 → 정적 JSON 데이터 사용");

    const fallbackRes = await fetch("./json/data.json");

    if (!fallbackRes.ok) {
      throw new Error("json/data.json을 불러오지 못했습니다.");
    }

    return await fallbackRes.json();
  }

  const apiBase = window.API_BASE || "http://localhost:8000";

  try {
    // 로컬 실행 환경에서는 기존처럼 FastAPI 서버 데이터 사용
    const res = await fetch(`${apiBase}/api/data`);

    if (!res.ok) {
      throw new Error("FastAPI 서버 응답 실패");
    }

    console.log("✅ FastAPI 서버 데이터 사용");
    return await res.json();
  } catch (error) {
    console.warn("⚠️ FastAPI 연결 실패 → json/data.json으로 대체합니다.", error);

    const fallbackRes = await fetch("./json/data.json");

    if (!fallbackRes.ok) {
      throw new Error("json/data.json도 불러오지 못했습니다.");
    }

    return await fallbackRes.json();
  }
}

// ── 헤더 렌더링 ──
function renderHeader(data) {
  const brand = document.getElementById("brand");
  const nav2 = document.getElementById("nav2");

  if (brand && data.site?.brand) {
    brand.textContent = data.site.brand;
  }

  // topLinks는 auth.js의 renderAuthTopLinks()가 담당
  // 로그인 상태에 따라 다르게 표시

  if (nav2) {
    const menus = data.site?.nav || [];
    nav2.innerHTML = menus.map((text) => `<a href="#">${text}</a>`).join("");
  }
}

// ── 히어로 배너 슬라이더 ──
function renderHero(data) {
  const viewport = document.getElementById("heroViewport");
  const prev = document.getElementById("heroPrev");
  const next = document.getElementById("heroNext");
  const currentEl = document.getElementById("heroCurrent");
  const totalEl = document.getElementById("heroTotal");

  const banners = data.heroBanners || [];
  if (!viewport || banners.length === 0) return;

  let idx = 0;
  let timer = null;

  // 슬라이드 HTML 생성
  viewport.innerHTML = banners
    .map(
      (b, i) => `
    <div class="heroSlide ${i === 0 ? "isActive" : ""}" data-hero="${i}">
      <div class="heroText">
        <h2>${b.title}</h2>
        <h3>${b.subtitle || ""}</h3>
        <p>${b.desc || ""}</p>
      </div>
      <div class="heroImage">
        <img src="${b.image}" alt="${b.title}" loading="lazy" />
      </div>
    </div>
  `,
    )
    .join("");

  if (totalEl) totalEl.textContent = String(banners.length);

  function setActive(nextIdx) {
    idx = (nextIdx + banners.length) % banners.length;

    viewport
      .querySelectorAll(".heroSlide")
      .forEach((s) => s.classList.remove("isActive"));

    viewport.querySelector(`[data-hero="${idx}"]`)?.classList.add("isActive");

    if (currentEl) currentEl.textContent = String(idx + 1);
  }

  function autoPlay() {
    clearInterval(timer);
    timer = setInterval(() => setActive(idx + 1), 5000);
  }

  prev?.addEventListener("click", () => {
    setActive(idx - 1);
    autoPlay();
  });

  next?.addEventListener("click", () => {
    setActive(idx + 1);
    autoPlay();
  });

  setActive(0);
  autoPlay();
}

// ── 상품 카드 HTML 생성 ──
function productCard(p) {
  const hasDis = typeof p.discountPercent === "number" && p.discountPercent > 0;
  const hasOri = typeof p.originalPrice === "number" && p.originalPrice > 0;

  return `
    <a href="./sub.html" class="cardLink">
      <article class="card">
        <div class="thumb">
          <img src="${p.image}" alt="${p.name}" loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=60'" />
          <div class="bag" title="장바구니">👜</div>
        </div>
        <div class="body">
          <p class="name">${p.name}</p>
          <div class="priceRow">
            ${hasDis ? `<span class="discount">${p.discountPercent}%</span>` : ""}
            <span class="price">${won(p.price)}</span>
            ${hasOri ? `<span class="original">${won(p.originalPrice)}</span>` : ""}
          </div>
          ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
        </div>
      </article>
    </a>
  `;
}

// ── 상품 캐러셀 섹션 HTML ──
function renderProductCarouselSection(sec) {
  return `
    <section class="section" data-section="${sec.id}">
      <div class="section__head">
        <h2>${sec.title}</h2>
        ${sec.subtitle ? `<p>${sec.subtitle}</p>` : ""}
      </div>
      <div class="carousel">
        <button class="navLR left" data-prev aria-label="이전">‹</button>
        <div class="trackWrap">
          <div class="track" data-track>
            ${(sec.items || []).map(productCard).join("")}
          </div>
        </div>
        <button class="navLR right" data-next aria-label="다음">›</button>
      </div>
      <div class="centerBtnRow">
        <button class="moreBtn" type="button">전체 보기 ›</button>
      </div>
    </section>
  `;
}

// ── 와이드 배너 섹션 HTML ──
function renderWideBannerSection(sec) {
  return `
    <section class="section" data-section="${sec.id}">
      <a href="./sub.html" class="wideBanner">
        <img src="${sec.image}" alt="${sec.title}" loading="lazy" />
        <div class="overlay">${sec.title}</div>
      </a>
    </section>
  `;
}

// ── 모든 섹션 렌더링 ──
// 로컬 FastAPI 데이터와 GitHub Pages용 json/data.json 모두
// data.sections 구조를 기준으로 렌더링
function renderSections(data) {
  const wrap = document.getElementById("sections");
  if (!wrap) return;

  wrap.innerHTML = (data.sections || [])
    .map((sec) => {
      if (sec.type === "productCarousel") {
        return renderProductCarouselSection(sec);
      }

      if (sec.type === "wideBanner") {
        return renderWideBannerSection(sec);
      }

      return "";
    })
    .join("");

  initAllCarousels();
}

// ── 캐러셀 슬라이더 초기화 ──
function initAllCarousels() {
  document.querySelectorAll(".section .carousel").forEach((carousel) => {
    const track = carousel.querySelector("[data-track]");
    const prev = carousel.querySelector("[data-prev]");
    const next = carousel.querySelector("[data-next]");
    let index = 0;

    function update() {
      const cards = track.querySelectorAll(".cardLink");
      const vc = visibleCount();
      const maxIdx = Math.max(0, cards.length - vc);
      index = Math.min(Math.max(index, 0), maxIdx);

      const first = track.querySelector(".cardLink");
      if (!first) return;

      const cardW = first.getBoundingClientRect().width;
      track.style.transform = `translateX(-${(cardW + 18) * index}px)`;

      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIdx;
    }

    prev?.addEventListener("click", () => {
      index -= 1;
      update();
    });

    next?.addEventListener("click", () => {
      index += 1;
      update();
    });

    window.addEventListener("resize", update);
    update();
  });
}

// ── 푸터 렌더링 ──
function renderFooter(data) {
  const footerTitle = document.getElementById("footerTitle");
  const footerGrid = document.getElementById("footerGrid");
  const footerLinks = document.getElementById("footerLinks");
  const footerInfo = document.getElementById("footerInfo");
  const footerCopy = document.getElementById("footerCopy");

  if (footerTitle) {
    footerTitle.textContent = data.footer?.servicesTitle || "";
  }

  if (footerGrid) {
    footerGrid.innerHTML = (data.footer?.services || [])
      .map((t) => `<span>${t}</span>`)
      .join("");
  }

  if (footerLinks) {
    footerLinks.innerHTML = (data.footer?.links || [])
      .map((t) => `<a href="#">${t}</a>`)
      .join("");
  }

  if (footerInfo) {
    footerInfo.innerHTML = (data.footer?.infoLines || [])
      .map((l) => `<p>${l}</p>`)
      .join("");
  }

  if (footerCopy) {
    footerCopy.textContent = data.footer?.copyright || "";
  }
}

// ── 진입점 ──
// 페이지 로드 시 한 번 실행
(async function init() {
  try {
    const data = await loadData();

    renderHeader(data);
    window.renderAuthTopLinks?.(); // auth.js: 로그인 상태 반영
    renderHero(data);
    renderSections(data);
    renderFooter(data);
  } catch (e) {
    console.error(e);

    // 여기까지 왔다는 건 FastAPI도 실패했고 json/data.json도 실패했다는 뜻
    // 이 경우에만 최소 안내 표시
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;color:#e24b42;font-weight:800;">
        ⚠️ 화면 데이터를 불러오지 못했습니다.<br>
        <small style="font-weight:400;color:#6b7280;">
          json/data.json 파일 경로를 확인하거나 로컬에서 uvicorn main:app --reload를 실행해주세요.
        </small>
      </div>
    `;
  }
})();