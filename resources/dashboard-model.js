(function (root) {
  'use strict';
  const sold = s => s === 'VENDIDO' || s === 'QUITADO';
  const omitted = new Set(['CASAS POPULARES', 'ÁREA VERDE']);
  const isListedObject = object => Number(object.QUADRA) !== 17 && !omitted.has(object.SITUACAO);
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
  function intervalRange(kind, currentMonth) {
    if (!/^\d{4}-\d{2}$/.test(currentMonth)) return { start: '', end: '' };
    const year = Number(currentMonth.slice(0, 4));
    if (kind === 'currentYear') return { start: year + '-01', end: currentMonth };
    if (kind === 'previousYear') return { start: year - 1 + '-01', end: year - 1 + '-12' };
    return { start: periodStart(currentMonth, 12), end: currentMonth };
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
    const objects = data.objects.filter(o => isListedObject(o) && (!filters.block || String(o.QUADRA) === filters.block));
    const counts = Object.fromEntries(Object.keys(data.options).map(s => [s, 0]));
    objects.forEach(o => { counts[o.SITUACAO] = (counts[o.SITUACAO] || 0) + 1; });
    const history = data.history || [];
    const baseline = !filters.block && Array.isArray(data.monthlyBaseline) ? data.monthlyBaseline : [];
    const baselineByMonth = new Map(baseline.map(row => [row.month, row]));
    const cutoffRevision = Number.isSafeInteger(data.monthlyBaselineMeta?.eventsIncludedThroughRevision) ? data.monthlyBaselineMeta.eventsIncludedThroughRevision : -1;
    const started = data.historyStartedAt || (history.length ? history.reduce((a,e) => a < e.at ? a : e.at, history[0].at) : null);
    const events = history.filter(e => (!filters.block || String(e.QUADRA) === filters.block) && month(e.at) >= filters.start && month(e.at) <= filters.end)
      .map(e => ({ ...e, type: type(e) })).sort((a,b) => b.at.localeCompare(a.at) || b.revision - a.revision);
    const rows = months(filters.start, filters.end).map(key => {
      const imported = baselineByMonth.get(key);
      const liveCovered = !!started && key >= month(started);
      return { month: key, covered: !!imported || liveCovered,
        partial: !!imported?.inProgress || (!imported && !!started && key === month(started)),
        sales: imported?.sales || 0, cancellations: imported?.cancellations || 0 };
    });
    const byMonth = new Map(rows.map(r => [r.month, r]));
    const flowEvents = filters.block ? events : events.filter(e => e.revision > cutoffRevision);
    flowEvents.forEach(e => {
      const row = byMonth.get(month(e.at));
      if (row && e.type === 'Venda') row.sales++;
      if (row && e.type === 'Cancelamento') row.cancellations++;
    });
    const sales = rows.filter(r => r.covered).reduce((sum, row) => sum + row.sales, 0);
    const cancellations = rows.filter(r => r.covered).reduce((sum, row) => sum + row.cancellations, 0);
    return { objects, counts, events, rows, sales, cancellations, started,
      hasMonthlyBaseline: baseline.length > 0, baselineUpdatedDate: data.monthlyBaselineMeta?.updatedDate || null,
      commercialized: objects.filter(o => sold(o.SITUACAO)).length,
      available: counts['DISPONÍVEL'] || 0 };
  }
  const api = { month, type, months, periodStart, intervalRange, summarize, compare, isListedObject };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MoriaDashboard = api;
}(typeof window !== 'undefined' ? window : globalThis));
