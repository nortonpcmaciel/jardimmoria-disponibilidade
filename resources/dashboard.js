(function () {
  'use strict';
  const $ = id => document.getElementById(id), model = window.MoriaDashboard;
  const number = n => n.toLocaleString('pt-BR');
  const date = at => new Date(at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const label = m => m.slice(5) + '/' + m.slice(0,4);
  let data, result, page = 0, filteredEvents = [], loading = false;
  function cell(row, value) { const td = document.createElement('td'); td.textContent = value; row.appendChild(td); return td; }
  function rowTo(id, values) { const row = document.createElement('tr'); values.forEach(v => cell(row, v)); $(id).appendChild(row); return row; }
  function empty(id, text, columns) { const row = rowTo(id, [text]); row.firstChild.colSpan = columns; row.firstChild.className = 'empty'; }
  function defaults() {
    const end = model.month(new Date());
    $('end').max = end; $('start').max = end;
    $('interval').value = 'last12';
    applyInterval();
  }
  function applyInterval() {
    const range = model.intervalRange($('interval').value, model.month(new Date()));
    $('start').value = range.start; $('end').value = range.end;
  }
  function renderEvents() {
    const query = $('search').value.trim().toLocaleLowerCase('pt-BR');
    filteredEvents = result.events.filter(e => (!$('event-type').value || e.type === $('event-type').value) &&
      (!query || [e.objectId,e.QDLT,e.QUADRA,e.LOTE].some(v => String(v).toLocaleLowerCase('pt-BR').includes(query))));
    const pages = Math.max(1, Math.ceil(filteredEvents.length / 20)); page = Math.min(page, pages - 1);
    $('events').replaceChildren();
    filteredEvents.slice(page * 20, page * 20 + 20).forEach(e => {
      const row = rowTo('events', [date(e.at),e.objectId,e.QUADRA + ' / ' + e.LOTE,e.QDLT,e.from,e.to]);
      const td = cell(row, ''), badge = document.createElement('span');
      badge.className = 'badge ' + (e.type === 'Venda' ? 'sale' : e.type === 'Cancelamento' ? 'cancel' : '');
      badge.textContent = e.type; td.appendChild(badge);
    });
    if (!filteredEvents.length) empty('events', 'Nenhuma alteração registrada para estes filtros.', 7);
    $('event-count').textContent = number(filteredEvents.length) + ' alterações • Página ' + (page + 1) + ' de ' + pages;
    $('prev').disabled = page === 0; $('next').disabled = page >= pages - 1; $('export').disabled = !filteredEvents.length;
  }
  function render() {
    if (!data) return;
    if (!$('start').value || !$('end').value || $('start').value > $('end').value || !$('start').checkValidity() || !$('end').checkValidity()) {
      $('message').textContent = 'Selecione um período válido: o mês inicial deve ser anterior ou igual ao final, sem meses futuros.';
      $('message').className = 'error'; $('content').hidden = true; return;
    }
    $('content').hidden = false;
    $('message').className = '';
    $('message').textContent = 'Dados publicados • Atualizado em ' + data.updatedDate + ' • Revisão ' + data.revision;
    result = model.summarize(data, { block: $('block').value, start: $('start').value, end: $('end').value });
    $('total').textContent = number(result.objects.length); $('available').textContent = number(result.available);
    $('sold').textContent = number(result.commercialized);
    const commercial = result.available + result.commercialized;
    $('portfolio').textContent = number(commercial);
    $('rate').textContent = commercial ? (result.commercialized / commercial * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—';
    const currentMonth = model.month(new Date()), previousMonth = model.periodStart(currentMonth, 2);
    const monthly = model.summarize(data, { block: $('block').value, start: previousMonth, end: currentMonth });
    const currentRow = monthly.rows.find(row => row.month === currentMonth), previousRow = monthly.rows.find(row => row.month === previousMonth);
    $('current-sales').textContent = currentRow?.covered ? number(currentRow.sales) : '—';
    $('current-cancellations').textContent = currentRow?.covered ? number(currentRow.cancellations) : '—';
    const growth = currentRow?.covered && previousRow?.covered ? model.percentChange(currentRow.sales, previousRow.sales) : null;
    $('current-growth').textContent = growth === null ? '—' : (growth > 0 ? '+' : '') + growth.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%';
    $('growth-period').textContent = label(previousMonth) + ' → ' + label(currentMonth);
    $('growth-card').classList.toggle('positive', growth !== null && growth > 0);
    $('growth-card').classList.toggle('negative', growth !== null && growth < 0);
    $('period').textContent = label($('start').value) + ' a ' + label($('end').value);
    const covered = result.rows.some(r => r.covered);
    $('sales').textContent = covered ? number(result.sales) : '—';
    $('cancellations').textContent = covered ? number(result.cancellations) : '—';
    $('net').textContent = covered ? number(result.sales - result.cancellations) : '—';
    $('coverage').textContent = result.hasMonthlyBaseline ? 'Histórico mensal importado desde 01/2025 • Base atualizada em ' + result.baselineUpdatedDate + '. O mês corrente está em andamento e novas alterações serão somadas automaticamente.' : result.started ? 'Este filtro por quadra mostra somente alterações individuais registradas desde ' + date(result.started) + '. O histórico importado não possui detalhamento por quadra.' : $('block').value ? 'O histórico importado não possui detalhamento por quadra. As próximas alterações individuais desta quadra formarão o comparativo.' : 'Histórico ainda não iniciado. As próximas alterações salvas em Dados formarão o comparativo.';
    $('chart').replaceChildren(); $('monthly').replaceChildren();
    const max = Math.max(1, ...result.rows.flatMap(r => [r.sales,r.cancellations]));
    result.rows.forEach((r,i) => {
      const col = document.createElement('div'); col.className = 'month-col';
      const bars = document.createElement('div'); bars.className = 'bars';
      if (r.covered) {
        [r.sales,r.cancellations].forEach((value,j) => {
          const bar = document.createElement('div'); bar.className = 'bar' + (j ? ' cancel' : ''); bar.style.height = (value / max * 85) + '%';
          bar.title = label(r.month) + ': ' + value + (j ? ' cancelamentos' : ' vendas');
          const count = document.createElement('span'); count.textContent = value; bar.appendChild(count); bars.appendChild(bar);
        });
      } else { const missing = document.createElement('span'); missing.className = 'missing'; missing.textContent = 'Sem dados'; bars.appendChild(missing); }
      const caption = document.createElement('span'); caption.className = 'month-label'; caption.textContent = label(r.month) + (r.partial ? '*' : '');
      col.append(bars,caption); $('chart').appendChild(col);
      const previous = result.rows[i-1];
      const delta = r.covered && previous && previous.covered && !r.partial && !previous.partial && r.month < model.month(new Date()) ? number(r.sales - previous.sales) : '—';
      rowTo('monthly', [label(r.month) + (r.partial ? ' (parcial)' : r.month === model.month(new Date()) ? ' (em andamento)' : ''),r.covered ? r.sales : 'Sem dados',r.covered ? r.cancellations : '—',r.covered ? r.sales-r.cancellations : '—',delta]);
    });
    $('distribution').replaceChildren();
    const colors = { 'DISPONÍVEL':'#20947f', VENDIDO:'#9b364b', QUITADO:'#617bb0', BLOQUEADO:'#d5a450', 'ÁREA VERDE':'#94b39c', 'CASAS POPULARES':'#8e9bad' };
    const omitted = new Set(['CASAS POPULARES','ÁREA VERDE']);
    const distribution = Object.entries(result.counts).filter(([status]) => !omitted.has(status));
    const distributionTotal = distribution.reduce((sum,[,count]) => sum + count,0);
    distribution.forEach(([status,count]) => {
      const item = document.createElement('div'); item.className = 'distribution-row';
      const title = document.createElement('div'); title.className = 'distribution-label';
      const name = document.createElement('span'); name.textContent = status;
      const percent = distributionTotal ? count / distributionTotal * 100 : 0;
      const value = document.createElement('strong'); value.textContent = number(count) + ' / ' + percent.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) + '%'; title.append(name,value);
      const track = document.createElement('div'); track.className = 'track';
      const bar = document.createElement('div'); bar.style.width = percent + '%'; bar.style.background = colors[status] || '#8e9bad';
      track.appendChild(bar); item.append(title,track); $('distribution').appendChild(item);
    });
    $('blocks').replaceChildren();
    const groups = new Map();
    result.objects.forEach(o => { const key = String(o.QUADRA); if (!groups.has(key)) groups.set(key,[]); groups.get(key).push(o); });
    [...groups].sort((a,b) => a[0].localeCompare(b[0], 'pt-BR', { numeric:true })).forEach(([block,objects]) => {
      const count = s => objects.filter(o => o.SITUACAO === s).length;
      const available = count('DISPONÍVEL'), sold = count('VENDIDO'), paid = count('QUITADO'), total = available + sold + paid;
      rowTo('blocks', [block,objects.length,available,sold,paid,objects.length-total,total ? ((sold+paid)/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1}) + '%' : '—']);
    });
    if (!groups.size) empty('blocks','Nenhum objeto encontrado.',7);
    renderEvents();
  }
  async function load() {
    if (loading) return; loading = true; $('refresh').disabled = true;
    try {
      const [next,historyResponse] = await Promise.all([MoriaStore.loadPublic(),fetch('data/dashboard-historico.json?v=' + Date.now(),{cache:'no-store'})]);
      if (!historyResponse.ok) throw new Error('Não foi possível carregar o histórico mensal publicado.');
      const monthly = await historyResponse.json();
      const validRows = monthly && Array.isArray(monthly.months) && monthly.months.every(row => /^\d{4}-\d{2}$/.test(row.month) && Number.isSafeInteger(row.sales) && row.sales >= 0 && Number.isSafeInteger(row.cancellations) && row.cancellations >= 0);
      if (!validRows || new Set(monthly.months.map(row => row.month)).size !== monthly.months.length) throw new Error('O histórico mensal publicado é inválido.');
      data = { ...next, monthlyBaseline: monthly.months, monthlyBaselineMeta: monthly };
      const selected = $('block').value;
      $('block').replaceChildren(new Option('Todas as quadras',''));
      [...new Set(data.objects.filter(model.isListedObject).map(o => String(o.QUADRA)))].sort((a,b) => a.localeCompare(b,'pt-BR',{numeric:true})).forEach(q => $('block').add(new Option('Quadra ' + q,q)));
      if ([...$('block').options].some(o => o.value === selected)) $('block').value = selected;
      render();
    } catch (error) { $('message').textContent = error.message + (data ? ' Exibindo a última leitura; os dados podem estar desatualizados.' : ' Clique em Atualizar dados para tentar novamente.'); $('message').className = 'error'; }
    finally { loading = false; $('refresh').disabled = false; }
  }
  ['block','start','end'].forEach(id => $(id).addEventListener('change', () => { page = 0; render(); }));
  $('interval').addEventListener('change', () => { applyInterval(); page = 0; render(); });
  ['search','event-type'].forEach(id => $(id).addEventListener('input', () => { page = 0; if (result) renderEvents(); }));
  $('prev').onclick = () => { page--; renderEvents(); }; $('next').onclick = () => { page++; renderEvents(); };
  $('refresh').onclick = load;
  $('export').onclick = () => {
    const quote = v => '"' + String(v).replace(/^[=+@-]/, "'$&").replace(/"/g,'""') + '"';
    const rows = [['Data e hora (São Paulo)','Objeto','Quadra','Lote','Código','Anterior','Atual','Movimentação'], ...filteredEvents.map(e => [date(e.at),e.objectId,e.QUADRA,e.LOTE,e.QDLT,e.from,e.to,e.type])];
    const blob = new Blob(['\ufeff' + rows.map(r => r.map(quote).join(';')).join('\r\n')], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'moria-movimentacoes-' + $('start').value + '-a-' + $('end').value + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  defaults(); load(); setInterval(() => { if (!document.hidden) load(); },30000);
}());
