/**
 * ai_register.js — 관리자 상품 등록/수정/삭제 페이지
 */

const API_BASE  = "http://127.0.0.1:8000";
let allProducts = [];
let currentPage = 1;
const PER_PAGE  = 5;
let searchQuery = "";

// ── 페이지 로드 ──
document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();

    // 파일 미리보기
    const fileInput  = document.getElementById("file-input");
    const preview    = document.getElementById("preview-img");
    const uploadText = document.getElementById("upload-text");
    fileInput?.addEventListener("change", () => {
        if (!fileInput.files[0]) return;
        preview.src           = URL.createObjectURL(fileInput.files[0]);
        preview.style.display = "block";
        uploadText.textContent = fileInput.files[0].name;
    });

    // 챗 Enter 키
    document.getElementById("chat-input")?.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) askAi();
    });

    // 검색바 실시간 필터
    document.getElementById("search-input")?.addEventListener("input", e => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        renderTable();
        renderPagination();
    });
});

// ────────────────────────────────────────────────────
// 상품 목록
// ────────────────────────────────────────────────────
async function fetchProducts() {
    showTableLoading();
    try {
        const res  = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
        const data = await res.json();
        allProducts = data.items || [];
        renderTable();
        renderPagination();
    } catch (e) {
        document.getElementById("product-list-body").innerHTML = `
            <tr><td colspan="7" style="padding:20px;color:#dc2626;text-align:center;">
                ⚠️ 서버 연결 실패 — uvicorn main:app --reload 를 실행 중인지 확인하세요
            </td></tr>`;
    }
}

function showTableLoading() {
    document.getElementById("product-list-body").innerHTML = `
        <tr><td colspan="7" style="padding:20px;color:#6b7280;text-align:center;">
            불러오는 중...
        </td></tr>`;
}

function getFiltered() {
    if (!searchQuery) return allProducts;
    return allProducts.filter(p =>
        p.name.includes(searchQuery) ||
        (p.tag && p.tag.includes(searchQuery))
    );
}

function renderTable() {
    const tbody    = document.getElementById("product-list-body");
    const filtered = getFiltered();
    tbody.innerHTML = "";

    const start = (currentPage - 1) * PER_PAGE;
    const items = filtered.slice(start, start + PER_PAGE);

    if (items.length === 0 && currentPage > 1) {
        currentPage--;
        renderTable();
        renderPagination();
        return;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="padding:20px;color:#9ca3af;text-align:center;">
                ${searchQuery ? `"${searchQuery}" 검색 결과 없음` : "등록된 상품이 없습니다."}
            </td></tr>`;
        return;
    }

    items.forEach(p => {
        const imgSrc = p.image || "https://via.placeholder.com/50x50?text=NO+IMG";
        tbody.innerHTML += `
            <tr id="row-${p.id}" style="border-bottom:1px solid #eee;">
                <td style="padding:10px;text-align:center;font-size:13px;">${p.id}</td>
                <td style="padding:10px;text-align:center;">
                    <img src="${imgSrc}" width="46" height="46"
                         style="border-radius:6px;object-fit:cover;"
                         onerror="this.src='https://via.placeholder.com/50?text=X'">
                </td>
                <td style="padding:10px;font-weight:600;font-size:14px;">${p.name}</td>
                <td style="padding:10px;text-align:right;font-size:14px;">${Number(p.price).toLocaleString()}원</td>
                <td style="padding:10px;text-align:center;color:#166534;font-weight:700;font-size:13px;">${p.tag || "-"}</td>
                <td style="padding:10px;text-align:center;">
                    <button onclick="startEdit(${p.id}, '${p.name.replace(/'/g,"\\'")}', ${p.price}, '${p.tag||""}')"
                        style="background:#dbeafe;color:#1d4ed8;border:none;padding:5px 10px;
                               border-radius:5px;cursor:pointer;font-weight:600;font-size:12px;margin-right:4px;">
                        수정
                    </button>
                    <button onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g,"\\'")}' )"
                        style="background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;
                               border-radius:5px;cursor:pointer;font-weight:600;font-size:12px;">
                        삭제
                    </button>
                </td>
            </tr>`;
    });
}

function renderPagination() {
    const container  = document.getElementById("pagination-container");
    container.innerHTML = "";
    const filtered   = getFiltered();
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        Object.assign(btn.style, {
            margin: "0 3px", padding: "6px 12px", cursor: "pointer",
            border:       `1px solid ${i === currentPage ? "#166534" : "#d1d5db"}`,
            borderRadius: "4px",
            background:   i === currentPage ? "#166534" : "#fff",
            color:        i === currentPage ? "#fff"    : "#374151",
            fontWeight:   i === currentPage ? "bold"    : "normal",
        });
        btn.onclick = () => { currentPage = i; renderTable(); renderPagination(); };
        container.appendChild(btn);
    }
}

// ────────────────────────────────────────────────────
// 수정 (인라인)
// ────────────────────────────────────────────────────
function startEdit(id, name, price, tag) {
    const row = document.getElementById(`row-${id}`);
    if (!row) return;
    row.innerHTML = `
        <td style="padding:8px;text-align:center;font-size:13px;">${id}</td>
        <td></td>
        <td style="padding:6px;">
            <input id="edit-name-${id}" value="${name}"
                   style="width:100%;padding:6px 8px;border:1.5px solid #166534;border-radius:5px;font-size:13px;">
        </td>
        <td style="padding:6px;">
            <input id="edit-price-${id}" type="number" value="${price}"
                   style="width:90px;padding:6px 8px;border:1.5px solid #166534;border-radius:5px;font-size:13px;">
        </td>
        <td style="padding:6px;">
            <input id="edit-tag-${id}" value="${tag}"
                   style="width:70px;padding:6px 8px;border:1.5px solid #166534;border-radius:5px;font-size:13px;">
        </td>
        <td style="padding:8px;text-align:center;">
            <button onclick="saveEdit(${id})"
                style="background:#166534;color:#fff;border:none;padding:5px 12px;
                       border-radius:5px;cursor:pointer;font-weight:600;font-size:12px;margin-right:4px;">
                저장
            </button>
            <button onclick="fetchProducts()"
                style="background:#f3f4f6;color:#374151;border:none;padding:5px 10px;
                       border-radius:5px;cursor:pointer;font-size:12px;">
                취소
            </button>
        </td>`;
}

async function saveEdit(id) {
    const name  = document.getElementById(`edit-name-${id}`)?.value.trim();
    const price = parseInt(document.getElementById(`edit-price-${id}`)?.value);
    const tag   = document.getElementById(`edit-tag-${id}`)?.value.trim();
    if (!name || isNaN(price)) { alert("상품명과 가격을 확인해주세요."); return; }

    try {
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name, price, tag }),
        });
        if (!res.ok) throw new Error(await res.text());
        const idx = allProducts.findIndex(p => p.id === id);
        if (idx !== -1) {
            allProducts[idx].name  = name;
            allProducts[idx].price = price;
            allProducts[idx].tag   = tag;
        }
        renderTable();
        renderPagination();
    } catch (e) {
        alert("수정 실패: " + e.message);
    }
}

// ────────────────────────────────────────────────────
// 삭제
// ────────────────────────────────────────────────────
async function deleteProduct(id, name) {
    if (!confirm(`[${name}] 상품을 삭제할까요?`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        fetchProducts();
    } catch (e) {
        alert("삭제 실패: " + e.message);
    }
}

// ────────────────────────────────────────────────────
// 상품 등록
// ────────────────────────────────────────────────────
async function saveProduct() {
    const name  = document.getElementById("prod-name").value.trim();
    const price = document.getElementById("prod-price").value.trim();
    const tag   = document.getElementById("prod-tag").value.trim();
    if (!name || !price) { alert("상품명과 판매가는 필수입니다."); return; }

    let imageUrl = "";
    const fileInput = document.getElementById("file-input");
    if (fileInput.files[0]) {
        try {
            const fd = new FormData();
            fd.append("file", fileInput.files[0]);
            const r = await fetch(`${API_BASE}/api/upload-image`, { method: "POST", body: fd });
            if (!r.ok) throw new Error(await r.text());
            imageUrl = (await r.json()).url;
        } catch (e) { alert("이미지 업로드 실패: " + e.message); return; }
    }

    try {
        const url = `${API_BASE}/api/products?name=${encodeURIComponent(name)}&price=${price}&tag=${encodeURIComponent(tag)}&image=${encodeURIComponent(imageUrl)}`;
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(await res.text());
        alert(`✅ "${name}" 등록 완료!`);
        document.getElementById("prod-name").value  = "";
        document.getElementById("prod-price").value = "";
        document.getElementById("prod-tag").value   = "";
        const preview = document.getElementById("preview-img");
        if (preview) { preview.src = ""; preview.style.display = "none"; }
        document.getElementById("upload-text").textContent = "클릭하여 상품 사진을 올려주세요";
        fileInput.value = "";
        fetchProducts();
    } catch (e) {
        alert("등록 실패: " + e.message);
    }
}

// ────────────────────────────────────────────────────
// AI 이미지 분석 — DB 체크 없이 무조건 폼 표시
// ────────────────────────────────────────────────────
async function analyzeImage() {
    const fileInput = document.getElementById("file-input");
    if (!fileInput.files[0]) { alert("사진을 먼저 업로드해주세요."); return; }

    const btn = document.querySelector(".btn-ai");
    btn.textContent = "⏳ AI 분석 중...";
    btn.disabled    = true;

    try {
        const fd = new FormData();
        fd.append("file", fileInput.files[0]);
        const res  = await fetch(`${API_BASE}/api/ai/analyze`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        document.getElementById("prod-name").value  = data.name  || "";
        document.getElementById("prod-price").value = data.price || "";
        document.getElementById("prod-tag").value   = data.tag   || "";

        addChatCard({ name: data.name, price: data.price, tag: data.tag });
    } catch (e) {
        addChatMsg("bot", "❌ AI 분석에 실패했어요.");
    } finally {
        btn.textContent = "✨ AI로 상품 정보 자동 완성";
        btn.disabled    = false;
    }
}

// ────────────────────────────────────────────────────
// 챗봇
// ────────────────────────────────────────────────────
function addChatMsg(role, text) {
    const win = document.getElementById("chat-window");
    if (!win) return;
    const div = document.createElement("div");
    div.style.cssText = role === "user"
        ? "margin:6px 0 6px auto;padding:10px 14px;background:#dcfce7;color:#166534;border-radius:12px 12px 2px 12px;font-size:13px;max-width:80%;text-align:right;display:block;"
        : "margin:6px auto 6px 0;padding:10px 14px;background:#f1f5f9;color:#1e293b;border-radius:12px 12px 12px 2px;font-size:13px;max-width:80%;line-height:1.6;white-space:pre-line;display:block;";
    div.textContent = text;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

function addChatCard({ name, price, tag }) {
    const win = document.getElementById("chat-window");
    if (!win) return;
    const div = document.createElement("div");
    div.style.cssText = "margin:8px 0;max-width:90%;";
    div.innerHTML = `
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">🤖 AI 분석 완료</div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 14px;">
            <div style="display:grid;grid-template-columns:64px 1fr;gap:5px 10px;font-size:13px;line-height:1.9;">
                <span style="color:#64748b;font-size:11px;align-self:center;">상품명</span>
                <span style="font-weight:700;color:#111;">${name || "-"}</span>
                <span style="color:#64748b;font-size:11px;align-self:center;">예상 가격</span>
                <span style="font-weight:700;color:#166534;">${price ? Number(price).toLocaleString() + "원" : "-"}</span>
                <span style="color:#64748b;font-size:11px;align-self:center;">카테고리</span>
                <span style="font-weight:600;color:#0369a1;background:#e0f2fe;padding:1px 8px;border-radius:4px;font-size:12px;display:inline-block;">${tag || "-"}</span>
            </div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #d1fae5;font-size:11px;color:#94a3b8;">
                ✏️ 오른쪽에서 정보를 수정 후 등록하세요
            </div>
        </div>`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

async function askAi() {
    const input = document.getElementById("chat-input");
    const msg   = input.value.trim();
    if (!msg) return;
    addChatMsg("user", msg);
    input.value = "";
    try {
        const res  = await fetch(`${API_BASE}/api/chat`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ message: msg, history: [] }),
        });
        const data = await res.json();
        addChatMsg("bot", data.reply || "응답을 받지 못했어요.");
    } catch {
        addChatMsg("bot", "서버 연결에 실패했어요.");
    }
}