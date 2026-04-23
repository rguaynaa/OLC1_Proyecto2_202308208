import { ASTNode } from '../Node';
export interface ForStatement extends ASTNode {
  type: 'ForStatement';
  form: 'while' | 'classic' | 'range';
  condition: ASTNode | null;
  init: ASTNode | null;
  post: ASTNode | null;
  indexVar: string | null;
  valueVar: string | null;
  iterable: ASTNode | null;
  body: ASTNode;
}
