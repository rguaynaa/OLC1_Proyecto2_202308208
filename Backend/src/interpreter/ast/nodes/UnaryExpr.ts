import { ASTNode } from '../Node';

// Una expresión con un solo operando y un operador de prefijo.

// - (negación numérica)
// ! (negación lógica)


export type UnaryOperator = '-' | '!';

export interface UnaryExpr extends ASTNode {
  type: 'UnaryExpr';
  operator: UnaryOperator;
  operand:  ASTNode;
}
