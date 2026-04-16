import { ASTNode } from '../Node';


// Block.ts – A Secuencia de instrucciones delimitadas por llaves 
// Los bloques introducen un nuevo ámbito léxico. Las variables declaradas dentro de un bloque
// ocultan las variables externas con el mismo nombre y no son accesibles fuera de él.


export interface Block extends ASTNode {
  type: 'Block';
  statements: ASTNode[];
}
