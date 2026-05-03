import React from 'react';
import type { CellInfo } from './tableUtils';
import { parseParams, getDisplayName } from './tableUtils';
import type { FlowSegment } from './flowLines';

export interface ParamLineData {
  lineIndex: number;
  paramName: string;
  paramType: string;
  defaultValue: string;
  modifier: string;
  comment: string;
}

interface TableLineProps {
  lineIndex: number;
  isSelected: boolean;
  onLineClick: (lineIndex: number, e: React.MouseEvent) => void;
  renderEditableCell: (
    lineIndex: number,
    cellIndex: number,
    cell: CellInfo,
    cellType: 'text' | 'type' | 'public'
  ) => React.ReactNode;
  renderParamCell?: (
    lineIndex: number,
    cellIndex: number,
    cell: CellInfo,
    cellType: 'text' | 'type'
  ) => React.ReactNode;
}

interface ProcTableProps extends TableLineProps {
  keyword: string;
  procName: string;
  isExported: boolean;
  genericParams: string;
  paramsStr: string;
  returnType: string;
  comment: string;
  onAddParam?: (lineIndex: number) => void;
  onAddLocalVar?: (lineIndex: number) => void;
  paramLines?: ParamLineData[];
}

export const ProcTable: React.FC<ProcTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  renderParamCell,
  keyword: _keyword,
  procName,
  isExported,
  genericParams,
  paramsStr,
  returnType,
  comment,
  onAddParam,
  onAddLocalVar,
  paramLines = [],
}) => {
  const params = parseParams(paramsStr);
  const headers = ['过程名', '泛型', '返回类型', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--generic', 'code-table__cell--type', 'code-table__cell--public', 'code-table__cell--remark'];
  const displayName = getDisplayName(procName);
  
  const cells: CellInfo[] = [
    { text: displayName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: genericParams ? '[' + genericParams + ']' : '', className: 'code-table__cell--generic', fieldIndex: 1 },
    { text: returnType || '空', className: 'code-table__cell--type', fieldIndex: 2 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 3 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 4 },
  ];

  const hasParams = params.length > 0 || paramLines.length > 0;

  const renderParamRow = (param: { name: string; type: string; defaultValue: string; modifier: string; comment: string }, _idx: number, lineIdx?: number) => {
    const paramCells: CellInfo[] = [
      { text: param.name, className: 'code-table__cell--param-name', fieldIndex: 0 },
      { text: param.type, className: 'code-table__cell--param-type', fieldIndex: 1 },
      { text: param.defaultValue, className: 'code-table__cell--param-default', fieldIndex: 2 },
      { text: param.modifier, className: 'code-table__cell--param-modifier', fieldIndex: -1 },
      { text: param.comment, className: 'code-table__cell--param-remark', fieldIndex: 3 },
    ];
    
    return paramCells.map((cell, i) => {
      if (renderParamCell && lineIdx !== undefined) {
        const cellType: 'text' | 'type' = i === 1 ? 'type' : 'text';
        return renderParamCell(lineIdx, i, cell, cellType);
      }
      return (
        <div key={i} className={`code-table__table-cell ${cell.className}`}>
          {cell.text || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--proc">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
          <div className="code-table__table-cell code-table__table-cell--header code-table__cell--actions">操作</div>
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 2 ? 'type' : 
              i === 3 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
          <div className="code-table__table-cell code-table__cell--actions">
            <button
              className="code-table__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddParam?.(lineIndex);
              }}
              title="新建参数"
            >
              + 参数
            </button>
            <button
              className="code-table__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddLocalVar?.(lineIndex);
              }}
              title="新建局部变量"
            >
              + 变量
            </button>
          </div>
        </div>
        {hasParams && (
          <div className="code-table__params-section">
            <div className="code-table__table-header code-table__table-header--params">
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-name">参数名</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-type">类型</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-default">默认值</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-modifier">修饰</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-remark">注释</div>
            </div>
            {params.map((param, idx) => (
              <div key={`inline-${idx}`} className="code-table__table-row code-table__table-row--params">
                {renderParamRow(param, idx)}
              </div>
            ))}
            {paramLines.map((param, idx) => (
              <div key={`line-${param.lineIndex}`} className="code-table__table-row code-table__table-row--params" data-line={param.lineIndex} onClick={(e) => onLineClick(param.lineIndex, e)}>
                {renderParamRow({ name: param.paramName, type: param.paramType, defaultValue: param.defaultValue || '', modifier: param.modifier || '', comment: param.comment }, idx, param.lineIndex)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface FuncTableProps extends TableLineProps {
  keyword: string;
  funcName: string;
  isExported: boolean;
  genericParams: string;
  paramsStr: string;
  returnType: string;
  comment: string;
  onAddParam?: (lineIndex: number) => void;
  onAddLocalVar?: (lineIndex: number) => void;
  paramLines?: ParamLineData[];
}

export const FuncTable: React.FC<FuncTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  renderParamCell,
  keyword: _keyword,
  funcName,
  isExported,
  genericParams,
  paramsStr,
  returnType,
  comment,
  onAddParam,
  onAddLocalVar,
  paramLines = [],
}) => {
  const params = parseParams(paramsStr);
  const headers = ['函数名', '泛型', '返回类型', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--generic', 'code-table__cell--type', 'code-table__cell--public', 'code-table__cell--remark'];
  const displayName = getDisplayName(funcName);
  
  const cells: CellInfo[] = [
    { text: displayName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: genericParams ? '[' + genericParams + ']' : '', className: 'code-table__cell--generic', fieldIndex: 1 },
    { text: returnType || '空', className: 'code-table__cell--type', fieldIndex: 2 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 3 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 4 },
  ];

  const hasParams = params.length > 0 || paramLines.length > 0;

  const renderParamRow = (param: { name: string; type: string; defaultValue: string; modifier: string; comment: string }, _idx: number, lineIdx?: number) => {
    const paramCells: CellInfo[] = [
      { text: param.name, className: 'code-table__cell--param-name', fieldIndex: 0 },
      { text: param.type, className: 'code-table__cell--param-type', fieldIndex: 1 },
      { text: param.defaultValue, className: 'code-table__cell--param-default', fieldIndex: 2 },
      { text: param.modifier, className: 'code-table__cell--param-modifier', fieldIndex: -1 },
      { text: param.comment, className: 'code-table__cell--param-remark', fieldIndex: 3 },
    ];
    
    return paramCells.map((cell, i) => {
      if (renderParamCell && lineIdx !== undefined) {
        const cellType: 'text' | 'type' = i === 1 ? 'type' : 'text';
        return renderParamCell(lineIdx, i, cell, cellType);
      }
      return (
        <div key={i} className={`code-table__table-cell ${cell.className}`}>
          {cell.text || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--func">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
          <div className="code-table__table-cell code-table__table-cell--header code-table__cell--actions">操作</div>
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 2 ? 'type' : 
              i === 3 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
          <div className="code-table__table-cell code-table__cell--actions">
            <button
              className="code-table__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddParam?.(lineIndex);
              }}
              title="新建参数"
            >
              + 参数
            </button>
            <button
              className="code-table__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddLocalVar?.(lineIndex);
              }}
              title="新建局部变量"
            >
              + 变量
            </button>
          </div>
        </div>
        {hasParams && (
          <div className="code-table__params-section">
            <div className="code-table__table-header code-table__table-header--params">
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-name">参数名</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-type">类型</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-default">默认值</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-modifier">修饰</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-remark">注释</div>
            </div>
            {params.map((param, idx) => (
              <div key={`inline-${idx}`} className="code-table__table-row code-table__table-row--params">
                {renderParamRow(param, idx)}
              </div>
            ))}
            {paramLines.map((param, idx) => (
              <div key={`line-${param.lineIndex}`} className="code-table__table-row code-table__table-row--params" data-line={param.lineIndex} onClick={(e) => onLineClick(param.lineIndex, e)}>
                {renderParamRow({ name: param.paramName, type: param.paramType, defaultValue: param.defaultValue || '', modifier: param.modifier || '', comment: param.comment }, idx, param.lineIndex)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DllTableProps extends TableLineProps {
  keyword: string;
  procName: string;
  isExported: boolean;
  paramsStr: string;
  returnType: string;
  dllName: string;
  comment: string;
  onAddParam?: (lineIndex: number) => void;
  paramLines?: ParamLineData[];
}

export const DllTable: React.FC<DllTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  renderParamCell,
  keyword: _keyword,
  procName,
  isExported,
  paramsStr,
  returnType,
  dllName,
  comment,
  onAddParam,
  paramLines = [],
}) => {
  const params = parseParams(paramsStr);
  const headers = ['命令名', '返回类型', 'DLL', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--type', 'code-table__cell--dll', 'code-table__cell--public', 'code-table__cell--remark'];
  const displayName = getDisplayName(procName);
  
  const cells: CellInfo[] = [
    { text: displayName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: returnType || '空', className: 'code-table__cell--type', fieldIndex: 1 },
    { text: dllName, className: 'code-table__cell--dll', fieldIndex: 2 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 3 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 4 },
  ];

  const hasParams = params.length > 0 || paramLines.length > 0;

  const renderParamRow = (param: { name: string; type: string; defaultValue: string; modifier: string; comment: string }, _idx: number, lineIdx?: number) => {
    const paramCells: CellInfo[] = [
      { text: param.name, className: 'code-table__cell--param-name', fieldIndex: 0 },
      { text: param.type, className: 'code-table__cell--param-type', fieldIndex: 1 },
      { text: param.defaultValue, className: 'code-table__cell--param-default', fieldIndex: 2 },
      { text: param.modifier, className: 'code-table__cell--param-modifier', fieldIndex: -1 },
      { text: param.comment, className: 'code-table__cell--param-remark', fieldIndex: 3 },
    ];
    
    return paramCells.map((cell, i) => {
      if (renderParamCell && lineIdx !== undefined) {
        const cellType: 'text' | 'type' = i === 1 ? 'type' : 'text';
        return renderParamCell(lineIdx, i, cell, cellType);
      }
      return (
        <div key={i} className={`code-table__table-cell ${cell.className}`}>
          {cell.text || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--dll">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
          <div className="code-table__table-cell code-table__table-cell--header code-table__cell--actions">操作</div>
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 1 ? 'type' : 
              i === 3 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
          <div className="code-table__table-cell code-table__cell--actions">
            <button
              className="code-table__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddParam?.(lineIndex);
              }}
              title="新建参数"
            >
              + 参数
            </button>
          </div>
        </div>
        {hasParams && (
          <div className="code-table__params-section">
            <div className="code-table__table-header code-table__table-header--params">
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-name">参数名</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-type">类型</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-default">默认值</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-modifier">修饰</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-remark">注释</div>
            </div>
            {params.map((param, idx) => (
              <div key={`inline-${idx}`} className="code-table__table-row code-table__table-row--params">
                {renderParamRow(param, idx)}
              </div>
            ))}
            {paramLines.map((param, idx) => (
              <div key={`line-${param.lineIndex}`} className="code-table__table-row code-table__table-row--params" data-line={param.lineIndex} onClick={(e) => onLineClick(param.lineIndex, e)}>
                {renderParamRow({ name: param.paramName, type: param.paramType, defaultValue: param.defaultValue || '', modifier: param.modifier || '', comment: param.comment }, idx, param.lineIndex)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface TemplateTableProps extends TableLineProps {
  keyword: string;
  templateName: string;
  isExported: boolean;
  genericParams: string;
  paramsStr: string;
  returnType: string;
  comment: string;
}

export const TemplateTable: React.FC<TemplateTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  keyword: _keyword,
  templateName,
  isExported,
  genericParams,
  paramsStr,
  returnType,
  comment,
}) => {
  const params = parseParams(paramsStr);
  const headers = ['模板名', '泛型', '返回类型', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--generic', 'code-table__cell--type', 'code-table__cell--public', 'code-table__cell--remark'];
  const displayName = getDisplayName(templateName);
  
  const cells: CellInfo[] = [
    { text: displayName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: genericParams ? '[' + genericParams + ']' : '', className: 'code-table__cell--generic', fieldIndex: 1 },
    { text: returnType || '空', className: 'code-table__cell--type', fieldIndex: 2 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 3 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 4 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--template">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 2 ? 'type' : 
              i === 3 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
        </div>
        {params.length > 0 && (
          <div className="code-table__params-section">
            <div className="code-table__table-header code-table__table-header--params">
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-name">参数名</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-type">类型</div>
              <div className="code-table__table-cell code-table__table-cell--header code-table__cell--param-remark">注释</div>
            </div>
            {params.map((param, idx) => (
              <div key={idx} className="code-table__table-row code-table__table-row--params">
                <div className="code-table__table-cell code-table__cell--param-name">{param.name}</div>
                <div className="code-table__table-cell code-table__cell--param-type">{param.type}</div>
                <div className="code-table__table-cell code-table__cell--param-remark">{param.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface VarTableProps extends TableLineProps {
  keyword: string;
  varName: string;
  isExported: boolean;
  varType: string;
  varValue: string;
  comment: string;
  showHeader?: boolean;
}

export const VarTable: React.FC<VarTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  keyword: _keyword,
  varName,
  isExported,
  varType,
  varValue,
  comment,
  showHeader = true,
}) => {
  const headers = ['变量名', '类型', '初始值', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--type', 'code-table__cell--value', 'code-table__cell--public', 'code-table__cell--remark'];
  
  const cells: CellInfo[] = [
    { text: varName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: varType || '自动', className: 'code-table__cell--type', fieldIndex: 1 },
    { text: varValue, className: 'code-table__cell--value', fieldIndex: 2 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 3 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 4 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--var">
        {showHeader && (
          <div className="code-table__table-header">
            {headers.map((h, i) => (
              <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
            ))}
          </div>
        )}
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 1 ? 'type' : 
              i === 3 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
        </div>
      </div>
    </div>
  );
};

interface ConstTableProps extends TableLineProps {
  keyword: string;
  constName: string;
  isExported: boolean;
  constType: string;
  constValue: string;
  comment: string;
  showHeader?: boolean;
}

export const ConstTable: React.FC<ConstTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  keyword: _keyword,
  constName,
  isExported,
  constType,
  constValue,
  comment,
  showHeader = true,
}) => {
  const headers = ['常量名', '类型', '值', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--type', 'code-table__cell--value', 'code-table__cell--public', 'code-table__cell--remark'];
  
  const cells: CellInfo[] = [
    { text: constName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: constType || '自动', className: 'code-table__cell--type', fieldIndex: 1 },
    { text: constValue, className: 'code-table__cell--value', fieldIndex: 2 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 3 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 4 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--const">
        {showHeader && (
          <div className="code-table__table-header">
            {headers.map((h, i) => (
              <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
            ))}
          </div>
        )}
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 1 ? 'type' : 
              i === 3 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
        </div>
      </div>
    </div>
  );
};

interface TypeTableProps extends TableLineProps {
  keyword: string;
  typeName: string;
  isExported: boolean;
  typeDef: string;
  comment: string;
}

export const TypeTable: React.FC<TypeTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  keyword: _keyword,
  typeName,
  isExported,
  typeDef,
  comment,
}) => {
  const headers = ['类型名', '定义', '公开', '注释'];
  const headerClasses = ['code-table__cell--name', 'code-table__cell--type', 'code-table__cell--public', 'code-table__cell--remark'];
  
  const cells: CellInfo[] = [
    { text: typeName, className: 'code-table__cell--name', fieldIndex: 0 },
    { text: typeDef || '对象', className: 'code-table__cell--type', fieldIndex: 1 },
    { text: isExported ? '公开' : '', className: 'code-table__cell--public', fieldIndex: 2 },
    { text: comment, className: 'code-table__cell--remark', fieldIndex: 3 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--type">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 2 ? 'public' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
        </div>
      </div>
    </div>
  );
};

interface ImportTableProps extends TableLineProps {
  moduleName: string;
  importType: 'all' | 'except' | 'selective';
  symbols: string;
  comment: string;
}

export const ImportTable: React.FC<ImportTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  moduleName,
  importType,
  symbols,
  comment,
}) => {
  let typeLabel = '全部导入';
  if (importType === 'except') {
    typeLabel = '排除';
  } else if (importType === 'selective') {
    typeLabel = '选择性';
  }
  
  const headers = ['模块名', '导入类型', '符号', '注释'];
  const headerClasses = ['code-table__cell--module-name', 'code-table__cell--import-type', 'code-table__cell--symbols', 'code-table__cell--remark'];
  
  const cells: CellInfo[] = [
    { text: moduleName || '', className: 'code-table__cell--module-name', fieldIndex: 0 },
    { text: typeLabel, className: 'code-table__cell--import-type', fieldIndex: 1 },
    { text: symbols || '', className: 'code-table__cell--symbols', fieldIndex: 2 },
    { text: comment || '', className: 'code-table__cell--remark', fieldIndex: 3 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--import">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => renderEditableCell(lineIndex, i, cell, 'text'))}
        </div>
      </div>
    </div>
  );
};

interface IncludeTableProps extends TableLineProps {
  fileName: string;
  comment: string;
}

export const IncludeTable: React.FC<IncludeTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  fileName,
  comment,
}) => {
  const headers = ['文件名', '注释'];
  const headerClasses = ['code-table__cell--file-name', 'code-table__cell--remark'];
  
  const cells: CellInfo[] = [
    { text: fileName || '', className: 'code-table__cell--file-name', fieldIndex: 0 },
    { text: comment || '', className: 'code-table__cell--remark', fieldIndex: 1 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--include">
        <div className="code-table__table-header">
          {headers.map((h, i) => (
            <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
          ))}
        </div>
        <div className="code-table__table-row">
          {cells.map((cell, i) => renderEditableCell(lineIndex, i, cell, 'text'))}
        </div>
      </div>
    </div>
  );
};

interface ParamTableProps extends TableLineProps {
  keyword: string;
  paramName: string;
  paramType: string;
  comment: string;
  showHeader: boolean;
}

export const ParamTable: React.FC<ParamTableProps> = ({
  lineIndex,
  isSelected,
  onLineClick,
  renderEditableCell,
  keyword: _keyword,
  paramName,
  paramType,
  comment,
  showHeader,
}) => {
  const headers = ['参数名', '类型', '注释'];
  const headerClasses = ['code-table__cell--param-name', 'code-table__cell--param-type', 'code-table__cell--param-remark'];
  
  const cells: CellInfo[] = [
    { text: paramName, className: 'code-table__cell--param-name', fieldIndex: 0 },
    { text: paramType || '自动', className: 'code-table__cell--param-type', fieldIndex: 1 },
    { text: comment, className: 'code-table__cell--param-remark', fieldIndex: 2 },
  ];

  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__table-line ${isSelected ? 'code-table__line--selected' : ''}`}
      onClick={(e) => onLineClick(lineIndex, e)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__table code-table__table--param">
        {showHeader && (
          <div className="code-table__table-header">
            {headers.map((h, i) => (
              <div key={i} className={`code-table__table-cell code-table__table-cell--header ${headerClasses[i]}`}>{h}</div>
            ))}
          </div>
        )}
        <div className="code-table__table-row">
          {cells.map((cell, i) => {
            const cellType: 'text' | 'type' | 'public' = 
              i === 1 ? 'type' : 'text';
            return renderEditableCell(lineIndex, i, cell, cellType);
          })}
        </div>
      </div>
    </div>
  );
};

interface CodeLineProps {
  lineIndex: number;
  line: string;
  isSelected: boolean;
  onLineMouseDown: (lineIndex: number, e: React.MouseEvent) => void;
  onLineMouseEnter?: (lineIndex: number) => void;
  flowSegs?: FlowSegment[];
  maxFlowDepth?: number;
}

export const CodeLine: React.FC<CodeLineProps> = ({
  lineIndex,
  line,
  isSelected,
  onLineMouseDown,
  onLineMouseEnter,
  flowSegs,
  maxFlowDepth: _maxFlowDepth = 0,
}) => {
  const hasFlowSegs = flowSegs && flowSegs.length > 0;
  
  return (
    <div
      key={lineIndex}
      data-line={lineIndex}
      className={`code-table__line ${isSelected ? 'code-table__line--selected' : ''}`}
      onMouseDown={(e) => onLineMouseDown(lineIndex, e)}
      onMouseEnter={() => onLineMouseEnter?.(lineIndex)}
    >
      <div className="code-table__gutter">
        <span className="code-table__line-number">{lineIndex + 1}</span>
      </div>
      <div className="code-table__content">
        {hasFlowSegs && (
          <div className="code-table__flow-lines">
            {flowSegs.map((seg, idx) => (
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
        <span className="code-table__code">{line || '\u00A0'}</span>
      </div>
    </div>
  );
};
