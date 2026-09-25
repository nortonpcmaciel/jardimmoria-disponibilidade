'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('catálogo exportado contém área e logradouro dos 843 lotes da planilha', () => {
  const lots = JSON.parse(read('data/lotes-detalhes.json'));
  assert.equal(Object.keys(lots).length, 843);
  assert.deepEqual(lots['01-01'], { area: 277.44, logradouro: 'AVENIDA 15 DE OUTUBRO' });
});

test('Dados apresenta as colunas solicitadas, omite tipos e inclui o rodapé', () => {
  const html = read('atualizar.html'), script = read('resources/atualizar.js');
  assert.match(html, /<th>Código<\/th><th>Quadra<\/th><th>Lote<\/th><th>Área \(m²\)<\/th><th>Logradouro<\/th>/);
  assert.doesNotMatch(html, /<th>Objeto<\/th>/);
  assert.match(script, /CASAS POPULARES/); assert.match(script, /ÁREA VERDE/);
  assert.match(script, /Number\(item\.QUADRA\) !== 17/);
  assert.match(html, /Residencial Jardim Moriá/);
  assert.match(html, /Inteligência Comercial • dados de disponibilidade/);
});

test('Quadro e Dashboard incluem títulos, tabela, rodapés e intervalos solicitados', () => {
  const map = read('index.html'), dashboard = read('dashboard.html'), dashboardScript = read('resources/dashboard.js');
  assert.match(map, /Quadro de Disponibilidade/);
  assert.match(map, /id="lotes-disponiveis"/);
  assert.match(map, /<th>Quadra<\/th><th>Lote<\/th><th>Área \(m²\)<\/th><th>Logradouro<\/th>/);
  assert.doesNotMatch(map, /<th>Código<\/th>/);
  assert.match(map, /font:400 13px/);
  assert.match(map, /Residencial Jardim Moriá/);
  assert.match(map, /Inteligência Comercial • dados de disponibilidade/);
  assert.match(dashboard, /Vendas & Disponibilidade/);
  assert.match(dashboard, /Estoque atual e a evolução das movimentações\./);
  assert.doesNotMatch(dashboard, /Acompanhe o estoque atual/);
  for (const label of ['Cadastros', 'Carteira', 'Contratos', 'Disponíveis', 'Vendas', 'Cancelamentos', 'Incremento mensal']) assert.match(dashboard, new RegExp(label));
  assert.match(dashboard, /<small>Total<\/small>/);
  assert.match(dashboard, /Disponíveis \+ Contratos/);
  assert.match(dashboard, /Vendidos \+ Quitados/);
  assert.match(dashboard, /<p>Disponíveis<\/p><strong id="available">—<\/strong><small>Estoque<\/small>/);
  assert.doesNotMatch(dashboard, /Período aplicado ao histórico|Estoque sempre na situação atual/);
  assert.ok(dashboard.indexOf('id="message"') < dashboard.indexOf('class="heading"'));
  assert.ok(dashboard.indexOf('<h2>Movimentações por período</h2>') < dashboard.indexOf('class="filters"'));
  assert.ok(dashboard.indexOf('class="filters"') < dashboard.indexOf('Vendas registradas'));
  assert.ok(dashboard.indexOf('<p>Cancelamentos</p>') < dashboard.indexOf('<p>Disponíveis</p>'));
  assert.ok(dashboard.indexOf('<p>Disponíveis</p>') < dashboard.indexOf('<p>Incremento mensal</p>'));
  assert.match(dashboardScript, /maximumFractionDigits:\s*0/);
  assert.match(dashboardScript, /'Atualizado em '\s*\+\s*data\.updatedDate/);
  assert.doesNotMatch(dashboardScript, /Dados publicados • Atualizado em/);
  assert.doesNotMatch(dashboardScript, /current-growth[\s\S]{0,300}minimumFractionDigits/);
  assert.match(dashboard, /Residencial Jardim Moriá/);
  assert.match(dashboard, /Inteligência Comercial • dados de disponibilidade/);
  assert.match(dashboard, /<label>Intervalos<select id="interval">/);
  for (const label of ['Últimos 12 meses', 'Ano Atual', 'Ano Anterior']) assert.match(dashboard, new RegExp(label));
});
