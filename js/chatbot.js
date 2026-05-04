// ============================================================
// chatbot.js  ─  초록마을 AI 챗봇 위젯
// ============================================================
// 동작 방식:
//   사용자 입력 → POST /api/chat (메시지 + 이전 대화 내역)
//              → 서버에서 chat_knowledge.json 참고 후 GPT 응답
//              → 화면에 표시
//
//   history 배열에 이전 대화를 쌓아서 보내므로 맥락 기억 가능!
// ============================================================
(function () {
  let isOpen  = false;
  let history = [];  // 대화 내역 (서버로 전송해서 맥락 유지)

  // ── 스타일 주입 ──
  const style = document.createElement("style");
  style.textContent = `
    .cb-btn {
      position: fixed; bottom: 28px; right: 28px;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #4f8f22, #6aad35);
      color: #fff; border: none; font-size: 26px; cursor: pointer;
      box-shadow: 0 6px 20px rgba(79,143,34,.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    .cb-btn:hover { transform: scale(1.08); }

    .cb-win {
      position: fixed; bottom: 98px; right: 28px;
      width: 360px; max-height: 520px;
      background: #fff; border-radius: 24px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 20px 60px rgba(0,0,0,.15);
      z-index: 999; display: none; flex-direction: column; overflow: hidden;
    }

    .cb-head {
      padding: 16px 20px;
      background: linear-gradient(135deg, #4f8f22, #6aad35);
      color: #fff; font-weight: 800; font-size: 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .cb-head-info { display: flex; align-items: center; gap: 10px; }
    .cb-online {
      width: 8px; height: 8px; border-radius: 50%;
      background: #a8f080; display: inline-block;
    }
    .cb-head button {
      background: none; border: none; color: #fff;
      font-size: 20px; cursor: pointer; padding: 0;
    }

    .cb-msgs {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      min-height: 200px; max-height: 360px;
      scroll-behavior: smooth;
    }

    .cb-msg {
      max-width: 85%; padding: 10px 14px;
      border-radius: 18px; font-size: 14px; line-height: 1.65;
      word-break: keep-all;
    }
    .cb-msg.bot {
      background: #f5f7f1; align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .cb-msg.user {
      background: linear-gradient(135deg, #4f8f22, #6aad35);
      color: #fff; align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .cb-msg.loading {
      color: #9ca3af; font-style: italic;
      animation: cb-pulse 1.2s ease-in-out infinite;
    }
    @keyframes cb-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .cb-row {
      display: flex; padding: 12px; border-top: 1px solid #f0f1ed; gap: 8px;
    }
    .cb-input {
      flex: 1; height: 42px; padding: 0 14px;
      border: 1px solid #dfe6d8; border-radius: 12px;
      outline: none; font-size: 14px;
    }
    .cb-input:focus {
      border-color: #6aad35;
      box-shadow: 0 0 0 3px rgba(106,173,53,.15);
    }
    .cb-send {
      height: 42px; padding: 0 16px; border: none;
      border-radius: 12px; background: #4f8f22;
      color: #fff; font-weight: 800; cursor: pointer;
      transition: opacity .2s;
    }
    .cb-send:hover { opacity: .85; }
    .cb-send:disabled { opacity: .5; cursor: not-allowed; }

    /* 초기 빠른 질문 버튼 */
    .cb-quick {
      display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px;
    }
    .cb-quick button {
      padding: 6px 12px; border: 1px solid #dfe6d8;
      border-radius: 999px; background: #fff;
      font-size: 12px; cursor: pointer; color: #374151;
      transition: .15s;
    }
    .cb-quick button:hover { background: var(--green-soft, #eef7e7); border-color: #6aad35; }

    @media (max-width: 640px) {
      .cb-win { width: calc(100vw - 40px); right: 20px; }
    }
  `;
  document.head.appendChild(style);

  // ── 위젯 생성 ──
  function create() {
    // 토글 버튼
    const btn = document.createElement("button");
    btn.className = "cb-btn";
    btn.innerHTML = "💬";
    btn.title     = "AI 상담원";
    btn.onclick   = toggle;
    document.body.appendChild(btn);

    // 채팅창
    const win = document.createElement("div");
    win.className = "cb-win";
    win.id        = "_cbWin";
    win.innerHTML = `
      <div class="cb-head">
        <div class="cb-head-info">
          <span class="cb-online"></span>
          🌿 초록마을 AI 상담원
        </div>
        <button onclick="document.getElementById('_cbWin').style.display='none';window._cbOpen=false;" aria-label="닫기">✕</button>
      </div>
      <div class="cb-msgs" id="_cbMsgs">
        <div class="cb-msg bot">
          안녕하세요! 초록마을 AI 상담원이에요 🌿<br>
          배송, 상품, 회원 혜택 등 무엇이든 물어보세요!
        </div>
      </div>
      <div class="cb-quick" id="_cbQuick">
        <button onclick="quickAsk('배송비 얼마예요?')">배송비 문의</button>
        <button onclick="quickAsk('반품하고 싶어요')">반품 문의</button>
        <button onclick="quickAsk('포인트는 어떻게 쌓여요?')">포인트 적립</button>
        <button onclick="quickAsk('유기농이랑 무농약 차이가 뭐예요?')">인증 차이</button>
      </div>
      <div class="cb-row">
        <input class="cb-input" id="_cbInput" type="text" placeholder="메시지를 입력하세요..." />
        <button class="cb-send" id="_cbSend">전송</button>
      </div>
    `;
    document.body.appendChild(win);

    document.getElementById("_cbSend").addEventListener("click", send);
    document.getElementById("_cbInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) send();
    });
  }

  // ── 토글 ──
  function toggle() {
    isOpen = !isOpen;
    const win = document.getElementById("_cbWin");
    if (win) win.style.display = isOpen ? "flex" : "none";
  }

  // ── 빠른 질문 ──
  window.quickAsk = function (text) {
    const input = document.getElementById("_cbInput");
    if (input) { input.value = text; send(); }
    // 빠른 질문 버튼 숨기기 (한 번 쓰면 사라짐)
    const quick = document.getElementById("_cbQuick");
    if (quick) quick.style.display = "none";
  };

  // ── 메시지 추가 ──
  function appendMsg(text, role) {
    const msgs = document.getElementById("_cbMsgs");
    if (!msgs) return null;
    const d = document.createElement("div");
    d.className = `cb-msg ${role}`;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  // ── 전송 ──
  async function send() {
    const input = document.getElementById("_cbInput");
    const btn   = document.getElementById("_cbSend");
    const msg   = input?.value.trim();
    if (!msg) return;

    input.value   = "";
    btn.disabled  = true;

    appendMsg(msg, "user");

    // 대화 내역에 추가 (서버로 보내서 맥락 유지)
    history.push({ role: "user", content: msg });

    const loading = appendMsg("답변 작성 중...", "bot loading");

    try {
      const res  = await fetch(`${window.API_BASE || "http://localhost:8000"}/api/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message: msg,
          history: history.slice(-10),  // 최근 10개 대화만 전송 (토큰 절약)
        }),
      });
      const data = await res.json();
      const reply = data.reply || "죄송해요, 다시 시도해주세요.";

      if (loading) {
        loading.textContent = reply;
        loading.classList.remove("loading");
      }

      // 봇 답변도 내역에 추가
      history.push({ role: "assistant", content: reply });

    } catch {
      if (loading) {
        loading.textContent = "서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.";
        loading.classList.remove("loading");
      }
    } finally {
      btn.disabled = false;
      input.focus();
    }
  }

  // ── 초기화 ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", create);
  } else {
    create();
  }
})();