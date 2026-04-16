import React, { useRef, useEffect, useCallback } from 'react';
import { useIDEStore } from '../../store/editorStore';

// ─────────────────────────────────────────────────────────────────────────────
// CodeEditor
// A lightweight code editor built on <textarea> + a mirrored line-number gutter.
// No external editor lib required for Part 1.
// ─────────────────────────────────────────────────────────────────────────────

export default function CodeEditor() {
  const { tabs, activeTabId, updateContent } = useIDEStore();
  const tab = tabs.find(t => t.id === activeTabId);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const gutterRef    = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);

  const code = tab?.content ?? '';

  // ── Sync gutter scroll with textarea ──────────────────────────────────────
  function syncScroll() {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  // ── Build line-number list ─────────────────────────────────────────────────
  const lineCount = code.split('\n').length;

  // ── Handle Tab key → insert 2 spaces (not lose focus) ─────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta    = textareaRef.current!;
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const next  = code.substring(0, start) + '\t' + code.substring(end);
        updateContent(activeTabId, next);
        // Restore cursor after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = start + 1;
          ta.selectionEnd   = start + 1;
        });
      }
    },
    [code, activeTabId, updateContent]
  );

  // ── Keep cursor at correct position after content change ──────────────────
  useEffect(() => {
    syncScroll();
  }, [code]);

  return (
    <div style={styles.outer} ref={wrapperRef}>
      {/* ── Gutter ─────────────────────────────────────────────────────── */}
      <div style={styles.gutter} ref={gutterRef}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} style={styles.lineNum}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* ── Textarea ───────────────────────────────────────────────────── */}
      <textarea
        ref={textareaRef}
        style={styles.textarea}
        value={code}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        onChange={e => updateContent(activeTabId, e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        placeholder="// Escribe tu código GoScript aquí…"
      />

      {/* ── Current line indicator (status bar) ───────────────────────── */}
      <LineStatus textareaRef={textareaRef} code={code} />
    </div>
  );
}

// ─── Status bar: shows Ln / Col ───────────────────────────────────────────────
function LineStatus({
  textareaRef,
  code,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  code: string;
}) {
  const [pos, setPos] = React.useState({ ln: 1, col: 1 });

  function update() {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = code.substring(0, ta.selectionStart);
    const lines  = before.split('\n');
    setPos({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
  }

  return (
    <div style={styles.statusBar} onMouseDown={update} onKeyDown={update}>
      <span style={styles.statusItem}>Ln {pos.ln}, Col {pos.col}</span>
      <span style={styles.statusItem}>GoScript</span>
      <span style={styles.statusItem}>UTF-8</span>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const FONT = "'JetBrains Mono', 'Space Mono', monospace";
const LINE_H = 22;

const styles: Record<string, any> = {
  outer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    background: '#0d1117',
    overflow: 'hidden',
    position: 'relative',
  },
  gutter: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 24,           // leave room for status bar
    width: 48,
    background: '#0d1117',
    borderRight: '1px solid #1c2333',
    overflowY: 'hidden',
    paddingTop: 12,
    boxSizing: 'border-box',
    zIndex: 1,
    pointerEvents: 'none',
  },
  lineNum: {
    height: LINE_H,
    lineHeight: `${LINE_H}px`,
    textAlign: 'right',
    paddingRight: 10,
    fontFamily: FONT,
    fontSize: 12,
    color: '#3d4f63',
    userSelect: 'none',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    background: 'transparent',
    color: '#e6edf3',
    fontFamily: FONT,
    fontSize: 14,
    lineHeight: `${LINE_H}px`,
    padding: '12px 16px 12px 60px',
    border: 'none',
    outline: 'none',
    width: '100%',
    height: 'calc(100% - 24px)',
    boxSizing: 'border-box',
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    caretColor: '#58a6ff',
    letterSpacing: '0.01em',
    tabSize: 2,
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    background: '#161b22',
    borderTop: '1px solid #1c2333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    padding: '0 12px',
    zIndex: 2,
  },
  statusItem: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#7a8a9e',
    userSelect: 'none',
  },
};
