import { BASIC_KEYWORDS, DATA_TYPES, PRAGMA_DIRECTIVES } from './keywords';

export interface CompletionItem {
  label: string;
  type: 'keyword' | 'data-type' | 'pragma' | 'snippet';
  detail?: string;
  insertText: string;
  sortText?: string;
  cursorOffset?: number;
}

export function getCompletions(prefix: string): CompletionItem[] {
  if (!prefix || prefix.length === 0) {
    return [];
  }

  const lowerPrefix = prefix.toLowerCase();
  const completions: CompletionItem[] = [];

  BASIC_KEYWORDS.forEach(keyword => {
    if (keyword.toLowerCase().includes(lowerPrefix)) {
      completions.push({
        label: keyword,
        type: 'keyword',
        insertText: keyword,
        sortText: `1${keyword}`,
      });
    }
  });

  DATA_TYPES.forEach(type => {
    if (type.toLowerCase().includes(lowerPrefix)) {
      completions.push({
        label: type,
        type: 'data-type',
        insertText: type,
        sortText: `2${type}`,
      });
    }
  });

  PRAGMA_DIRECTIVES.forEach(pragma => {
    if (pragma.toLowerCase().includes(lowerPrefix)) {
      completions.push({
        label: pragma,
        type: 'pragma',
        insertText: pragma,
        sortText: `3${pragma}`,
      });
    }
  });

  const snippets = getSnippets();
  snippets.forEach(snippet => {
    if (snippet.label.toLowerCase().includes(lowerPrefix)) {
      completions.push({
        ...snippet,
        sortText: `0${snippet.label}`,
      });
    }
  });

  return completions.sort((a, b) => {
    const aStartsWith = a.label.toLowerCase().startsWith(lowerPrefix);
    const bStartsWith = b.label.toLowerCase().startsWith(lowerPrefix);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return (a.sortText || a.label).localeCompare(b.sortText || b.label);
  });
}

export function getSnippets(): CompletionItem[] {
  return [
    {
      label: 'proc',
      type: 'snippet',
      detail: '过程定义',
      insertText: 'proc ',
      cursorOffset: 5,
    },
    {
      label: 'func',
      type: 'snippet',
      detail: '函数定义',
      insertText: 'func ',
      cursorOffset: 5,
    },
    {
      label: '过程',
      type: 'snippet',
      detail: '过程定义',
      insertText: '过程 ',
      cursorOffset: 3,
    },
    {
      label: '函数',
      type: 'snippet',
      detail: '函数定义',
      insertText: '函数 ',
      cursorOffset: 3,
    },
    {
      label: 'if',
      type: 'snippet',
      detail: '条件语句',
      insertText: 'if :\n  ',
      cursorOffset: 4,
    },
    {
      label: 'if-else',
      type: 'snippet',
      detail: '条件语句（含否则）',
      insertText: 'if :\n  \nelse:\n  ',
      cursorOffset: 4,
    },
    {
      label: '如果',
      type: 'snippet',
      detail: '条件语句',
      insertText: '如果 :\n  ',
      cursorOffset: 4,
    },
    {
      label: '如果否则',
      type: 'snippet',
      detail: '条件语句（含否则）',
      insertText: '如果 :\n  \n否则:\n  ',
      cursorOffset: 4,
    },
    {
      label: 'elif',
      type: 'snippet',
      detail: '否则如果',
      insertText: 'elif :\n  ',
      cursorOffset: 6,
    },
    {
      label: 'else',
      type: 'snippet',
      detail: '否则',
      insertText: 'else:\n  ',
      cursorOffset: 7,
    },
    {
      label: 'for',
      type: 'snippet',
      detail: '循环语句',
      insertText: 'for  in :\n  ',
      cursorOffset: 4,
    },
    {
      label: '对于',
      type: 'snippet',
      detail: '循环语句',
      insertText: '对于  在 :\n  ',
      cursorOffset: 3,
    },
    {
      label: 'while',
      type: 'snippet',
      detail: '循环语句',
      insertText: 'while :\n  ',
      cursorOffset: 7,
    },
    {
      label: '循环',
      type: 'snippet',
      detail: '循环语句',
      insertText: '循环 :\n  ',
      cursorOffset: 3,
    },
    {
      label: 'case',
      type: 'snippet',
      detail: '多分支语句',
      insertText: 'case \nof :\n  ',
      cursorOffset: 5,
    },
    {
      label: '情况',
      type: 'snippet',
      detail: '多分支语句',
      insertText: '情况 \n为 :\n  ',
      cursorOffset: 3,
    },
    {
      label: 'try',
      type: 'snippet',
      detail: '异常处理',
      insertText: 'try:\n  \nexcept:\n  ',
      cursorOffset: 6,
    },
    {
      label: '尝试',
      type: 'snippet',
      detail: '异常处理',
      insertText: '尝试:\n  \n异常:\n  ',
      cursorOffset: 4,
    },
    {
      label: 'block',
      type: 'snippet',
      detail: '代码块',
      insertText: 'block:\n  ',
      cursorOffset: 8,
    },
    {
      label: 'when',
      type: 'snippet',
      detail: '条件编译',
      insertText: 'when :\n  ',
      cursorOffset: 5,
    },
    {
      label: 'var',
      type: 'snippet',
      detail: '变量定义',
      insertText: 'var ',
      cursorOffset: 4,
    },
    {
      label: '变量',
      type: 'snippet',
      detail: '变量定义',
      insertText: '变量 ',
      cursorOffset: 3,
    },
    {
      label: 'let',
      type: 'snippet',
      detail: '不可变变量',
      insertText: 'let ',
      cursorOffset: 4,
    },
    {
      label: '让',
      type: 'snippet',
      detail: '不可变变量',
      insertText: '让 ',
      cursorOffset: 2,
    },
    {
      label: 'const',
      type: 'snippet',
      detail: '常量定义',
      insertText: 'const ',
      cursorOffset: 6,
    },
    {
      label: '常量',
      type: 'snippet',
      detail: '常量定义',
      insertText: '常量 ',
      cursorOffset: 3,
    },
    {
      label: 'type',
      type: 'snippet',
      detail: '类型定义',
      insertText: 'type ',
      cursorOffset: 5,
    },
    {
      label: '类型',
      type: 'snippet',
      detail: '类型定义',
      insertText: '类型 ',
      cursorOffset: 3,
    },
    {
      label: 'return',
      type: 'snippet',
      detail: '返回',
      insertText: 'return ',
      cursorOffset: 7,
    },
    {
      label: '返回',
      type: 'snippet',
      detail: '返回',
      insertText: '返回 ',
      cursorOffset: 3,
    },
    {
      label: 'import',
      type: 'snippet',
      detail: '导入模块',
      insertText: 'import ',
      cursorOffset: 7,
    },
    {
      label: '导入',
      type: 'snippet',
      detail: '导入模块',
      insertText: '导入 ',
      cursorOffset: 3,
    },
    {
      label: 'include',
      type: 'snippet',
      detail: '包含文件',
      insertText: 'include ',
      cursorOffset: 8,
    },
    {
      label: '包含',
      type: 'snippet',
      detail: '包含文件',
      insertText: '包含 ',
      cursorOffset: 3,
    },
  ];
}

export function getCompletionPrefix(code: string, position: number): string {
  let start = position - 1;
  while (start >= 0 && /[\u4e00-\u9fa5\w]/.test(code[start])) {
    start--;
  }
  return code.substring(start + 1, position);
}
