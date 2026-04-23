
//   strconv.Atoi(s string) int
//   strconv.ParseFloat(s string) float64

import { RuntimeValue, INT, FLOAT } from '../RuntimeValue';

export function strconvAtoi(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (!args[0] || args[0].type !== 'string') {
    onError('strconv.Atoi() requiere un argumento de tipo string');
    return INT(0);
  }
  const s = (args[0].value as string).trim();
  // Must be a pure integer string (no decimals)
  if (!/^-?[0-9]+$/.test(s)) {
    onError(`strconv.Atoi(): no se puede convertir "${s}" a int (¿es un decimal?)`);
    return INT(0);
  }
  const n = parseInt(s, 10);
  if (isNaN(n)) {
    onError(`strconv.Atoi(): cadena no válida "${s}"`);
    return INT(0);
  }
  return INT(n);
}

export function strconvParseFloat(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (!args[0] || args[0].type !== 'string') {
    onError('strconv.ParseFloat() requiere un argumento de tipo string');
    return FLOAT(0);
  }
  const s = (args[0].value as string).trim();
  const n = parseFloat(s);
  if (isNaN(n)) {
    onError(`strconv.ParseFloat(): no se puede convertir "${s}" a float64`);
    return FLOAT(0);
  }
  return FLOAT(n);
}
