import { ASTNode } from '../Node';
export interface SwitchStatement extends ASTNode {
  type: 'SwitchStatement';
  expr: ASTNode;
  cases: ASTNode[];
  defaultCase: ASTNode | null;
}
