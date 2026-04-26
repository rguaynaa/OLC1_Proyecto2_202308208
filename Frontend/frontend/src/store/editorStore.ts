
import { create } from 'zustand';
import type {
  EditorTab,
  BottomPanel,
  GoScriptError,
  SymbolEntry,
  InterpretResponse,
} from '../types';

let tabCounter = 1;

function makeTab(filename = 'nuevo.gst', content = ''): EditorTab {
  return {
    id: `tab-${Date.now()}-${tabCounter++}`,
    filename,
    content,
    isDirty: content !== '',
  };
}

interface IDEState {
  tabs: EditorTab[];
  activeTabId: string;

  output:  string[];
  errors:  GoScriptError[];
  symbols: SymbolEntry[];
  ast:     any;
  dot:     string;       // ← Part 6: Graphviz DOT string

  activePanel: BottomPanel;
  isRunning:   boolean;

  addTab:        (filename?: string, content?: string) => void;
  closeTab:      (id: string) => void;
  setActiveTab:  (id: string) => void;
  updateContent: (id: string, content: string) => void;
  renameTab:     (id: string, filename: string) => void;
  markSaved:     (id: string) => void;

  setResults:    (r: InterpretResponse) => void;
  clearResults:  () => void;

  setActivePanel: (p: BottomPanel) => void;
  setRunning:     (v: boolean) => void;

  activeTab: () => EditorTab | undefined;
}

const firstTab = makeTab('main.gst', `func main() {\n\tfmt.Println("Hola, GoScript!")\n}\n`);
firstTab.isDirty = false;

export const useIDEStore = create<IDEState>((set, get) => ({
  tabs: [firstTab],
  activeTabId: firstTab.id,

  output:  [],
  errors:  [],
  symbols: [],
  ast:     null,
  dot:     '',

  activePanel: 'console',
  isRunning:   false,

  addTab(filename = `sin-titulo-${tabCounter}.gst`, content = '') {
    const tab = makeTab(filename, content);
    set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  closeTab(id) {
    set(s => {
      const remaining = s.tabs.filter(t => t.id !== id);
      if (remaining.length === 0) {
        const newTab = makeTab();
        return { tabs: [newTab], activeTabId: newTab.id };
      }
      const active =
        s.activeTabId === id
          ? remaining[Math.max(0, s.tabs.findIndex(t => t.id === id) - 1)].id
          : s.activeTabId;
      return { tabs: remaining, activeTabId: active };
    });
  },

  setActiveTab(id) { set({ activeTabId: id }); },

  updateContent(id, content) {
    set(s => ({
      tabs: s.tabs.map(t =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    }));
  },

  renameTab(id, filename) {
    set(s => ({ tabs: s.tabs.map(t => (t.id === id ? { ...t, filename } : t)) }));
  },

  markSaved(id) {
    set(s => ({ tabs: s.tabs.map(t => (t.id === id ? { ...t, isDirty: false } : t)) }));
  },

  setResults({ ast, dot, output, errors, symbols }) {
    set({ ast, dot: dot ?? '', output, errors, symbols });
  },

  clearResults() {
    set({ ast: null, dot: '', output: [], errors: [], symbols: [] });
  },

  setActivePanel(p) { set({ activePanel: p }); },
  setRunning(v)     { set({ isRunning: v }); },

  activeTab() {
    const s = get();
    return s.tabs.find(t => t.id === s.activeTabId);
  },
}));
