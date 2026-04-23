import { ASTNode } from '../Node';

export interface SliceAssign extends ASTNode {
  type: 'SliceAssign';
  slice: ASTNode;
  index: ASTNode;
  value: ASTNode;
}

export interface SliceAssign2D extends ASTNode {
  type: 'SliceAssign2D';
  slice: ASTNode;
  row: ASTNode;
  col: ASTNode;
  value: ASTNode;
}
