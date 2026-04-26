"use strict";
// Sistema de tipos GoScript: coerciones implícitas y operadores.
// Implementa cada combinación 
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeChecker = void 0;
const RuntimeValue_1 = require("./RuntimeValue");
class TypeChecker {
    /** Convierte cualquier valor GoScript compatible a un número JS. */
    static aNumero(rv) {
        switch (rv.type) {
            case 'int':
            case 'float64':
            case 'rune': return rv.value;
            case 'bool': return rv.value ? 1 : 0;
            default:
                throw new TypeError(`No se puede convertir '${rv.type}' a número`);
        }
    }
    /** Convierte un valor a string en contexto de concatenación. */
    static aCadenaConcat(rv) {
        switch (rv.type) {
            case 'string': return rv.value;
            case 'rune': return String.fromCharCode(rv.value);
            case 'bool': return rv.value ? 'true' : 'false';
            case 'int':
            case 'float64': return TypeChecker.formatearNumero(rv);
            case 'nil': return '<nil>';
            default: return String(rv.value);
        }
    }
    /** Convierte un valor a string para mostrar en fmt.Println. */
    static aCadenaMostrar(rv) {
        switch (rv.type) {
            case 'string': return rv.value;
            case 'rune': return String.fromCharCode(rv.value);
            case 'bool': return rv.value ? 'true' : 'false';
            case 'int': return String(rv.value);
            case 'float64': return TypeChecker.formatearNumero(rv);
            case 'nil': return '<nil>';
            default: return String(rv.value);
        }
    }
    static formatearNumero(rv) {
        const n = rv.value;
        return String(n);
    }
    // SUMA  (+) 
    static sumar(izq, der) {
        const ti = izq.type;
        const td = der.type;
        // string en cualquier lado - concatenación
        if (ti === 'string') {
            return (0, RuntimeValue_1.STR)(izq.value + TypeChecker.aCadenaConcat(der));
        }
        if (td === 'string') {
            return (0, RuntimeValue_1.STR)(TypeChecker.aCadenaConcat(izq) + der.value);
        }
        // float64 en cualquier lado - float64
        if (ti === 'float64' || td === 'float64') {
            return (0, RuntimeValue_1.FLOAT)(TypeChecker.aNumero(izq) + TypeChecker.aNumero(der));
        }
        // bool + bool → bool
        if (ti === 'bool' && td === 'bool') {
            const suma = (izq.value ? 1 : 0) + (der.value ? 1 : 0);
            return (0, RuntimeValue_1.BOOL)(suma > 0);
        }
        // int / rune / bool - int
        return (0, RuntimeValue_1.INT)(TypeChecker.aNumero(izq) + TypeChecker.aNumero(der));
    }
    // RESTA  (-)  
    static restar(izq, der) {
        const ti = izq.type;
        const td = der.type;
        if (ti === 'string' || td === 'string') {
            throw new TypeError(`Operador '-' no soportado para tipo 'string'`);
        }
        if (ti === 'float64' || td === 'float64') {
            return (0, RuntimeValue_1.FLOAT)(TypeChecker.aNumero(izq) - TypeChecker.aNumero(der));
        }
        if (ti === 'bool' && td === 'bool') {
            const dif = (izq.value ? 1 : 0) - (der.value ? 1 : 0);
            return (0, RuntimeValue_1.BOOL)(dif !== 0);
        }
        return (0, RuntimeValue_1.INT)(TypeChecker.aNumero(izq) - TypeChecker.aNumero(der));
    }
    // MULTIPLICACIÓN  (*) 
    static multiplicar(izq, der) {
        const ti = izq.type;
        const td = der.type;
        // int * string → repetición de cadena
        if (ti === 'int' && td === 'string') {
            return (0, RuntimeValue_1.STR)(der.value.repeat(Math.max(0, izq.value)));
        }
        if (ti === 'string' && td === 'int') {
            return (0, RuntimeValue_1.STR)(izq.value.repeat(Math.max(0, der.value)));
        }
        if (ti === 'float64' || td === 'float64') {
            return (0, RuntimeValue_1.FLOAT)(TypeChecker.aNumero(izq) * TypeChecker.aNumero(der));
        }
        if (ti === 'bool' && td === 'bool') {
            return (0, RuntimeValue_1.BOOL)(Boolean(izq.value) && Boolean(der.value));
        }
        return (0, RuntimeValue_1.INT)(TypeChecker.aNumero(izq) * TypeChecker.aNumero(der));
    }
    // DIVISIÓN  (/) 
    static dividir(izq, der) {
        const ti = izq.type;
        const td = der.type;
        if (ti === 'string' || td === 'string' || ti === 'bool' || td === 'bool') {
            throw new TypeError(`Operador '/' no soportado entre '${ti}' y '${td}'`);
        }
        const divisor = TypeChecker.aNumero(der);
        if (divisor === 0)
            throw new RangeError('División por cero');
        const dividendo = TypeChecker.aNumero(izq);
        if ((ti === 'int' || ti === 'rune') && (td === 'int' || td === 'rune')) {
            return (0, RuntimeValue_1.INT)(Math.trunc(dividendo / divisor));
        }
        return (0, RuntimeValue_1.FLOAT)(dividendo / divisor);
    }
    // MÓDULO  (%)  —  solo int % int
    static residuo(izq, der) {
        if (izq.type !== 'int' || der.type !== 'int') {
            throw new TypeError(`Operador '%' solo soportado para tipo 'int'`);
        }
        const divisor = der.value;
        if (divisor === 0)
            throw new RangeError('Módulo por cero');
        return (0, RuntimeValue_1.INT)(izq.value % divisor);
    }
    // NEGACIÓN UNARIA  (-)  
    static negar(rv) {
        if (rv.type === 'int')
            return (0, RuntimeValue_1.INT)(-rv.value);
        if (rv.type === 'float64')
            return (0, RuntimeValue_1.FLOAT)(-rv.value);
        if (rv.type === 'rune')
            return (0, RuntimeValue_1.INT)(-rv.value);
        throw new TypeError(`Operador '-' unario no soportado para tipo '${rv.type}'`);
    }
    // NO LÓGICO  (!)
    static noLogico(rv) {
        if (rv.type !== 'bool') {
            throw new TypeError(`Operador '!' solo soportado para 'bool', se recibió '${rv.type}'`);
        }
        return (0, RuntimeValue_1.BOOL)(!rv.value);
    }
    // COMPARACIÓN  ==  !=  <  >  <=  >=  
    static comparar(izq, op, der) {
        const ti = izq.type;
        const td = der.type;
        const tiposNumericos = new Set(['int', 'float64', 'rune']);
        if (tiposNumericos.has(ti) && tiposNumericos.has(td)) {
            const lv = TypeChecker.aNumero(izq);
            const rv = TypeChecker.aNumero(der);
            return (0, RuntimeValue_1.BOOL)(TypeChecker.aplicarRelacional(lv, op, rv));
        }
        if (ti === td) {
            if (ti === 'string') {
                const lv = izq.value;
                const rv = der.value;
                if (op === '==')
                    return (0, RuntimeValue_1.BOOL)(lv === rv);
                if (op === '!=')
                    return (0, RuntimeValue_1.BOOL)(lv !== rv);
                if (op === '<')
                    return (0, RuntimeValue_1.BOOL)(lv < rv);
                if (op === '>')
                    return (0, RuntimeValue_1.BOOL)(lv > rv);
                if (op === '<=')
                    return (0, RuntimeValue_1.BOOL)(lv <= rv);
                if (op === '>=')
                    return (0, RuntimeValue_1.BOOL)(lv >= rv);
            }
            if (ti === 'bool') {
                if (op === '==')
                    return (0, RuntimeValue_1.BOOL)(izq.value === der.value);
                if (op === '!=')
                    return (0, RuntimeValue_1.BOOL)(izq.value !== der.value);
                throw new TypeError(`Operador '${op}' no soportado para tipo 'bool'`);
            }
            if (ti === 'nil') {
                if (op === '==')
                    return (0, RuntimeValue_1.BOOL)(true);
                if (op === '!=')
                    return (0, RuntimeValue_1.BOOL)(false);
                throw new TypeError(`Operador '${op}' no soportado para tipo 'nil'`);
            }
        }
        if ((ti === 'int' && td === 'float64') || (ti === 'float64' && td === 'int')) {
            const lv = TypeChecker.aNumero(izq);
            const rv = TypeChecker.aNumero(der);
            return (0, RuntimeValue_1.BOOL)(TypeChecker.aplicarRelacional(lv, op, rv));
        }
        throw new TypeError(`Operador '${op}' no soportado entre tipos '${ti}' y '${td}'`);
    }
    static aplicarRelacional(lv, op, rv) {
        switch (op) {
            case '==': return lv === rv;
            case '!=': return lv !== rv;
            case '<': return lv < rv;
            case '>': return lv > rv;
            case '<=': return lv <= rv;
            case '>=': return lv >= rv;
            default: return false;
        }
    }
    // Y LÓGICO / O LÓGICO 
    static yLogico(izq, der) {
        if (izq.type !== 'bool' || der.type !== 'bool') {
            throw new TypeError(`'&&' requiere operandos de tipo 'bool'`);
        }
        return (0, RuntimeValue_1.BOOL)(Boolean(izq.value) && Boolean(der.value));
    }
    static oLogico(izq, der) {
        if (izq.type !== 'bool' || der.type !== 'bool') {
            throw new TypeError(`'||' requiere operandos de tipo 'bool'`);
        }
        return (0, RuntimeValue_1.BOOL)(Boolean(izq.value) || Boolean(der.value));
    }
    // COMPATIBILIDAD DE TIPOS  (para asignación / declaración)
    static coercionarParaAsignacion(tipoDeclarado, valor) {
        if (valor.type === tipoDeclarado)
            return valor;
        // int - float64  (ampliación implícita)
        if (tipoDeclarado === 'float64' && (valor.type === 'int' || valor.type === 'rune')) {
            return (0, RuntimeValue_1.FLOAT)(valor.value);
        }
        // nil es asignable a tipos compuestos (slices, structs)
        if (valor.type === 'nil')
            return valor;
        throw new TypeError(`No se puede asignar '${valor.type}' a variable de tipo '${tipoDeclarado}'`);
    }
    // INFERENCIA DE TIPO  (para declaraciones :=)
    static inferirTipo(valor) {
        return valor.type;
    }
}
exports.TypeChecker = TypeChecker;
//# sourceMappingURL=TypeChecker.js.map