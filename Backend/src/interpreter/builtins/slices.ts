
//   slices.Index(s []T, v T) int  

import { RuntimeValue, INT } from '../RuntimeValue';
import { TypeChecker }       from '../TypeChecker';

export function slicesIndex(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length < 2) {
    onError('slices.Index() requiere 2 argumentos: slice y valor buscado');
    return INT(-1);
  }

  const slice  = args[0];
  const target = args[1];

  if (!Array.isArray(slice.value)) {
    onError('El primer argumento de slices.Index() debe ser un slice');
    return INT(-1);
  }

  const arr = slice.value as RuntimeValue[];
  for (let i = 0; i < arr.length; i++) {
    try {
      const eq = TypeChecker.comparar(arr[i], '==', target);
      if (eq.value === true) return INT(i);
    } catch {
      // Skip incompatible element types silently
    }
  }
  return INT(-1);
}
