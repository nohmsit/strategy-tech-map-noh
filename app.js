const state = {
  raw: null,
  query: "",
  selectedLaws: new Set(),
  selectedCategories: new Set(),
};

const els = {
  subtitle: document.getElementById('subtitle'),
  lawFilters: document.getElementById('lawFilters'),
  categoryFilters: document.getElementById('categoryFilters'),
  cardGrid: document.getElementById('cardGrid'),
  searchInput: document.getElementById('searchInput'),
  categoryCount: document.getElementById('categoryCount'),
  itemCount: document.getElementById('itemCount'),
  visibleCount: document.getElementById('visibleCount'),
  resultsMeta: document.getElementById('resultsMeta'),
  activeFilters: document.getElementById('activeFilters'),
  detailDialog: document.getElementById('detailDialog'),
  dialogContent: document.getElementById('dialogContent'),
  matrixHead: document.getElementById('matrixHead'),
  matrixBody: document.getElementById('matrixBody'),
  matrixLegend: document.getElementById('matrixLegend'),
};

const lawNameMap = {};

fetch('data.json')
  .then((res) => res.json())
  .then((data) => {
    state.raw = data;
    data.laws.forEach((law) => lawNameMap[law.id] = law.name);
    els.subtitle.textContent = data.meta.subtitle;
    renderFilters();
    renderMatrix();
    render();
  })
  .catch((error) => {
    console.error(error);
    els.cardGrid.innerHTML = '<div class="empty-state">데이터를 불러오지 못했습니다. data.json 파일이 같은 폴더에 있는지 확인해 주세요.</div>';
  });

function renderFilters() {
  els.lawFilters.innerHTML = state.raw.laws.map((law) => `
    <button class="chip ${state.selectedLaws.has(law.id) ? 'active' : ''}" data-law="${law.id}" type="button">${law.name}</button>
  `).join('');

  els.categoryFilters.innerHTML = state.raw.categories.map((category) => `
    <button class="category-btn ${state.selectedCategories.has(category.id) ? 'active' : ''}" data-category="${category.id}" type="button">
      <span>${category.name}</span>
      <small>${category.items.length}개</small>
    </button>
  `).join('');

  document.querySelectorAll('[data-law]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.law;
      toggleSet(state.selectedLaws, key);
      syncRender();
    });
  });

  document.querySelectorAll('[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.category;
      toggleSet(state.selectedCategories, key);
      syncRender();
    });
  });
}

function renderMatrix() {
  els.matrixLegend.innerHTML = `
    <span class="matrix-legend-item"><span class="matrix-dot on"></span> 포함</span>
    <span class="matrix-legend-item"><span class="matrix-dot off"></span> 미표시</span>
  `;

  els.matrixHead.innerHTML = `
    <tr>
      <th>분야</th>
      ${state.raw.laws.map((law) => `
        <th>
          <button class="matrix-header-btn ${state.selectedLaws.has(law.id) ? 'active' : ''}" type="button" data-matrix-law="${law.id}">
            ${law.name}
          </button>
        </th>
      `).join('')}
      <th>세부 기술</th>
    </tr>
  `;

  const filteredIds = new Set(filterCategories().map((category) => category.id));

  els.matrixBody.innerHTML = state.raw.categories.map((category) => {
    const activeRow = filteredIds.has(category.id);
    return `
      <tr class="${activeRow ? 'row-active' : 'row-dim'}">
        <th>
          <button class="matrix-category-btn ${state.selectedCategories.has(category.id) ? 'active' : ''}" type="button" data-matrix-category="${category.id}">
            ${category.name}
          </button>
        </th>
        ${state.raw.laws.map((law) => `
          <td>
            <button
              class="matrix-cell ${category.laws.includes(law.id) ? 'on' : 'off'} ${state.selectedLaws.has(law.id) ? 'selected-law' : ''}"
              type="button"
              data-matrix-category="${category.id}"
              data-matrix-law-toggle="${law.id}"
              aria-label="${category.name} - ${law.name} ${category.laws.includes(law.id) ? '포함' : '미표시'}"
              title="${category.name} / ${law.name} / ${category.laws.includes(law.id) ? '포함' : '미표시'}"
            >
              <span>${category.laws.includes(law.id) ? '●' : '–'}</span>
            </button>
          </td>
        `).join('')}
        <td class="matrix-count">${category.items.length}개</td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('[data-matrix-law]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleSet(state.selectedLaws, button.dataset.matrixLaw);
      syncRender();
    });
  });

  document.querySelectorAll('[data-matrix-category]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleSet(state.selectedCategories, button.dataset.matrixCategory);
      syncRender();
    });
  });

  document.querySelectorAll('[data-matrix-law-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const { matrixCategory, matrixLawToggle } = button.dataset;
      toggleSet(state.selectedCategories, matrixCategory);
      if (button.classList.contains('on')) {
        toggleSet(state.selectedLaws, matrixLawToggle);
      }
      syncRender();
    });
  });
}

function toggleSet(targetSet, value) {
  if (targetSet.has(value)) targetSet.delete(value);
  else targetSet.add(value);
}

function filterCategories() {
  const q = state.query.trim().toLowerCase();
  return state.raw.categories.filter((category) => {
    const matchCategory = state.selectedCategories.size === 0 || state.selectedCategories.has(category.id);
    const matchLaw = state.selectedLaws.size === 0 || [...state.selectedLaws].every((law) => category.laws.includes(law));
    const aliases = (category.aliases || []).join(' ');
    const haystack = `${category.name} ${aliases} ${category.summary} ${category.items.join(' ')}`.toLowerCase();
    const matchQuery = !q || haystack.includes(q);
    return matchCategory && matchLaw && matchQuery;
  });
}

function render() {
  const filtered = filterCategories();
  const totalItems = state.raw.categories.reduce((sum, category) => sum + category.items.length, 0);
  const visibleItems = filtered.reduce((sum, category) => sum + category.items.length, 0);

  els.categoryCount.textContent = state.raw.categories.length.toLocaleString('ko-KR');
  els.itemCount.textContent = totalItems.toLocaleString('ko-KR');
  els.visibleCount.textContent = visibleItems.toLocaleString('ko-KR');
  els.resultsMeta.textContent = `현재 ${filtered.length}개 분야 / ${visibleItems}개 기술 항목이 표시되고 있습니다.`;

  const active = [];
  if (state.query) active.push(`<span class="filter-pill">검색어: ${escapeHtml(state.query)}</span>`);
  [...state.selectedLaws].forEach((law) => active.push(`<span class="filter-pill">법령: ${lawNameMap[law]}</span>`));
  [...state.selectedCategories].forEach((id) => {
    const found = state.raw.categories.find((category) => category.id === id);
    if (found) active.push(`<span class="filter-pill">분야: ${found.name}</span>`);
  });
  els.activeFilters.innerHTML = active.length ? active.join('') : '<span class="filter-pill">현재 전체 보기 상태입니다.</span>';

  if (!filtered.length) {
    els.cardGrid.innerHTML = '<div class="empty-state">조건에 맞는 결과가 없습니다. 검색어를 바꾸거나 필터를 해제해 보세요.</div>';
    return;
  }

  els.cardGrid.innerHTML = filtered.map((category) => `
    <article class="card">
      <div>
        <h3>${category.name}</h3>
        <p>${category.summary}</p>
      </div>
      <div class="badges">
        ${state.raw.laws.map((law) => `<span class="law-pill ${category.laws.includes(law.id) ? 'yes' : ''}">${law.name} ${category.laws.includes(law.id) ? '포함' : '미표시'}</span>`).join('')}
      </div>
      <footer>
        <span class="count">세부 기술 ${category.items.length}개</span>
        <button class="primary-btn" type="button" data-open="${category.id}">상세 보기</button>
      </footer>
    </article>
  `).join('');

  document.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => openDetail(button.dataset.open));
  });
}

function openDetail(categoryId) {
  const category = state.raw.categories.find((item) => item.id === categoryId);
  if (!category) return;
  els.dialogContent.innerHTML = `
    <div class="detail-top">
      <p class="eyebrow">Detail View</p>
      <h3>${category.name}</h3>
      <p>${category.summary}</p>
      <div class="badges">
        ${state.raw.laws.map((law) => `<span class="law-pill ${category.laws.includes(law.id) ? 'yes' : ''}">${law.name} ${category.laws.includes(law.id) ? '포함' : '미표시'}</span>`).join('')}
      </div>
      <div class="notice">법령 포함 여부는 PPT 내 표기와 구조를 기준으로 정리한 웹 프로토타입입니다. 실제 행정·법률 판단에는 원문 법령과 고시를 반드시 확인해 주세요.</div>
    </div>
    <h4>세부 기술 목록</h4>
    <ul class="detail-list">
      ${category.items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `;
  els.detailDialog.showModal();
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function syncRender() {
  renderFilters();
  renderMatrix();
  render();
}

els.searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderMatrix();
  render();
});

document.getElementById('resetAll').addEventListener('click', resetAll);
document.getElementById('clearLawFilters').addEventListener('click', () => {
  state.selectedLaws.clear(); syncRender();
});
document.getElementById('clearCategoryFilters').addEventListener('click', () => {
  state.selectedCategories.clear(); syncRender();
});
document.getElementById('closeDialog').addEventListener('click', () => els.detailDialog.close());
els.detailDialog.addEventListener('click', (event) => {
  const card = event.target.closest('.dialog-card');
  if (!card) els.detailDialog.close();
});

function resetAll() {
  state.query = '';
  state.selectedLaws.clear();
  state.selectedCategories.clear();
  els.searchInput.value = '';
  syncRender();
}
