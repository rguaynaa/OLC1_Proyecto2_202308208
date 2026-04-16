import { ASTNode } from '../Node';

// BinaryExpr.ts  –  Any expression with two operands and an infix operator.

//arimeticos:   +  -  *  /  %
// comparacion:   ==  !=  <  >  <=  >=
// logicos:      &&  ||

export type BinaryOperator =
  | '+' | '-' | '*' | '/' | '%'
  | '==' | '!=' | '<' | '>' | '<=' | '>='
  | '&&' | '||';

export interface BinaryExpr extends ASTNode {
  type: 'BinaryExpr';
  operator: BinaryOperator;
  left:  ASTNode;
  right: ASTNode;
}
