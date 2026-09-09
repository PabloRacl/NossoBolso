/**
 * Avaliador Matemático Seguro do NossoBolso Finance OS
 * Implementa um algoritmo Shunting-Yard determinístico para avaliar expressões aritméticas
 * sem recorrer a eval() ou Function(), protegendo a aplicação contra vulnerabilidades de injeção de código.
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
}

const OPERATOR_PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

/**
 * Converte a string de expressão em uma lista de tokens matemáticos seguros.
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const expr = expression.trim();

  while (i < expr.length) {
    const char = expr[i];

    // Ignora espaços em branco
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Parênteses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Operadores aritméticos
    if (['+', '-', '*', '/'].includes(char)) {
      // Suporte a sinal unário de negativo (ex: -5 ou (-3))
      const prevToken = tokens[tokens.length - 1];
      const isUnary = (char === '-' || char === '+') &&
        (!prevToken || prevToken.type === 'OPERATOR' || prevToken.type === 'LPAREN');

      if (isUnary && char === '-') {
        // Trata como número negativo lendo os dígitos seguintes
        i++;
        let numStr = '-';
        while (i < expr.length && (/[0-9.]/.test(expr[i]))) {
          numStr += expr[i];
          i++;
        }
        if (numStr === '-') {
          throw new Error('Expressão com operador unário incompleto.');
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    // Números e pontos decimais
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      let hasDot = false;

      while (i < expr.length && (/[0-9.]/.test(expr[i]))) {
        if (expr[i] === '.') {
          if (hasDot) throw new Error('Número com múltiplos pontos decimais.');
          hasDot = true;
        }
        numStr += expr[i];
        i++;
      }

      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    throw new Error(`Caractere inválido na expressão: ${char}`);
  }

  return tokens;
}

/**
 * Converte tokens de Notação Infixa para Notação Pós-fixa (Reverse Polish Notation)
 * utilizando o clássico algoritmo Shunting-Yard de Edsger Dijkstra.
 */
function toRPN(tokens: Token[]): Token[] {
  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER') {
      outputQueue.push(token);
    } else if (token.type === 'OPERATOR') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
        OPERATOR_PRECEDENCE[operatorStack[operatorStack.length - 1].value] >= OPERATOR_PRECEDENCE[token.value]
      ) {
        const op = operatorStack.pop();
        if (op) outputQueue.push(op);
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      let foundMatchingLParen = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop();
        if (top?.type === 'LPAREN') {
          foundMatchingLParen = true;
          break;
        }
        if (top) outputQueue.push(top);
      }
      if (!foundMatchingLParen) {
        throw new Error('Parênteses desbalanceados na expressão.');
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op?.type === 'LPAREN' || op?.type === 'RPAREN') {
      throw new Error('Parênteses desbalanceados na expressão.');
    }
    if (op) outputQueue.push(op);
  }

  return outputQueue;
}

/**
 * Avalia a fila RPN calculando o valor numérico final.
 */
function evaluateRPN(rpnTokens: Token[]): number {
  const stack: number[] = [];

  for (const token of rpnTokens) {
    if (token.type === 'NUMBER') {
      const num = parseFloat(token.value);
      if (isNaN(num)) throw new Error('Valor numérico inválido.');
      stack.push(num);
    } else if (token.type === 'OPERATOR') {
      if (stack.length < 2) {
        throw new Error('Operador sem operandos suficientes.');
      }
      const b = stack.pop()!;
      const a = stack.pop()!;

      switch (token.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          if (b === 0) {
            throw new Error('Divisão por zero.');
          }
          stack.push(a / b);
          break;
        default:
          throw new Error(`Operador desconhecido: ${token.value}`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Expressão mal formatada.');
  }

  return stack[0];
}

/**
 * Avalia de forma segura uma expressão matemática simples sem eval/Function.
 * Exemplo: evaluateMathExpression("10 + 5 * 2") -> 20
 */
export function evaluateMathExpression(expression: string): number {
  if (!expression || typeof expression !== 'string') {
    throw new Error('Expressão vazia ou inválida.');
  }

  // Normaliza operadores visuais e porcentagem
  let sanitized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.');

  // Converte porcentagens simples (ex: 50% -> (50/100))
  sanitized = sanitized.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

  const tokens = tokenize(sanitized);
  const rpn = toRPN(tokens);
  const result = evaluateRPN(rpn);

  if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
    throw new Error('Resultado numérico indefinido ou infinito.');
  }

  return result;
}
