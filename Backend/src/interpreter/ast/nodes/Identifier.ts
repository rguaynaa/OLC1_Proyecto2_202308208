import { ASTNode } from '../Node';


// Un identificador es el nombre de una variable, función, tipo, etc.

export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}
