(function (root) {
  'use strict';
  const sold = s => s === 'VENDIDO' || s === 'QUITADO';
  function month(at) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date(at));
    return parts.find(p => p.type === 'year').value + '-' + parts.find(p => p.type === 'month').value;
  }
  function type(e) {
    if (!sold(e.from) && sold(e.to)) return 'Venda';
    if (sold(e.from) && e.to === 'DISPONÍVEL') return 'Cancelamento';
    return 'Outra alteração';
  }
  function months(start, end) {
    const result = [];
    if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end) || start > end) return result;
    let [year, m] = start.split('-').map(Number);
    while (result.length < 1200) {
      const key = year + '-' + String(m).padStart(2, '0');
      if (key > end) break;
      result.push(key); if (++m === 13) { year++; m = 1; }
    }
    return result;
  }
  function periodStart(end, length) {
    if (!/^\d{4}-\d{2}$/.test(end) || !Number.isSafeInteger(length) || length < 1) return '';
    const [year, monthNumber] = end.split('-').map(Number);
    if (monthNumber < 1 || monthNumber > 12) return '';
    const absoluteMonth = year * 12 + monthNumber - length;
    return Math.floor(absoluteMonth / 12) + '-' + String(absoluteMonth % 12 + 1).padStart(2, '0');
  }
  function compare(rows, currentMonth) {
    return rows.map((row, i) => {
      const previous = rows[i - 1];
      const complete = row.covered && !row.partial && row.month < currentMonth;
      const comparable = complete && previous && previous.covered && !previous.partial;
      return { ...row, net: row.sales - row.cancellations,
        salesDelta: comparable ? row.sales - previous.sales : null,
        cancellationsDelta: comparable ? row.cancellations - previous.cancellations : null };
    });
  }
  function summarize(data, filters) {
    const objects = data.objects.filter(o => !filters.block || String(o.QUADRA) === filters.block);
    const counts = Object.fromEntries(Object.keys(data.options).map(s => [s, 0]));
    objects.forEach(o => { counts[o.SITUACAO] = (counts[o.SITUACAO] || 0) + 1; });
    const history = data.history || [];
    const started = data.historyStartedAt || (history.length ? history.reduce((a,e) => a < e.at ? a : e.at, history[0].at) : null);
    const events = history.filter(e => (!filters.block || String(e.QUADRA) === filters.block) && month(e.at) >= filters.start && month(e.at) <= filters.end)
      .map(e => ({ ...e, type: type(e) })).sort((a,b) => b.at.localeCompare(a.at) || b.revision - a.revision);
    const rows = months(filters.start, filters.end).map(key => {
      const covered = !!started && key >= month(started);
      return { month: key, covered, partial: !!started && key === month(started), sales: 0, cancellations: 0 };
    });
    const byMonth = new Map(rows.map(r => [r.month, r]));
    events.forEach(e => {
      const row = byMonth.get(month(e.at));
      if (row && e.type === 'Venda') row.sales++;
      if (row && e.type === 'Cancelamento') row.cancellations++;
    });
    const sales = events.filter(e => e.type === 'Venda').length;
    const cancellations = events.filter(e => e.type === 'Cancelamento').length;
    return { objects, counts, events, rows, sales, cancellations, started,
      commercialized: objects.filter(o => sold(o.SITUACAO)).length,
      available: counts['DISPONÍVEL'] || 0 };
  }
  const api = { month, type, months, periodStart, summarize, compare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MoriaDashboard = api;
}(typeof window !== 'undefined' ? window : globalThis));
