"use strict";
//   strings.Join(slice []string, sep string) string
//   strings.Split(s string, sep string) []string
//   strings.Contains(s string, substr string) bool
//   strings.ToUpper(s string) string
//   strings.ToLower(s string) string
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringsJoin = stringsJoin;
exports.stringsSplit = stringsSplit;
exports.stringsContains = stringsContains;
exports.stringsToUpper = stringsToUpper;
exports.stringsToLower = stringsToLower;
const RuntimeValue_1 = require("../RuntimeValue");
//strings.Join([]string{"a", "b", "c"}, ", ") → "a, b, c"
function stringsJoin(args, onError) {
    if (args.length < 2) {
        onError('strings.Join() requiere 2 argumentos: slice y separador');
        return (0, RuntimeValue_1.STR)('');
    }
    const [sliceRv, sepRv] = args;
    if (!Array.isArray(sliceRv.value)) {
        onError('El primer argumento de strings.Join() debe ser un []string');
        return (0, RuntimeValue_1.STR)('');
    }
    const parts = sliceRv.value.map(rv => rv.type === 'string' ? rv.value : String(rv.value));
    const sep = sepRv.type === 'string' ? sepRv.value : '';
    return (0, RuntimeValue_1.STR)(parts.join(sep));
}
/**
divide el string usando un separador y devuelve un slice de strings.
strings.Split("a,b,c", ",") --> []string{"a", "b", "c"}
 */
function stringsSplit(args, onError) {
    if (args.length < 2) {
        onError('strings.Split() requiere 2 argumentos: string y separador');
        return { type: '[]string', value: [] };
    }
    const [strRv, sepRv] = args;
    if (strRv.type !== 'string') {
        onError('El primer argumento de strings.Split() debe ser un string');
        return { type: '[]string', value: [] };
    }
    const s = strRv.value;
    const sep = sepRv.type === 'string' ? sepRv.value : '';
    if (sep === '') {
        // divide en caracteres individuales
        const chars = s.split('').map(ch => (0, RuntimeValue_1.STR)(ch));
        return { type: '[]string', value: chars };
    }
    const parts = s.split(sep).map(part => (0, RuntimeValue_1.STR)(part));
    return { type: '[]string', value: parts };
}
/**
 verifica si un string contiene un substring dado.
 strings.Contains("hello", "ll") → true
 */
function stringsContains(args, onError) {
    if (args.length < 2) {
        onError('strings.Contains() requiere 2 argumentos: string y substring');
        return (0, RuntimeValue_1.BOOL)(false);
    }
    const [strRv, subRv] = args;
    if (strRv.type !== 'string' || subRv.type !== 'string') {
        onError('Ambos argumentos de strings.Contains() deben ser strings');
        return (0, RuntimeValue_1.BOOL)(false);
    }
    const s = strRv.value;
    const sub = subRv.value;
    return (0, RuntimeValue_1.BOOL)(s.includes(sub));
}
/**
convierte un string a mayúsculas.
strings.ToUpper("hello") → "HELLO"
 */
function stringsToUpper(args, onError) {
    if (args.length < 1) {
        onError('strings.ToUpper() requiere 1 argumento');
        return (0, RuntimeValue_1.STR)('');
    }
    if (args[0].type !== 'string') {
        onError('El argumento de strings.ToUpper() debe ser un string');
        return (0, RuntimeValue_1.STR)('');
    }
    return (0, RuntimeValue_1.STR)(args[0].value.toUpperCase());
}
/**
 convierte un string a minúsculas.
strings.ToLower("HELLO") → "hello"
 */
function stringsToLower(args, onError) {
    if (args.length < 1) {
        onError('strings.ToLower() requiere 1 argumento');
        return (0, RuntimeValue_1.STR)('');
    }
    if (args[0].type !== 'string') {
        onError('El argumento de strings.ToLower() debe ser un string');
        return (0, RuntimeValue_1.STR)('');
    }
    return (0, RuntimeValue_1.STR)(args[0].value.toLowerCase());
}
//# sourceMappingURL=strings.js.map