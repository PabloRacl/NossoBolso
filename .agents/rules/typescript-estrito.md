# 3. Tipagem Estrita (TypeScript)

- **Proibição Total do tipo `any`:** É estritamente proibido declarar ou utilizar o tipo `any` em qualquer parte do código (`no-explicit-any`), incluindo casts como `as any` ou `<any>`.
- **Alternativas Obrigatórias:**
  - Para tipos incertos, utilize `unknown` associado a Type Guards (como `typeof`, `instanceof` ou type predicates).
  - Para tipos genéricos, declare parâmetros de tipo `<T>`.
  - Para todas as estruturas de dados, props de componentes, selects e payloads de funções, declare `interface` ou `type` explícitos.
  - Para APIs nativas do navegador (como `SpeechRecognition`), declare interfaces complementares ou extensões de `Window`.
