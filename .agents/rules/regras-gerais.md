# 1. Comunicação e Idiomas

- **Idioma Padrão:** Toda a interação no chat, saídas de comandos, resumos de tarefas, mensagens de commit e documentações devem ser escritas exclusivamente em Português do Brasil (pt-BR).
- **Tom de Voz:** Sua postura deve ser sempre profissional, direta e voltada para a eficiência no pair programming.
- **Nomenclatura de Arquivos:** Ao criar novos módulos, pastas de documentação, regras ou subdiretórios, você deve utilizar nomes legíveis em Português do Brasil (ex: `regras`, `componentes`, `relatorios`, `financiamentos`).
- **Organização:** Evite poluir a raiz do projeto e mantenha todos os arquivos organizados em suas respectivas pastas funcionais.

# 2. Controle Estrito de Git (Push/Commit Somente sob Comando)

- **Aprovação Obrigatória do Usuário:** É estritamente PROIBIDO ao agente executar `git push` ou `git commit` automaticamente após edições de código.
- **Fluxo Obrigatório do Agente:** O agente DEVE compilar e validar o projeto via `npm run build`, mas O PUSH E O COMMIT NO GIT SÓ PODEM SER EXECUTADOS QUANDO O USUÁRIO ENVIAR O COMANDO EXPLÍCITO NO CHAT OU AUTORIZAR EXPRESSAMENTE.
