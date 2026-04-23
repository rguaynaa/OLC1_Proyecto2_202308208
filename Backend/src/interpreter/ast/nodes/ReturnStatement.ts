import { ASTNode } from '../Node';
export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement';
  value: ASTNode | null;
}
