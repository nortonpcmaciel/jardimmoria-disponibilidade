const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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
test('combina histórico mensal importado com eventos posteriores sem duplicar o corte', () => {
  const data = { options:{VENDIDO:'V','DISPONÍVEL':'D'},objects:[],monthlyBaselineMeta:{updatedDate:'10/09/2026',eventsIncludedThroughRevision:13},monthlyBaseline:[
    {month:'2026-08',sales:3,cancellations:5},
    {month:'2026-09',sales:3,cancellations:1,inProgress:true}
  ],historyStartedAt:'2026-09-09T12:00:00Z',history:[
    {revision:13,objectId:'1',QUADRA:1,from:'DISPONÍVEL',to:'VENDIDO',at:'2026-09-09T12:00:00Z'},
    {revision:14,objectId:'2',QUADRA:1,from:'VENDIDO',to:'DISPONÍVEL',at:'2026-09-11T12:00:00Z'}
  ]};
  const overall = model.summarize(data,{block:'',start:'2026-08',end:'2026-09'});
  assert.equal(overall.sales,6); assert.equal(overall.cancellations,7);
  assert.equal(overall.rows[1].sales,3); assert.equal(overall.rows[1].cancellations,2);
  assert.equal(overall.rows[1].partial,true); assert.equal(overall.hasMonthlyBaseline,true);
  const block = model.summarize(data,{block:'1',start:'2026-08',end:'2026-09'});
  assert.equal(block.hasMonthlyBaseline,false); assert.equal(block.sales,1); assert.equal(block.cancellations,1);
});
test('base importada contém a série da planilha e setembro em andamento', () => {
  const data = JSON.parse(fs.readFileSync('data/dashboard-historico.json','utf8'));
  assert.equal(data.months.length,21);
  assert.deepEqual(data.months[0],{month:'2025-01',sales:6,cancellations:4});
  assert.deepEqual(data.months.at(-1),{month:'2026-09',sales:3,cancellations:1,inProgress:true});
  assert.equal(data.months.reduce((sum,row) => sum + row.sales,0),79);
  assert.equal(data.months.reduce((sum,row) => sum + row.cancellations,0),79);
});
