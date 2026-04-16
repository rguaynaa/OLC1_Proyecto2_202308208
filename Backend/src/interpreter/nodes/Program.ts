import { ASTNode } from '../Node';

// ─────────────────────────────────────────────────────────────────────────────
// Program.ts  –  Root node of every GoScript program.
// Contains all top-level declarations (functions, structs, global vars).
// ─────────────────────────────────────────────────────────────────────────────

export interface Program extends ASTNode {
  type: 'Program';
  /** Top-level declarations in source order */
  declarations: ASTNode[];
}
