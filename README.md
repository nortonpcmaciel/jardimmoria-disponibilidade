# Jardim Moriá — mapa de disponibilidade

Mapa qgis2web com administração dos 848 objetos, adaptado para GitHub Pages.

- Site: https://nortonpcmaciel.github.io/jardimmoria-disponibilidade/
- Administração: https://nortonpcmaciel.github.io/jardimmoria-disponibilidade/atualizar.html

## Como atualizar

1. Abra a administração e informe um token GitHub com acesso apenas a este repositório e permissão **Contents: Read and write**.
2. Clique em **Recarregar lista** para consultar os dados mais recentes do repositório.
3. Localize o objeto pela quadra/lote, selecione a situação e clique em **Salvar**.
4. Aguarde a publicação do GitHub Pages. O mapa aberto consulta a versão publicada a cada 10 segundos, mas a publicação pode levar alguns minutos.

O token permanece apenas na memória da aba, é enviado somente à API do GitHub e não é gravado no repositório nem no armazenamento do navegador. Não use sua senha GitHub neste campo.

## Publicação

Em **Settings > Pages**, configure **Deploy from a branch**, branch **main**, pasta **/(root)**. O arquivo `.nojekyll` permite publicar diretamente os arquivos da exportação. Não há instalação de dependências ou servidor a executar no Pages.

Os dados ficam em `data/situacoes.json`. Cada gravação cria um commit com histórico e atualiza SITUACAO, STATUS e a data. Não substitua esse arquivo pela versão inicial ao atualizar o código, pois ele contém as alterações publicadas.

Leia [ATUALIZACAO.md](ATUALIZACAO.md) para detalhes de administração e manutenção.

## Testes

Com Node.js 20 ou superior:

```sh
node --test tests/*.test.js
```

`server.js` e seu teste são mantidos como referência da implementação anterior. A interface atual usa o GitHub; a API local antiga não alimenta mais o mapa. Para conferir a interface localmente, use um servidor de arquivos HTTP. Não faça salvamentos de teste com o token de produção.
