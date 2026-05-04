// ============================================================
// sub.js  ─  상품 상세 페이지 전용 스크립트
// ============================================================

const SUB_API  = "http://localhost:8000";
const CART_KEY = "choroc_cart";
const CART_VERSION_KEY = "choroc_cart_version";
const CART_VERSION = "choroc-cart-default-v2";

function getDefaultCartItems() {
  return [
    {
      id: "init-101",
      product_id: 101,
      name: "무농약이상 로메인",
      price: 2150,
      image: "./img/26.webp",
      tag: "냉장",
      quantity: 1
    },
    {
      id: "init-102",
      product_id: 102,
      name: "초록계란이 껍질째 먹는 사과(1.8kg)",
      price: 21900,
      image: "./img/23.webp",
      tag: "냉장",
      quantity: 1
    }
  ];
}

function ensureBaseCart() {
  const savedVersion = localStorage.getItem(CART_VERSION_KEY);
  const raw = localStorage.getItem(CART_KEY);

  // 새 장바구니 버전 최초 1회는 기본 상품 2개를 보장
  if (savedVersion !== CART_VERSION) {
    const defaults = getDefaultCartItems();
    localStorage.setItem(CART_KEY, JSON.stringify(defaults));
    localStorage.setItem(CART_VERSION_KEY, CART_VERSION);
    localStorage.setItem("cart_initialized", "true");
    return defaults;
  }

  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const defaults = getDefaultCartItems();
  localStorage.setItem(CART_KEY, JSON.stringify(defaults));
  localStorage.setItem("cart_initialized", "true");
  return defaults;
}

// ── 서버에서 헤더/푸터 데이터 가져오기 ──
async function loadSharedData() {
  try {
    const res = await fetch(`${SUB_API}/api/data`);
    if (!res.ok) throw new Error("fail");
    return await res.json();
  } catch {
    return null;
  }
}

// ── 헤더·푸터 채우기 ──
function renderHeaderFooter(data) {
  if (!data) return;
  const ids = {
    brand:       document.getElementById("brand"),
    nav2:        document.getElementById("nav2"),
    footerLinks: document.getElementById("footerLinks"),
    footerTitle: document.getElementById("footerTitle"),
    footerGrid:  document.getElementById("footerGrid"),
    footerInfo:  document.getElementById("footerInfo"),
    footerCopy:  document.getElementById("footerCopy"),
  };

  if (ids.brand && data.site?.brand)
    ids.brand.innerHTML = `<a href="./index.html">${data.site.brand}</a>`;
  if (ids.nav2)
    ids.nav2.innerHTML = (data.site?.topNav || data.site?.nav || [])
      .map(t => `<a href="#">${t}</a>`).join("");
  if (ids.footerLinks)
    ids.footerLinks.innerHTML = (data.footer?.links || [])
      .map(t => `<a href="#">${t}</a>`).join("");
  if (ids.footerTitle) ids.footerTitle.textContent = data.footer?.servicesTitle || "";
  if (ids.footerGrid)
    ids.footerGrid.innerHTML = (data.footer?.services || [])
      .map(t => `<span>${t}</span>`).join("");
  if (ids.footerInfo)
    ids.footerInfo.innerHTML = (data.footer?.infoLines || [])
      .map(l => `<p>${l}</p>`).join("");
  if (ids.footerCopy && data.footer?.copyright)
    ids.footerCopy.textContent = data.footer.copyright;
}

// ── 갤러리 썸네일 ──
function setupGallery() {
  const mainImg = document.getElementById("mainImage");
  document.querySelectorAll(".g-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      if (mainImg && thumb.dataset.image) mainImg.src = thumb.dataset.image;
      document.querySelectorAll(".g-thumb").forEach(t => t.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });
}

// ── 수량 +/- ──
function setupQuantity() {
  const minus = document.getElementById("qtyMinus");
  const plus  = document.getElementById("qtyPlus");
  const input = document.getElementById("qtyInput");
  const total = document.getElementById("totalPrice");
  const UNIT  = Number(document.querySelector(".purchase-box")?.dataset.price) || 2150;
  let count   = 1;

  function refresh() {
    if (input) input.value = count;
    if (total) total.textContent = (UNIT * count).toLocaleString("ko-KR") + "원";
  }

  minus?.addEventListener("click", () => { if (count > 1) { count--; refresh(); } });
  plus?.addEventListener("click",  () => { count++; refresh(); });
  refresh();
}

// ============================================================
// ★ 버튼 동작
//
//   [장바구니] → cart.html 로 이동만 (상품 추가 없음)
//   [바로구매] → 장바구니에 추가만 (이동 없음, 로그인 여부 무관)
// ============================================================
function setupBuyButtons() {
  const addBtn = document.getElementById("btnAddToCart"); // 장바구니
  const buyBtn = document.getElementById("btnBuyNow");    // 바로구매

  const box          = document.querySelector(".purchase-box");
  const productId    = Number(box?.dataset.productId) || 101;
  const productName  = box?.dataset.name              || "무농약이상 로메인(120g)";
  const productPrice = Number(box?.dataset.price)     || 2150;
  const productImg   = box?.dataset.image             || "./img/26.webp";
  const productTag   = box?.dataset.tag               || "냉장";

  function getQty() {
    return Math.max(1, Number(document.getElementById("qtyInput")?.value) || 1);
  }

  // localStorage에 추가 (기존 항목이면 수량 누적)
  function addToLocalCart(qty) {
    // cart.html에 먼저 가지 않고 서브페이지에서 바로구매를 눌러도
    // 기본 상품 2개가 유지된 상태에서 로메인이 추가되도록 보장
    let cart = ensureBaseCart();

    const existing = cart.find(i => String(i.product_id) === String(productId));
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id:         `local-${productId}-${Date.now()}`,
        product_id: productId,
        name:       productName,
        price:      productPrice,
        image:      productImg,
        tag:        productTag,
        quantity:   qty,
      });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // 로그인 상태이면 서버에도 추가 (실패해도 로컬엔 이미 저장됨)
  async function addToServerCart(qty) {
    const token = localStorage.getItem("choroc_token");
    if (!token) return;
    try {
      const res = await fetch(`${SUB_API}/api/cart`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify({ product_id: productId, quantity: qty }),
      });
      if (!res.ok) console.warn("서버 장바구니 저장 실패");
    } catch (e) { console.warn("서버 장바구니 저장 실패", e); }
  }

  // [장바구니] → 이동만
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "./cart.html";
    });
  }

  // [바로구매] → 추가만 (이동 없음)
  if (buyBtn) {
    buyBtn.addEventListener("click", async () => {
      buyBtn.disabled    = true;
      buyBtn.textContent = "담는 중...";

      const qty = getQty();
      addToLocalCart(qty);
      await addToServerCart(qty);

      buyBtn.disabled    = false;
      buyBtn.textContent = "바로구매";
      showToast("장바구니에 담았어요! 🛒");
    });
  }
}

// ── 토스트 팝업 ──
function showToast(msg) {
  let toast = document.getElementById("_subToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "_subToast";
    Object.assign(toast.style, {
      position:      "fixed",
      bottom:        "100px",
      left:          "50%",
      transform:     "translateX(-50%)",
      background:    "#1f2937",
      color:         "#fff",
      padding:       "12px 28px",
      borderRadius:  "999px",
      fontSize:      "14px",
      fontWeight:    "700",
      zIndex:        "9999",
      opacity:       "0",
      transition:    "opacity .3s",
      whiteSpace:    "nowrap",
      pointerEvents: "none",
      maxWidth:      "90vw",
    });
    document.body.appendChild(toast);
  }
  toast.textContent   = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

// ── 탭 스크롤 ──
function setupTabs() {
  const links      = Array.from(document.querySelectorAll(".tab-link"));
  const stickyTabs = document.getElementById("stickyTabs");
  if (!links.length || !stickyTabs) return;

  const sections = links
    .map(l => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  function activate(id) {
    links.forEach(l =>
      l.classList.toggle("is-active", l.getAttribute("href") === `#${id}`)
    );
  }

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      activate(target.id);
      const headerH = document.getElementById("siteHeader")?.getBoundingClientRect().height || 0;
      window.scrollTo({
        top: window.scrollY + target.getBoundingClientRect().top - headerH - stickyTabs.offsetHeight - 18,
        behavior: "smooth",
      });
    });
  });

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const headerH = document.getElementById("siteHeader")?.getBoundingClientRect().height || 0;
      const checkY  = headerH + stickyTabs.offsetHeight + 30;
      let cur = sections[0]?.id;
      sections.forEach(s => {
        const r = s.getBoundingClientRect();
        if (r.top <= checkY && r.bottom > checkY) cur = s.id;
      });
      if (cur) activate(cur);
      ticking = false;
    });
  }, { passive: true });

  const syncOffset = () => {
    const h = document.getElementById("siteHeader")?.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty("--header-offset", `${Math.ceil(h)}px`);
  };
  syncOffset();
  window.addEventListener("resize", syncOffset);
}

// ── 진입점 ──
(async function init() {
  const data = await loadSharedData();
  renderHeaderFooter(data);
  if (typeof window.renderAuthTopLinks === "function") {
    window.renderAuthTopLinks();
  }
  setupGallery();
  setupQuantity();
  setupBuyButtons();
  setupTabs();
})();