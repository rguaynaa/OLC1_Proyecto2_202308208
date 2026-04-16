import React from 'react';
import { useIDEStore } from '../../store/editorStore';
import { interpretCode } from '../../services/api';
import type { BottomPanel } from '../../types';

// ─── Icons ────────────────────────────────────────────────────────────────────
const RunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="22" strokeDashoffset="8" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

const PANELS: { key: BottomPanel; label: string }[] = [
  { key: 'console', label: 'Consola' },
  { key: 'errors',  label: 'Errores' },
  { key: 'symbols', label: 'Símbolos' },
  { key: 'ast',     label: 'AST' },
];

export default function Toolbar() {
  const {
    activePanel, setActivePanel,
    isRunning, setRunning,
    activeTab, setResults,
    errors,
  } = useIDEStore();

  async function handleRun() {
    const tab = activeTab();
    if (!tab || isRunning) return;

    setRunning(true);
    try {
      const result = await interpretCode(tab.content);
      setResults(result);
      // Switch to errors panel automatically if errors found, otherwise console
      if (result.errors.length > 0) {
        setActivePanel('errors');
      } else {
        setActivePanel('console');
      }
    } finally {
      setRunning(false);
    }
  }

  const errorCount = errors.length;

  return (
    <div style={styles.wrapper}>
      {/* ── Left: branding ──────────────────────────────────────────── */}
      <div style={styles.brand}>
        <span style={styles.brandText}>Go</span>
        <span style={styles.brandAccent}>Script</span>
        <span style={styles.brandSub}>IDE</span>
      </div>

      {/* ── Centre: panel tabs ──────────────────────────────────────── */}
      <div style={styles.panelTabs}>
        {PANELS.map(p => (
          <button
            key={p.key}
            style={{
              ...styles.panelTab,
              ...(activePanel === p.key ? styles.panelTabActive : {}),
            }}
            onClick={() => setActivePanel(p.key)}
          >
            {p.label}
            {p.key === 'errors' && errorCount > 0 && (
              <span style={styles.badge}>{errorCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Right: run button ───────────────────────────────────────── */}
      <div style={styles.right}>
        <button
          style={{
            ...styles.runBtn,
            ...(isRunning ? styles.runBtnDisabled : {}),
          }}
          onClick={handleRun}
          disabled={isRunning}
          title="Ejecutar código (Ctrl+Enter)"
        >
          {isRunning ? <SpinnerIcon /> : <RunIcon />}
          <span>{isRunning ? 'Ejecutando…' : 'Ejecutar'}</span>
        </button>
      </div>

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, any> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#010409',
    borderBottom: '1px solid #1c2333',
    height: 44,
    padding: '0 12px',
    gap: 8,
    flexShrink: 0,
    userSelect: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 0,
    marginRight: 8,
  },
  brandText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#58a6ff',
    letterSpacing: '-0.02em',
  },
  brandAccent: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#3fb950',
    letterSpacing: '-0.02em',
  },
  brandSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: '#7a8a9e',
    marginLeft: 5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  panelTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  panelTab: {
    background: 'none',
    border: 'none',
    color: '#7a8a9e',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '5px 14px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'color 0.15s, background 0.15s',
  },
  panelTabActive: {
    color: '#e6edf3',
    background: '#161b22',
  },
  badge: {
    background: '#da3633',
    color: '#fff',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 10,
    padding: '1px 5px',
    lineHeight: '14px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  runBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: '#238636',
    border: '1px solid #2ea043',
    color: '#fff',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    padding: '6px 16px',
    borderRadius: 6,
    transition: 'background 0.15s, border-color 0.15s',
  },
  runBtnDisabled: {
    background: '#1a4228',
    borderColor: '#1a4228',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
};
