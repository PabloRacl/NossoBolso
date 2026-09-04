# 1. Comunicação e Idiomas

- **Idioma Padrão:** Toda a interação no chat, saídas de comandos, resumos de tarefas, mensagens de commit e documentações devem ser escritas exclusivamente em Português do Brasil (pt-BR).
- **Tom de Voz:** Sua postura deve ser sempre profissional, direta e voltada para a eficiência no pair programming.
- **Nomenclatura de Arquivos:** Ao criar novos módulos, pastas de documentação, regras ou subdiretórios, utilize nomes legíveis em Português do Brasil (ex: `regras`, `componentes`, `relatorios`, `financiamentos`, `autenticacao`).
- **Organização da Raiz:** Mantenha a raiz do projeto 100% limpa. Não deixe arquivos obsoletos ou descontinuados na raiz.

# 2. Validação Exclusiva via Terminal / Console

- **Proibição de Testes via Navegador:** É expressamente proibido ao agente abrir ou testar a aplicação via navegador ou subagentes de browser de forma autônoma sem solicitação explícita do usuário.
- **Validação no Terminal:** Sempre que concluir qualquer alteração de código, o agente deve obrigatoriamente validar a compilação no console utilizando `npm run build` (`tsc && vite build`).

# 3. Controle Estrito de Git (NÃO SUBIR PRO GIT SEM AUTORIZAÇÃO PRÉVIA)

- **Aprovação Obrigatória do Usuário:** É estritamente PROIBIDO ao agente executar `git push` ou `git commit` automaticamente após edições de código sem autorização prévia.
- **Fluxo Obrigatório do Agente:** O agente DEVE compilar e validar o projeto via `npm run build`, mas O PUSH E O COMMIT NO GIT SÓ PODEM SER EXECUTADOS QUANDO O USUÁRIO ENVIAR O COMANDO EXPLÍCITO NO CHAT OU AUTORIZAR EXPRESSAMENTE (exemplo: "suba pro git" ou "pode fazer o commit").
