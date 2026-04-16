import { ASTNode } from '../Node';

// Cualquier tarea o Instrucciones de asignación compuesta

//   x = expr        tarea simple
//   x += expr       suma compuesta
//   x -= expr       resta compuesta
//   x *= expr       multiplicación compuesta
//   x /= expr       división compuesta
//   x++             incremento  
//   x--             decremento// 

export type AssignmentOperator =
  | '=' | '+=' | '-=' | '*=' | '/='
  | '++' | '--';

export interface Assignment extends ASTNode {
  type: 'Assignment';
  target: ASTNode;
  operator: AssignmentOperator;
  /** null para los operadores ++ y -- */
  value: ASTNode | null;
}
