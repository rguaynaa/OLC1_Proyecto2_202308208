// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts  –  Shared TypeScript interfaces for the GoScript IDE.
// ─────────────────────────────────────────────────────────────────────────────

// ── Error ─────────────────────────────────────────────────────────────────────
export type ErrorType = 'Léxico' | 'Sintáctico' | 'Semántico';

export interface GoScriptError {
  type: ErrorType;
  description: string;
  line: number;
  column: number;
}

// ── Symbol Table ─────────────────────────────────────────────────────────────
export type SymbolKind = 'Variable' | 'Función' | 'Struct' | 'Parámetro';

export interface SymbolEntry {
  id: string;
  kind: SymbolKind;
  dataType: string;
  scope: string;
  line: number;
  column: number;
}

// ── API Request / Response ────────────────────────────────────────────────────
export interface InterpretRequest {
  code: string;
}

export interface InterpretResponse {
  /** Raw AST returned by Jison (plain object tree) */
  ast: any;
  /** Lines printed by fmt.Println (populated from Part 2) */
  output: string[];
  errors: GoScriptError[];
  symbols: SymbolEntry[];
}

// ── Editor tabs ───────────────────────────────────────────────────────────────
export interface EditorTab {
  id: string;
  filename: string;
  content: string;
  isDirty: boolean;
}

// ── Active panel in the bottom section ───────────────────────────────────────
export type BottomPanel = 'console' | 'errors' | 'symbols' | 'ast';
