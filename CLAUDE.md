# SutoData — Diretrizes do projeto

## Regra fixa: bilíngue Português + Mandarim (中文)

Todo texto visível ao usuário no `index.html` — títulos de página, nomes de
aba/sub-aba, rótulos de campo, cabeçalhos de tabela, botões, badges de status,
mensagens de toast, estados vazios — deve ter uma legenda em mandarim logo
abaixo, no mesmo padrão já usado em todo o app. Isso vale para QUALQUER painel,
aba ou texto novo, sem exceção.

### Mecanismo (já implementado — não recriar)

- `const I18N_ZH = {...}`, perto do fim do `index.html`: dicionário que mapeia
  o texto em português (exatamente como aparece na tela, já com `.trim()`)
  para o texto em chinês correspondente.
- Uma IIFE logo abaixo do dicionário registra um `MutationObserver` que
  observa `document.body` e, de forma debounced, roda `aplicarBilingue()`.
  Essa função usa um `TreeWalker` para achar todo nó de texto cujo valor
  (trimado) bata com uma chave do dicionário, e insere um
  `<span class="zh-sub">` logo abaixo com a tradução (para `<option>`, que não
  aceita `<span>` filho, concatena `" / " + zh` no próprio texto).
- **Basta adicionar a entrada no dicionário.** Nenhuma outra mudança de código
  é necessária — a tradução passa a aparecer automaticamente em qualquer tela
  que use aquele texto, presente ou futura.

### Limitação conhecida (aceita — não tentar contornar)

O casamento é por texto **exato**. Um texto com valor dinâmico interpolado na
mesma string (contador, nome de pessoa, percentual, etc. — ex.:
`` `Mostrar desligados (${n})` ``) não pode ser traduzido por esse mecanismo,
porque o texto muda a cada render e nunca bate com uma chave fixa. Isso é uma
limitação estrutural do dicionário por igualdade exata, não uma regressão.
Ao criar uma tela nova, quando for viável, prefira manter o rótulo estático
em um nó de texto e o valor dinâmico em outro (ex.: `<span>Rótulo</span>
<b>${valor}</b>` em vez de uma única string interpolada), para que o rótulo
em si continue traduzível.

### Checklist ao adicionar/alterar UI

Toda vez que um texto novo for adicionado à interface (nova aba, novo botão,
novo cabeçalho de tabela, nova mensagem de estado vazio, novo toast estático),
adicione a tradução correspondente em `I18N_ZH` **na mesma tarefa** — não
deixar como pendência para depois. Se o texto já existir como chave (mesmo
vindo de outra tela), reaproveite a mesma chave/tradução em vez de duplicar
com redação ligeiramente diferente.
