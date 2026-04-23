import { ASTNode } from '../Node';

// VarDecl.ts – Declaración de variables en todos los archivos Tres formas de GoScript:
// var x int (tipo explícito, sin valor)
// var x int = expr (tipo explícito + valor)
// x := expr (declaración corta – tipo inferido)
// Persona p = {...} (declaración con tipo de estructura)

export interface VarDecl extends ASTNode {
  type: 'VarDecl';
  name: string;
  
  // El tipo de la variable.  null para declaraciones cortas (:=) donde el tipo se infiere del valor inicial.
  varType: string | null;
  
  // La expresión que inicializa la variable.  null para declaraciones sin valor (var x int).
  value: ASTNode | null;
  // true para declaraciones cortas (x := expr)
  isShort: boolean;
  // true para declaraciones con tipo explícito (var x int = expr o var x int)
  isTyped?: boolean;
}
