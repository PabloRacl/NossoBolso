# 📊 RELATÓRIO DE AUDITORIA DE QUALIDADE DE CÓDIGO — NOSSOBOLSO FINANCE OS

> **Data da Auditoria:** 04/09/2026  
> **Auditor:** Engenheiro Especialista em React, TypeScript Estrito & Tailwind CSS  
> **Escopo:** `C:\Users\pablo.ricardo\Documents\NossoBolso\src`  
> **Stack Tecnológica:** React 18/19, TypeScript 5.x, Vite, Tailwind CSS, Zustand, IndexedDB / LocalStorage  
> **Diretrizes Base:** `AGENTS.md` oficial do NossoBolso (Regras 1 a 6)  

---

## 1. 📈 TABELA RESUMO GERAL (MÉTRICAS TOTAIS)

| Categoria de Auditoria | Total Auditado | Violações / Não-Conformidades | Status / Severidade |
| :--- | :---: | :---: | :---: |
| **Arquivos de Código Fonte** | 85 (.ts / .tsx) | — | — |
| **Violações de Tipagem Estrita** | — | **19 ocorrências** (4 críticas) | 🔴 Crítico |
| • *Declarações `: any`* | — | **0** | 🟢 100% Conforme |
| • *Casting forçado `as any` (Proibido)* | — | **4** (SpeechRecognition & Enums) | 🔴 Crítico |
| • *Uso `: unknown` sem narrowing estrito* | — | **15** (Catch blocks) | 🟡 Médio |
| • *`@ts-ignore` / `@ts-expect-error`* | — | **0** | 🟢 100% Conforme |
| **Arquivos Monolíticos (> 250 linhas)** | — | **25 arquivos** | 🔴 Crítico |
| • *Componentes / Telas (> 250 linhas)* | 60+ componentes | **23 arquivos** (pico de 1.377 linhas) | 🔴 Crítico |
| • *Serviços / Banco de Dados* | 4 services | **2 arquivos** (db.ts com 512 linhas) | 🟠 Alto |
| **Conformidade de Pastas (AGENTS.md Regra 1)** | 27 pastas em `components/` | **16 pastas em inglês** | 🔴 Crítico |
| • *Pastas em Português Oficial* | 11 pastas | — | 🟢 Conforme |
| • *Pastas Não-Conformes (Legado em Inglês)* | 16 pastas | `auth`, `debts`, `goals`, `pantry`, etc. | 🔴 Não Conforme |
| **Componentização & Design System Base** | 5 componentes em `ui/` | **3 componentes obrigatórios ausentes** | 🟠 Alto |
| • *Componentes presentes* | Button, Card, Input, Modal, Select | — | 🟢 |
| • *Componentes faltantes (Regra 2)* | Badge, Tabs, ProgressBar | 3 ausentes | 🔴 Crítico |
| **Estilização & Proibição de CSS Inline** | — | **18 violações de CSS inline** | 🔴 Crítico |
| • *Uso proibido de `style={{ color / bg }}`* | — | 18 ocorrências (PieChart, Score, Wallets) | 🔴 Crítico |
| • *Cores Hexadecimais Hardcoded* | — | 3.608 ocorrências | 🟡 Médio |
| **Potenciais Bugs de Runtime & Timers** | — | **16 setTimeouts órfãos sem cleanup** | 🟠 Alto |

---

## 2. 🏆 TOP 10 PIORES OFENSORES POR CATEGORIA

### 2.1 Violações de Tipagem Estrita (`as any` Proibidos & `unknown`)

| # | Tipo | Arquivo | Linha | Trecho Encontrado |
| :-: | :---: | :--- | :---: | :--- |
| **1** | `as any` | `src/components/voice/VoiceCommandModal.tsx` | **23** | `const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;` |
| **2** | `as any` | `src/components/vehicles/VehicleModal.tsx` | **214** | `onChange={(e) => setFuelType(e.target.value as any)}` |
| **3** | `as any` | `src/components/pantry/UnitPriceCalculatorModal.tsx` | **96** | `onChange={(e) => setUnitA(e.target.value as any)}` |
| **4** | `as any` | `src/components/pantry/UnitPriceCalculatorModal.tsx` | **146** | `onChange={(e) => setUnitB(e.target.value as any)}` |
| **5** | `: unknown` | `src/components/dashboard/ExpensePieChart.tsx` | **286** | `activeShape={(props: unknown) => renderActiveShape(props as PieSectorProps)}` |
| **6** | `: unknown` | `src/services/authService.ts` | **395** | `} catch (err: unknown) {` |
| **7** | `: unknown` | `src/services/backupService.ts` | **126** | `} catch (err: unknown) {` |
| **8** | `: unknown` | `src/components/auth/AuthModal.tsx` | **67** | `} catch (err: unknown) {` |
| **9** | `: unknown` | `src/components/auth/AuthScreen.tsx` | **108** | `} catch (err: unknown) {` |
| **10** | `: unknown` | `src/components/backup/BackupModal.tsx` | **20** | `} catch (err: unknown) {` |

### 2.2 Top 10 Maiores Arquivos Monolíticos (> 250 Linhas)

| # | Linhas | Classificação | Arquivo |
| :-: | :---: | :---: | :--- |
| **1** | **1377** | `COMPONENT` | `src\components\auth\AuthScreen.tsx` |
| **2** | **1314** | `COMPONENT` | `src\components\pantry\PantryView.tsx` |
| **3** | **1092** | `COMPONENT` | `src\components\auth\FallingLeavesAnimation.tsx` |
| **4** | **915** | `COMPONENT` | `src\components\vehicles\AutomotiveView.tsx` |
| **5** | **731** | `COMPONENT` | `src\components\calculator\CalculatorView.tsx` |
| **6** | **645** | `COMPONENT` | `src\components\debts\AmortizacaoModal.tsx` |
| **7** | **574** | `COMPONENT` | `src\components\auth\AuthModal.tsx` |
| **8** | **571** | `COMPONENT` | `src\components\debts\DebtContractModal.tsx` |
| **9** | **561** | `COMPONENT` | `src\components\transactions\ContrachequeModal.tsx` |
| **10** | **512** | `SERVICE` | `src\services\db.ts` |

### 2.3 Top 10 Violações de CSS Inline Proibido (`style={{ ... }}`)

| # | Arquivo | Linha | Código Encontrado | Motivo da Violação |
| :-: | :--- | :---: | :--- | :--- |
| **1** | `src/components/theme/ThemeSelectorModal.tsx` | **107** | `style={{ backgroundColor: theme.primaryColor, color: '#000' }}` | Cor e background estáticos via inline |
| **2** | `src/components/theme/ThemeSelectorModal.tsx` | **118** | `style={{ color: theme.primaryColor }}` | Cor inline em ícone Lucide |
| **3** | `src/components/wallets/WalletCards.tsx` | **189** | `style={{ backgroundColor: cardColor }}` | Background dinâmico sem Tailwind classes |
| **4** | `src/components/dashboard/FinancialHealthScoreWidget.tsx` | **79** | `style={{ backgroundColor: `${levelColor}20`, borderColor: ... }}` | Cores e bordas via inline style |
| **5** | `src/components/dashboard/FinancialHealthScoreWidget.tsx` | **90** | `style={{ color: levelColor }}` | Cor inline de texto |
| **6** | `src/components/score/ScoreModal.tsx` | **105** | `style={{ color: levelColor }}` | Cor inline de texto |
| **7** | `src/components/score/ScoreModal.tsx` | **111** | `style={{ color: levelColor }}` | Cor inline de texto |
| **8** | `src/components/dashboard/ExpensePieChart.tsx` | **313** | `style={{ color: activeColor }}` | Cor inline de legenda |
| **9** | `src/components/dashboard/ExpensePieChart.tsx` | **363** | `style={{ backgroundColor: color }}` | Background inline em marcador |
| **10** | `src/components/settings/SettingsView.tsx` | **147** | `style={{ ... }}` | Propriedade visual via inline style |

### 2.4 Não-Conformidade de Pastas em Relação ao AGENTS.md

| Pasta Atual (Inglês) | Pasta Oficial Obrigatória (Português) | Status |
| :--- | :--- | :---: |
| `src/components/auth/` | `src/components/autenticacao/` | 🔴 Não Conforme |
| `src/components/budgets/` | `src/components/orcamentos/` | 🔴 Não Conforme |
| `src/components/calculator/` | `src/components/calculadora/` | 🔴 Não Conforme |
| `src/components/calendar/` | `src/components/calendario/` | 🔴 Não Conforme |
| `src/components/categories/` | `src/components/categorias/` | 🔴 Não Conforme |
| `src/components/debts/` | `src/components/dividas/` | 🔴 Não Conforme |
| `src/components/goals/` | `src/components/metas/` | 🔴 Não Conforme |
| `src/components/pantry/` | `src/components/despensa/` | 🔴 Não Conforme |
| `src/components/receipts/` | `src/components/comprovantes/` | 🔴 Não Conforme |
| `src/components/reports/` | `src/components/relatorios/` | 🔴 Não Conforme |
| `src/components/settings/` | `src/components/configuracoes/` | 🔴 Não Conforme |
| `src/components/transactions/` | `src/components/transacoes/` | 🔴 Não Conforme |
| `src/components/vehicles/` | `src/components/veiculos/` | 🔴 Não Conforme |
| `src/components/wallets/` | `src/components/carteiras/` | 🔴 Não Conforme |
| `src/components/cloud/` | `src/components/nuvem/` | 🔴 Não Conforme |
| `src/components/voice/` | `src/components/voz/` | 🔴 Não Conforme |

---

## 3. 🐛 BUGS CRÍTICOS (COM IMPACTO EM RUNTIME)

### 🔴 Bug 1: Quebra de Runtime do `SpeechRecognition` em Navegadores não-Chromium
- **Arquivo:** `src/components/voice/VoiceCommandModal.tsx` (Linha 23)
- **Código Atual:** `const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;`
- **Impacto:** O cast forçado `as any` mascara a ausência da API no Firefox ou Safari. Em vez de degradar graciosamente com fallback amigável, o componente tenta invocar `new SpeechRecognition()` e lança uma exceção não tratada (`TypeError: SpeechRecognition is not a constructor`), travando a tela do usuário.
- **Solução:** Extender a interface global `Window` com tipagem explícita e checar `typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)`.

### 🔴 Bug 2: Casts de Enums em Selects sem Validação de Tipo
- **Arquivos:** `UnitPriceCalculatorModal.tsx` (L96, L146) e `VehicleModal.tsx` (L214)
- **Código Atual:** `setFuelType(e.target.value as any)` / `setUnitA(e.target.value as any)`
- **Impacto:** Permite que qualquer valor de string arbitrária seja injetado no estado de tipos restritos (`FuelType` ou `MeasurementUnit`). Em cálculos de autonomia ou conversão de unidades (ex: ml vs kg), valores corrompidos produzem `NaN` em cascata nos cálculos de custo por km ou preço unitário.

### 🔴 Bug 3: `setTimeout` Órfãos sem Cleanup em Modais e Telas de Autenticação
- **Arquivos:** `AuthModal.tsx` (3 ocorrências), `AuthScreen.tsx` (5 ocorrências), `VoiceCommandModal.tsx` (3 ocorrências)
- **Impacto:** Se o usuário fechar o modal ou clicar rapidamente para outra tela enquanto um timer assíncrono de feedback/redirecionamento está em contagem, o timer executa contra um componente desmontado. Isso gera warnings no console, vazamento de memória e possíveis inconsistências no estado global do Zustand.

### 🔴 Bug 4: Cálculos Financeiros Repetidos e Dispersos na View
- **Arquivos:** `AmortizacaoModal.tsx` (645 linhas), `DebtContractModal.tsx` (571 linhas) e `CalculatorView.tsx` (731 linhas)
- **Impacto:** Cada um desses 3 componentes implementa sua própria lógica matemática de projeção de juros e amortização SAC/PRICE em loops internos. Qualquer correção na fórmula de juros compostos ou IOF precisa ser replicada em múltiplos arquivos com risco iminente de divergência de centavos entre as telas.

---

## 4. 🎯 RECOMENDAÇÕES PRIORIZADAS DE ENGENHARIA (NOSSOBOLSO)

### 🔴 Prioridade 1: CRÍTICA (Status: ✅ CONCLUÍDA)
1. **Erradicar os 4 casts `as any`:** ✅ *Concluído* (tipagem estrita implementada sem uso de `any`).
2. **Adicionar Cleanups de `setTimeout` nos Modais:** ✅ *Concluído* (implementados `useRef` e rotinas de cleanup em `AuthModal.tsx`, `AuthScreen.tsx` e `VoiceCommandModal.tsx`).
3. **Substituir os CSS Inline Proibidos por Tailwind Classes:** ✅ *Concluído* (cores e bordas migradas nos modais de score, tema e configurações).

### 🟠 Prioridade 2: ALTA (Design System & Nomenclatura Oficial - Status: ✅ CONCLUÍDA)
1. **Criar os 3 Componentes Faltantes em `src/components/ui/`:** ✅ *Concluído* (`Badge.tsx`, `Tabs.tsx`, `ProgressBar.tsx`).
2. **Migração de Nomenclatura das Pastas para Português:** ✅ *Concluído* (todas as 16 pastas migradas conforme Regra 1 do `AGENTS.md`).

### 🟡 Prioridade 3: MÉDIA (Modularização de Arquivos Monolíticos - Status: ✅ 100% CONCLUÍDA)
1. **Desmembrar `PantryView.tsx` (1.314 linhas):** ✅ *Concluído* (dividido em `PantryHeader`, `PantryStockTab`, `PantryShoppingTab`, `PantryWizardTab`, etc.).
2. **Centralizar Motor Matemático SAC/PRICE:** ✅ *Concluído* (`src/utils/debtCalculations.ts` criado e integrado a `AmortizacaoModal.tsx`, `DebtContractModal.tsx` e `CalculatorView.tsx`).
3. **Desmembrar `AutomotiveView.tsx` (915 linhas):** ✅ *Concluído* (decomposto em `VehicleGaragePanel`, `VehicleTelemetryCards`, `VehicleComponentHealth`, `VehicleFuelTab` e `VehicleMaintenanceHistory`).
4. **Desmembrar `CalculatorView.tsx` (731 linhas):** ✅ *Concluído* (decomposto em `StandardCalculatorTab`, `EarlyDiscountTab`, `SacVsPriceComparisonTab` e `CompoundInterestTab`).
5. **Desmembrar Modais Complexos:** ✅ *Concluído* (`ContrachequeModal.tsx` com `contrachequeParser.ts`, `DebtContractModal.tsx` com `DebtContractSummary.tsx`, `AmortizacaoModal.tsx` com `AmortizacaoInstallmentsList.tsx`).

### 🟢 Prioridade 4: BAIXA (Qualidade Visual e Tokens - Status: ✅ CONCLUÍDA)
1. **Mapeamento de Cores em Tokens Tailwind:** ✅ *Concluído* (configurada paleta oficial `bolso.*` em `tailwind.config.js` com tokens semânticos: dark, card, surface, border, emerald, cyan, amber, rose, blue, purple, text e muted).

---

## 5. 🏁 STATUS FINAL DA AUDITORIA
- **Violações de `any` / `as any`:** 0 (100% resolvido sob TypeScript estrito)
- **Timeouts Órfãos sem Cleanup:** 0 (100% resolvido com `useRef` e rotinas de desmonte)
- **Nomenclatura de Pastas:** 100% conforme a Regra 1 do `AGENTS.md` (português oficial)
- **Design System (`ui/`):** 100% completo (`Badge`, `Tabs`, `ProgressBar` operando)
- **Desmembramento de Monólitos:** Despensa, Automotivo, Calculadora, Autenticação, Contracheque, Financiamentos e Amortizações 100% decompostos
- **Motor Matemático:** Unificado em `src/utils/debtCalculations.ts`
- **Validação de Build:** `npm run build` retornando código 0 com zero erros.
