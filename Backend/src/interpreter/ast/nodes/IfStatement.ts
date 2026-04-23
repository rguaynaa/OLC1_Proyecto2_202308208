import { ASTNode } from '../Node';
export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: ASTNode;
  thenBlock: ASTNode;
  elseClause: ASTNode | null;
}
