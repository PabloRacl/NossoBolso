# 2. Arquitetura e Componentes

- **Reutilização Obrigatória:** É obrigatório isolar elementos visuais repetitivos em componentes genéricos e reutilizáveis, os quais devem ser alocados na pasta `src/components/ui/`.
- **Padrões de Componentes:** Sempre que necessário, crie componentes base como `Button` (com variantes primária, outline, ghost e tamanhos), `Input` (com label e ícones), `Select` (estilizado com opções), `Modal` (com backdrop e transição) e `Card` (com borda, sombra e animação hover).
- **Responsabilidade Única:** É proibido criar arquivos monolíticos extensos; divida as visualizações em subcomponentes com responsabilidade única.
