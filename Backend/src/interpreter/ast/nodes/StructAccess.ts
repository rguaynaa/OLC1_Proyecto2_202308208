import { ASTNode } from '../Node';
export interface StructAccess extends ASTNode {
  type: 'StructAccess';
  object: ASTNode;
  field: string;
}
