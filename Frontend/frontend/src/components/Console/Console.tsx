import React, { useEffect, useRef, useState } from 'react';
import { useIDEStore } from '../../store/editorStore';

const FONT  = "'JetBrains Mono', monospace";
const SFONT = "'Syne', sans-serif";

export default function Console() {
  const { output, isRunning, errors } = useIDEStore();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const [executedAt, setExecutedAt] = useState<string | null>(null);

  useEffect(() => {
    if (output.length > 0) {
      setExecutedAt(new Date().toLocaleTimeString('es-GT', { hour12: false }));
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  const hasErrors = errors.length > 0;

  return (
    <div style={styles.wrapper}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <span style={styles.title}>CONSOLA</span>

        {isRunning && (
          <span style={styles.runBadge}>
            <span style={styles.pulse} />
            ejecutando…
          </span>
        )}

        {executedAt && !isRunning && (
          <span style={styles.timestamp}>Última ejecución: {executedAt}</span>
        )}

        {output.length > 0 && (
          <button
            style={styles.clearBtn}
            title="Limpiar consola"
            onClick={() => useIDEStore.getState().setResults({
              ast: useIDEStore.getState().ast,
              output: [],
              errors: useIDEStore.getState().errors,
              symbols: useIDEStore.getState().symbols,
            })}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* ── Error summary banner ───────────────────────────────────── */}
      {hasErrors && output.length > 0 && (
        <div style={styles.errBanner}>
          ⚠ La ejecución completó con {errors.length} error(es).
          Cambia al panel <strong>Errores</strong> para ver el detalle.
        </div>
      )}

      {/* ── Output ─────────────────────────────────────────────────── */}
      <div style={styles.body}>
        {output.length === 0 && !isRunning && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>▶</div>
            <div style={styles.emptyTitle}>Sin salida</div>
            <div style={styles.emptyHint}>
              Presiona <kbd style={styles.kbd}>Ejecutar</kbd> o{' '}
              <kbd style={styles.kbd}>Ctrl+Enter</kbd> para correr el programa.
            </div>
          </div>
        )}

        {output.map((line, i) => (
          <div key={i} style={styles.line}>
            <span style={styles.lineNum}>{String(i + 1).padStart(3, ' ')}</span>
            <span style={styles.lineContent}>{line || ' '}</span>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, any> = {
  wrapper:   { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', overflow: 'hidden' },
  header:    { display: 'flex', alignItems: 'center', gap: 10, padding: '5px 14px', borderBottom: '1px solid #1c2333', background: '#010409', flexShrink: 0, minHeight: 34 },
  title:     { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: '#7a8a9e', textTransform: 'uppercase', flex: 1 },
  runBadge:  { display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 11, color: '#3fb950' },
  pulse:     { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#3fb950', animation: 'pulse 1s ease-in-out infinite' },
  timestamp: { fontFamily: FONT, fontSize: 10, color: '#4a5568' },
  clearBtn:  { fontFamily: SFONT, fontWeight: 600, fontSize: 10, background: 'none', border: '1px solid #30363d', color: '#7a8a9e', cursor: 'pointer', borderRadius: 4, padding: '2px 8px', letterSpacing: '0.04em' },
  errBanner: { background: '#2d1d1d', borderBottom: '1px solid #6e2020', color: '#f0883e', fontFamily: SFONT, fontSize: 11, padding: '5px 14px', flexShrink: 0 },
  body:      { flex: 1, overflowY: 'auto', padding: '6px 0' },
  line:      { display: 'flex', alignItems: 'baseline', padding: '1px 14px', gap: 12, lineHeight: '20px' },
  lineNum:   { fontFamily: FONT, fontSize: 11, color: '#3d4f63', userSelect: 'none', flexShrink: 0, minWidth: 28, textAlign: 'right' },
  lineContent: { fontFamily: FONT, fontSize: 13, color: '#e6edf3', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 },
  emptyIcon: { fontFamily: FONT, fontSize: 32, color: '#1c2333' },
  emptyTitle:{ fontFamily: SFONT, fontWeight: 700, fontSize: 14, color: '#3d4f63' },
  emptyHint: { fontFamily: SFONT, fontSize: 12, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'center' },
  kbd:       { background: '#161b22', border: '1px solid #30363d', borderRadius: 4, padding: '1px 6px', fontFamily: FONT, fontSize: 11, color: '#58a6ff' },
};
