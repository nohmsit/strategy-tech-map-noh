const state = {
  data: null,
  search: "",
  activeLaw: "all",
  activeStatus: "all",
  modalFieldId: null,
  modalLaw: null
};

const heroStats = document.getElementById("heroStats");
const lawFilters = document.getElementById("lawFilters");
const fieldGrid = document.getElementById("fieldGrid");
const matrix = document.getElementById("matrix");
const resultSummary = document.getElementById("resultSummary");
const searchInput = document.getElementById("searchInput");
const statusFilters = document.getElementById("statusFilters");
const detailModal = document.getElementById("detailModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalLawTabs = document.getElementById("modalLawTabs");
const modalBody = document.getElementById("modalBody");
const fieldCardTemplate = document.getElementById("fieldCardTemplate");

fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    state.data = data;
    renderHeroStats();
    renderLawFilters();
    renderMatrix();
    renderFieldGrid();
    attachGlobalEvents();
  });

function renderHeroStats() {
  const { fields, laws, stats } = state.data;
  const items = [
    `19개 분야`,
    `${stats.totalTechnologies}개 세부기술`,
    `${laws.length}개 법령 체계`,
    `${fields.filter((field) => field.summary.lawCoverageCount === 5).length}개 분야가 5개 체계 모두와 연결`
  ];
  heroStats.innerHTML = items.map((item) => `<div class="stat-pill">${item}</div>`).join("");
}

function renderLawFilters() {
  const buttons = [
    `<button class="chip chip--active" data-law-filter="all">전체 법령</button>`,
    ...state.data.laws.map(
      (law) =>
        `<button class="chip" data-law-filter="${law.key}">
          <span class="law-dot" style="background:${law.color}"></span>${law.short}
        </button>`
    )
  ];
  lawFilters.innerHTML = buttons.join("");
}

function renderMatrix() {
  const { fields, laws } = state.data;
  matrix.innerHTML = `
    <table class="matrix-table">
      <thead>
        <tr>
          <th>분야</th>
          ${laws.map((law) => `<th>${law.short}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${fields
          .map((field) => {
            return `
              <tr>
                <td>
                  <div class="matrix-field-name">${field.name}</div>
                  <div class="section-note">${field.summary.totalTechnologies}개 세부기술</div>
                </td>
                ${laws
                  .map((law) => {
                    const bucket = field.byLaw[law.key];
                    const total = bucket.all.length;
                    const exact = bucket.exact.length;
                    const related = bucket.related.length;
                    const empty = total === 0;
                    return `
                      <td>
                        <button
                          class="matrix-cell ${empty ? "is-empty" : ""}"
                          style="background:${empty ? "rgba(255,255,255,.03)" : toAlpha(law.color, .20)}; border-color:${toAlpha(law.color, .35)}"
                          data-matrix-field="${field.id}"
                          data-matrix-law="${law.key}"
                        >
                          <span class="matrix-cell__count">${total}개</span>
                          <span class="matrix-cell__sub">● ${exact} / ○ ${related}</span>
                        </button>
                      </td>
                    `;
                  })
                  .join("")}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderFieldGrid() {
  const filtered = getFilteredFields();
  resultSummary.textContent = `${filtered.length}개 분야가 현재 조건에 맞습니다.`;

  if (!filtered.length) {
    fieldGrid.innerHTML = `<div class="empty-state">조건에 맞는 분야가 없습니다. 검색어를 지우거나 법령 필터를 바꿔보세요.</div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  filtered.forEach((field) => {
    const node = fieldCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".field-card__title").textContent = field.name;

    node.querySelector(".field-card__stats").innerHTML = `
      <div class="mini-stat"><strong>${field.summary.totalTechnologies}</strong><span>전체 세부기술</span></div>
      <div class="mini-stat"><strong>${field.summary.lawCoverageCount}/5</strong><span>적용 법령 수</span></div>
      <div class="mini-stat"><strong>${field.summary.exactCountTotal}</strong><span>직접 포함 수</span></div>
      <div class="mini-stat"><strong>${field.summary.relatedCountTotal}</strong><span>연관/유사 수</span></div>
    `;

    node.querySelector(".field-card__laws").innerHTML = state.data.laws
      .map((law) => {
        const bucket = field.byLaw[law.key];
        return `
          <div class="law-strip">
            <div class="law-strip__meta">
              <span class="law-dot" style="background:${law.color}"></span>
              <div class="law-name">${law.short}</div>
            </div>
            <div class="law-counts">총 ${bucket.all.length}개 · ● ${bucket.exact.length} / ○ ${bucket.related.length}</div>
          </div>
        `;
      })
      .join("");

    const matchingRecords = getMatchingRecords(field).slice(0, 6);
    node.querySelector(".field-card__technologies").innerHTML = matchingRecords.length
      ? matchingRecords.map((record) => `<span class="tech-tag">${highlight(record.technology, state.search)}</span>`).join("")
      : field.records.slice(0, 6).map((record) => `<span class="tech-tag">${record.technology}</span>`).join("");

    node.querySelector(".field-card__btn").addEventListener("click", () => openFieldModal(field.id));
    node.addEventListener("dblclick", () => openFieldModal(field.id));

    frag.appendChild(node);
  });

  fieldGrid.innerHTML = "";
  fieldGrid.appendChild(frag);
}

function attachGlobalEvents() {
  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    renderFieldGrid();
  });

  lawFilters.addEventListener("click", (e) => {
    const button = e.target.closest("[data-law-filter]");
    if (!button) return;
    state.activeLaw = button.dataset.lawFilter;
    [...lawFilters.querySelectorAll(".chip")].forEach((chip) => chip.classList.remove("chip--active"));
    button.classList.add("chip--active");
    renderFieldGrid();
  });

  statusFilters.addEventListener("click", (e) => {
    const button = e.target.closest("[data-status-filter]");
    if (!button) return;
    state.activeStatus = button.dataset.statusFilter;
    [...statusFilters.querySelectorAll(".chip")].forEach((chip) => chip.classList.remove("chip--active"));
    button.classList.add("chip--active");
    renderFieldGrid();
  });

  matrix.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-matrix-field]");
    if (!cell) return;
    const fieldId = cell.dataset.matrixField;
    const lawKey = cell.dataset.matrixLaw;
    state.activeLaw = lawKey;
    [...lawFilters.querySelectorAll(".chip")].forEach((chip) => {
      chip.classList.toggle("chip--active", chip.dataset.lawFilter === lawKey);
    });
    renderFieldGrid();
    openFieldModal(fieldId, lawKey);
  });

  closeModalBtn.addEventListener("click", () => detailModal.close());
  detailModal.addEventListener("click", (e) => {
    const rect = detailModal.getBoundingClientRect();
    const inside = rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
    if (!inside) detailModal.close();
  });

  modalLawTabs.addEventListener("click", (e) => {
    const button = e.target.closest("[data-modal-law]");
    if (!button) return;
    state.modalLaw = button.dataset.modalLaw;
    renderModalBody();
  });
}

function getFilteredFields() {
  return state.data.fields.filter((field) => {
    const matchesRecords = getMatchingRecords(field);
    const lawMatch = matchesLawFilter(field);
    return lawMatch && (state.search ? matchesRecords.length > 0 : true);
  });
}

function getMatchingRecords(field) {
  const q = normalize(state.search);
  return field.records.filter((record) => {
    const hay = normalize([field.name, record.subcategory, record.technology, record.note].join(" "));
    const textMatch = q ? hay.includes(q) : true;
    const lawStatusMatch = matchesLawStatusFilter(record);
    return textMatch && lawStatusMatch;
  });
}

function matchesLawFilter(field) {
  if (state.activeLaw === "all") {
    if (state.activeStatus === "all") return true;
    return field.records.some((record) => Object.values(record.statuses).includes(state.activeStatus));
  }
  return field.records.some((record) => matchesLawStatusFilter(record));
}

function matchesLawStatusFilter(record) {
  if (state.activeLaw === "all" && state.activeStatus === "all") return true;

  if (state.activeLaw !== "all") {
    const status = record.statuses[state.activeLaw];
    if (state.activeStatus === "all") return status !== "none";
    return status === state.activeStatus;
  }

  if (state.activeStatus !== "all") {
    return Object.values(record.statuses).includes(state.activeStatus);
  }

  return true;
}

function openFieldModal(fieldId, preferredLaw = null) {
  state.modalFieldId = fieldId;
  state.modalLaw = preferredLaw || (state.activeLaw !== "all" ? state.activeLaw : state.data.laws[0].key);

  const field = state.data.fields.find((item) => item.id === fieldId);
  modalTitle.textContent = field.name;
  modalMeta.textContent = `전체 ${field.summary.totalTechnologies}개 세부기술 · 적용 법령 ${field.summary.lawCoverageCount}/5`;
  renderModalTabs();
  renderModalBody();
  detailModal.showModal();
}

function renderModalTabs() {
  modalLawTabs.innerHTML = state.data.laws
    .map((law) => {
      const bucket = currentField().byLaw[law.key];
      return `
        <button class="law-tab ${state.modalLaw === law.key ? "law-tab--active" : ""}" data-modal-law="${law.key}" style="border-color:${toAlpha(law.color,.35)}">
          <span class="law-dot" style="background:${law.color}"></span>
          ${law.short} (${bucket.all.length})
        </button>
      `;
    })
    .join("");
}

function renderModalBody() {
  const field = currentField();
  const law = state.data.laws.find((item) => item.key === state.modalLaw);
  const bucket = field.byLaw[law.key];
  const exactItems = bucket.exact.map((id) => state.data.recordLookup[id]);
  const relatedItems = bucket.related.map((id) => state.data.recordLookup[id]);

  modalBody.innerHTML = `
    <div class="detail-columns">
      <section class="detail-panel" style="border-color:${toAlpha(law.color,.28)}">
        <h4><span class="law-dot" style="background:${law.color}"></span> 직접 포함 (●)</h4>
        ${exactItems.length ? `<div class="detail-list">${exactItems.map(renderDetailItem).join("")}</div>` : `<div class="empty-state">직접 포함된 세부기술이 없습니다.</div>`}
      </section>
      <section class="detail-panel" style="border-color:${toAlpha(law.color,.18)}">
        <h4><span class="law-dot" style="background:${law.color}; opacity:.75"></span> 연관/유사 (○)</h4>
        ${relatedItems.length ? `<div class="detail-list">${relatedItems.map(renderDetailItem).join("")}</div>` : `<div class="empty-state">연관/유사로 표시된 세부기술이 없습니다.</div>`}
      </section>
    </div>
  `;
}

function renderDetailItem(item) {
  return `
    <article class="detail-item">
      <div class="detail-item__title">${highlight(item.technology, state.search)}</div>
      <div class="detail-item__sub">${item.subcategory || "중분류 없음"}</div>
      ${item.note ? `<div class="detail-item__note">${highlight(item.note, state.search)}</div>` : ""}
    </article>
  `;
}

function currentField() {
  return state.data.fields.find((item) => item.id === state.modalFieldId);
}

function normalize(value) {
  return (value || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const safe = escapeRegExp(query.trim());
  if (!safe) return escapeHtml(text);
  return escapeHtml(text).replace(new RegExp(`(${safe})`, "gi"), "<mark>$1</mark>");
}

function toAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
