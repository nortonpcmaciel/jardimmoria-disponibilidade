const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../resources/dashboard-model');
test('vendas, quitações, cancelamentos e revendas usam a transição real', () => {
  assert.equal(model.type({from:'DISPONÍVEL',to:'VENDIDO'}),'Venda');
  assert.equal(model.type({from:'VENDIDO',to:'QUITADO'}),'Outra alteração');
  assert.equal(model.type({from:'QUITADO',to:'VENDIDO'}),'Outra alteração');
  assert.equal(model.type({from:'QUITADO',to:'DISPONÍVEL'}),'Cancelamento');
  assert.equal(model.type({from:'BLOQUEADO',to:'DISPONÍVEL'}),'Outra alteração');
});
test('agrupa no fuso de São Paulo, preenche meses e filtra quadras sem deduplicar códigos', () => {
  const data = { options:{VENDIDO:'V','DISPONÍVEL':'D'},objects:[{id:'1',QDLT:'99-01',QUADRA:99,SITUACAO:'VENDIDO'},{id:'2',QDLT:'99-01',QUADRA:99,SITUACAO:'DISPONÍVEL'}],historyStartedAt:'2026-01-15T12:00:00Z',history:[
    {objectId:'1',QUADRA:99,from:'DISPONÍVEL',to:'VENDIDO',at:'2026-02-01T01:30:00Z'},
    {objectId:'1',QUADRA:99,from:'VENDIDO',to:'DISPONÍVEL',at:'2026-03-01T12:00:00Z'},
    {objectId:'1',QUADRA:99,from:'DISPONÍVEL',to:'VENDIDO',at:'2026-03-02T12:00:00Z'},
    {objectId:'3',QUADRA:1,from:'DISPONÍVEL',to:'VENDIDO',at:'2026-03-03T12:00:00Z'}] };
  const r = model.summarize(data,{block:'99',start:'2025-12',end:'2026-03'});
  assert.equal(r.objects.length,2); assert.equal(r.available,1); assert.equal(r.commercialized,1);
  assert.equal(r.sales,2); assert.equal(r.cancellations,1);
  assert.equal(r.rows[0].covered,false); assert.equal(r.rows[1].partial,true);
  assert.equal(r.rows[1].sales,1); assert.equal(r.rows[2].sales,0);
  assert.equal(r.rows[3].sales,1); assert.equal(r.rows[3].cancellations,1);
  assert.equal(model.summarize({...data,history:[],historyStartedAt:undefined},{start:'2026-01',end:'2026-03'}).rows.some(r => r.covered),false);
});
test('período padrão contém exatamente os 12 meses até o mês atual', () => {
  const start = model.periodStart('2026-09', 12);
  assert.equal(start, '2025-10');
  assert.equal(model.months(start, '2026-09').length, 12);
  assert.equal(model.periodStart('2026-01', 12), '2025-02');
});
