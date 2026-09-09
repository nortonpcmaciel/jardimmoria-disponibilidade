const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createStore } = require('../resources/github-store');
const original = JSON.parse(fs.readFileSync('data/situacoes.json', 'utf8'));
test('GitHub Pages: leitura pública, escrita autenticada, acentos e conflitos', async () => {
  let stored = structuredClone(original), sha = 'original', writes = 0;
  const baseRevision = original.revision;
  const baseHistoryLength = (original.history || []).length;
  const store = createStore({ owner: 'teste', repo: 'mapa', branch: 'main', path: 'data/situacoes.json' }, async (url, init) => {
    if (!url.startsWith('https://api.github.com/')) {
      assert.equal(init.headers, undefined);
      return { ok: true, json: async () => structuredClone(stored) };
    }
    assert.equal(init.headers.Authorization, 'Bearer teste-token');
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body);
      assert.equal(body.sha, sha);
      assert.equal(body.branch, 'main');
      stored = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
      assert.equal(stored.fileSha, undefined);
      sha = 'alterado'; writes++;
      return { ok: true, json: async () => ({ content: { sha } }) };
    }
    return { ok: true, json: async () => ({ sha, content: Buffer.from(JSON.stringify(stored)).toString('base64') }) };
  });
  const publicData = await store.loadPublic();
  assert.equal(publicData.objects.length, 848);
  await assert.rejects(store.save({ id: '1', situacao: 'DISPONÍVEL', revision: baseRevision }, '', original.dataset), /token/);
  const updated = await store.save({ id: '1', situacao: 'DISPONÍVEL', revision: baseRevision }, 'teste-token', original.dataset);
  assert.equal(updated.objects[0].SITUACAO, 'DISPONÍVEL');
  assert.equal(updated.objects[0].STATUS, 'D');
  assert.equal(updated.revision, baseRevision + 1);
  assert.equal(updated.history.length, baseHistoryLength + 1);
  const event = updated.history.at(-1);
  assert.equal(event.from, original.objects[0].SITUACAO);
  assert.equal(event.to, 'DISPONÍVEL');
  assert.equal(event.objectId, '1');
  assert.equal(updated.historyStartedAt, original.historyStartedAt || event.at);
  assert.equal(updated.objects[0].updatedAt, event.at);
  assert.equal(updated.updatedDate, new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  assert.deepEqual(updated.objects[1], original.objects[1]);
  await assert.rejects(store.save({ id: '2', situacao: 'QUITADO', revision: baseRevision }, 'teste-token', original.dataset), /Outro usuário/);
  await assert.rejects(store.save({ id: '2', situacao: 'QUITADO', revision: baseRevision + 1 }, 'teste-token', 'outra-camada'), /camada/);
  await assert.rejects(store.save({ id: '2', situacao: 'INVALIDA', revision: baseRevision + 1 }, 'teste-token', original.dataset), /inválidos/);
  await store.save({ id: '1', situacao: 'DISPONÍVEL', revision: baseRevision + 1 }, 'teste-token', original.dataset);
  assert.equal(writes, 1);
  const resold = await store.save({ id: '1', situacao: 'VENDIDO', revision: baseRevision + 1 }, 'teste-token', original.dataset);
  assert.equal(resold.history.length, baseHistoryLength + 2);
  assert.deepEqual(resold.history.slice(0, -1), updated.history);
  assert.equal(resold.historyStartedAt, updated.historyStartedAt);
  assert.equal((await store.loadAdmin('teste-token')).fileSha, 'alterado');
  const concurrent = createStore({ owner: 'teste', repo: 'mapa', branch: 'main', path: 'data/situacoes.json' }, async (_, init) =>
    init.method === 'PUT' ? { ok: false, status: 409 } : { ok: true, json: async () => ({ sha, content: Buffer.from(JSON.stringify(stored)).toString('base64') }) });
  await assert.rejects(concurrent.save({ id: '1', situacao: 'QUITADO', revision: baseRevision + 2 }, 'teste-token', original.dataset), /Outro usuário/);
});
