(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let data, busy = false;
  const drafts = new Map();
  function message(text, error) { $('mensagem').textContent = text; $('mensagem').className = error ? 'error' : ''; }
  function addOption(select, value) { const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); }
  function render() {
    if (!data) return;
    const query = $('busca').value.trim().toLocaleLowerCase('pt-BR');
    const items = data.objects.filter(o => (!$('quadra').value || String(o.QUADRA) === $('quadra').value) &&
      (!$('situacao').value || o.SITUACAO === $('situacao').value) &&
      (!query || [o.QDLT, o.QUADRA, o.LOTE, 'objeto ' + o.id].some(v => String(v).toLocaleLowerCase('pt-BR').includes(query))));
    $('objetos').replaceChildren();
    for (const item of items) {
      const row = document.createElement('tr');
      for (const value of [item.id, item.QUADRA, item.LOTE, item.QDLT, item.SITUACAO]) {
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
    $('resumo').textContent = items.length + ' de ' + data.objects.length + ' objetos • Atualizado em ' + data.updatedDate;
  }
  async function load() {
    $('recarregar').disabled = true;
    try {
      data = await MoriaStore.loadAdmin($('senha').value.trim());
      if ($('quadra').options.length === 1) {
        [...new Set(data.objects.map(o => o.QUADRA))].sort((a,b) => a-b).forEach(q => addOption($('quadra'), String(q)));
        Object.keys(data.options).sort().forEach(s => addOption($('situacao'), s));
      }
      render(); message('Dados carregados. Cada linha corresponde a um objeto; códigos repetidos são identificados pelo número do objeto.');
    } catch (error) { message(error.message, true); }
    finally { $('recarregar').disabled = false; }
  }
  ['busca', 'quadra', 'situacao'].forEach(id => $(id).addEventListener('input', render));
  $('recarregar').onclick = load;
  window.addEventListener('beforeunload', event => { if (drafts.size) { event.preventDefault(); event.returnValue = ''; } });
  load();
}());
