
//   strings.Join(slice []string, sep string) string
//   strings.Split(s string, sep string) []string
//   strings.Contains(s string, substr string) bool
//   strings.ToUpper(s string) string
//   strings.ToLower(s string) string

import { RuntimeValue, STR, BOOL } from '../RuntimeValue';

//strings.Join([]string{"a", "b", "c"}, ", ") → "a, b, c"

export function stringsJoin(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length < 2) {
    onError('strings.Join() requiere 2 argumentos: slice y separador');
    return STR('');
  }

  const [sliceRv, sepRv] = args;

  if (!Array.isArray(sliceRv.value)) {
    onError('El primer argumento de strings.Join() debe ser un []string');
    return STR('');
  }

  const parts = (sliceRv.value as RuntimeValue[]).map(rv =>
    rv.type === 'string' ? (rv.value as string) : String(rv.value)
  );
  const sep = sepRv.type === 'string' ? (sepRv.value as string) : '';
  return STR(parts.join(sep));
}

/**
divide el string usando un separador y devuelve un slice de strings.
strings.Split("a,b,c", ",") --> []string{"a", "b", "c"}
 */
export function stringsSplit(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length < 2) {
    onError('strings.Split() requiere 2 argumentos: string y separador');
    return { type: '[]string', value: [] };
  }

  const [strRv, sepRv] = args;

  if (strRv.type !== 'string') {
    onError('El primer argumento de strings.Split() debe ser un string');
    return { type: '[]string', value: [] };
  }

  const s   = strRv.value as string;
  const sep = sepRv.type === 'string' ? (sepRv.value as string) : '';

  if (sep === '') {
    // divide en caracteres individuales
    const chars = s.split('').map(ch => STR(ch));
    return { type: '[]string', value: chars };
  }

  const parts = s.split(sep).map(part => STR(part));
  return { type: '[]string', value: parts };
}

/**
 verifica si un string contiene un substring dado.
 strings.Contains("hello", "ll") → true
 */
export function stringsContains(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length < 2) {
    onError('strings.Contains() requiere 2 argumentos: string y substring');
    return BOOL(false);
  }

  const [strRv, subRv] = args;

  if (strRv.type !== 'string' || subRv.type !== 'string') {
    onError('Ambos argumentos de strings.Contains() deben ser strings');
    return BOOL(false);
  }

  const s   = strRv.value as string;
  const sub = subRv.value as string;
  return BOOL(s.includes(sub));
}

/**
convierte un string a mayúsculas.
strings.ToUpper("hello") → "HELLO"
 */
export function stringsToUpper(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length < 1) {
    onError('strings.ToUpper() requiere 1 argumento');
    return STR('');
  }

  if (args[0].type !== 'string') {
    onError('El argumento de strings.ToUpper() debe ser un string');
    return STR('');
  }

  return STR((args[0].value as string).toUpperCase());
}

/**
 convierte un string a minúsculas.
strings.ToLower("HELLO") → "hello"
 */
export function stringsToLower(
  args: RuntimeValue[],
  onError: (msg: string) => void
): RuntimeValue {
  if (args.length < 1) {
    onError('strings.ToLower() requiere 1 argumento');
    return STR('');
  }

  if (args[0].type !== 'string') {
    onError('El argumento de strings.ToLower() debe ser un string');
    return STR('');
  }

  return STR((args[0].value as string).toLowerCase());
}
