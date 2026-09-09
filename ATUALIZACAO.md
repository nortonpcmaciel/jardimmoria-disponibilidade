# Atualização online — GitHub Pages

## Configuração deste projeto

Repositório: `nortonpcmaciel/jardimmoria-disponibilidade`, branch `main`, publicação a partir da raiz. A configuração pública fica em `resources/github-config.js`; ela não contém credenciais.

O mapa usa a exportação original para geometria e os dados publicados em `data/situacoes.json` para SITUACAO e STATUS. O rodapé de `index.html` exibe a data registrada nesse mesmo arquivo, no formato **ATUALIZADO EM DD/MM/AAAA**.

## Acesso de edição

Na sua conta GitHub, abra **Settings > Developer settings > Personal access tokens > Fine-grained tokens**. Crie um token com prazo de expiração, selecione apenas `jardimmoria-disponibilidade` e conceda **Repository permissions > Contents > Read and write**. A criação do token é feita pelo próprio administrador no GitHub. Não envie o token em mensagens, não o coloque em arquivos e não o compartilhe com visitantes.

Na página `atualizar.html`, informe esse token e clique em **Recarregar lista**. O token fica somente na aba e desaparece ao fechá-la ou recarregar a página. Tokens expirados ou sem permissão são recusados pelo GitHub.

## Salvamento e publicação

Ao salvar, a página consulta a versão mais recente diretamente no GitHub, verifica conflitos e grava o arquivo inteiro usando a identificação da versão anterior. As alterações de outros administradores não são sobrescritas silenciosamente. Se aparecer conflito, recarregue a lista, confira a situação e tente novamente.

Cada alteração efetiva cria um commit. A data é calculada no fuso de São Paulo usando o relógio do computador do administrador; mantenha-o correto. Selecionar a mesma situação não altera a data. O GitHub Pages publica o commit de forma assíncrona: pode levar alguns minutos. Depois da publicação, as páginas abertas consultam os dados a cada 10 segundos. A gravação confirmada no GitHub não significa que a publicação do Pages já terminou; confira a execução em **Actions** se houver demora ou falha.

São mantidas as situações da exportação: ÁREA VERDE, BLOQUEADO, CASAS POPULARES, DISPONÍVEL, QUITADO e VENDIDO. O STATUS é ajustado junto com SITUACAO para manter a cor coerente.

## Códigos repetidos e nova exportação

Os 848 objetos têm identificadores individuais correspondentes à ordem da camada, pois há códigos QDLT repetidos. A assinatura `dataset` identifica a exportação. Não reordene ou substitua a camada sem migrar os dados e conferir a correspondência de cada objeto. Preserve `data/situacoes.json` ao publicar ajustes de código.

## Histórico e manutenção

O GitHub mantém o histórico de alterações de `data/situacoes.json`. A pasta `private/` pertence ao serviço Node.js anterior e não é utilizada no Pages. Os arquivos `server.js` e seu teste continuam no projeto apenas como referência; a administração atual usa a API GitHub.

O arquivo de dados é público, como o mapa. As credenciais nunca devem fazer parte dele. Para desenvolvimento, execute os testes com `node --test tests/*.test.js`; eles não acessam nem modificam o repositório online.
