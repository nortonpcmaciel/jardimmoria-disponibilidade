(function (root) {
  'use strict';
  function createStore(config, fetcher, now = () => new Date()) {
    const endpoint = 'https://api.github.com/repos/' + encodeURIComponent(config.owner) + '/' +
      encodeURIComponent(config.repo) + '/contents/' + config.path.split('/').map(encodeURIComponent).join('/');
    function validate(data) {
      if (!data || !Number.isSafeInteger(data.revision) || data.revision < 0 ||
          typeof data.dataset !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(data.updatedDate) ||
          !Array.isArray(data.objects) || !data.options || typeof data.options !== 'object')
        throw new Error('Arquivo de situações inválido. Confira a publicação no GitHub.');
      return data;
    }
    function headers(token) {
      return { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28' };
    }
    async function api(token, init) {
      if (!token) throw new Error('Informe o token de edição do GitHub.');
      const response = await fetcher(endpoint + '?ref=' + encodeURIComponent(config.branch), {
        cache: 'no-store', ...init, headers: { ...headers(token), ...(init && init.headers) }
      });
      if (!response.ok) {
        const messages = {
          401: 'Token inválido ou expirado. Informe um token de edição válido.',
          403: 'Acesso negado ou limite de consultas atingido. Confira a permissão Contents: Read and write e tente novamente.',
          404: 'Arquivo ou repositório não encontrado. Confira o acesso do token e a publicação inicial.',
          409: 'Outro usuário alterou os dados. Recarregue a lista, confira e salve novamente.',
          422: 'O GitHub recusou a gravação. Confira as permissões e regras do repositório.'
        };
        throw new Error(messages[response.status] || 'Não foi possível acessar o GitHub. Tente novamente.');
      }
      return response.json();
    }
    async function loadAdmin(token) {
      if (!token) return loadPublic();
      const file = await api(token);
      const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')), c => c.charCodeAt(0));
      return { ...validate(JSON.parse(new TextDecoder().decode(bytes))), fileSha: file.sha };
    }
    async function loadPublic() {
      const response = await fetcher(config.path + '?v=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível carregar as situações publicadas. Tente novamente.');
      return validate(await response.json());
    }
    async function save(input, token, expectedDataset) {
      const current = await loadAdmin(token);
      if (!token) throw new Error('Informe o token de edição do GitHub.');
      if (current.dataset !== expectedDataset) throw new Error('A camada do mapa mudou. Reabra a página antes de editar.');
      if (current.revision !== input.revision)
        throw new Error('Outro usuário alterou os dados ou a publicação está pendente. Recarregue a lista, confira e salve novamente.');
      const item = current.objects.find(o => o.id === input.id);
      if (!item || !Object.hasOwn(current.options, input.situacao)) throw new Error('Objeto ou situação inválidos.');
      if (item.SITUACAO === input.situacao) return current;
      const { fileSha, ...next } = current;
      const timestamp = now().toISOString();
      next.historyStartedAt = current.historyStartedAt || timestamp;
      next.history = [...(current.history || []), {
        revision: current.revision + 1, objectId: item.id, QDLT: item.QDLT,
        QUADRA: item.QUADRA, LOTE: item.LOTE,
        from: item.SITUACAO, to: input.situacao, at: timestamp
      }];
      next.objects = current.objects.map(o => o.id === input.id ? {
        ...o, SITUACAO: input.situacao, STATUS: current.options[input.situacao], updatedAt: timestamp
      } : o);
      next.revision += 1;
      next.updatedDate = new Date(timestamp).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const bytes = new TextEncoder().encode(JSON.stringify(next, null, 2) + '\n');
      let binary = '';
      bytes.forEach(byte => { binary += String.fromCharCode(byte); });
      const saved = await api(token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        message: 'Atualiza situação do objeto ' + item.id + ' (' + item.QDLT + ')',
        content: btoa(binary), sha: fileSha, branch: config.branch
      }) });
      return { ...next, fileSha: saved.content.sha };
    }
    return { loadPublic, loadAdmin, save };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createStore };
  else root.MoriaStore = createStore(root.MORIA_GITHUB, root.fetch.bind(root));
}(typeof window !== 'undefined' ? window : globalThis));
