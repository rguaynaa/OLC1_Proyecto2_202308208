import React, { useState, useMemo } from 'react';
import { useIDEStore } from '../../store/editorStore';
import type { SymbolEntry, SymbolKind } from '../../types';

// ─── Badge colours per symbol kind ───────────────────────────────────────────
const KIND_COLOR: Record<SymbolKind, string> = {
  'Variable':  '#58a6ff',
  'Función':   '#3fb950',
  'Struct':    '#d29922',
  'Parámetro':'#bc8cff',
};

// ─────────────────────────────────────────────────────────────────────────────

export default function SymbolTableReport() {
  const { symbols } = useIDEStore();
  const [filter, setFilter]   = useState('');
  const [kindFilter, setKind] = useState<string>('Todos');

  const kinds = ['Todos', 'Variable', 'Función', 'Struct', 'Parámetro'];

  const visible = useMemo(() => {
    return symbols.filter(sym => {
      const matchKind = kindFilter === 'Todos' || sym.kind === kindFilter;
      const matchText = filter === '' ||
        sym.id.toLowerCase().includes(filter.toLowerCase()) ||
        sym.dataType.toLowerCase().includes(filter.toLowerCase()) ||
        sym.scope.toLowerCase().includes(filter.toLowerCase());
      return matchKind && matchText;
    });
  }, [symbols, filter, kindFilter]);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>TABLA DE SÍMBOLOS</span>
        <span style={styles.count}>{symbols.length} símbolo(s)</span>
      </div>

      {/* Filters */}
      {symbols.length > 0 && (
        <div style={styles.filters}>
          <input
            style={styles.search}
            placeholder="Buscar por nombre, tipo o ámbito…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <div style={styles.kindBtns}>
            {kinds.map(k => (
              <button
                key={k}
                style={{
                  ...styles.kindBtn,
                  ...(kindFilter === k ? styles.kindBtnActive : {}),
                }}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {symbols.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>⊘</span>
          <span style={styles.emptyText}>
            Ejecuta el programa para poblar la tabla de símbolos.
          </span>
        </div>
      ) : visible.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyText}>Sin resultados para el filtro actual.</span>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['#', 'ID', 'Tipo Símbolo', 'Tipo Dato', 'Ámbito', 'Línea', 'Col'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((sym, i) => (
                <SymbolRow key={i} idx={i + 1} sym={sym} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SymbolRow({ idx, sym }: { idx: number; sym: SymbolEntry }) {
  const color = KIND_COLOR[sym.kind] ?? '#7a8a9e';
  return (
    <tr style={styles.tr}>
      <td style={styles.tdNum}>{idx}</td>
      <td style={styles.tdCode}>{sym.id}</td>
      <td style={styles.td}>
        <span style={{ ...styles.kindBadge, background: color + '20', color }}>
          {sym.kind}
        </span>
      </td>
      <td style={styles.tdCode}>{sym.dataType}</td>
      <td style={styles.tdScope}>{sym.scope}</td>
      <td style={styles.tdNum}>{sym.line}</td>
      <td style={styles.tdNum}>{sym.column}</td>
    </tr>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const FONT  = "'JetBrains Mono', monospace";
const SFONT = "'Syne', sans-serif";

const styles: Record<string, any> = {
  wrapper:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid #1c2333', background: '#010409', flexShrink: 0 },
  title:        { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: '#7a8a9e', textTransform: 'uppercase', flex: 1 },
  count:        { fontFamily: FONT, fontSize: 11, color: '#58a6ff' },
  filters:      { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 14px', borderBottom: '1px solid #1c2333', flexShrink: 0, background: '#010409' },
  search:       { fontFamily: FONT, fontSize: 12, background: '#161b22', border: '1px solid #30363d', borderRadius: 5, color: '#e6edf3', padding: '5px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  kindBtns:     { display: 'flex', gap: 4, flexWrap: 'wrap' },
  kindBtn:      { fontFamily: SFONT, fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', background: 'none', border: '1px solid #30363d', color: '#7a8a9e', cursor: 'pointer', padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase' },
  kindBtnActive:{ background: '#161b22', color: '#e6edf3', borderColor: '#58a6ff' },
  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.5 },
  emptyIcon:    { fontSize: 28, color: '#58a6ff' },
  emptyText:    { fontFamily: SFONT, fontSize: 12, color: '#7a8a9e', textAlign: 'center', maxWidth: 280 },
  tableWrapper: { flex: 1, overflowY: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a8a9e', padding: '7px 12px', borderBottom: '1px solid #1c2333', textAlign: 'left', background: '#010409', position: 'sticky', top: 0, zIndex: 1 },
  tr:           { borderBottom: '1px solid #161b22' },
  td:           { fontFamily: SFONT, fontSize: 12, color: '#c9d1d9', padding: '5px 12px', verticalAlign: 'middle' },
  tdCode:       { fontFamily: FONT, fontSize: 12, color: '#58a6ff', padding: '5px 12px' },
  tdScope:      { fontFamily: FONT, fontSize: 12, color: '#3fb950', padding: '5px 12px' },
  tdNum:        { fontFamily: FONT, fontSize: 12, color: '#7a8a9e', padding: '5px 12px', textAlign: 'center' },
  kindBadge:    { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' },
};
