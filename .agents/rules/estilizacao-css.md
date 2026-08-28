# 4. Estilização e Design System

- **Proibição de CSS Inline:** É proibido utilizar o atributo `style={{ ... }}` em elementos HTML ou React.
- **Exceção Restrita para Inline:** A única exceção para uso do atributo `style` é em propriedades verdadeiramente dinâmicas geradas por cálculos numéricos em tempo de execução (exemplo: larguras percentuais ou arcos e ângulos em gráficos SVG/Recharts, como `startAngle` e `endAngle`).
- **Tailwind CSS:** Toda a estilização visual do projeto deve ser feita utilizando as utility classes do Tailwind CSS.
- **Classes Dinâmicas:** Para compor variantes e classes dinâmicas, utilize estritamente as bibliotecas `clsx` e `twMerge`.
- **Estilos Globais:** Estilos recorrentes ou animações de fundo devem ser declarados de forma centralizada no arquivo `src/index.css`.
