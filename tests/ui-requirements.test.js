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
  assert.match(html, /Inteligência comercial • dados do quadro de disponibilidade/);
});

test('Quadro e Dashboard incluem títulos, tabela, rodapés e intervalos solicitados', () => {
  const map = read('index.html'), dashboard = read('dashboard.html');
  assert.match(map, /Quadro de Disponibilidade/);
  assert.match(map, /id="lotes-disponiveis"/);
  assert.match(map, /font:400 13px/);
  assert.match(map, /Inteligência comercial • dados do quadro de disponibilidade/);
  assert.match(dashboard, /Vendas & Disponibilidade/);
  assert.match(dashboard, /<label>Intervalos<select id="interval">/);
  for (const label of ['Últimos 12 meses', 'Ano Atual', 'Ano Anterior']) assert.match(dashboard, new RegExp(label));
});
