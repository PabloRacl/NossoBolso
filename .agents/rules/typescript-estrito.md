# 3. Tipagem Estrita (TypeScript)

- **Proibição do tipo `any`:** É estritamente proibido declarar ou utilizar o tipo `any` em qualquer parte do código (`no-explicit-any`).
- **Alternativas Obrigatórias:**
  - Para tipos incertos, utilize `unknown` associado a Type Guards (como `typeof`, `instanceof` ou type predicates).
  - Para tipos genéricos, declare parâmetros de tipo `<T>`.
  - Para todas as estruturas de dados, props de componentes e payloads de funções, declare `interface` ou `type` explícitos.
