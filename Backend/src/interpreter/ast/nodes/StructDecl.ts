import { ASTNode } from '../Node';
export interface StructField { fieldType: string; name: string; line: number; column: number; }
export interface StructDecl extends ASTNode {
  type: 'StructDecl';
  name: string;
  fields: StructField[];
}
