import { ASTNode } from '../Node';
export interface FieldInit { field: string; value: ASTNode; line: number; column: number; }
export interface StructLiteral extends ASTNode {
  type: 'StructLiteral';
  structName: string | null;
  fields: FieldInit[];
}
