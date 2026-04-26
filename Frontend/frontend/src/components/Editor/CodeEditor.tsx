import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useIDEStore }   from '../../store/editorStore';
import { highlight }     from '../../utils/syntaxHighlighter';


const FONT    = "'JetBrains Mono', 'Space Mono', monospace";
const LINE_H  = 22;   // px por línea
const FONT_SZ = 14;   // px

export default function CodeEditor() {
  const { tabs, activeTabId, updateContent, errors } = useIDEStore();
  const tab  = tabs.find(t => t.id === activeTabId);
  const code = tab?.content ?? '';

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef    = useRef<HTMLDivElement>(null);

  // ── Posición del cursor ────────────────────────────────────────────────────
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });

  // ── Líneas con error (para el indicador en el gutter) ─────────────────────
  const errorLines = useMemo(() => {
    const set = new Set<number>();
    errors.forEach(e => { if (e.line > 0) set.add(e.line); });
    return set;
  }, [errors]);

  // ── HTML con resaltado de sintaxis ─────────────────────────────────────────
  const highlighted = useMemo(() => highlight(code), [code]);

  // ── Sincronización de scroll ───────────────────────────────────────────────
  // El textarea es la única fuente de verdad del scroll.
  // Highlight y gutter se copian de él.
  const sincronizarScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop  = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      // Solo sincronizar scrollTop; el gutter no tiene scroll horizontal
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  useEffect(() => { sincronizarScroll(); }, [code, sincronizarScroll]);

  // ── Tecla Tab → insertar \t ────────────────────────────────────────────────
  const manejarTecla = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta    = textareaRef.current!;
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const next  = code.substring(0, start) + '\t' + code.substring(end);
        updateContent(activeTabId, next);
        requestAnimationFrame(() => {
          ta.selectionStart = start + 1;
          ta.selectionEnd   = start + 1;
        });
      }
    },
    [code, activeTabId, updateContent]
  );

  // ── Actualizar posición del cursor ─────────────────────────────────────────
  const actualizarCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const antes  = code.substring(0, ta.selectionStart);
    const lineas = antes.split('\n');
    setCursor({ ln: lineas.length, col: lineas[lineas.length - 1].length + 1 });
  }, [code]);

  const totalLineas = code.split('\n').length;

  return (
    <div style={estilos.outer}>

      {/* ── Fila principal: gutter + área de edición ───────────────────────── */}
      <div style={estilos.mainRow}>

        {/* ── Gutter (números de línea) ─────────────────────────────────────── */}
        <div style={estilos.gutter} ref={gutterRef}>
          {Array.from({ length: totalLineas }, (_, i) => {
            const ln     = i + 1;
            const tieneErr = errorLines.has(ln);
            return (
              <div
                key={ln}
                style={{
                  ...estilos.numLinea,
                  color: tieneErr ? '#da3633' : '#3d4f63',
                }}
                title={tieneErr ? `Error en línea ${ln}` : undefined}
              >
                {tieneErr && <span style={estilos.puntoCrit}>●</span>}
                {ln}
              </div>
            );
          })}
        </div>

        {/* ── Contenedor del editor (highlight + textarea apilados) ───────────── */}
        <div style={estilos.editorWrap}>

          {/* Capa de resaltado (no interactiva) */}
          <div
            ref={highlightRef}
            style={estilos.highlight}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />

          {/* Textarea transparente encima — fuente única del scroll */}
          <textarea
            ref={textareaRef}
            style={estilos.textarea}
            value={code}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            onChange={e => updateContent(activeTabId, e.target.value)}
            onScroll={sincronizarScroll}
            onKeyDown={manejarTecla}
            onClick={actualizarCursor}
            onKeyUp={actualizarCursor}
          />
        </div>
      </div>

      {/* ── Barra de estado ───────────────────────────────────────────────────── */}
      <div style={estilos.statusBar}>
        <span style={estilos.itemStatus}>
          {errorLines.size > 0 && (
            <span style={estilos.contadorErr}>⚠ {errorLines.size} error(es)</span>
          )}
        </span>
        <span style={estilos.itemStatus}>Ln {cursor.ln}, Col {cursor.col}</span>
        <span style={estilos.itemStatus}>GoScript</span>
        <span style={estilos.itemStatus}>UTF-8</span>
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const TEXTO_BASE: React.CSSProperties = {
  fontFamily:   FONT,
  fontSize:     FONT_SZ,
  lineHeight:   `${LINE_H}px`,
  tabSize:      2,
  whiteSpace:   'pre',
  overflowWrap: 'normal',
  wordBreak:    'keep-all',
  padding:      `12px 16px`,
  margin:       0,
};

const estilos: Record<string, React.CSSProperties> = {

  // Contenedor raíz: columna flex, sin desbordamiento propio
  outer: {
    display:       'flex',
    flexDirection: 'column',
    flex:           1,
    background:    '#0d1117',
    overflow:      'hidden',   // ← nunca muestra barras propias
  },

  // Fila que contiene gutter + área de edición
  mainRow: {
    display:    'flex',
    flexDirection: 'row',
    flex:        1,
    overflow:   'hidden',      // ← sin barras propias; el textarea las gestiona
    minHeight:   0,            // necesario para que flex no desborde
  },

  // Números de línea
  gutter: {
    width:        52,
    flexShrink:   0,
    background:  '#0d1117',
    borderRight: '1px solid #1c2333',
    overflowY:   'hidden',     // ← scroll controlado por JS, sin barra visible
    overflowX:   'hidden',
    paddingTop:   12,
    paddingBottom: 12,
    boxSizing:   'border-box',
  },

  numLinea: {
    height:         LINE_H,
    lineHeight:     `${LINE_H}px`,
    textAlign:      'right',
    paddingRight:    8,
    fontFamily:     FONT,
    fontSize:        12,
    userSelect:     'none',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:             3,
  },

  puntoCrit: {
    fontSize:   8,
    lineHeight: 1,
    color:     '#da3633',
  },

  // Área del editor: relativa, oculta su propio overflow
  editorWrap: {
    flex:       1,
    position:  'relative',
    overflow:  'hidden',       // ← el textarea maneja el scroll, no este div
    minWidth:   0,
  },

  // Highlight: siempre estático, no scrollable por sí mismo
  highlight: {
    ...TEXTO_BASE,
    position:     'absolute',
    top:           0,
    left:          0,
    right:         0,
    bottom:        0,
    width:        '100%',
    height:       '100%',
    pointerEvents: 'none',
    zIndex:        1,
    color:        '#e6edf3',
    overflow:     'hidden',    // ← scroll copiado via JS desde textarea
    minHeight:    '100%',
    boxSizing:    'border-box',
  },

  // Textarea: el ÚNICO elemento con scroll real
  textarea: {
    ...TEXTO_BASE,
    position:   'absolute',
    top:         0,
    left:        0,
    right:       0,
    bottom:      0,
    width:      '100%',
    height:     '100%',
    background: 'transparent',
    color:      'transparent',
    caretColor: '#58a6ff',
    border:     'none',
    outline:    'none',
    resize:     'none',
    zIndex:      2,
    boxSizing:  'border-box',
    // Scroll activo solo en textarea
    overflowY:  'auto',
    overflowX:  'auto',
  },

  // Barra de estado inferior
  statusBar: {
    flexShrink:     0,
    height:          24,
    background:     '#161b22',
    borderTop:      '1px solid #1c2333',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:             16,
    padding:        '0 12px',
  },

  itemStatus: {
    fontFamily: FONT,
    fontSize:   11,
    color:     '#7a8a9e',
    userSelect: 'none',
  },

  contadorErr: {
    color:      '#f0883e',
    fontFamily: FONT,
    fontSize:   11,
  },
};
