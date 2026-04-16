import React, { useRef } from 'react';
import { useIDEStore } from '../../store/editorStore';

// ─── icon glyphs (inline SVG, no external deps) ──────────────────────────────
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const FolderIcon = () => (
  <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
    <path d="M1 2.5A1.5 1.5 0 012.5 1h2.086a1.5 1.5 0 011.06.44l.415.414A1.5 1.5 0 007.12 2.5H10.5A1.5 1.5 0 0112 4v5.5A1.5 1.5 0 0110.5 11h-8A1.5 1.5 0 011 9.5v-7z" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="3.5" y="1" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="3" y="7" width="7" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function TabBar() {
  const {
    tabs, activeTabId,
    addTab, closeTab, setActiveTab, updateContent, renameTab, markSaved,
  } = useIDEStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Open .gst file from disk ───────────────────────────────────────────────
  function handleOpenFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string ?? '';
      addTab(file.name, content);
      // mark it clean (just loaded)
      const id = useIDEStore.getState().activeTabId;
      useIDEStore.getState().markSaved(id);
    };
    reader.readAsText(file);
    // Reset so the same file can be re-opened
    e.target.value = '';
  }

  // ── Save active tab as .gst ────────────────────────────────────────────────
  function handleSave() {
    const tab = useIDEStore.getState().activeTab();
    if (!tab) return;
    const blob = new Blob([tab.content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = tab.filename.endsWith('.gst') ? tab.filename : tab.filename + '.gst';
    a.click();
    URL.revokeObjectURL(url);
    markSaved(tab.id);
  }

  return (
    <div style={styles.wrapper}>
      {/* ── File action buttons ─────────────────────────────────── */}
      <div style={styles.actions}>
        <button
          style={styles.actionBtn}
          title="Nuevo archivo"
          onClick={() => addTab()}
        >
          <PlusIcon />
        </button>
        <button
          style={styles.actionBtn}
          title="Abrir archivo .gst"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderIcon />
        </button>
        <button
          style={styles.actionBtn}
          title="Guardar archivo activo"
          onClick={handleSave}
        >
          <SaveIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gst"
          style={{ display: 'none' }}
          onChange={handleOpenFile}
        />
      </div>

      {/* ── Tab list ───────────────────────────────────────────── */}
      <div style={styles.tabList}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : styles.tabInactive),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabDot(tab.isDirty)} />
              <span style={styles.tabName}>{tab.filename}</span>
              <button
                style={styles.closeBtn}
                title="Cerrar pestaña"
                onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
              >
                <CloseIcon />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, any> = {
  wrapper: {
    display: 'flex',
    alignItems: 'stretch',
    background: '#0d1117',
    borderBottom: '1px solid #1c2333',
    height: 38,
    userSelect: 'none',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '0 6px',
    borderRight: '1px solid #1c2333',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#7a8a9e',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s, background 0.15s',
  },
  tabList: {
    display: 'flex',
    alignItems: 'stretch',
    overflowX: 'auto',
    flex: 1,
    scrollbarWidth: 'none',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 12px 0 10px',
    cursor: 'pointer',
    borderRight: '1px solid #1c2333',
    minWidth: 0,
    maxWidth: 180,
    transition: 'background 0.15s',
    flexShrink: 0,
  },
  tabActive: {
    background: '#161b22',
    borderBottom: '2px solid #58a6ff',
  },
  tabInactive: {
    background: 'transparent',
    borderBottom: '2px solid transparent',
  },
  tabName: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: '#c9d1d9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tabDot: (dirty: boolean) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: dirty ? '#f0883e' : 'transparent',
    border: dirty ? 'none' : '1px solid #7a8a9e',
    flexShrink: 0,
  }),
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#7a8a9e',
    cursor: 'pointer',
    padding: '2px 2px 0',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 3,
    marginLeft: 2,
    flexShrink: 0,
    transition: 'color 0.15s',
  },
};
