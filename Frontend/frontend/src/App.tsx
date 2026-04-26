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
import { useResizable }   from './utils/useResizable';


export default function App() {
  const {
    activePanel, setRunning, setResults, activeTab,
  } = useIDEStore();

  const { leftPct, containerRef, onMouseDown } = useResizable({
    initialLeft: 60,
    minLeft: 25,
    maxLeft: 82,
  });

  // ── Global keyboard shortcut: Ctrl+Enter → Run ───────────────────────────
  useEffect(() => {
    async function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const tab = activeTab();
        if (!tab) return;
        const store = useIDEStore.getState();
        if (store.isRunning) return;
        store.setRunning(true);
        try {
          const result = await interpretCode(tab.content);
          store.setResults(result);
          store.setActivePanel(result.errors.length > 0 ? 'errors' : 'console');
        } finally {
          store.setRunning(false);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab]);

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
      <style>{GLOBAL_CSS}</style>

      <div style={layout.root}>
        {/* ── Top bar ───────────────────────────────────────────── */}
        <Toolbar />

        {/* ── File tabs ─────────────────────────────────────────── */}
        <TabBar />

        {/* ── Main: editor ║ panel ──────────────────────────────── */}
        <div style={layout.main} ref={containerRef}>
          {/* Left: editor */}
          <div style={{ ...layout.panel, flex: `0 0 ${leftPct}%` }}>
            <CodeEditor />
          </div>

          {/* Resizable divider */}
          <div
            style={layout.divider}
            onMouseDown={onMouseDown}
            title="Arrastrar para redimensionar"
          />

          {/* Right: active panel */}
          <div style={{ ...layout.panel, flex: `1 1 ${100 - leftPct}%` }}>
            {renderPanel()}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer style={layout.footer}>
          <span>GoScript IDE · OLC1 · Ingeniería en Ciencias y Sistemas</span>
          <span style={{ color: '#238636' }}>Rodrigo Andres Guay Minera 202308208</span>
        </footer>
      </div>
    </>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
const layout: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0d1117',
    overflow: 'hidden', color: '#e6edf3',
  },
  main: {
    display: 'flex', flex: 1,
    overflow: 'hidden', minHeight: 0,
    position: 'relative',
  },
  panel: {
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', minWidth: 0,
  },
  divider: {
    width: 4,
    background: '#1c2333',
    cursor: 'col-resize',
    flexShrink: 0,
    transition: 'background 0.15s',
    zIndex: 10,
    position: 'relative',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 22, padding: '0 12px',
    background: '#010409', borderTop: '1px solid #1c2333',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
    color: '#3d4f63', userSelect: 'none', flexShrink: 0,
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Textarea selection colour */
  textarea::selection {
    background: rgba(88, 166, 255, 0.25);
    color: transparent;
  }
`;
