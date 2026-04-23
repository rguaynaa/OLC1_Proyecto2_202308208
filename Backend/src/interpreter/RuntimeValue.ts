
export type GoScriptType =
  | 'int'
  | 'float64'
  | 'string'
  | 'bool'
  | 'rune'
  | 'nil'
  | '__function__'   //Almacena un nodo AST FunctionDecl
  | '__struct_def__' //almacena un nodo AST StructDecl
  | string;          //tipos de instancias de estructura, por ejemplo, "Persona"
                     //tipos de segmentos, por ejemplo, "[]int", "[][]float64"

export interface RuntimeValue {
  type: GoScriptType;
  value: any;
}

//constructor
export const INT    = (v: number):  RuntimeValue => ({ type: 'int',     value: Math.trunc(v) });
export const FLOAT  = (v: number):  RuntimeValue => ({ type: 'float64', value: v });
export const STR    = (v: string):  RuntimeValue => ({ type: 'string',  value: v });
export const BOOL   = (v: boolean): RuntimeValue => ({ type: 'bool',    value: v });
export const RUNE   = (v: number):  RuntimeValue => ({ type: 'rune',    value: Math.trunc(v) });
export const NIL_VALUE: RuntimeValue                = { type: 'nil',     value: null };

// Clases de señales para la transferencia de flujo de control
// Estas señales se generan y capturan en el límite de flujo de control correspondiente.

export class ReturnSignal {
  constructor(public readonly returnValue: RuntimeValue) {}
}

export class BreakSignal {
  readonly tag = 'BreakSignal';
}

export class ContinueSignal {
  readonly tag = 'ContinueSignal';
}

//Helpers

//Devuelve verdadero si el valor se considera "verdadero" (para condiciones if/for).
export function isTruthy(rv: RuntimeValue): boolean {
  if (rv.type === 'bool')   return rv.value === true;
  if (rv.type === 'int')    return rv.value !== 0;
  if (rv.type === 'float64')return rv.value !== 0;
  if (rv.type === 'rune')   return rv.value !== 0;
  if (rv.type === 'string') return rv.value !== '';
  if (rv.type === 'nil')    return false;
  return true;
}

// Devuelve el valor por defecto para un tipo dado (0 para números, "" para strings, false para bools, nil para structs/slices).
export function defaultForType(typeName: string): RuntimeValue {
  switch (typeName) {
    case 'int':     return INT(0);
    case 'float64': return FLOAT(0.0);
    case 'string':  return STR('');
    case 'bool':    return BOOL(false);
    case 'rune':    return RUNE(0);
    default:        return { ...NIL_VALUE };  // structs, slices → nil
  }
}
