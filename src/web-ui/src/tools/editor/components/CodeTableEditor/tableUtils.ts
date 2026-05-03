export const BASIC_TYPES = [
  '整数',
  '整数8',
  '整数16',
  '整数32',
  '整数64',
  '无符号整数',
  '无符号整数8',
  '无符号整数16',
  '无符号整数32',
  '无符号整数64',
  '浮点数',
  '浮点数32',
  '浮点数64',
  '逻辑型',
  '字符串',
  '字符',
  'C字符串',
  '指针',
  '内存地址',
  '自动',
];

export interface ParamInfo {
  name: string;
  type: string;
  defaultValue: string;
  modifier: string;
  comment: string;
}

export interface CellInfo {
  text: string;
  className: string;
  fieldIndex: number;
}

export const KEYWORDS = {
  proc: { chinese: '过程', english: 'proc' },
  func: { chinese: '函数', english: 'func' },
  template: { chinese: '代码模板', english: 'template' },
  var: { chinese: '变量', english: 'var' },
  const: { chinese: '常量', english: 'const' },
  type: { chinese: '类型', english: 'type' },
  param: { chinese: '参数', english: 'param' },
  import: { chinese: '导入', english: 'import' },
  include: { chinese: '包含', english: 'include' },
};

export function parseParams(paramsStr: string): ParamInfo[] {
  const params: ParamInfo[] = [];
  const inner = paramsStr.trim();
  if (!inner || inner === '()') return params;
  
  const content = inner.replace(/^\(|\)$/g, '');
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  
  for (const char of content) {
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    
    const cMatch = p.match(/#\s*(.*)$/);
    const c = cMatch ? cMatch[1].trim() : '';
    const main = cMatch ? p.substring(0, p.indexOf('#')).trim() : p;
    
    let name = '';
    let type = '自动';
    let defaultValue = '';
    let modifier = '';
    
    const eqIdx = main.indexOf('=');
    let typePart = main;
    let valuePart = '';
    
    if (eqIdx > 0) {
      typePart = main.substring(0, eqIdx).trim();
      valuePart = main.substring(eqIdx + 1).trim();
    }
    
    const colonIdx = typePart.lastIndexOf(':');
    if (colonIdx > 0) {
      name = typePart.substring(0, colonIdx).trim();
      type = typePart.substring(colonIdx + 1).trim();
    } else {
      name = typePart;
    }
    
    const modifierMatch = name.match(/^(var|ptr|ref|static|lent|sink|out|distinct)\s+/);
    if (modifierMatch) {
      modifier = modifierMatch[1];
      name = name.substring(modifierMatch[0].length).trim();
    }
    
    if (valuePart) {
      defaultValue = valuePart;
    }
    
    params.push({
      name,
      type,
      defaultValue,
      modifier,
      comment: c
    });
  }
  
  return params;
}

export function getDisplayName(name: string | undefined): string {
  if (!name) return '';
  const needsBackticks = !name.match(/^[\w\u4e00-\u9fa5]+$/);
  return needsBackticks ? '\x60' + name + '\x60' : name;
}

export function buildProcLine(
  keyword: string,
  procName: string,
  isPublic: string,
  genericParams: string,
  params: string,
  returnType: string,
  comment: string
): string {
  let line = keyword + ' ';
  
  if (procName && procName.match(/^[\w\u4e00-\u9fa5]+$/)) {
    line += procName;
  } else if (procName) {
    line += '\x60' + procName + '\x60';
  }
  
  line += (isPublic || '');
  if (genericParams) line += '[' + genericParams + ']';
  line += '(' + params + ')';
  if (returnType) line += ': ' + returnType;
  line += ' =';
  if (comment) line += ' # ' + comment;
  
  return line;
}

export function buildVarLine(
  keyword: string,
  varName: string,
  isPublic: string,
  varType: string,
  varValue: string,
  comment: string
): string {
  let line = keyword + ' ' + varName;
  line += (isPublic || '');
  if (varType) line += ': ' + varType.trim();
  if (varValue) line += ' = ' + varValue.trim();
  if (comment) line += ' # ' + comment;
  
  return line;
}

export function buildConstLine(
  keyword: string,
  constName: string,
  isPublic: string,
  constType: string,
  constValue: string,
  comment: string
): string {
  let line = keyword + ' ' + constName;
  line += (isPublic || '');
  if (constType) line += ': ' + constType.trim();
  if (constValue) line += ' = ' + constValue.trim();
  if (comment) line += ' # ' + comment;
  
  return line;
}

export function buildTypeLine(
  keyword: string,
  typeName: string,
  isPublic: string,
  typeDef: string,
  comment: string
): string {
  let line = keyword + ' ' + typeName;
  line += (isPublic || '');
  line += ' = ' + (typeDef ? typeDef.trim() : '对象');
  if (comment) line += ' # ' + comment;
  
  return line;
}

export function buildParamLine(
  keyword: string,
  paramName: string,
  paramType: string,
  defaultValue: string,
  modifier: string,
  comment: string
): string {
  let line = keyword + ' ';
  if (modifier) line += modifier + ' ';
  line += paramName;
  if (paramType) line += ': ' + paramType;
  if (defaultValue) line += ' = ' + defaultValue;
  if (comment) line += ' # ' + comment;
  
  return line;
}
