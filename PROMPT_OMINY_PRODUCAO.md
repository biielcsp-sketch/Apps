# PROMPT — OMINY PRODUÇÃO: Versão Personalizada para Fábrica de Camisetas
> Cole este prompt numa nova conversa com o Claude e anexe o arquivo `ominy_sistema.html`

---

## CONTEXTO

Você receberá o arquivo `ominy_sistema.html` — sistema de gestão ERP/CRM completo chamado **Ominy**. Sua tarefa é criar uma **versão personalizada e exclusiva** chamada **Ominy Produção**, mantendo 100% da identidade visual do Ominy (cores, fontes, ícones SVG hi-tech, dark/light mode) mas substituindo os módulos atuais por um sistema de **controle de produção para fábrica de camisetas**.

---

## CHECKLIST OBRIGATÓRIA ANTES DE ESCREVER QUALQUER CÓDIGO

Confirme mentalmente cada item antes de começar:

1. Todos os módulos inativos foram ocultados (não removidos) e podem ser reativados via Configurações?
2. O DB é inicializado antes de qualquer tela ser renderizada?
3. Todos os cálculos automáticos (totais, produtividade, hora homem x máquina) são reativos — atualizam ao adicionar/editar registros?
4. A geração de PDF usa jsPDF via CDN carregado no `<head>`?
5. Os três tipos de relatório (diário, semanal, mensal) estão implementados e funcionando?
6. Todos os formulários validam campos obrigatórios antes de salvar?
7. Nenhum emoji foi usado — apenas SVG inline estilo hi-tech?
8. O dark/light mode aplica corretamente em todas as telas novas?
9. Os dados persistem em `localStorage` para não perder ao fechar o navegador?
10. Após escrever o código completo, reler integralmente e corrigir todos os erros antes de entregar?

---

## OBJETIVO

Transformar o `ominy_sistema.html` numa versão personalizada **Ominy Produção** com foco exclusivo em:
- Registro diário de produção por colaborador
- Controle de avarias
- Métricas de produtividade
- Hora homem x hora máquina
- Relatórios em PDF (diário, semanal, mensal)

---

## MÓDULOS ATIVOS (substituir os existentes)

### Sidebar — nova estrutura:
```
OMINY PRODUÇÃO
— PRODUÇÃO —
  ◉ Dashboard
  ⬡ Lançamento Diário
  ◈ Equipe
  ▦ Relatórios
— SISTEMA —
  ⚙ Configurações
  🔒 (módulos desativados — opcional)
```

---

### MÓDULO 1 — DASHBOARD (tela inicial)

**KPI Cards (linha superior — 4 cards):**
- **Produção Hoje:** total de camisetas produzidas no dia atual
- **Meta do Dia:** % de atingimento da meta diária (barra de progresso circular)
- **Avarias Hoje:** total de avarias + % sobre produção (vermelho se > 3%)
- **Eficiência Geral:** índice de produtividade médio da equipe hoje

**Gráfico central:**
- Barras agrupadas Chart.js — produção vs meta por colaborador no dia atual
- Cores: produção (azul `#2979FF`), meta (tracejado cinza), avarias (vermelho `#FF3D57`)

**Ranking do dia (tabela):**
- Posição, colaborador, produzido, avarias, eficiência %, hora homem, status badge
- Badge: "Acima da Meta" (verde) / "Na Meta" (azul) / "Abaixo da Meta" (amarelo) / "Crítico" (vermelho)

**Alertas automáticos:**
- Colaborador com avarias > 5% da produção → alerta vermelho
- Colaborador sem lançamento no dia → alerta amarelo
- Meta geral do dia atingida → alerta verde comemorativo

---

### MÓDULO 2 — LANÇAMENTO DIÁRIO

**Subtabs:** Registrar | Histórico | Editar Registro

**Registrar Produção:**

Formulário principal — lançar produção de cada colaborador:

```
Data: [date picker — padrão hoje]
Turno: [Manhã / Tarde / Noite]

Tabela de lançamento (uma linha por colaborador cadastrado):
┌─────────────────┬──────────┬─────────┬───────────┬───────────┬──────────┐
│ Colaborador     │ Produzido│ Avarias │ H. Início │ H. Fim    │ Máquinas │
├─────────────────┼──────────┼─────────┼───────────┼───────────┼──────────┤
│ [nome]          │ [input]  │ [input] │ [time]    │ [time]    │ [input]  │
└─────────────────┴──────────┴─────────┴───────────┴───────────┴──────────┘
```

- Campos numéricos com validação (não aceita negativo)
- Hora Fim - Hora Início = cálculo automático de Hora Homem
- Máquinas utilizadas × horas = Hora Máquina
- Total da linha calculado em tempo real: produzido líquido = produzido - avarias
- Linha com avarias > 5% fica com fundo vermelho translúcido como alerta visual

Rodapé do formulário:
```
Total Produzido: [soma automática]
Total Avarias:   [soma automática]  ([%] do total)
Total H. Homem:  [soma automática]
Total H. Máquina:[soma automática]
```

Botão "Salvar Lançamento" → valida → adiciona em `DB.producao[]` → registra log → Toast sucesso → atualiza Dashboard

**Histórico:**
- Filtros: data, colaborador, turno
- Tabela com todos os lançamentos — colunas: Data, Turno, Colaborador, Produzido, Avarias, %, H.Homem, H.Máquina, Ações (editar/excluir com Confirm())
- Paginação 15 por página

**Editar Registro:**
- Buscar lançamento por data + colaborador
- Formulário pré-preenchido para correção
- Salvar atualiza o DB e registra log de alteração

---

### MÓDULO 3 — EQUIPE

**Subtabs:** Colaboradores | Metas | Desempenho

**Colaboradores:**
- Grid de cards: foto placeholder circular, nome, função (Costureira/Cortador/Acabamento/etc.), turno padrão, meta diária (unidades), status (Ativo/Férias/Afastado)
- Botão "Novo Colaborador" → modal:
  - Nome completo
  - Função (select: Costureira, Cortador, Acabamento, Estamparia, Revisão, Embalagem)
  - Turno: Manhã / Tarde / Noite / Integral
  - Meta diária (unidades)
  - Data de admissão
  - Observações
- Clicar no card → painel lateral com:
  - Histórico dos últimos 30 dias (gráfico de linha produção diária)
  - Média de produção, melhor dia, pior dia
  - Taxa de avarias histórica
  - Eficiência geral

**Metas:**
- Tabela editável: colaborador, meta diária, meta semanal (auto: diária × 5), meta mensal (auto: diária × 22)
- Meta geral da fábrica (soma de todos)
- Botão "Definir Meta Global" → aplica o mesmo valor para todos

**Desempenho:**
- Período selecionável: última semana / último mês / trimestre
- Ranking geral com posição, nome, total produzido, total avarias, % eficiência, % atingimento de meta
- Gráfico de barras horizontais Chart.js: eficiência por colaborador
- Badge de destaque: "MVP do Período" para o melhor colaborador

---

### MÓDULO 4 — RELATÓRIOS

**Subtabs:** Diário | Semanal | Mensal

> Todos os relatórios usam **jsPDF** (`https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`) + **jsPDF-AutoTable** (`https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js`) para geração de PDF com tabelas formatadas.

**Layout padrão do PDF gerado:**

```
╔══════════════════════════════════════════════════════╗
║  [Logo Ominy]    OMINY PRODUÇÃO                      ║
║                  Relatório de Produção — [Tipo]      ║
║                  Período: [data/semana/mês]          ║
║                  Gerado em: [timestamp]              ║
╠══════════════════════════════════════════════════════╣
║  RESUMO EXECUTIVO                                    ║
║  Total Produzido: XXXX camisetas                     ║
║  Total Avarias:   XX (X.X%)                          ║
║  Eficiência Média: XX%                               ║
║  Hora Homem Total: XXh                               ║
║  Hora Máquina Total: XXh                             ║
║  Meta do Período: XXXX | Atingimento: XX%            ║
╠══════════════════════════════════════════════════════╣
║  PRODUÇÃO POR COLABORADOR                            ║
║  Nome | Produzido | Avarias | % Avaria | Efic. | HH ║
║  .... | ....      | ...     | ...      | ...   | .. ║
╠══════════════════════════════════════════════════════╣
║  ANÁLISE DE PRODUTIVIDADE                            ║
║  Melhor colaborador: [nome] — [X] unidades           ║
║  Maior avaria: [nome] — X.X%                         ║
║  Produção/hora: X.X unidades/hora                    ║
╠══════════════════════════════════════════════════════╣
║  Assinatura: _____________  Data: ___/___/___        ║
╚══════════════════════════════════════════════════════╝
```

**Relatório Diário:**
- Seletor de data
- Preview na tela antes de gerar PDF (renderizar o conteúdo do relatório em HTML estilizado)
- Botão "Baixar PDF" → gera `ominy_producao_diario_[DD-MM-AAAA].pdf`
- Botão "Compartilhar" → abre modal com opções: Copiar link / Baixar / Imprimir (`window.print()`)

**Relatório Semanal:**
- Seletor de semana (segunda a domingo)
- Gráfico de linha embutido no PDF: produção diária da semana
- Comparativo com semana anterior (% variação)
- Nome do arquivo: `ominy_producao_semanal_[semana]-[AAAA].pdf`

**Relatório Mensal:**
- Seletor de mês/ano
- Gráfico de barras: produção por semana do mês
- Ranking mensal completo de colaboradores
- Análise de tendência (crescimento ou queda vs mês anterior)
- Nome do arquivo: `ominy_producao_mensal_[MM-AAAA].pdf`

---

### MÓDULO 5 — CONFIGURAÇÕES

**Subtabs:** Empresa | Módulos | Metas Globais | Turno

**Empresa:**
- Nome da empresa cliente, CNPJ, responsável, logo (upload + preview)
- Esses dados aparecem no cabeçalho do PDF gerado

**Módulos (diferencial desta versão):**
- Lista de todos os módulos originais do Ominy (Vendas, Estoque, Financeiro, Clientes, RH, Metas, Segurança, Backup)
- Cada módulo com toggle "Ativar/Desativar"
- Por padrão: todos desativados, apenas os 4 módulos de produção ativos
- Ao ativar um módulo desativado: ele reaparece na sidebar imediatamente
- Mensagem informativa: "Esta é uma versão personalizada Ominy Produção. Os demais módulos estão disponíveis e podem ser ativados a qualquer momento."

**Metas Globais:**
- Meta diária da fábrica (total geral)
- % máximo de avarias tolerado (padrão 3%)
- Ao ultrapassar: gerar alerta automático no Dashboard

**Turno:**
- Configurar horários dos turnos:
  - Manhã: 06:00–14:00
  - Tarde: 14:00–22:00
  - Noite: 22:00–06:00
- Carga horária por turno (calculada automaticamente)

---

## MÉTRICAS DE PRODUTIVIDADE SUGERIDAS

Implementar e calcular automaticamente para cada colaborador:

```
1. EFICIÊNCIA (%)
   = (Produzido Líquido / Meta Diária) × 100
   Exibir: verde ≥ 100% / azul 80–99% / amarelo 60–79% / vermelho < 60%

2. TAXA DE AVARIAS (%)
   = (Avarias / Produzido Bruto) × 100
   Tolerância padrão: ≤ 3% — acima disso gera alerta

3. PRODUTIVIDADE HORA HOMEM
   = Produzido Líquido / Horas Trabalhadas
   Resultado em: unidades/hora

4. PRODUTIVIDADE HORA MÁQUINA
   = Produzido Líquido / (Máquinas × Horas)
   Resultado em: unidades/hora-máquina

5. ÍNDICE DE QUALIDADE (%)
   = ((Produzido - Avarias) / Produzido) × 100
   Meta: ≥ 97%

6. OEE SIMPLIFICADO (Overall Equipment Effectiveness)
   = Eficiência × Índice de Qualidade / 100
   Benchmark para fábrica de camisetas: OEE ideal ≥ 75%

7. CONSISTÊNCIA (últimos 30 dias)
   = Desvio padrão da produção diária
   Baixo desvio = colaborador consistente (badge "Consistente")

8. TENDÊNCIA
   = Comparar média últimos 7 dias vs 7 dias anteriores
   Badge: "Em evolução" ↑ / "Estável" → / "Em queda" ↓
```

---

## BANCO DE DADOS LOCAL

```javascript
DB.colaboradores[]  — cadastro da equipe
DB.producao[]       — todos os lançamentos diários
DB.metas{}          — metas por colaborador e globais
DB.config{}         — configurações da empresa e módulos
DB.logs[]           — auditoria de ações
DB.sessao{}         — sessão ativa

// Estrutura de cada registro em DB.producao[]:
{
  id, data, turno, colaborador_id, colaborador_nome,
  produzido_bruto, avarias, produzido_liquido,
  hora_inicio, hora_fim, horas_trabalhadas,
  maquinas_utilizadas, hora_maquina,
  eficiencia, taxa_avaria, produtividade_hh, produtividade_hm,
  created_at, updated_at
}
```

**Persistência:** usar `localStorage` para salvar `DB` a cada alteração — dados não se perdem ao fechar o navegador.

```javascript
// Salvar
localStorage.setItem('ominy_producao_db', JSON.stringify(DB));

// Carregar na inicialização
const saved = localStorage.getItem('ominy_producao_db');
if (saved) Object.assign(DB, JSON.parse(saved));
```

**Dados de exemplo pré-populados:**
- 6 colaboradores cadastrados com funções variadas
- 15 dias de histórico de produção com dados realistas
- Metas individuais já definidas

---

## COMPONENTES GLOBAIS

```javascript
Modal(titulo, htmlConteudo)     // overlay + slide-down + X + ESC
Toast(mensagem, tipo)           // sucesso/erro/aviso/info — auto-fecha 3s
Confirm(mensagem, callback)     // obrigatório antes de excluir
Badge(texto, cor)               // reutilizável
EmptyState(icone, titulo, desc) // quando não há dados
calcularMetricas(registro)      // calcula todas as 8 métricas automaticamente
salvarDB()                      // persiste no localStorage
gerarPDF(tipo, periodo)         // diário/semanal/mensal
```

---

## QUALIDADE TÉCNICA

**CDNs no `<head>` (nesta ordem):**
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
```

- **Zero emojis** — 100% SVG inline estilo hi-tech/circuito
- Dark/light mode via toggle com variáveis CSS (manter do sistema original)
- Identidade visual Ominy 100% preservada: `#2979FF`, `#0D0D12`, `#1C1C27`, Outfit font
- Responsivo: sidebar overlay em mobile < 768px
- Código organizado em seções comentadas:
  ```
  // ======= ESTILOS CSS =======
  // ======= BANCO DE DADOS =======
  // ======= CÁLCULO DE MÉTRICAS =======
  // ======= COMPONENTES GLOBAIS =======
  // ======= GERAÇÃO DE PDF =======
  // ======= TELA: DASHBOARD =======
  // ======= TELA: LANÇAMENTO =======
  // ======= TELA: EQUIPE =======
  // ======= TELA: RELATÓRIOS =======
  // ======= TELA: CONFIGURAÇÕES =======
  // ======= INICIALIZAÇÃO =======
  ```
- Após finalizar: **reler o arquivo completo, corrigir todos os erros e entregar**

---

## ENTREGÁVEL

Um único arquivo `ominy_producao.html` — completo, funcional, sem erros, pronto para abrir no navegador e usar imediatamente pelo cliente da fábrica de camisetas.
