import { ASTNode } from '../Node';

// Un literal es un valor constante escrito directamente en el código fuente, como un número, una cadena, un booleano, etc.
export type PrimitiveType = 'int' | 'float64' | 'string' | 'bool' | 'rune' | 'nil';

export interface Literal extends ASTNode {
  type: 'Literal';
  value: number | string | boolean | null;
  dataType: PrimitiveType;
  raw: string;
}
