export type DeclType =
  | 'assembly'
  | 'assemblyVar'
  | 'sub'
  | 'subParam'
  | 'localVar'
  | 'globalVar'
  | 'constant'
  | 'dataType'
  | 'dataTypeMember'
  | 'dll'
  | 'image'
  | 'sound'
  | 'using'
  | 'mainEntry'
  | 'version'
  | 'supportLib'
  | 'blank'
  | 'comment'
  | 'code';

export interface ParsedLine {
  type: DeclType;
  raw: string;
  fields: string[];
  indent: number;
  lineIndex: number;
}

export interface TableCell {
  text: string;
  className: string;
  fieldIndex?: number;
  isEditable?: boolean;
  selectOptions?: string[];
  isCheckbox?: boolean;
  isChecked?: boolean;
  colSpan?: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableHeader {
  text: string;
  className?: string;
}

export interface TableSection {
  type: 'table';
  declType: DeclType;
  header: TableHeader[];
  rows: TableRow[];
  lineIndex: number;
}

export interface TableRow {
  cells: TableCell[];
  lineIndex: number;
  isHeader?: boolean;
}

export interface CodeLine {
  type: 'code';
  raw: string;
  lineIndex: number;
  indent: number;
}

export type RenderBlock = TableSection | CodeLine;

export interface EditorState {
  content: string;
  lines: ParsedLine[];
  blocks: RenderBlock[];
  cursorLine: number;
  cursorColumn: number;
  selectedLines: Set<number>;
  editCell: EditCellState | null;
}

export interface EditCellState {
  lineIndex: number;
  cellIndex: number;
  fieldIndex: number;
  value: string;
  isVirtual?: boolean;
}

export interface FileProblem {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface CompletionItem {
  name: string;
  type: string;
  description?: string;
  insertText?: string;
}

export interface EditorProps {
  value: string;
  isClassModule?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onProblemsChange?: (problems: FileProblem[]) => void;
  projectGlobalVars?: Array<{ name: string; type: string }>;
  projectConstants?: Array<{ name: string; value: string }>;
  projectDataTypes?: Array<{ name: string }>;
  availableTypes?: string[];
}

export interface EditorHandle {
  insertSubroutine: () => void;
  insertVariable: (type: 'local' | 'global' | 'assembly') => void;
  navigateToLine: (line: number) => void;
  getContent: () => string;
  focus: () => void;
}
