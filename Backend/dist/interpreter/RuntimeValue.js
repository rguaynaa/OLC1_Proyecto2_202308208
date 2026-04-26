"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinueSignal = exports.BreakSignal = exports.ReturnSignal = exports.NIL_VALUE = exports.RUNE = exports.BOOL = exports.STR = exports.FLOAT = exports.INT = void 0;
exports.isTruthy = isTruthy;
exports.defaultForType = defaultForType;
//constructor
const INT = (v) => ({ type: 'int', value: Math.trunc(v) });
exports.INT = INT;
const FLOAT = (v) => ({ type: 'float64', value: v });
exports.FLOAT = FLOAT;
const STR = (v) => ({ type: 'string', value: v });
exports.STR = STR;
const BOOL = (v) => ({ type: 'bool', value: v });
exports.BOOL = BOOL;
const RUNE = (v) => ({ type: 'rune', value: Math.trunc(v) });
exports.RUNE = RUNE;
exports.NIL_VALUE = { type: 'nil', value: null };
// Clases de señales para la transferencia de flujo de control
// Estas señales se generan y capturan en el límite de flujo de control correspondiente.
class ReturnSignal {
    constructor(returnValue) {
        this.returnValue = returnValue;
    }
}
exports.ReturnSignal = ReturnSignal;
class BreakSignal {
    constructor() {
        this.tag = 'BreakSignal';
    }
}
exports.BreakSignal = BreakSignal;
class ContinueSignal {
    constructor() {
        this.tag = 'ContinueSignal';
    }
}
exports.ContinueSignal = ContinueSignal;
//Helpers
//Devuelve verdadero si el valor se considera "verdadero" (para condiciones if/for).
function isTruthy(rv) {
    if (rv.type === 'bool')
        return rv.value === true;
    if (rv.type === 'int')
        return rv.value !== 0;
    if (rv.type === 'float64')
        return rv.value !== 0;
    if (rv.type === 'rune')
        return rv.value !== 0;
    if (rv.type === 'string')
        return rv.value !== '';
    if (rv.type === 'nil')
        return false;
    return true;
}
// Devuelve el valor por defecto para un tipo dado (0 para números, "" para strings, false para bools, nil para structs/slices).
function defaultForType(typeName) {
    switch (typeName) {
        case 'int': return (0, exports.INT)(0);
        case 'float64': return (0, exports.FLOAT)(0.0);
        case 'string': return (0, exports.STR)('');
        case 'bool': return (0, exports.BOOL)(false);
        case 'rune': return (0, exports.RUNE)(0);
        default: return { ...exports.NIL_VALUE }; // structs, slices → nil
    }
}
//# sourceMappingURL=RuntimeValue.js.map