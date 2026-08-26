# Café com Deus Shine — Diretrizes do projeto

> Este `CLAUDE.md` vale **apenas para o que está dentro de `/cafe-com-deus-shine`**. O
> restante do repositório (`Apps`) contém um app não relacionado (SutoData) com suas
> próprias regras — não misture as duas coisas.

Você vai construir o sistema "Café com Deus Shine" em Next.js (App Router) + TypeScript +
Supabase (Postgres + Auth + RLS). O documento `arquitetura-tecnica-cafe-com-deus-shine.md`,
nesta mesma pasta, é a fonte de verdade de schema, permissões e estrutura de pastas — leia
ele por completo antes de qualquer ação e siga-o literalmente, sem improvisar estrutura
alternativa. `cafe-com-deus-shine-especificacao-mvp.md` é a especificação de produto original.

## Projeto Supabase

- Projeto dedicado: `cafe-com-deus-shine` (ref `gqwobpovsdjrzwqnsunt`, org
  `doqapnutnficekukcxrv`, região `us-east-1`), plano gratuito.
- **Não é** o mesmo projeto do "GC Manager - Lagoinha Alphaville" (ref
  `kacglxgdlmcaziirdsvd`) — aquele é um sistema diferente, em produção, de outra base de
  usuários. Ele só serve como referência de lógica de negócio (regra de rotação, cálculo de
  ausência consecutiva), nunca como banco a escrever.
- Recuperação de senha usa o e-mail padrão embutido do Supabase Auth (decisão do usuário —
  sem SMTP customizado no MVP).
- Convite de líder usa `supabase.auth.admin.inviteUserByEmail` via `SUPABASE_SERVICE_ROLE_KEY`
  (server-only, nunca no cliente) — ver `lib/supabase/admin.ts`.

## Decisões travadas (não reabra estas discussões, não peça confirmação sobre elas)
- Projeto é single-tenant: uma comunidade só, sem isolamento multi-igreja.
- Motor de distribuição usa os 5 critérios do item 7 da especificação original, como score
  ponderado (pesos decrescentes somados, não prioridade lexicográfica estrita), com pesos
  configuráveis em `app_config.distribution_weights`. Detalhamento completo na seção 5 do
  `arquitetura-tecnica-cafe-com-deus-shine.md` — siga a fórmula exatamente como descrita lá,
  não invente pesos ou fórmula alternativa.
- Acompanhamento pastoral (`follow_ups.observation`): visível apenas para a própria líder
  responsável (atual ou histórica, via `participant_leader_history`) e para admin. Sem
  camada extra de restrição por tipo no MVP.
- "Exclusão de dados" (LGPD) = anonimização, não exclusão física de linha. Nunca implemente
  DELETE de `participants`, `attendance`, `follow_ups` ou `meetings` como resposta a pedido
  de exclusão — use sempre a função de anonimização descrita na seção 5 do documento de
  arquitetura.
- Todo cadastro de participante exige `consent_accepted_at` preenchido antes de salvar. Isso
  é validação de aplicação (bloqueia o submit), não apenas constraint de banco.
- Toda regra de autorização vive em Row Level Security no Postgres. Checagem de papel no
  frontend é só UX (esconder botão) — nunca é a barreira de segurança real.
- Nenhum componente de página do Next.js chama o Supabase diretamente. Toda leitura/escrita
  passa por funções em `/lib/services`.

## Cuidado com o scaffold do Next.js
`next dev`/`next build` re-escreve `AGENTS.md` automaticamente (bloco entre marcadores) e,
se `AGENTS.md` não existir ou não tiver o bloco, também sobrescreve este `CLAUDE.md` para
`@AGENTS.md`. Como `AGENTS.md` já existe e hospeda o bloco, isso não deve mais acontecer —
mas se este arquivo algum dia virar `@AGENTS.md` sozinho, restaure este conteúdo a partir do
histórico do git, não aceite a versão gerada.

## Regras gerais para todas as fases
- Você NUNCA implementa uma fase inteira sem que o usuário tenha aprovado a fase anterior.
- Faça apenas as alterações pedidas no prompt da fase atual. Não adicione funcionalidade,
  não refatore código fora do escopo da fase, não "aproveite para melhorar" algo não pedido.
- Nunca instale dependências que não estejam listadas explicitamente no prompt da fase.
- Nunca rode migrations destrutivas (DROP, TRUNCATE, DELETE em massa) sem mostrar o SQL
  antes e esperar aprovação explícita.
- Nunca faça commit ou push para git sem o usuário pedir.
- Ao final de cada fase, liste todos os arquivos criados/alterados e um resumo do que cada
  um faz — não assuma que o usuário vai ler o diff inteiro sem esse resumo.
- Se encontrar qualquer contradição entre este documento e a arquitetura técnica, pare e
  pergunte antes de decidir sozinho qual prevalece.
