import { ASTNode } from '../Node';
export interface SliceLiteral extends ASTNode {
  type: 'SliceLiteral';
  elementType: string;
  elements: ASTNode[];
}
export interface SliceLiteral2D extends ASTNode {
  type: 'SliceLiteral2D';
  elementType: string;
  rows: ASTNode[][];
}
