import { ASTNode } from '../Node';
export interface SliceAccess extends ASTNode {
  type: 'SliceAccess';
  slice: ASTNode;
  index: ASTNode;
}
export interface SliceAccess2D extends ASTNode {
  type: 'SliceAccess2D';
  slice: ASTNode;
  row: ASTNode;
  col: ASTNode;
}
