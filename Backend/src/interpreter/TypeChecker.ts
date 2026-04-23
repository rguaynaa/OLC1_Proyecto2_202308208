
// Sistema de tipos GoScript: coerciones implícitas y operadores.
// Implementa cada combinación 

import {
  RuntimeValue,
  INT, FLOAT, STR, BOOL, RUNE, NIL_VALUE,
} from './RuntimeValue';

export class TypeChecker {
  /** Convierte cualquier valor GoScript compatible a un número JS. */
  static aNumero(rv: RuntimeValue): number {
    switch (rv.type) {
      case 'int':
      case 'float64':
      case 'rune':    return rv.value as number;
      case 'bool':    return rv.value ? 1 : 0;
      default:
        throw new TypeError(`No se puede convertir '${rv.type}' a número`);
    }
  }

  /** Convierte un valor a string en contexto de concatenación. */
  static aCadenaConcat(rv: RuntimeValue): string {
    switch (rv.type) {
      case 'string':  return rv.value as string;
      case 'rune':    return String.fromCharCode(rv.value as number);
      case 'bool':    return rv.value ? 'true' : 'false';
      case 'int':
      case 'float64': return TypeChecker.formatearNumero(rv);
      case 'nil':     return '<nil>';
      default:        return String(rv.value);
    }
  }

  /** Convierte un valor a string para mostrar en fmt.Println. */
  static aCadenaMostrar(rv: RuntimeValue): string {
    switch (rv.type) {
      case 'string':  return rv.value as string;
      case 'rune':    return String.fromCharCode(rv.value as number);
      case 'bool':    return rv.value ? 'true' : 'false';
      case 'int':     return String(rv.value);
      case 'float64': return TypeChecker.formatearNumero(rv);
      case 'nil':     return '<nil>';
      default:        return String(rv.value);
    }
  }

  static formatearNumero(rv: RuntimeValue): string {
    const n = rv.value as number;
    return String(n);
  }

  // SUMA  (+) 

  static sumar(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    const ti = izq.type;
    const td = der.type;

    // string en cualquier lado - concatenación
    if (ti === 'string') {
      return STR((izq.value as string) + TypeChecker.aCadenaConcat(der));
    }
    if (td === 'string') {
      return STR(TypeChecker.aCadenaConcat(izq) + (der.value as string));
    }

    // float64 en cualquier lado - float64
    if (ti === 'float64' || td === 'float64') {
      return FLOAT(TypeChecker.aNumero(izq) + TypeChecker.aNumero(der));
    }

    // bool + bool → bool
    if (ti === 'bool' && td === 'bool') {
      const suma = (izq.value ? 1 : 0) + (der.value ? 1 : 0);
      return BOOL(suma > 0);
    }

    // int / rune / bool - int
    return INT(TypeChecker.aNumero(izq) + TypeChecker.aNumero(der));
  }

  // RESTA  (-)  

  static restar(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    const ti = izq.type;
    const td = der.type;

    if (ti === 'string' || td === 'string') {
      throw new TypeError(`Operador '-' no soportado para tipo 'string'`);
    }

    if (ti === 'float64' || td === 'float64') {
      return FLOAT(TypeChecker.aNumero(izq) - TypeChecker.aNumero(der));
    }

    if (ti === 'bool' && td === 'bool') {
      const dif = (izq.value ? 1 : 0) - (der.value ? 1 : 0);
      return BOOL(dif !== 0);
    }

    return INT(TypeChecker.aNumero(izq) - TypeChecker.aNumero(der));
  }

  
  // MULTIPLICACIÓN  (*) 

  static multiplicar(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    const ti = izq.type;
    const td = der.type;

    // int * string → repetición de cadena
    if (ti === 'int' && td === 'string') {
      return STR((der.value as string).repeat(Math.max(0, izq.value as number)));
    }
    if (ti === 'string' && td === 'int') {
      return STR((izq.value as string).repeat(Math.max(0, der.value as number)));
    }

    if (ti === 'float64' || td === 'float64') {
      return FLOAT(TypeChecker.aNumero(izq) * TypeChecker.aNumero(der));
    }

    if (ti === 'bool' && td === 'bool') {
      return BOOL(Boolean(izq.value) && Boolean(der.value));
    }

    return INT(TypeChecker.aNumero(izq) * TypeChecker.aNumero(der));
  }

  
  // DIVISIÓN  (/) 

  static dividir(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    const ti = izq.type;
    const td = der.type;

    if (ti === 'string' || td === 'string' || ti === 'bool' || td === 'bool') {
      throw new TypeError(`Operador '/' no soportado entre '${ti}' y '${td}'`);
    }

    const divisor = TypeChecker.aNumero(der);
    if (divisor === 0) throw new RangeError('División por cero');

    const dividendo = TypeChecker.aNumero(izq);

    if ((ti === 'int' || ti === 'rune') && (td === 'int' || td === 'rune')) {
      return INT(Math.trunc(dividendo / divisor));
    }

    return FLOAT(dividendo / divisor);
  }

  
  // MÓDULO  (%)  —  solo int % int

  static residuo(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    if (izq.type !== 'int' || der.type !== 'int') {
      throw new TypeError(`Operador '%' solo soportado para tipo 'int'`);
    }
    const divisor = der.value as number;
    if (divisor === 0) throw new RangeError('Módulo por cero');
    return INT((izq.value as number) % divisor);
  }

  
  // NEGACIÓN UNARIA  (-)  

  static negar(rv: RuntimeValue): RuntimeValue {
    if (rv.type === 'int')     return INT(-(rv.value as number));
    if (rv.type === 'float64') return FLOAT(-(rv.value as number));
    if (rv.type === 'rune')    return INT(-(rv.value as number));
    throw new TypeError(`Operador '-' unario no soportado para tipo '${rv.type}'`);
  }


  // NO LÓGICO  (!)

  static noLogico(rv: RuntimeValue): RuntimeValue {
    if (rv.type !== 'bool') {
      throw new TypeError(`Operador '!' solo soportado para 'bool', se recibió '${rv.type}'`);
    }
    return BOOL(!rv.value);
  }

  
  // COMPARACIÓN  ==  !=  <  >  <=  >=  

  static comparar(
    izq: RuntimeValue,
    op: '==' | '!=' | '<' | '>' | '<=' | '>=',
    der: RuntimeValue
  ): RuntimeValue {
    const ti = izq.type;
    const td = der.type;

    const tiposNumericos = new Set(['int', 'float64', 'rune']);
    if (tiposNumericos.has(ti) && tiposNumericos.has(td)) {
      const lv = TypeChecker.aNumero(izq);
      const rv = TypeChecker.aNumero(der);
      return BOOL(TypeChecker.aplicarRelacional(lv, op, rv));
    }

    if (ti === td) {
      if (ti === 'string') {
        const lv = izq.value as string;
        const rv = der.value as string;
        if (op === '==') return BOOL(lv === rv);
        if (op === '!=') return BOOL(lv !== rv);
        if (op === '<')  return BOOL(lv <  rv);
        if (op === '>')  return BOOL(lv >  rv);
        if (op === '<=') return BOOL(lv <= rv);
        if (op === '>=') return BOOL(lv >= rv);
      }
      if (ti === 'bool') {
        if (op === '==') return BOOL(izq.value === der.value);
        if (op === '!=') return BOOL(izq.value !== der.value);
        throw new TypeError(`Operador '${op}' no soportado para tipo 'bool'`);
      }
      if (ti === 'nil') {
        if (op === '==') return BOOL(true);
        if (op === '!=') return BOOL(false);
        throw new TypeError(`Operador '${op}' no soportado para tipo 'nil'`);
      }
    }

    if ((ti === 'int' && td === 'float64') || (ti === 'float64' && td === 'int')) {
      const lv = TypeChecker.aNumero(izq);
      const rv = TypeChecker.aNumero(der);
      return BOOL(TypeChecker.aplicarRelacional(lv, op, rv));
    }

    throw new TypeError(`Operador '${op}' no soportado entre tipos '${ti}' y '${td}'`);
  }

  private static aplicarRelacional(lv: number, op: string, rv: number): boolean {
    switch (op) {
      case '==': return lv === rv;
      case '!=': return lv !== rv;
      case '<':  return lv <  rv;
      case '>':  return lv >  rv;
      case '<=': return lv <= rv;
      case '>=': return lv >= rv;
      default:   return false;
    }
  }

  
  // Y LÓGICO / O LÓGICO 

  static yLogico(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    if (izq.type !== 'bool' || der.type !== 'bool') {
      throw new TypeError(`'&&' requiere operandos de tipo 'bool'`);
    }
    return BOOL(Boolean(izq.value) && Boolean(der.value));
  }

  static oLogico(izq: RuntimeValue, der: RuntimeValue): RuntimeValue {
    if (izq.type !== 'bool' || der.type !== 'bool') {
      throw new TypeError(`'||' requiere operandos de tipo 'bool'`);
    }
    return BOOL(Boolean(izq.value) || Boolean(der.value));
  }

  
  // COMPATIBILIDAD DE TIPOS  (para asignación / declaración)
 
  static coercionarParaAsignacion(
    tipoDeclarado: string,
    valor: RuntimeValue
  ): RuntimeValue {
    if (valor.type === tipoDeclarado) return valor;

    // int - float64  (ampliación implícita)
    if (tipoDeclarado === 'float64' && (valor.type === 'int' || valor.type === 'rune')) {
      return FLOAT(valor.value as number);
    }

    // nil es asignable a tipos compuestos (slices, structs)
    if (valor.type === 'nil') return valor;

    throw new TypeError(
      `No se puede asignar '${valor.type}' a variable de tipo '${tipoDeclarado}'`
    );
  }

  
  // INFERENCIA DE TIPO  (para declaraciones :=)

  static inferirTipo(valor: RuntimeValue): string {
    return valor.type;
  }
}
