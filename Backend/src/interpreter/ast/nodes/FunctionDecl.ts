import { ASTNode } from '../Node';
import { Block }   from './Block';

//  Un archivo de nivel superior Definición de la función.
// func nombre(p1 tipo1, p2 tipo2) tipoDeRetorno { ... }
// func principal() { ... } (sin parámetros, sin tipo de retorno)

// Funciones con parámetros y tipo de retorno
export interface FuncParam {
  
  name: string;
  paramType: string;
  line: number;
  column: number;
}

// Funciones sin parámetros ni tipo de retorno
export interface FunctionDecl extends ASTNode {
  type: 'FunctionDecl';

  name: string;
  params: FuncParam[];
  // El tipo de retorno es null para funciones sin tipo de retorno declarado (void)
  returnType: string | null;
  body: Block;
}
