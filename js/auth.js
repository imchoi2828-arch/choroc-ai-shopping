// ============================================================
// auth.js  ─  인증 관련 유틸 모음
// ============================================================
// 이 파일이 하는 일:
//   1. 토큰/유저 정보를 localStorage에 저장·삭제
//   2. 헤더 topLinks를 로그인 상태에 맞게 바꾸기
//   3. 장바구니 아이콘 클릭 시 cart.html로 이동
//
// ★ 모든 HTML 페이지에서 맨 먼저 로드됨 (<script src="./js/auth.js">)
// ============================================================

window.API_BASE = "http://localhost:8000";

// ── 토큰·유저 정보 관리 ──────────────────────────────────────
// localStorage = 브라우저에 데이터를 저장하는 공간 (탭 닫아도 유지)

window.getToken  = () => localStorage.getItem("choroc_token");

window.getUser   = () => {
  try { return JSON.parse(localStorage.getItem("choroc_user")); }
  catch { return null; }
};

window.saveAuth  = (token, user) => {
  localStorage.setItem("choroc_token", token);
  localStorage.setItem("choroc_user",  JSON.stringify(user));
};

window.clearAuth = () => {
  localStorage.removeItem("choroc_token");
  localStorage.removeItem("choroc_user");
};

window.isLoggedIn  = () => !!window.getToken();

// API 요청 시 헤더에 토큰 포함 (서버가 "누구인지" 알 수 있게)
window.authHeaders = () => ({
  "Content-Type":  "application/json",
  "Authorization": `Bearer ${window.getToken()}`,
});


// ── 헤더 상단 링크를 로그인 상태에 맞게 렌더 ─────────────────
// 이 함수는 main.js, sub.js 등에서 데이터 로드 후 호출함
window.renderAuthTopLinks = function () {
  const el = document.getElementById("topLinks");
  if (!el) return;

  const user = window.getUser();

  if (user) {
    // ✅ 로그인 상태: 이름 표시 + 로그아웃 버튼
    el.innerHTML = `
      <span style="color:#4f8f22;font-weight:700;">안녕하세요, ${user.name}님 👋</span>
      <a href="#" id="logoutBtn">로그아웃</a>
      <a href="#">마이페이지</a>
      <a href="#">고객센터</a>
    `;
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.clearAuth();
      window.location.reload(); // 로그아웃 후 새로고침
    });
  } else {
    // ❌ 비로그인 상태: 로그인/회원가입 링크
    el.innerHTML = `
      <a href="./login.html?tab=signup">회원가입</a>
      <a href="./login.html">로그인</a>
      <a href="#">마이페이지</a>
      <a href="#">고객센터</a>
    `;
  }
};


// ── 장바구니 아이콘 클릭 → cart.html 이동 ───────────────────
function setupCartIcons() {
  document.querySelectorAll('[aria-label="장바구니"], [title="장바구니"]').forEach((btn) => {
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      window.location.href = "./cart.html";
    });
  });
}

document.addEventListener("DOMContentLoaded", setupCartIcons);