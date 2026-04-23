
// Returns an array of output lines produced by the call.

import { RuntimeValue } from '../RuntimeValue';

// ── fmt.Println ───────────────────────────────────────────────────────────────

/**
 * primitivos:
 *   int     
 *   float64 
 *   string  
 *   bool    
 *   rune    
 *   nil     
 * Ccompuestos:
 *   []T        
 *   StructType "Name{Field1: v1, Field2: v2}"
 */
export function fmtValue(rv: RuntimeValue, depth = 0): string {
  if (rv === null || rv === undefined) return '<nil>';

  switch (rv.type) {
    case 'int':     return String(Math.trunc(rv.value));
    case 'float64': return formatFloat(rv.value);
    case 'string':  return rv.value as string;
    case 'bool':    return rv.value ? 'true' : 'false';
    case 'rune':    return String.fromCharCode(rv.value as number);
    case 'nil':     return '<nil>';

    default: {
      // arrays 
      if (rv.type.startsWith('[]') && Array.isArray(rv.value)) {
        const elements = (rv.value as RuntimeValue[]);
        
        // chequeo para las matrices 2D
        if (elements.length > 0 && elements[0].type?.startsWith('[]')) {
          return format2DSlice(elements, depth);
        }
        
        // matriz 1D
        if (elements.length === 0) return '[]';
        
        // para matrices peqyueñas y simples
        if (depth === 0 && elements.length <= 10 && !hasComplexElements(elements)) {
          return '[' + elements.map(e => fmtValue(e, depth + 1)).join(' ') + ']';
        }
        
        // para matrices grandes o elementos complejos, multilinea
        const items = elements.map(e => fmtValue(e, depth + 1));
        return '[' + items.join(' ') + ']';
      }

      // structs
      if (typeof rv.value === 'object' && rv.value !== null && !Array.isArray(rv.value)) {
        const fields = Object.entries(rv.value as Record<string, RuntimeValue>);
        
        if (fields.length === 0) {
          return `${rv.type}{}`;
        }
        
        // para structs pequeños y simples, formato compacto
        if (depth === 0 && fields.length <= 5 && !hasComplexFields(fields)) {
          const fieldStrs = fields.map(([k, v]) => `${k}: ${fmtValue(v, depth + 1)}`);
          return `${rv.type}{${fieldStrs.join(', ')}}`;
        }
        
        // multilinea para structs grandes o con campos complejos
        const fieldStrs = fields.map(([k, v]) => `${k}: ${fmtValue(v, depth + 1)}`);
        return `${rv.type}{${fieldStrs.join(', ')}}`;
      }

      return String(rv.value);
    }
  }
}


function formatFloat(n: number): string {
  // conserva el punto decimal cuando sea necesario, pero no muestra decimales innecesarios
  const s = String(n);
  // si es un numero entero representado como float (ej. 3.0), lo mostramos sin decimales
  if (Number.isInteger(n) && !s.includes('.')) {
    return n.toString();
  }
  return s;
}

function format2DSlice(rows: RuntimeValue[], depth: number): string {
  if (rows.length === 0) return '[[]]';
  
  const rowStrs = rows.map(row => {
    if (!Array.isArray(row.value)) return '[]';
    const cols = row.value as RuntimeValue[];
    return '[' + cols.map(c => fmtValue(c, depth + 1)).join(' ') + ']';
  });
  
  // cimpacto para matrices pequeñas y simples
  if (rows.length <= 3 && rowStrs.every(r => r.length < 40)) {
    return '[' + rowStrs.join(' ') + ']';
  }
  
  // multilinea para matrices grandes o con elementos complejos
  return '[\n  ' + rowStrs.join('\n  ') + '\n]';
}

function hasComplexElements(elements: RuntimeValue[]): boolean {
  return elements.some(e => {
    if (e.type.startsWith('[]')) return true;
    if (typeof e.value === 'object' && e.value !== null && !Array.isArray(e.value)) return true;
    return false;
  });
}

function hasComplexFields(fields: [string, RuntimeValue][]): boolean {
  return fields.some(([_, v]) => {
    if (v.type.startsWith('[]')) return true;
    if (typeof v.value === 'object' && v.value !== null && !Array.isArray(v.value)) return true;
    return false;
  });
}


/**
* Ejecuta fmt.Println con los argumentos dados.
* Devuelve una única línea de salida.
*/
export function println(args: RuntimeValue[]): string {
  if (args.length === 0) return '';
  return args.map(a => fmtValue(a, 0)).join(' ');
}
