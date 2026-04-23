
//reflect.TypeOf(v any) string 

import { RuntimeValue, STR } from '../RuntimeValue';

/**
 *Devuelve el nombre del tipo GoScript del valor dado.
 *
 * ejemplos:
 *   reflect.TypeOf(42)        "int"
 *   reflect.TypeOf(3.14)      "float64"
 *   reflect.TypeOf("hello")   "string"
 *   reflect.TypeOf(true)      "bool"
 *   reflect.TypeOf('A')       "rune"
 *   reflect.TypeOf(p)         "Persona"  
 *   reflect.TypeOf(nums)      "[]int"    
 */

export function reflectTypeOf(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length === 0) {
    onError('reflect.TypeOf() requiere al menos un argumento');
    return STR('nil');
  }
  return STR(args[0].type);
}
