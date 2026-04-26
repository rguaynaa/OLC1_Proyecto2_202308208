// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts  –  Shared TypeScript interfaces for the GoScript IDE.
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorType = 'Léxico' | 'Sintáctico' | 'Semántico';

export interface GoScriptError {
  type: ErrorType;
  description: string;
  line: number;
  column: number;
}

export type SymbolKind = 'Variable' | 'Función' | 'Struct' | 'Parámetro';

export interface SymbolEntry {
  id: string;
  kind: SymbolKind;
  dataType: string;
  scope: string;
  line: number;
  column: number;
}

export interface InterpretRequest {
  code: string;
}

export interface InterpretResponse {
  ast: any;
  /** Graphviz DOT string for the AST report */
  dot: string;
  output: string[];
  errors: GoScriptError[];
  symbols: SymbolEntry[];
}

export interface EditorTab {
  id: string;
  filename: string;
  content: string;
  isDirty: boolean;
}

export type BottomPanel = 'console' | 'errors' | 'symbols' | 'ast';
