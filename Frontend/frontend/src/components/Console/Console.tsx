import React, { useEffect, useRef } from 'react';
import { useIDEStore } from '../../store/editorStore';

// ─────────────────────────────────────────────────────────────────────────────
// Console  –  Displays the output produced by fmt.Println during execution.
// Also shows a welcome / idle message when no output is present.
// ─────────────────────────────────────────────────────────────────────────────

export default function Console() {
  const { output, isRunning } = useIDEStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new output arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>CONSOLA DE SALIDA</span>
        {isRunning && (
          <span style={styles.runningBadge}>
            <span style={styles.dot} /> ejecutando…
          </span>
        )}
      </div>

      {/* Output area */}
      <div style={styles.body}>
        {output.length === 0 && !isRunning ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>▶</span>
            <span style={styles.emptyText}>
              Presiona <kbd style={styles.kbd}>Ejecutar</kbd> para ver la salida del programa.
            </span>
          </div>
        ) : (
          output.map((line, i) => (
            <div key={i} style={styles.line}>
              <span style={styles.lineNum}>{String(i + 1).padStart(3, ' ')}</span>
              <span style={styles.lineContent}>{line}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const FONT = "'JetBrains Mono', monospace";

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
  headerLabel: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: '#7a8a9e',
    textTransform: 'uppercase',
  },
  runningBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: FONT,
    fontSize: 11,
    color: '#3fb950',
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#3fb950',
    animation: 'pulse 1s ease-in-out infinite',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  line: {
    display: 'flex',
    alignItems: 'baseline',
    padding: '1px 14px',
    gap: 12,
    lineHeight: '20px',
  },
  lineNum: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#3d4f63',
    userSelect: 'none',
    flexShrink: 0,
    minWidth: 28,
    textAlign: 'right',
  },
  lineContent: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#e6edf3',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 10,
    opacity: 0.45,
  },
  emptyIcon: {
    fontFamily: FONT,
    fontSize: 28,
    color: '#3fb950',
  },
  emptyText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    color: '#7a8a9e',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  kbd: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 4,
    padding: '1px 6px',
    fontFamily: FONT,
    fontSize: 11,
    color: '#58a6ff',
  },
};
