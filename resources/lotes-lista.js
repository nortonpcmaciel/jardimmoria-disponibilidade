(function () {
  'use strict';
  const body = document.getElementById('lotes-disponiveis');
  const summary = document.getElementById('disponiveis-resumo');
  let catalog;
  const area = value => value == null ? '—' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function cell(row, value) {
    const element = document.createElement('td'); element.textContent = value; row.appendChild(element);
  }
  function render(data) {
    if (!catalog || !data) return;
    const available = data.objects.filter(item => item.SITUACAO === 'DISPONÍVEL')
      .sort((a, b) => a.QUADRA - b.QUADRA || a.LOTE - b.LOTE);
    body.replaceChildren();
    available.forEach(item => {
      const details = catalog[item.QDLT] || {}, row = document.createElement('tr');
      [item.QUADRA, item.LOTE, area(details.area), details.logradouro || '—'].forEach(value => cell(row, value));
      body.appendChild(row);
    });
    if (!available.length) {
      const row = document.createElement('tr'), empty = document.createElement('td');
      empty.colSpan = 4; empty.className = 'empty'; empty.textContent = 'Nenhum lote disponível no momento.';
      row.appendChild(empty); body.appendChild(row);
    }
    summary.textContent = available.length.toLocaleString('pt-BR') + ' lotes • Atualizado em ' + data.updatedDate;
  }
  fetch('data/lotes-detalhes.json?v=' + Date.now(), { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(next => { catalog = next; return MoriaStore.loadPublic(); })
    .then(render)
    .catch(() => { summary.textContent = 'Não foi possível carregar a lista de lotes.'; });
  window.addEventListener('moria:data', event => render(event.detail));
}());
