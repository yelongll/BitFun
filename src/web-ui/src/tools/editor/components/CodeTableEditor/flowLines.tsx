export interface FlowSegment {
  indent: number;
  type: 'fold' | 'vert' | 'horz';
  isLoop: boolean;
  showTopArrow?: boolean;
  showBottomArrow?: boolean;
}

interface KeywordInfo {
  isLoop: boolean;
  isBranch: boolean;
}

const FLOW_KEYWORDS: Record<string, KeywordInfo> = {
  'if': { isLoop: false, isBranch: false },
  'case': { isLoop: false, isBranch: false },
  'while': { isLoop: true, isBranch: false },
  'for': { isLoop: true, isBranch: false },
  'when': { isLoop: false, isBranch: false },
  'block': { isLoop: false, isBranch: false },
  'try': { isLoop: false, isBranch: false },
  'proc': { isLoop: false, isBranch: false },
  'func': { isLoop: false, isBranch: false },
  'type': { isLoop: false, isBranch: false },
  'enum': { isLoop: false, isBranch: false },
  'object': { isLoop: false, isBranch: false },
  '如果': { isLoop: false, isBranch: false },
  '判断': { isLoop: false, isBranch: false },
  '循环': { isLoop: true, isBranch: false },
  '计次': { isLoop: true, isBranch: false },
  '当': { isLoop: true, isBranch: false },
  '尝试': { isLoop: false, isBranch: false },
  '过程': { isLoop: false, isBranch: false },
  '函数': { isLoop: false, isBranch: false },
  '类型': { isLoop: false, isBranch: false },
  '枚举': { isLoop: false, isBranch: false },
  '对象': { isLoop: false, isBranch: false },
  'elif': { isLoop: false, isBranch: true },
  'else': { isLoop: false, isBranch: true },
  'of': { isLoop: false, isBranch: true },
  'except': { isLoop: false, isBranch: true },
  'finally': { isLoop: false, isBranch: true },
  '否则如果': { isLoop: false, isBranch: true },
  '否则': { isLoop: false, isBranch: true },
  '为': { isLoop: false, isBranch: true },
  '异常': { isLoop: false, isBranch: true },
  '最后': { isLoop: false, isBranch: true },
  '当为': { isLoop: false, isBranch: true },
};

const BLOCK_END_KEYWORDS = new Set([
  'end', '结束',
]);

function extractKeyword(codeLine: string): string | null {
  const trimmed = codeLine.trim();
  if (!trimmed) return null;

  for (const kw of Object.keys(FLOW_KEYWORDS)) {
    const pattern = new RegExp(`^${kw}(?:\\s|:|$|\\(|\\u4e00-\\u9fa5)`);
    if (pattern.test(trimmed)) {
      return kw;
    }
  }

  return null;
}

function isBlockEnd(codeLine: string): boolean {
  const trimmed = codeLine.trim();
  if (!trimmed) return false;
  for (const kw of BLOCK_END_KEYWORDS) {
    if (trimmed === kw || trimmed.startsWith(kw + ' ') || trimmed.startsWith(kw + ':')) {
      return true;
    }
  }
  return false;
}

function getIndent(line: string): number {
  const match = line.match(/^( *)/);
  return match ? match[1].length : 0;
}

export function computeFlowLines(lines: string[]): { map: Map<number, FlowSegment[]>; maxIndent: number } {
  const map = new Map<number, FlowSegment[]>();
  let maxIndent = 0;

  const stack: { keyword: string; indent: number; isLoop: boolean; startLine: number }[] = [];

  const addSeg = (lineIndex: number, seg: FlowSegment) => {
    if (!map.has(lineIndex)) map.set(lineIndex, []);
    const segs = map.get(lineIndex)!;
    const existingIdx = segs.findIndex(s => s.indent === seg.indent);
    if (existingIdx >= 0) {
      segs[existingIdx] = { ...segs[existingIdx], ...seg };
    } else {
      segs.push(seg);
      if (seg.indent > maxIndent) maxIndent = seg.indent;
    }
  };

  const blockRanges: { startLine: number; endLine: number; indent: number; isLoop: boolean }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = getIndent(line);
    const kw = extractKeyword(line);
    const kwInfo = kw ? FLOW_KEYWORDS[kw] : null;

    if (isBlockEnd(line)) {
      while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
        const closed = stack.pop()!;
        blockRanges.push({
          startLine: closed.startLine,
          endLine: i,
          indent: closed.indent,
          isLoop: closed.isLoop
        });
      }
      continue;
    }

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      if (kwInfo && kwInfo.isBranch && indent === stack[stack.length - 1].indent) {
        break;
      }
      const closed = stack.pop()!;
      blockRanges.push({
        startLine: closed.startLine,
        endLine: i - 1,
        indent: closed.indent,
        isLoop: closed.isLoop
      });
    }

    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
      if (kw && kwInfo && !kwInfo.isBranch) {
        stack.push({
          keyword: kw,
          indent: indent,
          isLoop: kwInfo.isLoop,
          startLine: i
        });

        addSeg(i, { indent: indent, type: 'fold', isLoop: kwInfo.isLoop, showTopArrow: true });
      } else if (kw && kwInfo && kwInfo.isBranch) {
        if (stack.length > 0) {
          addSeg(i, { indent: stack[stack.length - 1].indent, type: 'horz', isLoop: stack[stack.length - 1].isLoop });
        }
      }
    }
  }

  while (stack.length > 0) {
    const closed = stack.pop()!;
    blockRanges.push({
      startLine: closed.startLine,
      endLine: lines.length - 1,
      indent: closed.indent,
      isLoop: closed.isLoop
    });
  }

  for (const range of blockRanges) {
    for (let lineIdx = range.startLine + 1; lineIdx <= range.endLine; lineIdx++) {
      const isEndLine = lineIdx === range.endLine;
      addSeg(lineIdx, {
        indent: range.indent,
        type: 'vert',
        isLoop: range.isLoop,
        showTopArrow: false,
        showBottomArrow: isEndLine
      });
    }
  }

  for (const segs of map.values()) {
    if (segs.length > 1) {
      segs.sort((a, b) => a.indent - b.indent);
    }
  }

  return { map, maxIndent };
}
