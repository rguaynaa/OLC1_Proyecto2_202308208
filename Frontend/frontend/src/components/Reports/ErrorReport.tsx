import React from 'react';
import { useIDEStore } from '../../store/editorStore';
import type { GoScriptError } from '../../types';

// ─── Badge colour per error type ─────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  'Léxico':     '#f0883e',
  'Sintáctico': '#da3633',
  'Semántico':  '#d29922',
};

export default function ErrorReport() {
  const { errors } = useIDEStore();

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>REPORTE DE ERRORES</span>
        <span style={styles.count}>
          {errors.length} {errors.length === 1 ? 'error' : 'errores'}
        </span>
      </div>

      {/* Table */}
      {errors.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>✓</span>
          <span style={styles.emptyText}>Sin errores detectados.</span>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['#', 'Tipo', 'Descripción', 'Línea', 'Columna'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errors.map((err, i) => (
                <ErrorRow key={i} idx={i + 1} error={err} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ErrorRow({ idx, error }: { idx: number; error: GoScriptError }) {
  const color = TYPE_COLOR[error.type] ?? '#7a8a9e';
  return (
    <tr style={styles.tr}>
      <td style={styles.tdNum}>{idx}</td>
      <td style={styles.td}>
        <span style={{ ...styles.typeBadge, background: color + '22', color }}>
          {error.type}
        </span>
      </td>
      <td style={{ ...styles.td, ...styles.tdDesc }}>{error.description}</td>
      <td style={styles.tdNum}>{error.line}</td>
      <td style={styles.tdNum}>{error.column}</td>
    </tr>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const FONT  = "'JetBrains Mono', monospace";
const SFONT = "'Syne', sans-serif";

const styles: Record<string, any> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0d1117',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 14px',
    borderBottom: '1px solid #1c2333',
    background: '#010409',
    flexShrink: 0,
  },
  title: {
    fontFamily: SFONT,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: '#7a8a9e',
    textTransform: 'uppercase',
    flex: 1,
  },
  count: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#da3633',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 8,
    opacity: 0.5,
  },
  emptyIcon: {
    fontSize: 28,
    color: '#3fb950',
  },
  emptyText: {
    fontFamily: SFONT,
    fontSize: 13,
    color: '#7a8a9e',
  },
  tableWrapper: {
    flex: 1,
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    fontFamily: SFONT,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#7a8a9e',
    padding: '7px 12px',
    borderBottom: '1px solid #1c2333',
    textAlign: 'left',
    background: '#010409',
    position: 'sticky',
    top: 0,
  },
  tr: {
    borderBottom: '1px solid #161b22',
  },
  td: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#c9d1d9',
    padding: '6px 12px',
    verticalAlign: 'top',
  },
  tdNum: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#7a8a9e',
    padding: '6px 12px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  tdDesc: {
    color: '#e6edf3',
    maxWidth: 420,
  },
  typeBadge: {
    fontFamily: SFONT,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.08em',
    padding: '2px 8px',
    borderRadius: 10,
    whiteSpace: 'nowrap',
  },
};
