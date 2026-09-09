'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = __dirname;
const raw = fs.readFileSync(path.join(ROOT, 'layers/JARDIMMORI_1.js'), 'utf8');
const base = JSON.parse(raw.slice(raw.indexOf('{')).trim().replace(/;$/, '')).features;
const dataset = crypto.createHash('sha256').update(raw).digest('hex');
const options = Object.fromEntries(base.map(f => [f.properties.SITUACAO, f.properties.STATUS]));

function createServer({ token, statePath = path.join(ROOT, 'private/situacoes.json'), now = () => new Date() } = {}) {
  if (!token || token.length < 16) throw new Error('Defina MAPA_ADMIN_TOKEN com pelo menos 16 caracteres.');
  let state = { dataset, revision: 0, updatedDate: '02/06/2026', changes: {} };
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.dataset !== dataset) throw new Error('A camada mudou. Migre os dados salvos antes de iniciar o servidor.');
  }
  const snapshot = () => ({ dataset, revision: state.revision, updatedDate: state.updatedDate, options,
    objects: base.map((f, i) => ({ ...f.properties, id: String(i + 1),
      ...(state.changes[String(i + 1)] || {}) })) });
  const reply = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/situacoes') {
        if (req.method === 'GET') return reply(res, 200, snapshot());
        if (req.method !== 'POST') return reply(res, 405, { error: 'Método não permitido.' });
        const supplied = Buffer.from(req.headers.authorization || '');
        const expected = Buffer.from('Bearer ' + token);
        if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected))
          return reply(res, 401, { error: 'Senha de administração inválida.' });
        if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host && req.headers.origin !== 'https://' + req.headers.host)
          return reply(res, 403, { error: 'Origem não permitida.' });
        if (!(req.headers['content-type'] || '').startsWith('application/json'))
          return reply(res, 415, { error: 'Envie dados JSON.' });
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 4096) return reply(res, 413, { error: 'Requisição muito grande.' });
        }
        let input;
        try { input = JSON.parse(body); } catch { return reply(res, 400, { error: 'JSON inválido.' }); }
        if (!input || typeof input !== 'object') return reply(res, 400, { error: 'Dados inválidos.' });
        const { id, situacao, revision } = input;
        if (!/^\d+$/.test(id) || !base[Number(id) - 1] || String(Number(id)) !== id || !Object.hasOwn(options, situacao))
          return reply(res, 400, { error: 'Objeto ou situação inválidos.' });
        if (revision !== state.revision) return reply(res, 409, { error: 'Os dados foram alterados por outro usuário. Recarregue a lista e confira antes de salvar.' });
        const current = state.changes[id] || base[Number(id) - 1].properties;
        if (current.SITUACAO === situacao) return reply(res, 200, snapshot());
        const next = { ...state, revision: state.revision + 1,
          updatedDate: now().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
          changes: { ...state.changes, [id]: { SITUACAO: situacao, STATUS: options[situacao] } } };
        fs.mkdirSync(path.dirname(statePath), { recursive: true });
        fs.writeFileSync(statePath + '.tmp', JSON.stringify(next, null, 2), { mode: 0o600 });
        fs.renameSync(statePath + '.tmp', statePath);
        state = next;
        return reply(res, 200, snapshot());
      }
      if (!['GET', 'HEAD'].includes(req.method)) return reply(res, 405, { error: 'Método não permitido.' });
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      if (!/^\/(index.html|index2.html|atualizar.html|data\/situacoes.json|(?:resources|layers|styles|images|webfonts)\/[\w./ -]+)$/.test(pathname) || pathname.split('/').includes('..'))
        return reply(res, 404, { error: 'Página não encontrada.' });
      const file = path.join(ROOT, pathname);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return reply(res, 404, { error: 'Arquivo não encontrado.' });
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    } catch (error) {
      console.error(error.message);
      reply(res, 500, { error: 'Não foi possível salvar ou carregar os dados. Tente novamente.' });
    }
  });
}
if (require.main === module) {
  createServer({ token: process.env.MAPA_ADMIN_TOKEN }).listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => {
    console.log('Mapa: http://localhost:' + (process.env.PORT || 3000) + '/index.html');
    console.log('Administração: /atualizar.html');
  });
}
module.exports = { createServer };
