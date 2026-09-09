'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../server');

test('salvamento compartilhado, autenticação, conflitos, data e persistência', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-test-'));
  const statePath = path.join(dir, 'situacoes.json');
  const token = 'senha-apenas-para-teste';
  let server, address;
  async function start() {
    server = createServer({ token, statePath, now: () => new Date('2026-09-10T01:30:00Z') });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    address = 'http://127.0.0.1:' + server.address().port;
  }
  async function close() { await new Promise(resolve => server.close(resolve)); }
  t.after(async () => { if (server.listening) await close(); fs.rmSync(dir, { recursive: true, force: true }); });
  await start();
  const get = () => fetch(address + '/api/situacoes').then(r => r.json());
  const save = (body, password = token) => fetch(address + '/api/situacoes', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + password }, body: JSON.stringify(body) });
  const initial = await get();
  assert.equal(initial.objects.length, 848);
  assert.equal(new Set(initial.objects.map(o => o.id)).size, 848);
  assert.equal(initial.updatedDate, '02/06/2026');
  const input = { id: '1', situacao: 'DISPONÍVEL', revision: 0 };
  assert.equal((await save(input, 'errada')).status, 401);
  assert.equal((await save({ ...input, situacao: 'INVALIDO' })).status, 400);
  assert.equal((await save(input)).status, 200);
  const changed = await get();
  assert.equal(changed.objects[0].SITUACAO, 'DISPONÍVEL');
  assert.equal(changed.objects[0].STATUS, 'D');
  assert.equal(changed.updatedDate, '09/09/2026');
  assert.equal(changed.revision, 1);
  assert.deepEqual(changed.objects[1], initial.objects[1]);
  assert.equal((await save({ ...input, situacao: 'QUITADO' })).status, 409);
  assert.equal((await save({ ...input, revision: 1 })).status, 200);
  assert.equal((await get()).revision, 1);
  // Objetos com QDLT repetido continuam independentes.
  const duplicates = changed.objects.filter(o => o.QDLT === '99-01');
  assert.ok(duplicates.length > 1);
  await save({ id: duplicates[0].id, situacao: 'BLOQUEADO', revision: 1 });
  const updated = await get();
  assert.equal(updated.objects.find(o => o.id === duplicates[1].id).SITUACAO, 'ÁREA VERDE');
  for (const file of ['/index.html', '/index2.html', '/atualizar.html', '/resources/atualizar.js', '/resources/situacoes-sync.js'])
    assert.equal((await fetch(address + file)).status, 200, file);
  for (const file of ['/server.js', '/private/situacoes.json', '/package.json'])
    assert.equal((await fetch(address + file)).status, 404, file);
  await close(); await start();
  assert.deepEqual(await get(), updated);
});
