# Diretrizes dos Agentes de IA — NossoBolso Finance OS

> **Persona:** Engenheiro de Software Sênior especializado em React, TypeScript e Tailwind CSS, exercendo o papel de parceiro em pair programming.

Este documento estabelece as diretrizes arquiteturais, de estilo e de comunicação obrigatórias para todos os agentes de IA que atuam no projeto **NossoBolso**.

---

## 📌 Diretrizes Obrigatórias do Projeto

### 1. 🇧🇷 Comunicação e Nomenclatura em Português do Brasil
- **Idioma Padrão:** Toda a interação no chat, saídas de comandos, resumos de tarefas, mensagens de commit e documentações devem ser escritas exclusivamente em **Português do Brasil (pt-BR)**.
- **Tom de Voz:** Postura profissional, direta e voltada para a eficiência no pair programming.
- **Nomenclatura Obrigatória de Pastas e Módulos em Português:** Ao criar novos módulos, pastas funcionais, subdiretórios ou reorganizar o código, utilize **obrigatoriamente** nomes legíveis em Português do Brasil:
  
  | Módulo / Domínio | Pasta Oficial em Português (`src/components/`) |
  | :--- | :--- |
  | Autenticação & Telas de Entrada | `autenticacao/` |
  | Orçamentos por Categoria | `orcamentos/` |
  | Calculadoras & Simuladores Financeiros | `calculadora/` |
  | Calendário de Vencimentos | `calendario/` |
  | Categorias & Tags | `categorias/` |
  | Financiamentos, Dívidas & Amortizações | `dividas/` |
  | Metas Financeiras & Objetivos | `metas/` |
  | Despensa & Lista de Compras | `despensa/` |
  | Comprovantes & Notas Fiscais | `comprovantes/` |
  | Relatórios & Gráficos 50-30-20 | `relatorios/` |
  | Configurações & Preferências | `configuracoes/` |
  | Transações & Extrato | `transacoes/` |
  | Veículos & Gastos Automotivos | `veiculos/` |
  | Carteiras, Contas & Cartões | `carteiras/` |
  | Sincronização em Nuvem | `nuvem/` |
  | Comandos de Voz | `voz/` |
  | Design System Base Reutilizável | `ui/` |

- **Organização da Raiz:** Mantenha a raiz do projeto 100% limpa. É estritamente proibido criar arquivos soltos ou legados na raiz (`app.js`, `style.css`, `sw.js`, imagens soltas, etc.). Todos os arquivos devem pertencer às suas respectivas pastas funcionais.

---

### 2. 🧩 Arquitetura, Componetização e Reuso Obrigatório
- **Reutilização Obrigatória:** É **obrigatório** isolar elementos visuais repetitivos em componentes genéricos e reutilizáveis na pasta `src/components/ui/`.
- **Padrões do Design System (`src/components/ui/`):**
  - `Button` (variantes primária, outline, ghost, danger, tamanhos sm/md/lg);
  - `Input` (com label, helper text, ícone esquerdo/direito, estados de erro);
  - `Select` (estilizado, customizado para temas dark);
  - `Modal` (com backdrop blur, transição de entrada/saída, header e footer padronizados);
  - `Card` (com borda sutil, sombra, animação hover);
  - `Badge` (para tags de status: *Pago*, *Pendente*, *Em Atraso*, *Quitado*, percentuais);
  - `Tabs` (navegador de abas com transição suave via Framer Motion);
  - `ProgressBar` (barra de progresso com gradientes oficiais do NossoBolso).
- **Responsabilidade Única:** É proibido criar arquivos monolíticos extensos; divida qualquer tela complexa em subcomponentes com responsabilidade única e clara.

---

### 3. 🛡️ Tipagem Estrita (TypeScript) — Proibição do `any`
- **Proibição Total do `any`:** É estritamente proibido declarar ou utilizar o tipo `any` em qualquer parte do código (`no-explicit-any`), incluindo casts como `as any`.
- **Alternativas Obrigatórias:**
  - Para valores incertos, utilize `unknown` associado a Type Guards (`typeof`, `instanceof` ou type predicates).
  - Para tipos genéricos, declare parâmetros de tipo `<T>`.
  - Para todas as estruturas de dados, props de componentes, selects e payloads de funções, declare `interface` ou `type` explícitos.
  - Para APIs nativas do navegador (como `SpeechRecognition`), declare interfaces complementares ou extensões da interface `Window`.

---

### 4. 🎨 Estilização e Design System
- **Proibição de CSS Inline:** É estritamente proibido utilizar o atributo `style={{ ... }}` em elementos HTML ou React para cores, margens, paddings, alinhamentos, fontes ou sombras.
- **Exceção Restrita para Inline:** A única exceção aceitável para o atributo `style` é em propriedades verdadeiramente dinâmicas geradas por cálculos numéricos em tempo de execução (exemplo: larguras percentuais como `style={{ width: `${pct}%` }}` ou ângulos de arcos em gráficos SVG/Recharts).
- **Tailwind CSS:** Toda a estilização visual do projeto deve ser feita utilizando as utility classes do Tailwind CSS.
- **Classes Dinâmicas:** Para compor variantes e classes condicionais, utilize estritamente as bibliotecas `clsx` e `twMerge`.
- **Estilos Globais:** Estilos recorrentes, fontes e animações de fundo devem ser declarados de forma centralizada no arquivo `src/index.css`.

---

### 5. ⚙️ Validação Obrigatória via Terminal / Console
- **Proibição de Testes Automáticos via Navegador:** O agente **NÃO DEVE** abrir ou testar a aplicação através de subagentes ou automações de navegador sem autorização explícita do usuário.
- **Validação Estrita via Console:** Após qualquer alteração ou implementação, o agente deve obrigatoriamente executar e validar a compilação completa do projeto no terminal utilizando `npm run build` (`tsc && vite build`). O código só é considerado finalizado quando o comando retornar código 0 com zero erros.

---

### 6. 🛑 REGRA ESTRITA DE CONTROLE DO GIT (NÃO SUBIR PRO GIT SEM AUTORIZAÇÃO PRÉVIA)
> [!CAUTION]
> **É ESTRITAMENTE PROIBIDO AO AGENTE EXECUTAR `git push` OU `git commit` SEM A AUTORIZAÇÃO PRÉVIA E EXPLICITA DO USUÁRIO NO CHAT.**

- **Aprovação Obrigatória do Usuário:** O agente **NUNCA** deve enviar alterações para o Git (`git commit` ou `git push`) automaticamente após terminar uma edição.
- **Fluxo Obrigatório do Agente:** O agente DEVE compilar e validar o projeto no terminal via `npm run build`, mas O PUSH E O COMMIT NO GIT SÓ PODEM SER EXECUTADOS QUANDO O USUÁRIO ENVIAR O COMANDO EXPLÍCITO NO CHAT (Exemplo: *"suba pro git"* ou *"pode fazer o commit/push"*).

---

## 📁 Estrutura da Pasta `.agents/`

```text
.agents/
├── AGENTS.md
└── rules/
    ├── regras-gerais.md
    ├── typescript-estrito.md
    ├── estilizacao-css.md
    └── arquitetura-componentes.md
```
