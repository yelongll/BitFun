import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Check, Trash2, AlertCircle, CheckCircle, Info, FileCode, Bug, Rocket, FileBox, ChevronDown, ChevronUp } from 'lucide-react';
import './ProgramOutputPanel.scss';

export interface ProgramOutput {
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'success';
  content: string;
  timestamp?: number;
}

export interface ProgramOutputPanelProps {
  outputs: ProgramOutput[];
  isVisible: boolean;
  onClose: () => void;
  onClear: () => void;
  title?: string;
  compileMode?: 'debug' | 'release';
  outputType?: 'exe' | 'dll' | 'lib' | 'out';
}

const TypeIcon: React.FC<{ type: ProgramOutput['type'] }> = ({ type }) => {
  switch (type) {
    case 'error':
    case 'stderr':
      return <AlertCircle size={14} className="program-output-panel__icon program-output-panel__icon--error" />;
    case 'success':
      return <CheckCircle size={14} className="program-output-panel__icon program-output-panel__icon--success" />;
    case 'info':
      return <Info size={14} className="program-output-panel__icon program-output-panel__icon--info" />;
    case 'stdout':
      return <FileCode size={14} className="program-output-panel__icon program-output-panel__icon--stdout" />;
    default:
      return null;
  }
};

const TypeLabel: React.FC<{ type: ProgramOutput['type'] }> = ({ type }) => {
  switch (type) {
    case 'error': return '错误';
    case 'stderr': return '错误';
    case 'success': return '成功';
    case 'info': return '提示';
    default: return '';
  }
};

const ModeIcon: React.FC<{ mode?: 'debug' | 'release' }> = ({ mode }) => {
  if (mode === 'debug') return <Bug size={12} />;
  if (mode === 'release') return <Rocket size={12} />;
  return <FileCode size={12} />;
};

export const ProgramOutputPanel: React.FC<ProgramOutputPanelProps> = ({
  outputs,
  isVisible,
  onClose,
  onClear,
  title = '程序输出',
  compileMode,
  outputType,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  const handleCopy = () => {
    const text = outputs.map(o => o.content).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isVisible) return null;

  const hasErrors = outputs.some(o => o.type === 'stderr' || o.type === 'error');
  const hasSuccess = outputs.some(o => o.type === 'success');

  const getStatusIcon = () => {
    if (hasErrors) return <AlertCircle size={16} />;
    if (hasSuccess) return <CheckCircle size={16} />;
    return '>';
  };

  const modeDisplay = compileMode === 'debug' ? '调试版' : compileMode === 'release' ? '发布版' : '';
  const typeDisplay = outputType ? outputType.toUpperCase() : '';

  const programOutputs = outputs.filter(o => o.type === 'stdout' || o.type === 'success' || o.type === 'error');
  const compilerOutputs = outputs.filter(o => o.type === 'stderr' || o.type === 'info');
  const hasCompilerInfo = compilerOutputs.length > 0;

  return (
    <div className={`program-output-panel ${hasErrors ? 'has-errors' : ''} ${hasSuccess ? 'has-success' : ''}`}>
      <div className="program-output-panel__header">
        <div className="program-output-panel__status-icon">
          {getStatusIcon()}
        </div>
        <div className="program-output-panel__header-info">
          <h3 className="program-output-panel__title">{title}</h3>
          <div className="program-output-panel__subtitle">
            {outputs.length > 0 ? `${outputs.length} 条输出` : '等待输出...'}
            {typeDisplay && (
              <>
                <span className="program-output-panel__divider">|</span>
                <span className="program-output-panel__tag">
                  <FileBox size={10} />
                  {typeDisplay}
                </span>
              </>
            )}
            {modeDisplay && (
              <>
                <span className="program-output-panel__divider">|</span>
                <span className={`program-output-panel__tag ${compileMode === 'debug' ? 'is-debug' : 'is-release'}`}>
                  <ModeIcon mode={compileMode} />
                  {modeDisplay}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="program-output-panel__actions">
          {hasCompilerInfo && (
            <button
              className={`program-output-panel__action-btn ${showDetails ? 'is-active' : ''}`}
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? '隐藏详细信息' : '显示详细信息'}
            >
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            className={`program-output-panel__action-btn ${isCopied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            title="复制"
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            className="program-output-panel__action-btn"
            onClick={onClear}
            title="清空"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="program-output-panel__action-btn"
            onClick={onClose}
            title="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        className="program-output-panel__content"
        ref={outputRef}
      >
        {outputs.length === 0 ? null : (
          <>
            {programOutputs.map((output, index) => (
              <div key={`program-${index}`} className={`program-output-panel__item program-output-panel__item--${output.type}`}>
                <TypeIcon type={output.type} />
                <span className="program-output-panel__label">{TypeLabel({ type: output.type })}</span>
                <pre className="program-output-panel__text">{output.content}</pre>
              </div>
            ))}
            
            {hasCompilerInfo && showDetails && (
              <div className="program-output-panel__details">
                <div className="program-output-panel__details-header">
                  <Info size={12} />
                  <span>编译器详细信息</span>
                </div>
                {compilerOutputs.map((output, index) => (
                  <div key={`compiler-${index}`} className={`program-output-panel__item program-output-panel__item--${output.type}`}>
                    <TypeIcon type={output.type} />
                    <span className="program-output-panel__label">{TypeLabel({ type: output.type })}</span>
                    <pre className="program-output-panel__text">{output.content}</pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
