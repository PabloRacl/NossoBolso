# 2. Arquitetura, Componetização e Nomenclatura

## 🗂️ Nomenclatura Obrigatória de Pastas em Português
Todas as pastas funcionais sob `src/components/` devem ser estritamente em Português do Brasil:
- `autenticacao/`: Telas de login, cadastro, recuperação e segurança
- `orcamentos/`: Gestão e modais de orçamentos por categoria
- `calculadora/`: Simuladores de juros, parcelas e PMPE
- `calendario/`: Agenda financeira de vencimentos
- `categorias/`: Gerenciador de categorias e tags
- `dividas/`: Financiamentos, dívidas e quitações
- `metas/`: Metas financeiras e reservas
- `despensa/`: Lista de compras e mantimentos
- `comprovantes/`: Upload e visualização de comprovantes
- `relatorios/`: Relatórios mensais e regra 50-30-20
- `configuracoes/`: Preferências do usuário e sistema
- `transacoes/`: Inclusão, edição e extrato de transações
- `veiculos/`: Manutenção, combustível e despesas veiculares
- `carteiras/`: Contas bancárias e cartões de crédito
- `nuvem/`: Sincronização e backup cloud
- `voz/`: Comandos de voz com reconhecimento nativo
- `ui/`: Design System Base Reutilizável

## 🧩 Componetização e Reuso Obrigatório (`src/components/ui/`)
- É expressamente proibido criar botões, inputs, modais, selects e badges repetitivos ou ad-hoc soltos nas telas.
- Todo elemento visual padrão deve ser isolado e consumido a partir de `src/components/ui/`:
  - `Button`
  - `Input`
  - `Select`
  - `Modal`
  - `Card`
  - `Badge` (Status: Pago, Pendente, Atrasado, Quitado)
  - `Tabs` (Navegador de abas com Framer Motion)
  - `ProgressBar` (Barras de progresso com gradientes oficiais)
- **Responsabilidade Única:** Views complexas devem ser decompostas em subcomponentes atômicos.
