import React from 'react';
import { useIDEStore } from '../../store/editorStore';

// Placeholder – fully wired in Part 2 when the interpreter populates symbols[]
export default function SymbolTableReport() {
  const { symbols } = useIDEStore();

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>TABLA DE SÍMBOLOS</span>
        <span style={styles.count}>{symbols.length} símbolo(s)</span>
      </div>

      {symbols.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>⊘</span>
          <span style={styles.emptyText}>
            La tabla de símbolos se completa a partir de la Parte 2 (intérprete).
          </span>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['ID', 'Tipo Símbolo', 'Tipo Dato', 'Ámbito', 'Línea', 'Col'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.tdCode}>{sym.id}</td>
                  <td style={styles.td}>{sym.kind}</td>
                  <td style={styles.tdCode}>{sym.dataType}</td>
                  <td style={styles.td}>{sym.scope}</td>
                  <td style={styles.tdNum}>{sym.line}</td>
                  <td style={styles.tdNum}>{sym.column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const FONT  = "'JetBrains Mono', monospace";
const SFONT = "'Syne', sans-serif";

const styles: Record<string, any> = {
  wrapper:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid #1c2333', background: '#010409', flexShrink: 0 },
  title:        { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: '#7a8a9e', textTransform: 'uppercase', flex: 1 },
  count:        { fontFamily: FONT, fontSize: 11, color: '#58a6ff' },
  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.5 },
  emptyIcon:    { fontSize: 28, color: '#58a6ff' },
  emptyText:    { fontFamily: SFONT, fontSize: 12, color: '#7a8a9e', textAlign: 'center', maxWidth: 320 },
  tableWrapper: { flex: 1, overflowY: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a8a9e', padding: '7px 12px', borderBottom: '1px solid #1c2333', textAlign: 'left', background: '#010409', position: 'sticky', top: 0 },
  tr:           { borderBottom: '1px solid #161b22' },
  td:           { fontFamily: SFONT, fontSize: 12, color: '#c9d1d9', padding: '5px 12px' },
  tdCode:       { fontFamily: FONT, fontSize: 12, color: '#58a6ff', padding: '5px 12px' },
  tdNum:        { fontFamily: FONT, fontSize: 12, color: '#7a8a9e', padding: '5px 12px', textAlign: 'center' },
};
