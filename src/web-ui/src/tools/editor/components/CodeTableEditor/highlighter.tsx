import React from 'react';
import { BASIC_KEYWORDS, DATA_TYPES, PRAGMA_DIRECTIVES } from './keywords';

export enum TokenType {
  KEYWORD = 'keyword',
  DATA_TYPE = 'data-type',
  PRAGMA = 'pragma',
  STRING = 'string',
  NUMBER = 'number',
  COMMENT = 'comment',
  OPERATOR = 'operator',
  IDENTIFIER = 'identifier',
  PUNCTUATION = 'punctuation',
  WHITESPACE = 'whitespace',
}

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

const OPERATORS = [
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
  '==', '!=', '<=', '>=', '<', '>',
  '+', '-', '*', '/', '%',
  '&', '|', '^', '~',
  '<<', '>>',
  '&&', '||', '!',
  '=',
  '->', '..',
];

const PUNCTUATION = ['(', ')', '[', ']', '{', '}', ',', ';', ':', '.', '#'];

export function tokenizeCode(code: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < code.length) {
    const char = code[pos];

    if (/\s/.test(char)) {
      let value = '';
      const start = pos;
      while (pos < code.length && /\s/.test(code[pos])) {
        value += code[pos];
        pos++;
      }
      tokens.push({ type: TokenType.WHITESPACE, value, start, end: pos });
      continue;
    }

    if (char === '#') {
      let value = '';
      const start = pos;
      while (pos < code.length && code[pos] !== '\n') {
        value += code[pos];
        pos++;
      }
      tokens.push({ type: TokenType.COMMENT, value, start, end: pos });
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let value = quote;
      const start = pos;
      pos++;
      while (pos < code.length && code[pos] !== quote) {
        if (code[pos] === '\\' && pos + 1 < code.length) {
          value += code[pos] + code[pos + 1];
          pos += 2;
        } else {
          value += code[pos];
          pos++;
        }
      }
      if (pos < code.length) {
        value += code[pos];
        pos++;
      }
      tokens.push({ type: TokenType.STRING, value, start, end: pos });
      continue;
    }

    if (/\d/.test(char)) {
      let value = '';
      const start = pos;
      while (pos < code.length && /[\d.]/.test(code[pos])) {
        value += code[pos];
        pos++;
      }
      tokens.push({ type: TokenType.NUMBER, value, start, end: pos });
      continue;
    }

    const opFound = OPERATORS.find(op => code.substring(pos, pos + op.length) === op);
    if (opFound) {
      tokens.push({ type: TokenType.OPERATOR, value: opFound, start: pos, end: pos + opFound.length });
      pos += opFound.length;
      continue;
    }

    if (PUNCTUATION.includes(char)) {
      tokens.push({ type: TokenType.PUNCTUATION, value: char, start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    if (/[\u4e00-\u9fa5\w]/.test(char)) {
      let value = '';
      const start = pos;
      while (pos < code.length && /[\u4e00-\u9fa5\w]/.test(code[pos])) {
        value += code[pos];
        pos++;
      }

      let type = TokenType.IDENTIFIER;
      if (BASIC_KEYWORDS.includes(value)) {
        type = TokenType.KEYWORD;
      } else if (DATA_TYPES.includes(value)) {
        type = TokenType.DATA_TYPE;
      } else if (PRAGMA_DIRECTIVES.includes(value)) {
        type = TokenType.PRAGMA;
      }

      tokens.push({ type, value, start, end: pos });
      continue;
    }

    tokens.push({ type: TokenType.IDENTIFIER, value: char, start: pos, end: pos + 1 });
    pos++;
  }

  return tokens;
}

export function highlightCode(code: string): React.ReactNode {
  const tokens = tokenizeCode(code);
  
  return tokens.map((token, index) => {
    const className = `code-token--${token.type}`;
    return (
      <span key={index} className={className}>
        {token.value}
      </span>
    );
  });
}

export function getHighlightClassName(type: TokenType): string {
  return `code-token--${type}`;
}
