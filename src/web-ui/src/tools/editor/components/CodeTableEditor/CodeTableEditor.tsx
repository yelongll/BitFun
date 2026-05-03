import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { EditorProps, EditorHandle, EditCellState } from './types';
import { highlightCode } from './highlighter';
import { CompletionPopup } from './CompletionPopup';
import type { CompletionItem } from './completions';
import { getCompletions, getCompletionPrefix } from './completions';
import { BASIC_TYPES } from './tableUtils';
import { ProcTable, FuncTable, DllTable, TemplateTable, VarTable, ConstTable, TypeTable, ImportTable, IncludeTable, ParamTable, CodeLine, ParamLineData } from './TableComponents';
import { computeFlowLines } from './flowLines';
import './CodeTableEditor.scss';

const CodeTableEditor = forwardRef<EditorHandle, EditorProps>(function CodeTableEditor(
  {
    value,
    isClassModule: _isClassModule = false,
    readOnly = false,
    onChange,
    onCursorChange,
    onProblemsChange: _onProblemsChange,
    projectGlobalVars: _projectGlobalVars = [],
    projectConstants: _projectConstants = [],
    projectDataTypes: _projectDataTypes = [],
    availableTypes: customTypes = [],
  },
  ref
) {
  const [content, setContent] = useState(value);
  const [editCell, setEditCell] = useState<EditCellState | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartLine, setDragStartLine] = useState<number | null>(null);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editingLineValue, setEditingLineValue] = useState('');
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionPosition, setCompletionPosition] = useState(0);
  const [completionIndex, setCompletionIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentModalData, setCommentModalData] = useState<{
    lineIndex: number;
    fieldIndex: number;
    value: string;
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef(value);
  const isUndoRedoRef = useRef(false);
  const parseCacheRef = useRef<Map<number, { line: string; type: string; data: any }>>(new Map());

  const allTypes = useMemo(() => {
    const types = [...BASIC_TYPES];
    customTypes.forEach(t => {
      if (!types.includes(t)) types.push(t);
    });
    return types;
  }, [customTypes]);

  const lines = useMemo(() => content.split('\n'), [content]);

  const { flowMap, maxFlowDepth } = useMemo(() => {
    const result = computeFlowLines(lines);
    return { flowMap: result.map, maxFlowDepth: result.maxIndent };
  }, [lines]);

  const parseLine = useCallback((line: string, lineIndex: number) => {
    const cached = parseCacheRef.current.get(lineIndex);
    if (cached && cached.line === line) {
      return cached;
    }
    
    if (parseCacheRef.current.size > 1000) {
      const keys = Array.from(parseCacheRef.current.keys());
      keys.slice(0, 500).forEach(key => parseCacheRef.current.delete(key));
    }
    
    const trimmed = line.trim();
    let type = 'code';
    let data: any = null;
    
    // 解析参数字符串
    const parseParams = (paramsStr: string): Array<{name: string; type: string; comment: string}> => {
      const params: Array<{name: string; type: string; comment: string}> = [];
      const inner = paramsStr.trim();
      if (!inner || inner === '()') return params;
      
      const content = inner.replace(/^\(|\)$/g, '');
      const parts = content.split(',');
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const commentMatch = trimmed.match(/#\s*(.*)$/);
        const comment = commentMatch ? commentMatch[1].trim() : '';
        const mainPart = commentMatch ? trimmed.substring(0, trimmed.indexOf('#')).trim() : trimmed;
        const colonIdx = mainPart.lastIndexOf(':');
        if (colonIdx > 0) {
          params.push({
            name: mainPart.substring(0, colonIdx).trim(),
            type: mainPart.substring(colonIdx + 1).trim(),
            comment
          });
        } else {
          params.push({ name: mainPart, type: '自动', comment });
        }
      }
      return params;
    };
    
    if (trimmed.startsWith('proc ') || trimmed.startsWith('过程 ')) {
      const isDll = trimmed.includes('{.dynlib:');
      type = isDll ? 'dll' : 'proc';
      const isChinese = trimmed.startsWith('过程');
      const keyword = isChinese ? '过程' : 'proc';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, paramsStr, returnType, rest] = match;
        const procName = backtickName || normalName || '';
        const commentMatch = rest.match(/#\s*(.*)$/);
        const dynlibMatch = rest.match(/\{\.dynlib:\s*"([^"]+)"\}/);
        data = {
          procName,
          isExported: isPublic === '*',
          genericParams: genericParams || '',
          params: parseParams(paramsStr),
          returnType: returnType || '空',
          comment: commentMatch ? commentMatch[1].trim() : '',
          dllName: dynlibMatch ? dynlibMatch[1] : ''
        };
      }
    } else if (trimmed.startsWith('func ') || trimmed.startsWith('函数 ')) {
      type = 'func';
      const isChinese = trimmed.startsWith('函数');
      const keyword = isChinese ? '函数' : 'func';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, paramsStr, returnType, rest] = match;
        const funcName = backtickName || normalName || '';
        const commentMatch = rest.match(/#\s*(.*)$/);
        data = {
          funcName,
          isExported: isPublic === '*',
          genericParams: genericParams || '',
          params: parseParams(paramsStr),
          returnType: returnType || '空',
          comment: commentMatch ? commentMatch[1].trim() : ''
        };
      }
    } else if (trimmed.startsWith('template ') || trimmed.startsWith('代码模板 ')) {
      type = 'template';
      const isChinese = trimmed.startsWith('代码模板');
      const keyword = isChinese ? '代码模板' : 'template';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, paramsStr, returnType, rest] = match;
        const templateName = backtickName || normalName || '';
        const commentMatch = rest.match(/#\s*(.*)$/);
        data = {
          templateName,
          isExported: isPublic === '*',
          genericParams: genericParams || '',
          params: parseParams(paramsStr),
          returnType: returnType || '空',
          comment: commentMatch ? commentMatch[1].trim() : ''
        };
      }
    } else if (trimmed.startsWith('param ') || trimmed.startsWith('参数 ')) {
      type = 'param';
      const isChinese = trimmed.startsWith('参数');
      const keyword = isChinese ? '参数' : 'param';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5]+))?\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, paramName, paramType, comment] = match;
        data = { paramName, paramType: paramType || '自动', comment: comment || '' };
      }
    } else if (trimmed.startsWith('var ') || trimmed.startsWith('变量 ')) {
      type = 'var';
      const isChinese = trimmed.startsWith('变量');
      const keyword = isChinese ? '变量' : 'var';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*(?:=\\s*([^#]*?))?\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, varName, isPublic, varType, varValue, comment] = match;
        data = {
          varName,
          isExported: isPublic === '*',
          varType: varType ? varType.trim() : '自动',
          varValue: varValue ? varValue.trim() : '',
          comment: comment ? comment.trim() : ''
        };
      }
    } else if (trimmed.startsWith('const ') || trimmed.startsWith('常量 ')) {
      type = 'const';
      const isChinese = trimmed.startsWith('常量');
      const keyword = isChinese ? '常量' : 'const';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*=\\s*([^#]*?)\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, constName, isPublic, constType, constValue, comment] = match;
        data = {
          constName,
          isExported: isPublic === '*',
          constType: constType ? constType.trim() : '自动',
          constValue: constValue ? constValue.trim() : '',
          comment: comment ? comment.trim() : ''
        };
      }
    } else if (trimmed.startsWith('type ') || trimmed.startsWith('类型 ')) {
      type = 'type';
      const isChinese = trimmed.startsWith('类型');
      const keyword = isChinese ? '类型' : 'type';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*=\\s*(对象|引用 对象|[\\w\\u4e00-\\u9fa5]+)?\\s*(?:继承\\s+([\\w\\u4e00-\\u9fa5]+))?\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, typeName, isPublic, typeKind, baseType, comment] = match;
        data = {
          typeName,
          isExported: isPublic === '*',
          typeKind: typeKind || '对象',
          baseType: baseType || '',
          comment: comment || ''
        };
      }
    } else if (trimmed.startsWith('import ') || trimmed.startsWith('导入 ')) {
      type = 'import';
      const importContent = trimmed.startsWith('import ') ? trimmed.substring(7) : trimmed.substring(3);
      const commentMatch = importContent.match(/#\s*(.*)$/);
      const importPart = commentMatch ? importContent.substring(0, importContent.indexOf('#')).trim() : importContent.trim();
      
      let moduleName = importPart;
      let importType = 'all';
      let symbols = '';
      
      const exceptMatch = importPart.match(/^(.+?)\s+except\s+(.+)$/i);
      const exceptMatchCn = importPart.match(/^(.+?)\s+排除\s+(.+)$/);
      if (exceptMatch) {
        importType = 'except';
        moduleName = exceptMatch[1].trim();
        symbols = exceptMatch[2].trim();
      } else if (exceptMatchCn) {
        importType = 'except';
        moduleName = exceptMatchCn[1].trim();
        symbols = exceptMatchCn[2].trim();
      }
      
      data = {
        moduleName,
        importType,
        symbols,
        comment: commentMatch ? commentMatch[1].trim() : ''
      };
    } else if (trimmed.startsWith('from ') || trimmed.startsWith('选择导入 ')) {
      type = 'import';
      const fromContent = trimmed.startsWith('from ') ? trimmed.substring(5) : trimmed.substring(4);
      const commentMatch = fromContent.match(/#\s*(.*)$/);
      const fromPart = commentMatch ? fromContent.substring(0, fromContent.indexOf('#')).trim() : fromContent.trim();
      
      const importMatch = fromPart.match(/^(.+?)\s+import\s+(.+)$/i);
      const importMatchCn = fromPart.match(/^(.+?)\s+导入\s+(.+)$/);
      
      if (importMatch) {
        data = {
          moduleName: importMatch[1].trim(),
          importType: 'selective',
          symbols: importMatch[2].trim(),
          comment: commentMatch ? commentMatch[1].trim() : ''
        };
      } else if (importMatchCn) {
        data = {
          moduleName: importMatchCn[1].trim(),
          importType: 'selective',
          symbols: importMatchCn[2].trim(),
          comment: commentMatch ? commentMatch[1].trim() : ''
        };
      } else {
        data = {
          moduleName: fromPart,
          importType: 'all',
          symbols: '',
          comment: commentMatch ? commentMatch[1].trim() : ''
        };
      }
    } else if (trimmed.startsWith('include ') || trimmed.startsWith('包含 ')) {
      type = 'include';
      const includeContent = trimmed.startsWith('include ') ? trimmed.substring(8) : trimmed.substring(3);
      const commentMatch = includeContent.match(/#\s*(.*)$/);
      const includePart = commentMatch ? includeContent.substring(0, includeContent.indexOf('#')).trim() : includeContent.trim();
      
      data = {
        fileName: includePart,
        comment: commentMatch ? commentMatch[1].trim() : ''
      };
    }
    
    const result = { line, type, data };
    parseCacheRef.current.set(lineIndex, result);
    return result;
  }, []);

  useEffect(() => {
    if (value !== lastContentRef.current) {
      setContent(value);
      lastContentRef.current = value;
      parseCacheRef.current.clear();
    }
  }, [value]);

  useEffect(() => {
    if (textareaRef.current && editingLine !== null) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [editingLineValue, editingLine]);

  const updateContent = useCallback((newContent: string) => {
    lastContentRef.current = newContent;
    setContent(newContent);
    onChange?.(newContent);
    
    if (!isUndoRedoRef.current) {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        if (newHistory.length > 100) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 99));
    }
    isUndoRedoRef.current = false;
  }, [onChange, historyIndex]);

  const handleCellClick = useCallback((lineIndex: number, cellIndex: number, fieldIndex: number, currentValue: string) => {
    if (readOnly) return;
    setSelectedLines(new Set());
    setEditCell({ lineIndex, cellIndex, fieldIndex, value: currentValue });
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [readOnly]);

  const handleCellCommit = useCallback(() => {
    if (!editCell) return;
    
    const newLines = [...lines];
    const line = newLines[editCell.lineIndex];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('proc ') || trimmed.startsWith('过程 ')) {
      const isChinese = trimmed.startsWith('过程');
      const keyword = isChinese ? '过程' : 'proc';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, params, returnType, rest] = match;
        const procName = backtickName || normalName || '';
        const commentMatch = rest.match(/#\s*(.*)$/);
        const comment = commentMatch ? commentMatch[1].trim() : '';
        
        let newLine = keyword + ' ';
        
        if (editCell.fieldIndex === 0) {
          if (editValue && editValue.match(/^[\w\u4e00-\u9fa5]+$/)) {
            newLine += editValue;
          } else if (editValue) {
            newLine += '\x60' + editValue + '\x60';
          }
        } else {
          if (procName && procName.match(/^[\w\u4e00-\u9fa5]+$/)) {
            newLine += procName;
          } else if (procName) {
            newLine += '\x60' + procName + '\x60';
          }
        }
        
        if (editCell.fieldIndex === 3) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (editCell.fieldIndex === 1) {
          newLine += '[' + editValue + ']';
        } else if (genericParams) {
          newLine += '[' + genericParams + ']';
        }
        
        newLine += '(' + params + ')';
        
        if (editCell.fieldIndex === 2) {
          newLine += ': ' + editValue;
        } else {
          newLine += returnType ? ': ' + returnType : '';
        }
        
        newLine += ' =';
        
        if (editCell.fieldIndex === 4) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment;
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('func ') || trimmed.startsWith('函数 ')) {
      const isChinese = trimmed.startsWith('函数');
      const keyword = isChinese ? '函数' : 'func';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, params, returnType, rest] = match;
        const funcName = backtickName || normalName || '';
        const commentMatch = rest.match(/#\s*(.*)$/);
        const comment = commentMatch ? commentMatch[1].trim() : '';
        
        let newLine = keyword + ' ';
        
        if (editCell.fieldIndex === 0) {
          if (editValue && editValue.match(/^[\w\u4e00-\u9fa5]+$/)) {
            newLine += editValue;
          } else if (editValue) {
            newLine += '\x60' + editValue + '\x60';
          }
        } else {
          if (funcName && funcName.match(/^[\w\u4e00-\u9fa5]+$/)) {
            newLine += funcName;
          } else if (funcName) {
            newLine += '\x60' + funcName + '\x60';
          }
        }
        
        if (editCell.fieldIndex === 3) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (editCell.fieldIndex === 1) {
          newLine += '[' + editValue + ']';
        } else if (genericParams) {
          newLine += '[' + genericParams + ']';
        }
        
        newLine += '(' + params + ')';
        
        if (editCell.fieldIndex === 2) {
          newLine += ': ' + editValue;
        } else {
          newLine += returnType ? ': ' + returnType : '';
        }
        
        newLine += ' =';
        
        if (editCell.fieldIndex === 4) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment;
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('template ') || trimmed.startsWith('代码模板 ')) {
      const isChinese = trimmed.startsWith('代码模板');
      const keyword = isChinese ? '代码模板' : 'template';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, params, returnType, rest] = match;
        const templateName = backtickName || normalName || '';
        const commentMatch = rest.match(/#\s*(.*)$/);
        const comment = commentMatch ? commentMatch[1].trim() : '';
        
        let newLine = keyword + ' ';
        
        if (editCell.fieldIndex === 0) {
          if (editValue && editValue.match(/^[\w\u4e00-\u9fa5]+$/)) {
            newLine += editValue;
          } else if (editValue) {
            newLine += '\x60' + editValue + '\x60';
          }
        } else {
          if (templateName && templateName.match(/^[\w\u4e00-\u9fa5]+$/)) {
            newLine += templateName;
          } else if (templateName) {
            newLine += '\x60' + templateName + '\x60';
          }
        }
        
        if (editCell.fieldIndex === 3) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (editCell.fieldIndex === 1) {
          newLine += '[' + editValue + ']';
        } else if (genericParams) {
          newLine += '[' + genericParams + ']';
        }
        
        newLine += '(' + params + ')';
        
        if (editCell.fieldIndex === 2) {
          newLine += ': ' + editValue;
        } else {
          newLine += returnType ? ': ' + returnType : '';
        }
        
        newLine += ' =';
        
        if (editCell.fieldIndex === 4) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment;
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('param ') || trimmed.startsWith('参数 ')) {
      const isChinese = trimmed.startsWith('参数');
      const keyword = isChinese ? '参数' : 'param';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)\\s*(?::\\s*([^#=]*?))?(?:=\\s*([^#]*?))?\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, paramName, paramType, defaultValue, comment] = match;
        
        let newLine = keyword + ' ';
        if (editCell.fieldIndex === 0) {
          newLine += editValue;
        } else {
          newLine += paramName;
        }
        
        if (editCell.fieldIndex === 1) {
          newLine += ': ' + editValue;
        } else {
          newLine += paramType ? ': ' + paramType.trim() : '';
        }
        
        if (editCell.fieldIndex === 2) {
          newLine += ' = ' + editValue;
        } else if (defaultValue) {
          newLine += ' = ' + defaultValue.trim();
        }
        
        if (editCell.fieldIndex === 3) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment.trim();
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('var ') || trimmed.startsWith('变量 ')) {
      const isChinese = trimmed.startsWith('变量');
      const keyword = isChinese ? '变量' : 'var';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*(?:=\\s*([^#]*?))?\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, varName, isPublic, varType, varValue, comment] = match;
        
        let newLine = keyword + ' ';
        if (editCell.fieldIndex === 0) {
          newLine += editValue;
        } else {
          newLine += varName;
        }
        
        if (editCell.fieldIndex === 3) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (editCell.fieldIndex === 1) {
          newLine += ': ' + editValue;
        } else {
          newLine += varType ? ': ' + varType.trim() : '';
        }
        
        if (editCell.fieldIndex === 2) {
          newLine += ' = ' + editValue;
        } else if (varValue) {
          newLine += ' = ' + varValue.trim();
        }
        
        if (editCell.fieldIndex === 4) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment.trim();
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('const ') || trimmed.startsWith('常量 ')) {
      const isChinese = trimmed.startsWith('常量');
      const keyword = isChinese ? '常量' : 'const';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*=\\s*([^#]*?)\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, constName, isPublic, constType, constValue, comment] = match;
        
        let newLine = keyword + ' ';
        if (editCell.fieldIndex === 0) {
          newLine += editValue;
        } else {
          newLine += constName;
        }
        
        if (editCell.fieldIndex === 3) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (editCell.fieldIndex === 1) {
          newLine += ': ' + editValue;
        } else {
          newLine += constType ? ': ' + constType.trim() : '';
        }
        
        if (editCell.fieldIndex === 2) {
          newLine += ' = ' + editValue;
        } else if (constValue) {
          newLine += ' = ' + constValue.trim();
        }
        
        if (editCell.fieldIndex === 4) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment.trim();
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('func ') || trimmed.startsWith('函数 ')) {
      const isChinese = trimmed.startsWith('函数');
      const keyword = isChinese ? '函数' : 'func';
      // 支持反引号名称和类型约束
      const namePattern = '(?:\\x60([^\\x60]+)\\x60|[\\w\\u4e00-\\u9fa5]+)';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|<>|#]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, funcName, isPublic, genericParams, params, returnType, rest] = match;
        const commentMatch = rest.match(/#\s*(.*)$/);
        const comment = commentMatch ? commentMatch[1].trim() : '';
        
        let newLine = keyword + ' ';
        if (funcName && funcName.match(/[\w\u4e00-\u9fa5]+/)) {
          newLine += funcName;
        } else if (funcName) {
          newLine += '\x60' + funcName + '\x60';
        }
        
        if (editCell.fieldIndex === 2) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (genericParams) {
          newLine += '[' + genericParams + ']';
        }
        
        newLine += params;
        
        if (editCell.fieldIndex === 1) {
          newLine += ': ' + editValue;
        } else {
          newLine += returnType ? ': ' + returnType.trim() : '';
        }
        
        newLine += ' =';
        
        if (editCell.fieldIndex === 3) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment;
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('template ') || trimmed.startsWith('代码模板 ')) {
      const isChinese = trimmed.startsWith('代码模板');
      const keyword = isChinese ? '代码模板' : 'template';
      // 支持反引号名称和类型约束
      const namePattern = '(?:\\x60([^\\x60]+)\\x60|[\\w\\u4e00-\\u9fa5]+)';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|<>|#]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, templateName, isPublic, genericParams, params, returnType, rest] = match;
        const commentMatch = rest.match(/#\s*(.*)$/);
        const comment = commentMatch ? commentMatch[1].trim() : '';
        
        let newLine = keyword + ' ';
        if (templateName && templateName.match(/[\w\u4e00-\u9fa5]+/)) {
          newLine += templateName;
        } else if (templateName) {
          newLine += '\x60' + templateName + '\x60';
        }
        
        if (editCell.fieldIndex === 2) {
          newLine += editValue === '公开' ? '*' : '';
        } else {
          newLine += isPublic || '';
        }
        
        if (genericParams) {
          newLine += '[' + genericParams + ']';
        }
        
        newLine += params;
        
        if (editCell.fieldIndex === 1) {
          newLine += ': ' + editValue;
        } else {
          newLine += returnType ? ': ' + returnType : '';
        }
        
        newLine += ' =';
        
        if (editCell.fieldIndex === 3) {
          newLine += ' # ' + editValue;
        } else if (comment) {
          newLine += ' # ' + comment;
        }
        
        newLines[editCell.lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    }
    
    setEditCell(null);
    setEditValue('');
  }, [editCell, editValue, lines, updateContent]);

  const handleCommentSave = useCallback((newValue: string) => {
    if (!commentModalData) return;
    
    const { lineIndex, fieldIndex: _fieldIndex } = commentModalData;
    const newLines = [...lines];
    const line = newLines[lineIndex];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('proc ') || trimmed.startsWith('过程 ')) {
      const isChinese = trimmed.startsWith('过程');
      const keyword = isChinese ? '过程' : 'proc';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, params, returnType, _rest] = match;
        const procName = backtickName || normalName || '';
        
        let newLine = keyword + ' ';
        if (procName && procName.match(/^[\w\u4e00-\u9fa5]+$/)) {
          newLine += procName;
        } else if (procName) {
          newLine += '\x60' + procName + '\x60';
        }
        
        newLine += (isPublic || '');
        if (genericParams) newLine += '[' + genericParams + ']';
        newLine += '(' + params + ')';
        if (returnType) newLine += ': ' + returnType;
        newLine += ' =';
        if (newValue) newLine += ' # ' + newValue;
        
        newLines[lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('func ') || trimmed.startsWith('函数 ')) {
      const isChinese = trimmed.startsWith('函数');
      const keyword = isChinese ? '函数' : 'func';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, params, returnType, _rest] = match;
        const funcName = backtickName || normalName || '';
        
        let newLine = keyword + ' ';
        if (funcName && funcName.match(/^[\w\u4e00-\u9fa5]+$/)) {
          newLine += funcName;
        } else if (funcName) {
          newLine += '\x60' + funcName + '\x60';
        }
        
        newLine += (isPublic || '');
        if (genericParams) newLine += '[' + genericParams + ']';
        newLine += '(' + params + ')';
        if (returnType) newLine += ': ' + returnType;
        newLine += ' =';
        if (newValue) newLine += ' # ' + newValue;
        
        newLines[lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('template ') || trimmed.startsWith('代码模板 ')) {
      const isChinese = trimmed.startsWith('代码模板');
      const keyword = isChinese ? '代码模板' : 'template';
      const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
      if (match) {
        const [, backtickName, normalName, isPublic, genericParams, params, returnType, _rest] = match;
        const templateName = backtickName || normalName || '';
        
        let newLine = keyword + ' ';
        if (templateName && templateName.match(/^[\w\u4e00-\u9fa5]+$/)) {
          newLine += templateName;
        } else if (templateName) {
          newLine += '\x60' + templateName + '\x60';
        }
        
        newLine += (isPublic || '');
        if (genericParams) newLine += '[' + genericParams + ']';
        newLine += '(' + params + ')';
        if (returnType) newLine += ': ' + returnType;
        newLine += ' =';
        if (newValue) newLine += ' # ' + newValue;
        
        newLines[lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('var ') || trimmed.startsWith('变量 ')) {
      const isChinese = trimmed.startsWith('变量');
      const keyword = isChinese ? '变量' : 'var';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*(?:=\\s*([^#]*?))?\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, varName, isPublic, varType, varValue, _comment] = match;
        
        let newLine = keyword + ' ' + varName;
        newLine += (isPublic || '');
        if (varType) newLine += ': ' + varType.trim();
        if (varValue) newLine += ' = ' + varValue.trim();
        if (newValue) newLine += ' # ' + newValue;
        
        newLines[lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('const ') || trimmed.startsWith('常量 ')) {
      const isChinese = trimmed.startsWith('常量');
      const keyword = isChinese ? '常量' : 'const';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*=\\s*([^#]*?)\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, constName, isPublic, constType, constValue, _comment] = match;
        
        let newLine = keyword + ' ' + constName;
        newLine += (isPublic || '');
        if (constType) newLine += ': ' + constType.trim();
        if (constValue) newLine += ' = ' + constValue.trim();
        if (newValue) newLine += ' # ' + newValue;
        
        newLines[lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    } else if (trimmed.startsWith('type ') || trimmed.startsWith('类型 ')) {
      const isChinese = trimmed.startsWith('类型');
      const keyword = isChinese ? '类型' : 'type';
      const match = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*=\\s*([^#]*?)\\s*(?:#\\s*(.*))?$`));
      if (match) {
        const [, typeName, isPublic, typeDef, _comment] = match;
        
        let newLine = keyword + ' ' + typeName;
        newLine += (isPublic || '');
        newLine += ' = ' + (typeDef ? typeDef.trim() : '对象');
        if (newValue) newLine += ' # ' + newValue;
        
        newLines[lineIndex] = newLine;
        updateContent(newLines.join('\n'));
      }
    }
    
    setShowCommentModal(false);
    setCommentModalData(null);
  }, [commentModalData, lines, updateContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellCommit();
    } else if (e.key === 'Escape') {
      setEditCell(null);
      setEditValue('');
    }
  }, [handleCellCommit]);

  const handleLineMouseDown = useCallback((lineIndex: number, e: React.MouseEvent) => {
    if (editCell || editingLine !== null) return;
    
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
    }
    
    if (e.shiftKey && selectedLines.size > 0) {
      const min = Math.min(...Array.from(selectedLines));
      const max = Math.max(lineIndex, min);
      const newSelection = new Set<number>();
      for (let i = min; i <= max; i++) {
        newSelection.add(i);
      }
      setSelectedLines(newSelection);
    } else {
      setSelectedLines(new Set([lineIndex]));
      setDragStartLine(lineIndex);
      setIsDragging(true);
    }
    setCurrentLineIndex(lineIndex);
    onCursorChange?.(lineIndex + 1, 1);
  }, [editCell, editingLine, selectedLines, onCursorChange]);

  const handleLineMouseEnter = useCallback((lineIndex: number) => {
    if (!isDragging || dragStartLine === null) return;
    const min = Math.min(dragStartLine, lineIndex);
    const max = Math.max(dragStartLine, lineIndex);
    const newSelection = new Set<number>();
    for (let i = min; i <= max; i++) {
      newSelection.add(i);
    }
    setSelectedLines(newSelection);
  }, [isDragging, dragStartLine]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartLine(null);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (editCell || editingLine !== null) return;
    const clipText = e.clipboardData.getData('text/plain');
    if (!clipText) return;
    e.preventDefault();
    const clipLines = clipText.split('\n');
    const insertAfter = selectedLines.size > 0
      ? Math.max(...Array.from(selectedLines))
      : currentLineIndex !== null
        ? currentLineIndex
        : -1;
    if (insertAfter < 0) return;
    const newLines = [...lines];
    newLines.splice(insertAfter + 1, 0, ...clipLines);
    updateContent(newLines.join('\n'));
    const newSelection = new Set<number>();
    for (let i = insertAfter + 1; i <= insertAfter + clipLines.length; i++) {
      newSelection.add(i);
    }
    setSelectedLines(newSelection);
  }, [editCell, editingLine, selectedLines, currentLineIndex, lines, updateContent]);

  const handleLineEditCommit = useCallback(() => {
    if (editingLine === null) return;
    
    const newLines = [...lines];
    newLines[editingLine] = editingLineValue;
    updateContent(newLines.join('\n'));
    
    setEditingLine(null);
    setEditingLineValue('');
  }, [editingLine, editingLineValue, lines, updateContent]);

  const handleKeyDownGlobal = useCallback((e: React.KeyboardEvent) => {
    if (editCell || editingLine !== null) return;
    
    if (e.key === 'Delete' && selectedLines.size > 0) {
      e.preventDefault();
      const newLines = lines.filter((_, i) => !selectedLines.has(i));
      updateContent(newLines.join('\n'));
      setSelectedLines(new Set());
    }
    
    if (e.key === 'Tab' && selectedLines.size > 0) {
      e.preventDefault();
      const newLines = [...lines];
      const indent = e.shiftKey ? -2 : 2;
      
      selectedLines.forEach(lineIndex => {
        const line = newLines[lineIndex];
        if (indent > 0) {
          newLines[lineIndex] = ' '.repeat(indent) + line;
        } else {
          const currentIndent = line.length - line.trimStart().length;
          const removeSpaces = Math.min(currentIndent, Math.abs(indent));
          newLines[lineIndex] = line.substring(removeSpaces);
        }
      });
      
      updateContent(newLines.join('\n'));
    }
    
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c' && selectedLines.size > 0) {
        e.preventDefault();
        const selectedContent = lines
          .filter((_, i) => selectedLines.has(i))
          .join('\n');
        navigator.clipboard.writeText(selectedContent);
      } else if (e.key === 'x' && selectedLines.size > 0) {
        e.preventDefault();
        const selectedContent = lines
          .filter((_, i) => selectedLines.has(i))
          .join('\n');
        navigator.clipboard.writeText(selectedContent);
        const newLines = lines.filter((_, i) => !selectedLines.has(i));
        updateContent(newLines.join('\n'));
        setSelectedLines(new Set());
      } else if (e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then(clipText => {
          if (!clipText) return;
          const clipLines = clipText.split('\n');
          const insertAfter = selectedLines.size > 0
            ? Math.max(...Array.from(selectedLines))
            : currentLineIndex !== null
              ? currentLineIndex
              : -1;
          if (insertAfter < 0) return;
          const newLines = [...lines];
          newLines.splice(insertAfter + 1, 0, ...clipLines);
          updateContent(newLines.join('\n'));
          const newSelection = new Set<number>();
          for (let i = insertAfter + 1; i <= insertAfter + clipLines.length; i++) {
            newSelection.add(i);
          }
          setSelectedLines(newSelection);
        });
      } else if (e.key === 'a') {
        e.preventDefault();
        const allLines = new Set<number>();
        for (let i = 0; i < lines.length; i++) {
          allLines.add(i);
        }
        setSelectedLines(allLines);
      } else if (e.key === 'z') {
        e.preventDefault();
        if (historyIndex > 0) {
          isUndoRedoRef.current = true;
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const prevContent = history[newIndex];
          setContent(prevContent);
          lastContentRef.current = prevContent;
          onChange?.(prevContent);
          parseCacheRef.current.clear();
        }
      } else if (e.key === 'y') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          isUndoRedoRef.current = true;
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const nextContent = history[newIndex];
          setContent(nextContent);
          lastContentRef.current = nextContent;
          onChange?.(nextContent);
          parseCacheRef.current.clear();
        }
      }
    }
  }, [editCell, editingLine, selectedLines, lines, updateContent, content]);

  const renderEditableCell = useCallback((
    lineIndex: number,
    cellIndex: number,
    cell: { text: string; className: string; fieldIndex: number },
    cellType: 'text' | 'type' | 'public' = 'text'
  ) => {
    const isEditing = editCell?.lineIndex === lineIndex && editCell?.cellIndex === cellIndex;
    
    if (cellType === 'public') {
      const isPublic = cell.text.trim() === '公开' || cell.text.trim() === '是';
      
      const updatePublicStatus = (makePublic: boolean) => {
        if (readOnly) return;
        const newLines = [...lines];
        const line = newLines[lineIndex];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('proc ') || trimmed.startsWith('过程 ')) {
          const isChinese = trimmed.startsWith('过程');
          const keyword = isChinese ? '过程' : 'proc';
          const match = trimmed.match(new RegExp(`^(${keyword}\\s+[\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*\\(`));
          if (match) {
            const newLine = makePublic 
              ? trimmed.replace(match[0], `${match[1]}*(`)
              : trimmed.replace(match[0], `${match[1]}(`);
            newLines[lineIndex] = newLine;
            updateContent(newLines.join('\n'));
          }
        } else if (trimmed.startsWith('var ') || trimmed.startsWith('变量 ')) {
          const isChinese = trimmed.startsWith('变量');
          const keyword = isChinese ? '变量' : 'var';
          const match = trimmed.match(new RegExp(`^(${keyword}\\s+[\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*:`));
          if (match) {
            const newLine = makePublic 
              ? trimmed.replace(match[0], `${match[1]}*:`)
              : trimmed.replace(match[0], `${match[1]}:`);
            newLines[lineIndex] = newLine;
            updateContent(newLines.join('\n'));
          }
        } else if (trimmed.startsWith('const ') || trimmed.startsWith('常量 ')) {
          const isChinese = trimmed.startsWith('常量');
          const keyword = isChinese ? '常量' : 'const';
          const match = trimmed.match(new RegExp(`^(${keyword}\\s+[\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*=`));
          if (match) {
            const newLine = makePublic 
              ? trimmed.replace(match[0], `${match[1]}* =`)
              : trimmed.replace(match[0], `${match[1]}=`);
            newLines[lineIndex] = newLine;
            updateContent(newLines.join('\n'));
          }
        } else if (trimmed.startsWith('type ') || trimmed.startsWith('类型 ')) {
          const isChinese = trimmed.startsWith('类型');
          const keyword = isChinese ? '类型' : 'type';
          const match = trimmed.match(new RegExp(`^(${keyword}\\s+[\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*=`));
          if (match) {
            const newLine = makePublic 
              ? trimmed.replace(match[0], `${match[1]}* =`)
              : trimmed.replace(match[0], `${match[1]}=`);
            newLines[lineIndex] = newLine;
            updateContent(newLines.join('\n'));
          }
        } else if (trimmed.startsWith('func ') || trimmed.startsWith('函数 ')) {
          const isChinese = trimmed.startsWith('函数');
          const keyword = isChinese ? '函数' : 'func';
          const match = trimmed.match(new RegExp(`^(${keyword}\\s+[\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*\\(`));
          if (match) {
            const newLine = makePublic 
              ? trimmed.replace(match[0], `${match[1]}*(`)
              : trimmed.replace(match[0], `${match[1]}(`);
            newLines[lineIndex] = newLine;
            updateContent(newLines.join('\n'));
          }
        } else if (trimmed.startsWith('template ') || trimmed.startsWith('代码模板 ')) {
          const isChinese = trimmed.startsWith('代码模板');
          const keyword = isChinese ? '代码模板' : 'template';
          const match = trimmed.match(new RegExp(`^(${keyword}\\s+[\\w\\u4e00-\\u9fa5\`]+)(\\*)?\\s*\\(`));
          if (match) {
            const newLine = makePublic 
              ? trimmed.replace(match[0], `${match[1]}*(`)
              : trimmed.replace(match[0], `${match[1]}(`);
            newLines[lineIndex] = newLine;
            updateContent(newLines.join('\n'));
          }
        }
      };
      
      return (
        <div
          key={cellIndex}
          className={`code-table__table-cell ${cell.className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <select
            className="code-table__select code-table__select--public"
            value={isPublic ? 'true' : 'false'}
            onChange={(e) => updatePublicStatus(e.target.value === 'true')}
            disabled={readOnly}
          >
            <option value="false">假</option>
            <option value="true">真</option>
          </select>
        </div>
      );
    }

    if (cellType === 'type' && isEditing) {
      return (
        <div key={cellIndex} className={`code-table__table-cell ${cell.className}`}>
          <select
            ref={selectRef}
            className="code-table__select"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCellCommit();
              } else if (e.key === 'Escape') {
                setEditCell(null);
                setEditValue('');
              }
            }}
            onBlur={handleCellCommit}
            autoFocus
          >
            <option value="">选择类型</option>
            {allTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      );
    }
    
    const isRemarkCell = cell.fieldIndex === 4;
    
    return (
      <div
        key={cellIndex}
        className={`code-table__table-cell ${cell.className}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly) {
            if (isRemarkCell) {
              setCommentModalData({
                lineIndex,
                fieldIndex: cell.fieldIndex,
                value: cell.text
              });
              setShowCommentModal(true);
            } else {
              handleCellClick(lineIndex, cellIndex, cell.fieldIndex, cell.text);
            }
          }
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="code-table__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCellCommit}
            autoFocus
          />
        ) : (
          <span className={isRemarkCell && cell.text ? 'code-table__remark-text' : ''}>{cell.text || '\u00A0'}</span>
        )}
      </div>
    );
  }, [editCell, editValue, readOnly, allTypes, handleCellClick, handleCellCommit, handleKeyDown, lines, updateContent]);

  const renderParamCell = useCallback((
    lineIndex: number,
    cellIndex: number,
    cell: { text: string; className: string; fieldIndex: number },
    cellType: 'text' | 'type' = 'text'
  ) => {
    const isEditing = editCell?.lineIndex === lineIndex && editCell?.fieldIndex === cell.fieldIndex;
    
    if (cellType === 'type' && isEditing) {
      return (
        <div key={cellIndex} className={`code-table__table-cell ${cell.className}`}>
          <select
            ref={selectRef}
            className="code-table__select"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCellCommit();
              } else if (e.key === 'Escape') {
                setEditCell(null);
                setEditValue('');
              }
            }}
            onBlur={handleCellCommit}
            autoFocus
          >
            <option value="">选择类型</option>
            {allTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      );
    }
    
    const isRemarkCell = cell.fieldIndex === 3;
    
    return (
      <div
        key={cellIndex}
        className={`code-table__table-cell ${cell.className}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly && cell.fieldIndex >= 0) {
            if (isRemarkCell) {
              setCommentModalData({
                lineIndex,
                fieldIndex: cell.fieldIndex,
                value: cell.text
              });
              setShowCommentModal(true);
            } else {
              handleCellClick(lineIndex, cellIndex, cell.fieldIndex, cell.text);
            }
          }
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="code-table__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCellCommit}
            autoFocus
          />
        ) : (
          <span className={isRemarkCell && cell.text ? 'code-table__remark-text' : ''}>{cell.text || '\u00A0'}</span>
        )}
      </div>
    );
  }, [editCell, editValue, readOnly, allTypes, handleCellClick, handleCellCommit, handleKeyDown]);

  const insertSubroutine = useCallback(() => {
    const newLine = 'proc 新子程序*(): 整数 = # 子程序说明';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertParamAfterProc = useCallback((procLineIndex: number) => {
    const newLine = '  param 新参数: 整数 # 参数说明';
    const newLines = [...lines];
    
    let insertIndex = procLineIndex + 1;
    for (let i = procLineIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('param ') || trimmed.startsWith('参数 ')) {
        insertIndex = i + 1;
      } else if (trimmed && !trimmed.startsWith('param ') && !trimmed.startsWith('参数 ')) {
        break;
      }
    }
    
    newLines.splice(insertIndex, 0, newLine);
    updateContent(newLines.join('\n'));
  }, [lines, updateContent]);

  const insertLocalVarAfterProc = useCallback((procLineIndex: number) => {
    const newLine = '  var 新变量: 整数 # 变量说明';
    const newLines = [...lines];
    
    let insertIndex = procLineIndex + 1;
    for (let i = procLineIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('param ') || trimmed.startsWith('参数 ') || 
          trimmed.startsWith('var ') || trimmed.startsWith('变量 ')) {
        insertIndex = i + 1;
      } else if (trimmed && !trimmed.startsWith('param ') && !trimmed.startsWith('参数 ') &&
                 !trimmed.startsWith('var ') && !trimmed.startsWith('变量 ')) {
        break;
      }
    }
    
    newLines.splice(insertIndex, 0, newLine);
    updateContent(newLines.join('\n'));
  }, [lines, updateContent]);

  const insertLocalVariable = useCallback(() => {
    const newLine = '  var 新变量: 整数 # 变量说明';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertGlobalVariable = useCallback(() => {
    const newLine = 'var 新全局变量*: 整数 # 全局变量说明';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertAssemblyVariable = useCallback(() => {
    const newLine = 'var 新程序集变量: 整数 # 程序集变量说明';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertParameter = useCallback(() => {
    const newLine = '  param 新参数: 整数 # 参数说明';
    
    if (!content) {
      updateContent(newLine);
      return;
    }
    
    const lines = content.split('\n');
    let lastProcIndex = -1;
    let lastParamIndex = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('proc ')) {
        lastProcIndex = i;
        break;
      }
    }
    
    if (lastProcIndex === -1) {
      const newContent = content + '\n' + newLine;
      updateContent(newContent);
      return;
    }
    
    for (let i = lastProcIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('param ')) {
        lastParamIndex = i;
      } else if (trimmed && !trimmed.startsWith('param ')) {
        break;
      }
    }
    
    const insertIndex = lastParamIndex >= 0 ? lastParamIndex + 1 : lastProcIndex + 1;
    const newLines = [...lines];
    newLines.splice(insertIndex, 0, newLine);
    updateContent(newLines.join('\n'));
  }, [content, updateContent]);

  const insertConstant = useCallback(() => {
    const newLine = 'const 新常量* = 0 # 常量说明';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertDataType = useCallback(() => {
    const newLine = 'type 新数据类型* = 对象 # 数据类型说明';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertDllCommand = useCallback(() => {
    const newLine = 'proc 新DLL命令*(): 整数 {.dynlib: "user32.dll".}';
    const newContent = content ? content + '\n' + newLine : newLine;
    updateContent(newContent);
  }, [content, updateContent]);

  const insertCodeLine = useCallback(() => {
    const newLine = '  # 在这里输入代码';
    
    if (selectedLines.size > 0) {
      const maxLine = Math.max(...Array.from(selectedLines));
      const newLines = [...lines];
      newLines.splice(maxLine + 1, 0, newLine);
      updateContent(newLines.join('\n'));
      setSelectedLines(new Set([maxLine + 1]));
    } else {
      const newContent = content ? content + '\n' + newLine : newLine;
      updateContent(newContent);
    }
  }, [content, updateContent, lines, selectedLines]);

  useImperativeHandle(ref, () => ({
    insertSubroutine,
    insertVariable: (type) => {
      if (type === 'local') insertLocalVariable();
      else if (type === 'global') insertGlobalVariable();
      else insertAssemblyVariable();
    },
    navigateToLine: (line) => {
      containerRef.current?.querySelector(`[data-line="${line - 1}"]`)?.scrollIntoView({ behavior: 'smooth' });
    },
    getContent: () => content,
    focus: () => containerRef.current?.focus(),
  }), [content, insertSubroutine, insertLocalVariable, insertGlobalVariable, insertAssemblyVariable]);

  const getFlowSegs = useCallback((lineIndex: number) => {
    return flowMap.get(lineIndex);
  }, [flowMap]);

  const renderProcLine = useCallback((line: string, lineIndex: number, isSelected: boolean, paramLines: ParamLineData[] = []) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('过程');
    const keyword = isChinese ? '过程' : 'proc';
    const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
    const procMatch = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
    
    if (!procMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, backtickName, normalName, isPublic, genericParams, paramsStr, returnType, rest] = procMatch;
    const procName = backtickName || normalName || '';
    const isExported = isPublic === '*';
    const commentMatch = rest.match(/#\s*(.*)$/);
    const comment = commentMatch ? commentMatch[1].trim() : '';
    
    return (
      <ProcTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        renderParamCell={renderParamCell}
        keyword={keyword}
        procName={procName}
        isExported={isExported}
        genericParams={genericParams}
        paramsStr={paramsStr}
        returnType={returnType}
        comment={comment}
        onAddParam={insertParamAfterProc}
        onAddLocalVar={insertLocalVarAfterProc}
        paramLines={paramLines}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, renderParamCell, insertParamAfterProc, insertLocalVarAfterProc]);

  const renderFuncLine = useCallback((line: string, lineIndex: number, isSelected: boolean, paramLines: ParamLineData[] = []) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('函数');
    const keyword = isChinese ? '函数' : 'func';
    const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
    const funcMatch = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
    
    if (!funcMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, backtickName, normalName, isPublic, genericParams, paramsStr, returnType, rest] = funcMatch;
    const funcName = backtickName || normalName || '';
    const isExported = isPublic === '*';
    const commentMatch = rest.match(/#\s*(.*)$/);
    const comment = commentMatch ? commentMatch[1].trim() : '';
    
    return (
      <FuncTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        renderParamCell={renderParamCell}
        keyword={keyword}
        funcName={funcName}
        isExported={isExported}
        genericParams={genericParams}
        paramsStr={paramsStr}
        returnType={returnType}
        comment={comment}
        onAddParam={insertParamAfterProc}
        onAddLocalVar={insertLocalVarAfterProc}
        paramLines={paramLines}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, renderParamCell, insertParamAfterProc, insertLocalVarAfterProc]);

  const renderDllLine = useCallback((line: string, lineIndex: number, isSelected: boolean, paramLines: ParamLineData[] = []) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('过程');
    const keyword = isChinese ? '过程' : 'proc';
    const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
    const dllMatch = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
    
    if (!dllMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, backtickName, normalName, isPublic, _genericParams, paramsStr, returnType, rest] = dllMatch;
    const procName = backtickName || normalName || '';
    const isExported = isPublic === '*';
    const commentMatch = rest.match(/#\s*(.*)$/);
    const comment = commentMatch ? commentMatch[1].trim() : '';
    const dynlibMatch = rest.match(/\{\.dynlib:\s*"([^"]+)"\}/);
    const dllName = dynlibMatch ? dynlibMatch[1] : '';
    
    return (
      <DllTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        renderParamCell={renderParamCell}
        keyword={keyword}
        procName={procName}
        isExported={isExported}
        paramsStr={paramsStr}
        returnType={returnType}
        dllName={dllName}
        comment={comment}
        onAddParam={insertParamAfterProc}
        paramLines={paramLines}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, renderParamCell, insertParamAfterProc]);

  const renderTemplateLine = useCallback((line: string, lineIndex: number, isSelected: boolean) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('代码模板');
    const keyword = isChinese ? '代码模板' : 'template';
    const namePattern = '(?:\\x60([^\\x60]*)\\x60|([\\w\\u4e00-\\u9fa5]*))?';
    const templateMatch = trimmed.match(new RegExp(`^${keyword}\\s+${namePattern}(\\*)?(?:\\[([^\\]]*)\\])?\\s*(\\([^)]*\\))\\s*(?::\\s*([\\w\\u4e00-\\u9fa5\\[\\],\\s|]+))?\\s*(?:=\\s*)?(.*)$`));
    
    if (!templateMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, backtickName, normalName, isPublic, genericParams, paramsStr, returnType, rest] = templateMatch;
    const templateName = backtickName || normalName || '';
    const isExported = isPublic === '*';
    const commentMatch = rest.match(/#\s*(.*)$/);
    const comment = commentMatch ? commentMatch[1].trim() : '';
    
    return (
      <TemplateTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        keyword={keyword}
        templateName={templateName}
        isExported={isExported}
        genericParams={genericParams}
        paramsStr={paramsStr}
        returnType={returnType}
        comment={comment}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell]);

  const renderVariableLine = useCallback((line: string, lineIndex: number, isSelected: boolean) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('变量');
    const keyword = isChinese ? '变量' : 'var';
    const varMatch = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*(?:=\\s*([^#]*?))?\\s*(?:#\\s*(.*))?$`));
    
    if (!varMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, varName, isPublic, varType, varValue, comment] = varMatch;
    const isExported = isPublic === '*';
    const cleanType = varType ? varType.trim() : '自动';
    const cleanValue = varValue ? varValue.trim() : '';
    const cleanComment = comment ? comment.trim() : '';
    
    const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : '';
    const prevParsed = parseLine(prevLine, lineIndex - 1);
    const showHeader = prevParsed.type !== 'var';
    
    return (
      <VarTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        keyword={keyword}
        varName={varName}
        isExported={isExported}
        varType={cleanType}
        varValue={cleanValue}
        comment={cleanComment}
        showHeader={showHeader}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, lines, parseLine]);

  const renderConstantLine = useCallback((line: string, lineIndex: number, isSelected: boolean) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('常量');
    const keyword = isChinese ? '常量' : 'const';
    const constMatch = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*(?::\\s*([^#=]*?))?\\s*=\\s*([^#]*?)\\s*(?:#\\s*(.*))?$`));
    
    if (!constMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, constName, isPublic, constType, constValue, comment] = constMatch;
    const isExported = isPublic === '*';
    const cleanType = constType ? constType.trim() : '自动';
    const cleanValue = constValue ? constValue.trim() : '';
    const cleanComment = comment ? comment.trim() : '';
    
    const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : '';
    const prevParsed = parseLine(prevLine, lineIndex - 1);
    const showHeader = prevParsed.type !== 'const';
    
    return (
      <ConstTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        keyword={keyword}
        constName={constName}
        isExported={isExported}
        constType={cleanType}
        constValue={cleanValue}
        comment={cleanComment}
        showHeader={showHeader}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, lines, parseLine]);

  const renderDataTypeLine = useCallback((line: string, lineIndex: number, isSelected: boolean) => {
    const trimmed = line.trim();
    const isChinese = trimmed.startsWith('类型');
    const keyword = isChinese ? '类型' : 'type';
    const typeMatch = trimmed.match(new RegExp(`^${keyword}\\s+([\\w\\u4e00-\\u9fa5]+)(\\*)?\\s*=\\s*(对象|引用 对象|[\\w\\u4e00-\\u9fa5]+)?\\s*(?:继承\\s+([\\w\\u4e00-\\u9fa5]+))?\\s*(?:#\\s*(.*))?$`));
    
    if (!typeMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, typeName, isPublic, typeKind, _baseType, comment] = typeMatch;
    const isExported = isPublic === '*';
    const typeDef = typeKind || '对象';
    
    return (
      <TypeTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        keyword={keyword}
        typeName={typeName}
        isExported={isExported}
        typeDef={typeDef}
        comment={comment || ''}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell]);

  const renderImportLine = useCallback((line: string, lineIndex: number, isSelected: boolean) => {
    const parsed = parseLine(line, lineIndex);
    if (!parsed.data) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const { moduleName, importType, symbols, comment } = parsed.data;
    
    return (
      <ImportTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        moduleName={moduleName}
        importType={importType}
        symbols={symbols}
        comment={comment}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, parseLine]);

  const renderIncludeLine = useCallback((line: string, lineIndex: number, isSelected: boolean) => {
    const parsed = parseLine(line, lineIndex);
    if (!parsed.data) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const { fileName, comment } = parsed.data;
    
    return (
      <IncludeTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        fileName={fileName}
        comment={comment}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell, parseLine]);

  const renderParameterLine = useCallback((line: string, lineIndex: number, isSelected: boolean, showHeader: boolean) => {
    const trimmed = line.trim();
    const paramMatch = trimmed.match(/^param\s+([\w\u4e00-\u9fa5]+)\s*(?::\s*([\w\u4e00-\u9fa5]+))?\s*(?:#\s*(.*))?$/);
    
    if (!paramMatch) {
      return <CodeLine lineIndex={lineIndex} line={line} isSelected={isSelected} onLineMouseDown={handleLineMouseDown} onLineMouseEnter={handleLineMouseEnter} flowSegs={getFlowSegs(lineIndex)} maxFlowDepth={maxFlowDepth} />;
    }

    const [, paramName, paramType, comment] = paramMatch;
    const isChinese = trimmed.startsWith('参数');
    const keyword = isChinese ? '参数' : 'param';
    
    return (
      <ParamTable
        lineIndex={lineIndex}
        isSelected={isSelected}
        onLineMouseDown={handleLineMouseDown}
        renderEditableCell={renderEditableCell}
        keyword={keyword}
        paramName={paramName}
        paramType={paramType || '自动'}
        comment={comment || ''}
        showHeader={showHeader}
      />
    );
  }, [handleLineMouseDown, handleLineMouseEnter, renderEditableCell]);

  const collectParamLines = useCallback((startIndex: number): ParamLineData[] => {
    const paramLines: ParamLineData[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const nextParsed = parseLine(lines[i], i);
      if (nextParsed.type === 'param') {
        const trimmed = lines[i].trim();
        const paramMatch = trimmed.match(/^(?:参数|param)\s+([\w\u4e00-\u9fa5]+)\s*(?::\s*([^#=]*?))?\s*(?:=\s*([^#]*?))?\s*(?:#\s*(.*))?$/);
        if (paramMatch) {
          let paramName = paramMatch[1];
          let modifier = '';
          const modifierMatch = paramName.match(/^(var|ptr|ref|static|lent|sink|out|distinct)\s+/);
          if (modifierMatch) {
            modifier = modifierMatch[1];
            paramName = paramName.substring(modifierMatch[0].length);
          }
          paramLines.push({
            lineIndex: i,
            paramName,
            paramType: paramMatch[2] ? paramMatch[2].trim() : '自动',
            defaultValue: paramMatch[3] ? paramMatch[3].trim() : '',
            modifier,
            comment: paramMatch[4] ? paramMatch[4].trim() : '',
          });
        }
      } else {
        break;
      }
    }
    return paramLines;
  }, [lines, parseLine]);

  const mergedLinesInfo = useMemo(() => {
    const skippedLines = new Set<number>();
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseLine(lines[i], i);
      if (parsed.type === 'proc' || parsed.type === 'func' || parsed.type === 'dll') {
        for (let j = i + 1; j < lines.length; j++) {
          const nextParsed = parseLine(lines[j], j);
          if (nextParsed.type === 'param') {
            skippedLines.add(j);
          } else {
            break;
          }
        }
      }
    }
    return skippedLines;
  }, [lines, parseLine]);

  const renderLine = useCallback((line: string, lineIndex: number) => {
    if (mergedLinesInfo.has(lineIndex)) {
      return null;
    }

    const parsed = parseLine(line, lineIndex);
    const isSelected = selectedLines.has(lineIndex);
    
    switch (parsed.type) {
      case 'proc': {
        const paramLines = collectParamLines(lineIndex);
        return renderProcLine(line, lineIndex, isSelected, paramLines);
      }
      case 'dll': {
        const paramLines = collectParamLines(lineIndex);
        return renderDllLine(line, lineIndex, isSelected, paramLines);
      }
      case 'func': {
        const paramLines = collectParamLines(lineIndex);
        return renderFuncLine(line, lineIndex, isSelected, paramLines);
      }
      case 'template':
        return renderTemplateLine(line, lineIndex, isSelected);
      case 'param': {
        const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : '';
        const prevParsed = parseLine(prevLine, lineIndex - 1);
        const showHeader = prevParsed.type !== 'param';
        return renderParameterLine(line, lineIndex, isSelected, showHeader);
      }
      case 'var':
        return renderVariableLine(line, lineIndex, isSelected);
      case 'const':
        return renderConstantLine(line, lineIndex, isSelected);
      case 'type':
        return renderDataTypeLine(line, lineIndex, isSelected);
      case 'import':
        return renderImportLine(line, lineIndex, isSelected);
      case 'include':
        return renderIncludeLine(line, lineIndex, isSelected);
      default: {
        const isEditing = editingLine === lineIndex;
        
        if (isEditing) {
          return (
            <div
              key={lineIndex}
              data-line={lineIndex}
              className={`code-table__line code-table__line--editing ${isSelected ? 'code-table__line--selected' : ''}`}
            >
              <div className="code-table__gutter">
                <span className="code-table__line-number">{lineIndex + 1}</span>
              </div>
              <div className="code-table__content">
                {getFlowSegs(lineIndex) && getFlowSegs(lineIndex)!.length > 0 && (
                  <div className="code-table__flow-lines">
                    {getFlowSegs(lineIndex)!.map((seg, idx) => (
                      <span
                        key={idx}
                        className={`code-flow-seg code-flow-${seg.type} ${seg.isLoop ? 'code-flow-loop' : ''} ${seg.showBottomArrow ? 'has-bottom-arrow' : ''}`}
                        style={{ left: `calc(${seg.indent}ch - 4px)` }}
                      >
                        {seg.type === 'horz' && <span className="code-flow-line" />}
                        {seg.showTopArrow && <span className="code-flow-arrow-top" />}
                        {seg.showBottomArrow && <span className="code-flow-arrow-bottom" />}
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  className="code-table__textarea"
                  value={editingLineValue}
                  onChange={(e) => setEditingLineValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleLineEditCommit();
                    } else if (e.key === 'Escape') {
                      setEditingLine(null);
                      setEditingLineValue('');
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const indent = e.shiftKey ? -2 : 2;
                      
                      if (indent > 0) {
                        const newValue = editingLineValue.substring(0, start) + '  ' + editingLineValue.substring(end);
                        setEditingLineValue(newValue);
                        setTimeout(() => {
                          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                        }, 0);
                      } else {
                        const lineStart = editingLineValue.lastIndexOf('\n', start - 1) + 1;
                        const currentIndent = editingLineValue.substring(lineStart).match(/^\s*/)?.[0].length || 0;
                        const removeSpaces = Math.min(currentIndent, 2);
                        if (removeSpaces > 0) {
                          const newValue = editingLineValue.substring(0, lineStart) + editingLineValue.substring(lineStart + removeSpaces);
                          setEditingLineValue(newValue);
                          setTimeout(() => {
                            e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start - removeSpaces;
                          }, 0);
                        }
                      }
                    }
                  }}
                  onBlur={handleLineEditCommit}
                  onPaste={(e) => {
                    const clipText = e.clipboardData.getData('text/plain');
                    if (!clipText) return;
                    const clipLines = clipText.split('\n');
                    if (clipLines.length <= 1) return;
                    e.preventDefault();
                    const cursorPos = e.currentTarget.selectionStart;
                    const before = editingLineValue.substring(0, cursorPos);
                    const after = editingLineValue.substring(e.currentTarget.selectionEnd);
                    const newLines = [...lines];
                    newLines[editingLine!] = before + clipLines[0];
                    const middleLines = clipLines.slice(1, -1);
                    const lastLine = clipLines[clipLines.length - 1] + after;
                    newLines.splice(editingLine! + 1, 0, ...middleLines, lastLine);
                    setEditingLine(null);
                    setEditingLineValue('');
                    updateContent(newLines.join('\n'));
                    const newSelection = new Set<number>();
                    for (let i = editingLine! + 1; i <= editingLine! + clipLines.length - 1; i++) {
                      newSelection.add(i);
                    }
                    setSelectedLines(newSelection);
                  }}
                  autoFocus
                />
              </div>
            </div>
          );
        }
        
        return (
          <div
            key={lineIndex}
            data-line={lineIndex}
            className={`code-table__line ${isSelected ? 'code-table__line--selected' : ''}`}
            onMouseDown={(e) => handleLineMouseDown(lineIndex, e)}
            onMouseEnter={() => handleLineMouseEnter(lineIndex)}
          >
            <div className="code-table__gutter">
              <span className="code-table__line-number">{lineIndex + 1}</span>
            </div>
            <div className="code-table__content">
              {getFlowSegs(lineIndex) && getFlowSegs(lineIndex)!.length > 0 && (
                <div className="code-table__flow-lines">
                  {getFlowSegs(lineIndex)!.map((seg, idx) => (
                    <span
                      key={idx}
                      className={`code-flow-seg code-flow-${seg.type} ${seg.isLoop ? 'code-flow-loop' : ''} ${seg.showBottomArrow ? 'has-bottom-arrow' : ''}`}
                      style={{ left: `calc(${seg.indent}ch - 4px)` }}
                    >
                      {seg.type === 'horz' && <span className="code-flow-line" />}
                      {seg.showTopArrow && <span className="code-flow-arrow-top" />}
                      {seg.showBottomArrow && <span className="code-flow-arrow-bottom" />}
                    </span>
                  ))}
                </div>
              )}
              <div className="code-table__input-wrapper">
                <input
                  type="text"
                  className="code-table__inline-input"
                  value={line}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[lineIndex] = e.target.value;
                    updateContent(newLines.join('\n'));
                    
                    setCurrentLineIndex(lineIndex);
                    const newPosition = e.currentTarget.selectionStart ?? 0;
                    setCompletionPosition(newPosition);
                    
                    const prefix = getCompletionPrefix(e.target.value, newPosition);
                    const completions = getCompletions(prefix);
                    
                    if (completions.length > 0) {
                      setShowCompletion(true);
                      setCompletionIndex(0);
                    } else {
                      setShowCompletion(false);
                      setCompletionIndex(0);
                    }
                  }}
                  onFocus={() => {
                    setSelectedLines(new Set());
                    setCurrentLineIndex(lineIndex);
                    setCompletionPosition(0);
                    setShowCompletion(false);
                    setCompletionIndex(0);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowCompletion(false);
                      setCompletionIndex(0);
                      setCurrentLineIndex(null);
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    const prefix = getCompletionPrefix(line, completionPosition);
                    const completions = getCompletions(prefix);
                    const hasCompletions = completions.length > 0;
                    
                    if (showCompletion && hasCompletions) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setCompletionIndex(prev => (prev + 1) % completions.length);
                        return;
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setCompletionIndex(prev => (prev - 1 + completions.length) % completions.length);
                        return;
                      } else if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        const item = completions[completionIndex];
                        const currentLineIndent = line.length - line.trimStart().length;
                        const prefix = getCompletionPrefix(line, completionPosition);
                        const beforePrefix = line.substring(0, completionPosition - prefix.length);
                        const afterCursor = line.substring(completionPosition);
                        const insertText = item.insertText.replace(/\n/g, '\n' + ' '.repeat(currentLineIndent));
                        const newLine = beforePrefix + insertText + afterCursor;
                        const newLines = [...lines];
                        newLines[lineIndex] = newLine;
                        updateContent(newLines.join('\n'));
                        setShowCompletion(false);
                        setCompletionIndex(0);
                        return;
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setShowCompletion(false);
                        setCompletionIndex(0);
                        return;
                      }
                    }
                    
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setShowCompletion(false);
                      setCompletionIndex(0);
                      
                      const cursorPos = e.currentTarget.selectionStart ?? 0;
                      const textBeforeCursor = line.substring(0, cursorPos);
                      const textAfterCursor = line.substring(cursorPos);
                      
                      const currentIndent = line.length - line.trimStart().length;
                      const trimmedBefore = textBeforeCursor.trim();
                      const endsWithBlock = /^(if|case|while|for|when|block|try|proc|func|type|enum|object|如果|判断|循环|计次|当|尝试|过程|函数|类型|枚举|对象|elif|else|of|except|finally|否则如果|否则|为|异常|最后|当为)\b.*:\s*$/.test(trimmedBefore);
                      const extraIndent = endsWithBlock ? 2 : 0;
                      const indentStr = ' '.repeat(currentIndent + extraIndent);
                      const newLines = [...lines];
                      newLines[lineIndex] = textBeforeCursor;
                      newLines.splice(lineIndex + 1, 0, indentStr + textAfterCursor.trimStart());
                      updateContent(newLines.join('\n'));
                      
                      const newCursorPos = currentIndent + extraIndent;
                      setTimeout(() => {
                        const nextLine = containerRef.current?.querySelector(`[data-line="${lineIndex + 1}"] input`);
                        if (nextLine) {
                          (nextLine as HTMLInputElement).focus();
                          (nextLine as HTMLInputElement).selectionStart = newCursorPos;
                          (nextLine as HTMLInputElement).selectionEnd = newCursorPos;
                        }
                      }, 0);
                    } else if (e.key === 'Backspace' && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
                      e.preventDefault();
                      setShowCompletion(false);
                      setCompletionIndex(0);
                      if (lineIndex > 0) {
                        const newLines = [...lines];
                        const prevLine = newLines[lineIndex - 1];
                        newLines[lineIndex - 1] = prevLine + line;
                        newLines.splice(lineIndex, 1);
                        updateContent(newLines.join('\n'));
                        setTimeout(() => {
                          const prevInput = containerRef.current?.querySelector(`[data-line="${lineIndex - 1}"] input`);
                          if (prevInput) {
                            (prevInput as HTMLInputElement).focus();
                            (prevInput as HTMLInputElement).selectionStart = prevLine.length;
                          }
                        }, 0);
                      }
                    } else if (e.key === 'Delete' && e.currentTarget.selectionStart === line.length && e.currentTarget.selectionEnd === line.length) {
                      e.preventDefault();
                      setShowCompletion(false);
                      setCompletionIndex(0);
                      if (lineIndex < lines.length - 1) {
                        const newLines = [...lines];
                        const nextLine = newLines[lineIndex + 1];
                        newLines[lineIndex] = line + nextLine;
                        newLines.splice(lineIndex + 1, 1);
                        updateContent(newLines.join('\n'));
                      }
                    } else if (e.key === 'ArrowUp' && lineIndex > 0 && !showCompletion) {
                      e.preventDefault();
                      const prevInput = containerRef.current?.querySelector(`[data-line="${lineIndex - 1}"] input`);
                      if (prevInput) (prevInput as HTMLInputElement).focus();
                    } else if (e.key === 'ArrowDown' && lineIndex < lines.length - 1 && !showCompletion) {
                      e.preventDefault();
                      const nextInput = containerRef.current?.querySelector(`[data-line="${lineIndex + 1}"] input`);
                      if (nextInput) (nextInput as HTMLInputElement).focus();
                    } else if (e.key === 'Escape') {
                      setShowCompletion(false);
                      setCompletionIndex(0);
                    }
                  }}
                  spellCheck={false}
                />
                <div className="code-table__highlight">
                  {highlightCode(line)}
                </div>
                {showCompletion && currentLineIndex === lineIndex && (
                  <CompletionPopup
                    code={line}
                    position={completionPosition}
                    selectedIndex={completionIndex}
                    visible={showCompletion}
                    onSelect={(item: CompletionItem) => {
                      const prefix = getCompletionPrefix(line, completionPosition);
                      const beforePrefix = line.substring(0, completionPosition - prefix.length);
                      const afterCursor = line.substring(completionPosition);
                      const currentLineIndent = line.length - line.trimStart().length;
                      const insertText = item.insertText.replace(/\n/g, '\n' + ' '.repeat(currentLineIndent));
                      
                      const newLines = [...lines];
                      newLines[lineIndex] = beforePrefix + insertText + afterCursor;
                      updateContent(newLines.join('\n'));
                      setShowCompletion(false);
                      setCompletionIndex(0);
                    }}
                    onClose={() => {
                      setShowCompletion(false);
                      setCompletionIndex(0);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      }
    }
  }, [selectedLines, handleLineMouseDown, handleLineMouseEnter, parseLine, lines, editingLine, editingLineValue, handleLineEditCommit, updateContent, renderProcLine, renderFuncLine, renderTemplateLine, renderParameterLine, renderVariableLine, renderConstantLine, renderDataTypeLine, renderImportLine, renderIncludeLine, currentLineIndex, showCompletion, completionPosition, completionIndex, mergedLinesInfo, collectParamLines, renderDllLine]);

  const hasTableContent = useMemo(() => {
    return lines.some((line, index) => {
      const parsed = parseLine(line, index);
      return parsed.type !== 'code';
    });
  }, [lines, parseLine]);

  return (
    <div
      ref={containerRef}
      className={`code-table-editor`}
      tabIndex={0}
      onKeyDown={handleKeyDownGlobal}
      onMouseUp={handleMouseUp}
      onPaste={handlePaste}
    >
      {!readOnly && (
        <div className="code-table__toolbar">
          <div className="code-table__toolbar-group">
            <button 
              className="code-table__toolbar-btn"
              onClick={insertSubroutine}
              title="添加子程序"
            >
              <span className="code-table__toolbar-icon">⚡</span>
              <span>子程序</span>
            </button>
            <button 
              className="code-table__toolbar-btn"
              onClick={insertParameter}
              title="添加参数"
            >
              <span className="code-table__toolbar-icon">📝</span>
              <span>参数</span>
            </button>
          </div>
          <div className="code-table__toolbar-separator" />
          <div className="code-table__toolbar-group">
            <button 
              className="code-table__toolbar-btn"
              onClick={insertLocalVariable}
              title="添加局部变量"
            >
              <span className="code-table__toolbar-icon">📦</span>
              <span>局部变量</span>
            </button>
            <button 
              className="code-table__toolbar-btn"
              onClick={insertGlobalVariable}
              title="添加全局变量"
            >
              <span className="code-table__toolbar-icon">🌐</span>
              <span>全局变量</span>
            </button>
            <button 
              className="code-table__toolbar-btn"
              onClick={insertAssemblyVariable}
              title="添加程序集变量"
            >
              <span className="code-table__toolbar-icon">📁</span>
              <span>程序集变量</span>
            </button>
          </div>
          <div className="code-table__toolbar-separator" />
          <div className="code-table__toolbar-group">
            <button 
              className="code-table__toolbar-btn"
              onClick={insertConstant}
              title="添加常量"
            >
              <span className="code-table__toolbar-icon">💎</span>
              <span>常量</span>
            </button>
            <button 
              className="code-table__toolbar-btn"
              onClick={insertDataType}
              title="添加数据类型"
            >
              <span className="code-table__toolbar-icon">🏗️</span>
              <span>数据类型</span>
            </button>
            <button 
              className="code-table__toolbar-btn"
              onClick={insertDllCommand}
              title="添加DLL命令"
            >
              <span className="code-table__toolbar-icon">🔌</span>
              <span>DLL命令</span>
            </button>
          </div>
          <div className="code-table__toolbar-separator" />
          <div className="code-table__toolbar-group">
            <button 
              className="code-table__toolbar-btn code-table__toolbar-btn--primary"
              onClick={insertCodeLine}
              title="插入代码行"
            >
              <span className="code-table__toolbar-icon">✏️</span>
              <span>插入代码</span>
            </button>
          </div>
        </div>
      )}
      <div className="code-table__viewport">
        {lines.length === 0 ? (
          <div className="code-table__empty">
            <div className="code-table__empty-icon">📝</div>
            <div className="code-table__empty-text">空文件</div>
            <div className="code-table__empty-hint">点击上方按钮添加过程或变量</div>
          </div>
        ) : !hasTableContent ? (
          <div className="code-table__empty">
            <div className="code-table__empty-icon">📄</div>
            <div className="code-table__empty-text">普通代码文件</div>
            <div className="code-table__empty-hint">此文件不包含空灵语言表格格式代码</div>
            <div className="code-table__empty-hint">表格编辑器支持以下格式：</div>
            <div className="code-table__example">proc 过程名*(参数: 类型): 返回类型 =</div>
            <div className="code-table__example">var 变量名*: 类型 = 初始值</div>
            <div className="code-table__example">const 常量名*: 类型 = 值</div>
            <div className="code-table__example">type 类型名* = 对象 继承 基类</div>
          </div>
        ) : (
          <Virtuoso
            style={{ height: '100%', width: '100%' }}
            totalCount={lines.length}
            itemContent={(index) => renderLine(lines[index], index)}
            overscan={10}
          />
        )}
      </div>
      {showCommentModal && commentModalData && (
        <div className="code-table__modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="code-table__modal" onClick={(e) => e.stopPropagation()}>
            <div className="code-table__modal-header">
              <span className="code-table__modal-title">编辑注释</span>
              <button 
                className="code-table__modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="code-table__modal-textarea"
              value={commentModalData.value}
              onChange={(e) => setCommentModalData({ ...commentModalData, value: e.target.value })}
              placeholder="输入注释内容..."
              autoFocus
            />
            <div className="code-table__modal-footer">
              <button 
                className="code-table__modal-btn code-table__modal-btn--cancel"
                onClick={() => setShowCommentModal(false)}
              >
                取消
              </button>
              <button 
                className="code-table__modal-btn code-table__modal-btn--confirm"
                onClick={() => handleCommentSave(commentModalData.value)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CodeTableEditor;
