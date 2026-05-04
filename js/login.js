// login.js - login.html에서 분리된 최신 로직
const API_BASE = "http://localhost:8000";

// 1. 초기 실행 로직 (로그인 체크 및 탭 설정)
document.addEventListener("DOMContentLoaded", () => {
  // 이미 로그인된 경우 메인으로 이동
  if (localStorage.getItem("choroc_token")) {
    window.location.replace("./index.html");
  }

  // URL 파라미터로 초기 탭 결정
  const urlParams = new URLSearchParams(window.location.search);
  const initTab = urlParams.get("tab") === "signup" ? "signup" : "login";
  showTab(initTab);

  // Enter 키 지원 추가
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const loginVisible = document.getElementById("loginForm").style.display !== "none";
    if (loginVisible) doLogin();
    else doSignup();
  });
});

// 2. 탭 전환 함수
function showTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("loginForm").style.display  = isLogin ? "" : "none";
  document.getElementById("signupForm").style.display = isLogin ? "none" : "";
  document.getElementById("tabLogin").classList.toggle("active",  isLogin);
  document.getElementById("tabSignup").classList.toggle("active", !isLogin);
}

// 3. 메시지 표시 헬퍼
function showMsg(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.display = "block";
}
function hideMsg(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// 4. 로그인 로직
async function doLogin() {
  hideMsg("loginError");
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPw").value;
  if (!email || !password) return showMsg("loginError", "이메일과 비밀번호를 입력해주세요.");

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "로그인 중...";

  try {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showMsg("loginError", data.detail || "로그인에 실패했어요.");
      return;
    }

    localStorage.setItem("choroc_token", data.token);
    localStorage.setItem("choroc_user",  JSON.stringify(data.user));
    window.location.href = "./index.html";

  } catch {
    showMsg("loginError", "서버 연결 실패. 파이썬 서버를 확인하세요.");
  } finally {
    btn.disabled = false;
    btn.textContent = "로그인";
  }
}

// 5. 회원가입 로직
async function doSignup() {
  hideMsg("signupError");
  hideMsg("signupOk");
  const name     = document.getElementById("signupName").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPw").value;

  if (!name || !email || !password) return showMsg("signupError", "모든 항목을 입력해주세요.");
  if (password.length < 6) return showMsg("signupError", "비밀번호는 6자 이상이어야 해요.");

  const btn = document.getElementById("signupBtn");
  btn.disabled = true;
  btn.textContent = "가입 중...";

  try {
    const res  = await fetch(`${API_BASE}/api/auth/signup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showMsg("signupError", data.detail || "회원가입 실패.");
      return;
    }

    showMsg("signupOk", `${data.user.name}님, 환영해요! 🎉`);
    localStorage.setItem("choroc_token", data.token);
    localStorage.setItem("choroc_user",  JSON.stringify(data.user));
    setTimeout(() => { window.location.href = "./index.html"; }, 1500);

  } catch {
    showMsg("signupError", "서버 연결 실패.");
  } finally {
    btn.disabled = false;
    btn.textContent = "회원가입";
  }
}