import { BASIC_KEYWORDS, DATA_TYPES, PRAGMA_DIRECTIVES, ALL_KEYWORDS } from './keywords';

export interface CompletionItem {
  label: string;
  type: 'keyword' | 'data-type' | 'pragma' | 'snippet';
  detail?: string;
  insertText: string;
  sortText?: string;
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
      label: '过程',
      type: 'snippet',
      detail: '过程定义',
      insertText: '过程 ${1:名称}(${2:参数}): ${3:返回类型} =\n  ${4:代码}',
    },
    {
      label: '函数',
      type: 'snippet',
      detail: '函数定义',
      insertText: '函数 ${1:名称}(${2:参数}): ${3:返回类型} =\n  ${4:代码}',
    },
    {
      label: '如果',
      type: 'snippet',
      detail: '条件语句',
      insertText: '如果 ():\n  ',
    },
    {
      label: '如果否则',
      type: 'snippet',
      detail: '条件语句（含否则）',
      insertText: '如果 ${1:条件}:\n  ${2:代码}\n否则:\n  ${3:代码}',
    },
    {
      label: '对于',
      type: 'snippet',
      detail: '循环语句',
      insertText: '对于 ${1:变量} 在 ${2:集合}:\n  ${3:代码}',
    },
    {
      label: '循环',
      type: 'snippet',
      detail: '循环语句',
      insertText: '循环 ():\n  ',
    },
    {
      label: '变量',
      type: 'snippet',
      detail: '变量定义',
      insertText: '变量 ${1:名称}: ${2:类型} = ${3:值}',
    },
    {
      label: '常量',
      type: 'snippet',
      detail: '常量定义',
      insertText: '常量 ${1:名称} = ${2:值}',
    },
    {
      label: '类型',
      type: 'snippet',
      detail: '类型定义',
      insertText: '类型 ${1:名称} = ${2:定义}',
    },
    {
      label: '对象',
      type: 'snippet',
      detail: '对象定义',
      insertText: '对象 ${1:名称} = 对象\n  ${2:字段}: ${3:类型}',
    },
    {
      label: '尝试',
      type: 'snippet',
      detail: '异常处理',
      insertText: '尝试:\n  ${1:代码}\n异常 ${2:异常类型}:\n  ${3:处理}',
    },
    {
      label: '情况',
      type: 'snippet',
      detail: '多分支语句',
      insertText: '情况 ${1:表达式}\n当为 ${2:值1}:\n  ${3:代码}\n当为 ${4:值2}:\n  ${5:代码}',
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
