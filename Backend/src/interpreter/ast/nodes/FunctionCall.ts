import { ASTNode } from '../Node';


// Una función o método Expresión de invocación

// Llamada simple: suma(3, 7)
// Llamada con punto: fmt.Println("hola")
// Llamada encadenada: reflect.TypeOf(x).String()
// Llamadas integradas: append(s, v) / len(s) / slices.Index(s, v) / etc.

export interface FunctionCall extends ASTNode {
  type: 'FunctionCall';
  name: string;
  object: string | null;
  args: ASTNode[];
  chained?: boolean;
}
