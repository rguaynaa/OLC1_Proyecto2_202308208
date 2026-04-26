import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/editorStore';

// ─────────────────────────────────────────────────────────────────────────────
// ASTReport.tsx  –  Part 6: Graphical interactive AST visualiser.
//
// Renders the AST as a collapsible, colour-coded tree.
// Also provides a DOT-format download button (Graphviz compatible).
// ─────────────────────────────────────────────────────────────────────────────

const FONT  = "'JetBrains Mono', monospace";
const SFONT = "'Syne', sans-serif";

// ── Colour mapping per node type ─────────────────────────────────────────────
const NODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Program:          { bg: '#0d419d22', text: '#79c0ff', border: '#0d419d' },
  FunctionDecl:     { bg: '#1a422822', text: '#3fb950', border: '#238636' },
  StructDecl:       { bg: '#3d2b0022', text: '#d29922', border: '#9e6a03' },
  Block:            { bg: '#21262d22', text: '#8b949e', border: '#30363d' },
  VarDecl:          { bg: '#1c233322', text: '#58a6ff', border: '#388bfd' },
  Assignment:       { bg: '#21262d22', text: '#f0883e', border: '#db6d28' },
  BinaryExpr:       { bg: '#2d1c3d22', text: '#bc8cff', border: '#8957e5' },
  UnaryExpr:        { bg: '#2d1c3d22', text: '#bc8cff', border: '#8957e5' },
  Literal:          { bg: '#0d2d0d22', text: '#56d364', border: '#2ea043' },
  Identifier:       { bg: '#16294022', text: '#79c0ff', border: '#388bfd' },
  FunctionCall:     { bg: '#1c233322', text: '#d2a8ff', border: '#8957e5' },
  IfStatement:      { bg: '#31101022', text: '#ff7b72', border: '#da3633' },
  ForStatement:     { bg: '#31101022', text: '#ff7b72', border: '#da3633' },
  SwitchStatement:  { bg: '#31101022', text: '#ff7b72', border: '#da3633' },
  ReturnStatement:  { bg: '#2d1c0022', text: '#ffa657', border: '#db6d28' },
  BreakStatement:   { bg: '#2d1c0022', text: '#ffa657', border: '#db6d28' },
  ContinueStatement:{ bg: '#2d1c0022', text: '#ffa657', border: '#db6d28' },
  SliceLiteral:     { bg: '#0d2d3d22', text: '#58a6ff', border: '#388bfd' },
  SliceLiteral2D:   { bg: '#0d2d3d22', text: '#58a6ff', border: '#388bfd' },
  SliceAccess:      { bg: '#0d2d3d22', text: '#58a6ff', border: '#388bfd' },
  SliceAccess2D:    { bg: '#0d2d3d22', text: '#58a6ff', border: '#388bfd' },
  StructLiteral:    { bg: '#2d250022', text: '#d29922', border: '#9e6a03' },
  StructAccess:     { bg: '#2d250022', text: '#d29922', border: '#9e6a03' },
};

const DEFAULT_COLOR = { bg: '#21262d22', text: '#c9d1d9', border: '#30363d' };

function colorFor(type: string) {
  return NODE_COLORS[type] ?? DEFAULT_COLOR;
}

// ── Label builder ────────────────────────────────────────────────────────────
function labelFor(node: any): string {
  if (!node || typeof node !== 'object') return String(node ?? 'null');
  const t = node.type;
  if (!t) {
    // Si el nodo no tiene tipo formal pero es objeto (ej. un param o un field)
    return '';
  }
  switch (t) {
    case 'Program':        return 'Program';
    case 'FunctionDecl':   return `func ${node.name}()`;
    case 'StructDecl':     return `struct ${node.name}`;
    case 'Block':          return '{ block }';
    case 'VarDecl': {
      const decl = node.infer ? ':=' : node.varType ? `: ${node.varType}` : '';
      return `var ${node.name}${decl}`;
    }
    case 'Assignment':     return node.operator;
    case 'BinaryExpr':     return node.operator;
    case 'UnaryExpr':      return `${node.operator}(…)`;
    case 'Literal': {
      const v = node.dataType === 'string'
        ? `"${String(node.value ?? '').substring(0, 18)}"`
        : String(node.value ?? '');
      return `${node.dataType}: ${v}`;
    }
    case 'Identifier':     return `id: ${node.name}`;
    case 'FunctionCall':   return node.object
      ? `${node.object}.${node.name}()`
      : `${node.name}()`;
    case 'IfStatement':    return 'if / else';
    case 'ForStatement':   return `for (${node.form})`;
    case 'SwitchStatement':return 'switch';
    case 'ReturnStatement':return 'return';
    case 'BreakStatement': return 'break';
    case 'ContinueStatement': return 'continue';
    case 'SliceLiteral':   return `[]${node.elementType}{ }`;
    case 'SliceLiteral2D': return `[][]${node.elementType}{ }`;
    case 'SliceAccess':    return 'slice[i]';
    case 'SliceAccess2D':  return 'slice[i][j]';
    case 'StructLiteral':  return node.structName ? `${node.structName}{ }` : '{ struct }';
    case 'StructAccess':   return `.${node.field}`;
    default: return t;
  }
}

// ── Child extractor ──────────────────────────────────────────────────────────
function childrenOf(node: any): { label: string; child: any }[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [];
  const t = node.type;
  const ch: { label: string; child: any }[] = [];

  const push = (label: string, child: any) => { if (child != null) ch.push({ label, child }); };

  switch (t) {
    case 'Program':
      (node.declarations ?? []).forEach((d: any, i: number) =>
        push(`decl[${i}]`, d));
      break;
    case 'FunctionDecl':
      (node.params ?? []).forEach((p: any) => push(`param: ${p.name}`, p));
      push('body', node.body);
      break;
    case 'StructDecl':
      (node.fields ?? []).forEach((f: any) => push(`${f.fieldType} ${f.name}`, f));
      break;
    case 'Block':
      (node.statements ?? []).forEach((s: any, i: number) =>
        push(`stmt[${i}]`, s));
      break;
    case 'VarDecl':
      push('value', node.value);
      break;
    case 'Assignment':
      push('target', node.target);
      push('value', node.value);
      break;
    case 'BinaryExpr':
      push('left', node.left);
      push('right', node.right);
      break;
    case 'UnaryExpr':
      push('operand', node.operand);
      break;
    case 'FunctionCall':
      (node.args ?? []).forEach((a: any, i: number) => push(`arg[${i}]`, a));
      break;
    case 'IfStatement':
      push('condition', node.condition);
      push('then', node.thenBlock);
      push('else', node.elseClause);
      break;
    case 'ForStatement':
      if (node.form === 'classic') {
        push('init', node.init);
        push('condition', node.condition);
        push('post', node.post);
      } else if (node.form === 'while') {
        push('condition', node.condition);
      } else if (node.form === 'range') {
        push('iterable', node.iterable);
      }
      push('body', node.body);
      break;
    case 'SwitchStatement':
      push('expr', node.expr);
      (node.cases ?? []).forEach((c: any, i: number) => push(`case[${i}]`, c));
      push('default', node.defaultCase);
      break;
    case 'ReturnStatement':
      push('value', node.value);
      break;
    case 'SliceLiteral':
      (node.elements ?? []).forEach((e: any, i: number) => push(`[${i}]`, e));
      break;
    case 'SliceLiteral2D':
      (node.rows ?? []).forEach((row: any[], i: number) =>
        row.forEach((e: any, j: number) => push(`[${i}][${j}]`, e)));
      break;
    case 'SliceAccess':
      push('slice', node.slice);
      push('index', node.index);
      break;
    case 'SliceAccess2D':
      push('slice', node.slice);
      push('row',   node.row);
      push('col',   node.col);
      break;
    case 'StructLiteral':
      (node.fields ?? []).forEach((fi: any) => push(fi.field, fi.value));
      break;
    case 'StructAccess':
      push('object', node.object);
      break;
  }
  return ch;
}

// ── Tree Node component ──────────────────────────────────────────────────────
interface TreeNodeProps {
  node: any;
  depth: number;
  edgeLabel?: string;
  expandedIds: Set<string>;
  toggleId: (id: string) => void;
  uid: string;
}

function TreeNode({ node, depth, edgeLabel, expandedIds, toggleId, uid }: TreeNodeProps) {
  if (node === null || node === undefined) return null;

  // Primitive leaf
  if (typeof node !== 'object') {
    return (
      <div style={{ paddingLeft: depth * 20 }}>
        <div style={styles.leafRow}>
          {edgeLabel && <span style={styles.edgeLabel}>{edgeLabel}:&nbsp;</span>}
          <span style={{ ...styles.leafValue, color: '#56d364' }}>{String(node)}</span>
        </div>
      </div>
    );
  }

  const label   = labelFor(node);
  const color   = colorFor(node.type);
  const children = childrenOf(node);
  const hasKids  = children.length > 0;
  const expanded = expandedIds.has(uid);

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      {/* ── Node pill ────────────────────────────────────────────── */}
      <div
        style={{
          ...styles.nodePill,
          background: color.bg,
          borderColor: color.border,
          cursor: hasKids ? 'pointer' : 'default',
        }}
        onClick={() => hasKids && toggleId(uid)}
      >
        {edgeLabel && (
          <span style={styles.edgeLabel}>
            {edgeLabel}{label ? ': ' : ''}
          </span>
        )}
        {hasKids && (
          <span style={{ ...styles.caret, color: color.text }}>
            {expanded ? '▾' : '▸'}
          </span>
        )}
        <span style={{ ...styles.nodeLabel, color: color.text }}>{label}</span>
        {node.type && (
          <span style={{ ...styles.nodeType, color: color.border }}>
            {' ' + node.type}
          </span>
        )}
        {(node.line ?? 0) > 0 && (
          <span style={styles.lineBadge}>L{node.line}</span>
        )}
      </div>

      {/* ── Children ─────────────────────────────────────────────── */}
      {expanded && children.map(({ label: l, child }, i) => (
        <TreeNode
          key={i}
          node={child}
          depth={depth + 1}
          edgeLabel={l}
          expandedIds={expandedIds}
          toggleId={toggleId}
          uid={`${uid}-${i}`}
        />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ASTReport() {
  const { ast, dot } = useIDEStore();
  const [expandedIds, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearch]    = useState('');
  const [viewMode, setViewMode]    = useState<'tree' | 'dot' | 'graph'>('tree');
  const [graphSvgUrl, setGraphSvgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'graph' && dot) {
      fetch('https://kroki.io/graphviz/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: dot
      })
      .then(res => res.text())
      .then(svgText => {
        // Envolver el texto en un blob explícito con tipo MIME SVG para img tag
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setGraphSvgUrl(url);
      })
      .catch(console.error);
    }
  }, [viewMode, dot]);

  const toggleId = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  function expandAll()   { /* collect all IDs – simplified: toggle root */ setExpanded(new Set(['root'])); }
  function collapseAll() { setExpanded(new Set()); }

  function downloadDot() {
    if (!dot) return;
    const blob = new Blob([dot], { type: 'text/vnd.graphviz' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'ast.dot';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.wrapper}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <span style={styles.title}>ÁRBOL DE SINTAXIS ABSTRACTA</span>
        <div style={styles.headerRight}>
          {/* View toggle */}
          <div style={styles.toggleGroup}>
            <button
              style={{ ...styles.toggleBtn, ...(viewMode === 'tree' ? styles.toggleActive : {}) }}
              onClick={() => setViewMode('tree')}
            >Tree</button>
            <button
              style={{ ...styles.toggleBtn, ...(viewMode === 'graph' ? styles.toggleActive : {}) }}
              onClick={() => setViewMode('graph')}
            >Graphviz</button>
            <button
              style={{ ...styles.toggleBtn, ...(viewMode === 'dot' ? styles.toggleActive : {}) }}
              onClick={() => setViewMode('dot')}
            >DOT</button>
          </div>
          {dot && (
            <button style={styles.dlBtn} onClick={downloadDot} title="Descargar .dot para Graphviz">
              ↓ .dot
            </button>
          )}
        </div>
      </div>

      {/* ── Controls (tree mode) ────────────────────────────────────── */}
      {viewMode === 'tree' && ast && (
        <div style={styles.controls}>
          <input
            style={styles.searchBox}
            placeholder="Buscar nodo…"
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
          <button style={styles.ctrlBtn} onClick={() => setExpanded(new Set(['root']))}>
            ▾ Expandir raíz
          </button>
          <button style={styles.ctrlBtn} onClick={collapseAll}>
            ▸ Colapsar todo
          </button>
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div style={styles.body}>
        {!ast ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>⊤</span>
            <span style={styles.emptyText}>
              El AST se genera al ejecutar el código.
            </span>
          </div>
        ) : viewMode === 'tree' ? (
          <TreeNode
            node={ast}
            depth={0}
            expandedIds={expandedIds}
            toggleId={toggleId}
            uid="root"
          />
        ) : viewMode === 'graph' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            {graphSvgUrl ? (
               <img src={graphSvgUrl} alt="Graphviz AST" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
               <span style={styles.emptyText}>Generando grafo...</span>
            )}
          </div>
        ) : (
          <pre style={styles.dotCode}>{dot || '/* DOT no disponible */'}</pre>
        )}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, any> = {
  wrapper: {
    display: 'flex', flexDirection: 'column',
    height: '100%', background: '#0d1117', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 14px', borderBottom: '1px solid #1c2333',
    background: '#010409', flexShrink: 0,
  },
  title: {
    fontFamily: SFONT, fontWeight: 700, fontSize: 10,
    letterSpacing: '0.12em', color: '#7a8a9e', textTransform: 'uppercase',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  toggleGroup: { display: 'flex', border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' },
  toggleBtn: {
    fontFamily: SFONT, fontWeight: 600, fontSize: 10, letterSpacing: '0.06em',
    background: 'none', border: 'none', color: '#7a8a9e',
    cursor: 'pointer', padding: '3px 10px', textTransform: 'uppercase',
  },
  toggleActive: { background: '#161b22', color: '#e6edf3' },
  dlBtn: {
    fontFamily: FONT, fontSize: 11, background: '#161b22',
    border: '1px solid #30363d', color: '#58a6ff',
    cursor: 'pointer', borderRadius: 5, padding: '3px 10px',
  },
  controls: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderBottom: '1px solid #1c2333',
    background: '#010409', flexShrink: 0, flexWrap: 'wrap',
  },
  searchBox: {
    fontFamily: FONT, fontSize: 11, background: '#161b22',
    border: '1px solid #30363d', borderRadius: 5,
    color: '#e6edf3', padding: '4px 10px', outline: 'none', width: 200,
  },
  ctrlBtn: {
    fontFamily: SFONT, fontWeight: 600, fontSize: 10, letterSpacing: '0.05em',
    background: 'none', border: '1px solid #30363d', color: '#7a8a9e',
    cursor: 'pointer', borderRadius: 4, padding: '3px 10px', textTransform: 'uppercase',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '10px 14px',
  },
  // Tree styles
  nodePill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    border: '1px solid', borderRadius: 6,
    padding: '3px 10px', marginBottom: 3,
    maxWidth: '100%', userSelect: 'none',
    fontFamily: FONT, fontSize: 12,
    transition: 'opacity 0.1s',
  },
  caret: { fontSize: 10, fontFamily: FONT, flexShrink: 0 },
  nodeLabel: { fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 },
  nodeType: { fontSize: 10, opacity: 0.7, whiteSpace: 'nowrap', flexShrink: 0 },
  edgeLabel: { fontFamily: FONT, fontSize: 10, color: '#484f58', flexShrink: 0 },
  lineBadge: {
    fontFamily: FONT, fontSize: 9, color: '#484f58',
    background: '#161b22', borderRadius: 4, padding: '1px 4px', flexShrink: 0,
  },
  leafRow: { display: 'flex', alignItems: 'center', marginBottom: 2, paddingLeft: 8 },
  leafValue: { fontFamily: FONT, fontSize: 11 },
  // DOT view
  dotCode: {
    fontFamily: FONT, fontSize: 11, color: '#8b949e',
    margin: 0, lineHeight: '18px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    background: '#010409', padding: '12px 16px',
  },
  // Empty state
  empty: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 8, opacity: 0.5,
  },
  emptyIcon: { fontSize: 28, color: '#d29922' },
  emptyText: { fontFamily: SFONT, fontSize: 12, color: '#7a8a9e', textAlign: 'center', lineHeight: '1.6' },
};
