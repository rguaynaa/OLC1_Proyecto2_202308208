import React, { useState } from 'react';
import { useIDEStore } from '../../store/editorStore';

// Placeholder – full graphical AST visualisation implemented in Part 6.
// For Part 1 we render the raw JSON tree, which is already useful for debugging.
export default function ASTReport() {
  const { ast } = useIDEStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>ÁRBOL DE SINTAXIS ABSTRACTA (AST)</span>
        {ast && (
          <button style={styles.toggleBtn} onClick={() => setCollapsed(c => !c)}>
            {collapsed ? 'Expandir' : 'Colapsar'}
          </button>
        )}
      </div>

      <div style={styles.body}>
        {!ast ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>⊤</span>
            <span style={styles.emptyText}>
              El AST se genera al ejecutar el código.
              <br/>
              La visualización gráfica se activa en la Parte 6.
            </span>
          </div>
        ) : (
          !collapsed && (
            <pre style={styles.json}>
              {JSON.stringify(ast, null, 2)}
            </pre>
          )
        )}
      </div>
    </div>
  );
}

const FONT  = "'JetBrains Mono', monospace";
const SFONT = "'Syne', sans-serif";

const styles: Record<string, any> = {
  wrapper: { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', overflow: 'hidden' },
  header:  { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid #1c2333', background: '#010409', flexShrink: 0 },
  title:   { fontFamily: SFONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: '#7a8a9e', textTransform: 'uppercase', flex: 1 },
  toggleBtn: { fontFamily: SFONT, fontWeight: 600, fontSize: 11, background: '#161b22', border: '1px solid #30363d', color: '#7a8a9e', cursor: 'pointer', borderRadius: 5, padding: '3px 10px' },
  body:    { flex: 1, overflowY: 'auto' },
  json:    { fontFamily: FONT, fontSize: 11, color: '#8b949e', padding: '12px 16px', margin: 0, lineHeight: '18px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  empty:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.5 },
  emptyIcon:  { fontSize: 28, color: '#d29922' },
  emptyText:  { fontFamily: SFONT, fontSize: 12, color: '#7a8a9e', textAlign: 'center', lineHeight: '1.6' },
};
