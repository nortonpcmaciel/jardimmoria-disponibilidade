(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let data, busy = false, lotes = {};
  const drafts = new Map();
  const omitted = new Set(['CASAS POPULARES', 'ÁREA VERDE']);
  const isListed = item => Number(item.QUADRA) !== 17 && !omitted.has(item.SITUACAO);
  const area = value => value == null ? '—' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function message(text, error) { $('mensagem').textContent = text; $('mensagem').className = error ? 'error' : ''; }
  function addOption(select, value) { const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); }
  function render() {
    if (!data) return;
    const query = $('busca').value.trim().toLocaleLowerCase('pt-BR');
    const eligible = data.objects.filter(isListed);
    const items = eligible.filter(o => (!$('quadra').value || String(o.QUADRA) === $('quadra').value) &&
      (!$('situacao').value || o.SITUACAO === $('situacao').value) &&
      (!query || [o.QDLT, o.QUADRA, o.LOTE, lotes[o.QDLT]?.logradouro].some(v => String(v || '').toLocaleLowerCase('pt-BR').includes(query))));
    $('objetos').replaceChildren();
    for (const item of items) {
      const row = document.createElement('tr');
      const details = lotes[item.QDLT] || {};
      for (const value of [item.QDLT, item.QUADRA, item.LOTE, area(details.area), details.logradouro || '—', item.SITUACAO, item.updatedAt ? new Date(item.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Sem registro individual']) {
        const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell);
      }
      const cell = document.createElement('td'), select = document.createElement('select');
      select.setAttribute('aria-label', 'Nova situação do objeto ' + item.id + ', código ' + item.QDLT);
      Object.keys(data.options).sort().forEach(value => addOption(select, value));
      select.value = drafts.get(item.id) || item.SITUACAO;
      select.disabled = busy;
      cell.appendChild(select); row.appendChild(cell);
      const action = document.createElement('td'), button = document.createElement('button');
      button.textContent = 'Salvar'; button.disabled = busy || select.value === item.SITUACAO;
      select.onchange = () => {
        if (select.value === item.SITUACAO) drafts.delete(item.id);
        else drafts.set(item.id, select.value);
        button.disabled = select.value === item.SITUACAO;
      };
      button.onclick = async () => {
        if (!$('senha').value) { message('Informe o token de edição do GitHub para salvar.', true); $('senha').focus(); return; }
        const situacao = select.value;
        busy = true; render(); $('recarregar').disabled = true;
        try {
          data = await MoriaStore.save({ id: item.id, situacao, revision: data.revision }, $('senha').value.trim(), data.dataset);
          drafts.delete(item.id);
          message('Objeto ' + item.id + ' (' + item.QDLT + ') salvo no GitHub. Aguarde a publicação do Pages, que pode levar alguns minutos, para ver a alteração e a data no mapa.');
        } catch (error) { message(error.message, true); }
        finally { busy = false; $('recarregar').disabled = false; render(); }
      };
      action.appendChild(button); row.appendChild(action); $('objetos').appendChild(row);
    }
    $('resumo').textContent = items.length + ' de ' + eligible.length + ' lotes • Atualizado em ' + data.updatedDate;
  }
  async function load() {
    $('recarregar').disabled = true;
    try {
      const [next, detailsResponse] = await Promise.all([
        MoriaStore.loadAdmin($('senha').value.trim()),
        fetch('data/lotes-detalhes.json?v=' + Date.now(), { cache: 'no-store' })
      ]);
      if (!detailsResponse.ok) throw new Error('Não foi possível carregar as áreas e os logradouros.');
      data = next; lotes = await detailsResponse.json();
      if ($('quadra').options.length === 1) {
        [...new Set(data.objects.filter(isListed).map(o => o.QUADRA))].sort((a,b) => a-b).forEach(q => addOption($('quadra'), String(q)));
        Object.keys(data.options).filter(s => !omitted.has(s)).sort().forEach(s => addOption($('situacao'), s));
      }
      render(); message('Dados carregados. Cada linha corresponde a um lote comercializável.');
    } catch (error) { message(error.message, true); }
    finally { $('recarregar').disabled = false; }
  }
  ['busca', 'quadra', 'situacao'].forEach(id => $(id).addEventListener('input', render));
  $('recarregar').onclick = load;
  window.addEventListener('beforeunload', event => { if (drafts.size) { event.preventDefault(); event.returnValue = ''; } });
  load();
}());
