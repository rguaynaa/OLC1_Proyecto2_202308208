import React, { useEffect } from 'react';
import Toolbar            from './components/Toolbar/Toolbar';
import TabBar             from './components/Editor/TabBar';
import CodeEditor         from './components/Editor/CodeEditor';
import Console            from './components/Console/Console';
import ErrorReport        from './components/Reports/ErrorReport';
import SymbolTableReport  from './components/Reports/SymbolTableReport';
import ASTReport          from './components/Reports/ASTReport';
import { useIDEStore }    from './store/editorStore';
import { interpretCode }  from './services/api';

export default function App() {
  const { activePanel, setRunning, setResults, activeTab } = useIDEStore();

  // ── Global keyboard shortcut: Ctrl+Enter → Run ────────────────────────────
  useEffect(() => {
    async function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const tab = activeTab();
        if (!tab) return;
        setRunning(true);
        try {
          const result = await interpretCode(tab.content);
          setResults(result);
          useIDEStore.getState().setActivePanel(
            result.errors.length > 0 ? 'errors' : 'console'
          );
        } finally {
          setRunning(false);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, setRunning, setResults]);

  // ── Render the active bottom panel ────────────────────────────────────────
  function renderPanel() {
    switch (activePanel) {
      case 'console': return <Console />;
      case 'errors':  return <ErrorReport />;
      case 'symbols': return <SymbolTableReport />;
      case 'ast':     return <ASTReport />;
      default:        return <Console />;
    }
  }

  return (
    <>
      {/* ── Global styles injected once ──────────────────────────────────── */}
      <style>{GLOBAL_CSS}</style>

      <div style={layout.root}>
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <Toolbar />

        {/* ── File tabs ────────────────────────────────────────────────── */}
        <TabBar />

        {/* ── Main content: editor + panel ─────────────────────────────── */}
        <div style={layout.main}>
          {/* Editor column */}
          <div style={layout.editorCol}>
            <CodeEditor />
          </div>

          {/* Vertical divider */}
          <div style={layout.divider} />

          {/* Bottom panel column */}
          <div style={layout.panelCol}>
            {renderPanel()}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer style={layout.footer}>
          <span>GoScript IDE · OLC1 · USAC Ingeniería en Ciencias y Sistemas</span>
          <span>Parte 1 — Análisis Léxico + Sintáctico</span>
        </footer>
      </div>
    </>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
const layout: Record<string, React.CSSProperties> = {
  root: {
    display:        'flex',
    flexDirection:  'column',
    height:         '100vh',
    background:     '#0d1117',
    overflow:       'hidden',
    color:          '#e6edf3',
  },
  main: {
    display:   'flex',
    flex:       1,
    overflow:  'hidden',
    minHeight: 0,
  },
  editorCol: {
    display:       'flex',
    flexDirection: 'column',
    flex:          '0 0 60%',
    overflow:      'hidden',
    minWidth:       0,
  },
  divider: {
    width:      '1px',
    background: '#1c2333',
    flexShrink: 0,
    cursor:     'col-resize',
  },
  panelCol: {
    display:       'flex',
    flexDirection: 'column',
    flex:          '1 1 40%',
    overflow:      'hidden',
    minWidth:       0,
  },
  footer: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    height:          22,
    padding:        '0 12px',
    background:     '#010409',
    borderTop:      '1px solid #1c2333',
    fontFamily:     "'JetBrains Mono', monospace",
    fontSize:        10,
    color:          '#3d4f63',
    userSelect:     'none',
    flexShrink:      0,
  },
};

// ─── Global CSS reset ────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    background: #0d1117;
    color: #e6edf3;
    font-family: 'Syne', sans-serif;
  }

  ::-webkit-scrollbar        { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  { background: #1c2333; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #30363d; }

  button:hover { filter: brightness(1.12); }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
`;
