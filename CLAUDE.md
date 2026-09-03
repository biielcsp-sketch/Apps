# SutoData — Diretrizes do projeto

## Regra fixa: três idiomas (Português / English / 中文)

O sistema tem três versões de idioma, e o usuário escolhe a dele pelo seletor
de bandeira (cabeçalho e tela de login). Isso vale para TODAS as telas,
inclusive o painel executivo do perfil proprietária (总经理). Todo texto
visível no `index.html` —
títulos de página, nomes de aba/sub-aba, rótulos de campo, cabeçalhos de
tabela, botões, badges de status, mensagens de estado vazio, placeholders —
precisa existir nos três idiomas. Isso vale para QUALQUER painel, aba ou texto
novo, sem exceção.

O código-fonte continua sendo escrito **em português**: o português é a chave
do dicionário, e as outras duas versões são traduções dessa chave.

### Mecanismo (já implementado — não recriar)

- `const I18N = {...}`, perto do fim do `index.html`: dicionário no formato
  `'texto em português': {en:'...', zh:'...'}`. A chave é o texto exatamente
  como aparece na tela, já com `.trim()`.
- Uma IIFE logo abaixo registra um `MutationObserver` que, de forma debounced,
  roda `aplicarIdioma()`. Ela usa um `TreeWalker` para achar os nós de texto
  que batem com uma chave e **troca** o texto pelo idioma ativo (não é
  legenda). O português original fica guardado no próprio nó (`__i18nPt`), o
  que permite alternar de idioma quantas vezes quiser sem perder o texto-fonte.
- Também traduz os atributos `placeholder` e `title` (guardados em
  `data-i18n-placeholder` / `data-i18n-title`).
- **Basta adicionar a entrada no dicionário.** Nenhuma outra mudança de código
  é necessária — a tradução passa a valer automaticamente em qualquer tela que
  use aquele texto, presente ou futura.
- Onde o `TreeWalker` não alcança, use o helper `T('texto em português')`, que
  devolve a string já no idioma ativo (usado, por exemplo, nos rótulos do PDF
  via `bz()`).
- Datas e números seguem o idioma via `localeAtual()`. No PDF use `localePDF()`:
  o jsPDF aqui só tem fonte latina, então em 中文 o PDF cai para inglês —
  caracteres CJK sairiam em branco no arquivo.

### O que fica FORA da tradução

- Qualquer elemento marcado com `data-no-i18n` (e seus filhos).
- Dados do usuário: nomes de pessoas, textos de tarefa/feedback/ideia, logins.
  Como o casamento é por igualdade exata com uma chave do dicionário, esses
  valores naturalmente nunca são traduzidos.

### `<option>` sempre com `value=` explícito

Como o motor **troca** o texto do `<option>`, um `<option>` sem `value=`
explícito teria seu valor corrompido junto com o texto (o `.value` de um
`<option>` sem atributo é o próprio `textContent`). Portanto: todo `<option>`
gerado no app precisa de `value="..."`, sem exceção.

### Limitação conhecida (aceita — não tentar contornar)

O casamento é por texto **exato**. Um texto com valor dinâmico interpolado na
mesma string (contador, nome de pessoa, percentual, etc. — ex.:
`` `Mostrar desligados (${n})` ``) não pode ser traduzido, porque o texto muda
a cada render e nunca bate com uma chave fixa. Isso é uma limitação estrutural
do dicionário por igualdade exata, não uma regressão.

Ao criar ou alterar uma tela, mantenha o rótulo estático em um nó de texto e o
valor dinâmico em outro — `<span>Rótulo</span> <b>${valor}</b>` em vez de uma
única string interpolada — para que o rótulo continue traduzível.

### Checklist ao adicionar/alterar UI

Toda vez que um texto novo for adicionado à interface (nova aba, novo botão,
novo cabeçalho de tabela, nova mensagem de estado vazio, novo placeholder),
adicione a entrada correspondente em `I18N` com **`en` e `zh` preenchidos** na
mesma tarefa — não deixar como pendência. Se o texto já existir como chave
(mesmo vindo de outra tela), reaproveite a mesma chave em vez de duplicar com
redação ligeiramente diferente.

## Idioma do usuário

A escolha fica salva no perfil (`profiles.idioma`, valores `pt` | `en` | `zh`),
gravada pelo RPC `rpc_user_set_idioma` e devolvida pelo `rpc_login` — então o
idioma acompanha a pessoa em qualquer aparelho. O `localStorage`
(`sutodata-idioma`) guarda a escolha local, usada antes do login e como cache.

## Fechamento mensal

O fechamento é **apenas manual**, pelo botão "Fechar período do mês" (Gestão de
Pessoas → Desempenho). Não existe mais fechamento automático: a rotina agendada
`fechamento-mensal-automatico` foi removida do banco a pedido da cliente. Um
mês fechado bloqueia lançamentos retroativos até ser reaberto pelo botão
"Reabrir", que exige motivo e fica registrado em log.
