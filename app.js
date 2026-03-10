
async function init() {
  const res = await fetch('./data.json');
  const data = await res.json();

  const state = {
    query: '',
    selectedLaws: new Set(),
    selectedField: null,
  };

  const els = {
    searchInput: document.getElementById('searchInput'),
    results: document.getElementById('results'),
    cardTemplate: document.getElementById('cardTemplate'),
    lawFilters: document.getElementById('lawFilters'),
    fieldFilters: document.getElementById('fieldFilters'),
    activeSummary: document.getElementById('activeSummary'),
    resetBtn: document.getElementById('resetBtn'),
    statFields: document.getElementById('statFields'),
    statItems: document.getElementById('statItems'),
    statVisible: document.getElementById('statVisible'),
  };

  els.statFields.textContent = data.fields.length;
  els.statItems.textContent = data.items.length;

  data.laws.forEach((law) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = law;
    btn.addEventListener('click', () => {
      if (state.selectedLaws.has(law)) state.selectedLaws.delete(law);
      else state.selectedLaws.add(law);
      btn.classList.toggle('active', state.selectedLaws.has(law));
      render();
    });
    els.lawFilters.appendChild(btn);
  });

  data.fields.forEach((field) => {
    const btn = document.createElement('button');
    btn.className = 'field-item';
    btn.textContent = field;
    btn.addEventListener('click', () => {
      state.selectedField = state.selectedField === field ? null : field;
      [...els.fieldFilters.children].forEach(node => node.classList.remove('active'));
      if (state.selectedField) btn.classList.add('active');
      render();
    });
    els.fieldFilters.appendChild(btn);
  });

  els.searchInput.addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  els.resetBtn.addEventListener('click', () => {
    state.query = '';
    state.selectedLaws.clear();
    state.selectedField = null;
    els.searchInput.value = '';
    [...els.lawFilters.children].forEach(node => node.classList.remove('active'));
    [...els.fieldFilters.children].forEach(node => node.classList.remove('active'));
    render();
  });

  function matches(item) {
    const haystack = [item.tech, item.field, item.section, item.sourceBlock, ...(item.laws || [])]
      .join(' ')
      .toLowerCase();

    const queryOk = !state.query || haystack.includes(state.query);
    const lawOk = state.selectedLaws.size === 0 || [...state.selectedLaws].every(law => item.laws.includes(law));
    const fieldOk = !state.selectedField || item.field === state.selectedField;
    return queryOk && lawOk && fieldOk;
  }

  function render() {
    const filtered = data.items.filter(matches);
    els.statVisible.textContent = filtered.length;
    els.activeSummary.textContent =
      filtered.length === data.items.length
        ? '전체 기술을 표시 중입니다.'
        : `${filtered.length}개의 기술이 검색되었습니다.`;

    els.results.innerHTML = '';
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = '<strong>검색 결과가 없습니다.</strong><div style="margin-top:8px;">다른 키워드나 필터 조합으로 다시 시도해 보세요.</div>';
      els.results.appendChild(empty);
      return;
    }

    filtered
      .sort((a, b) => a.field.localeCompare(b.field, 'ko') || a.slide - b.slide || a.tech.localeCompare(b.tech, 'ko'))
      .forEach((item) => {
        const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
        node.querySelector('.field').textContent = item.field;
        node.querySelector('.section').textContent = item.section || '세부구분 없음';
        node.querySelector('.tech').textContent = item.tech;
        node.querySelector('.slide-badge').textContent = `Slide ${item.slide}`;
        node.querySelector('.source').textContent = item.sourceBlock;

        const lawWrap = node.querySelector('.law-badges');
        item.laws.forEach((law) => {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.dataset.law = law;
          badge.textContent = law;
          lawWrap.appendChild(badge);
        });

        els.results.appendChild(node);
      });
  }

  render();
}
init();
