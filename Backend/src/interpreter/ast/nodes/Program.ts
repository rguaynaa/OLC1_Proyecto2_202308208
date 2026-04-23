import { ASTNode } from '../Node';

//Nodo raíz de cada Programa GoScript.

// Contiene todas las declaraciones de nivel superior (funciones, estructuras, variables globales).
export interface Program extends ASTNode {
  type: 'Program';
// El programa es una secuencia de declaraciones (funciones, structs, variables globales)
  declarations: ASTNode[];
}
