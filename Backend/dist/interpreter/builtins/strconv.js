"use strict";
//   strconv.Atoi(s string) int
//   strconv.ParseFloat(s string) float64
Object.defineProperty(exports, "__esModule", { value: true });
exports.strconvAtoi = strconvAtoi;
exports.strconvParseFloat = strconvParseFloat;
const RuntimeValue_1 = require("../RuntimeValue");
function strconvAtoi(args, onError) {
    if (!args[0] || args[0].type !== 'string') {
        onError('strconv.Atoi() requiere un argumento de tipo string');
        return (0, RuntimeValue_1.INT)(0);
    }
    const s = args[0].value.trim();
    // Must be a pure integer string (no decimals)
    if (!/^-?[0-9]+$/.test(s)) {
        onError(`strconv.Atoi(): no se puede convertir "${s}" a int (¿es un decimal?)`);
        return (0, RuntimeValue_1.INT)(0);
    }
    const n = parseInt(s, 10);
    if (isNaN(n)) {
        onError(`strconv.Atoi(): cadena no válida "${s}"`);
        return (0, RuntimeValue_1.INT)(0);
    }
    return (0, RuntimeValue_1.INT)(n);
}
function strconvParseFloat(args, onError) {
    if (!args[0] || args[0].type !== 'string') {
        onError('strconv.ParseFloat() requiere un argumento de tipo string');
        return (0, RuntimeValue_1.FLOAT)(0);
    }
    const s = args[0].value.trim();
    const n = parseFloat(s);
    if (isNaN(n)) {
        onError(`strconv.ParseFloat(): no se puede convertir "${s}" a float64`);
        return (0, RuntimeValue_1.FLOAT)(0);
    }
    return (0, RuntimeValue_1.FLOAT)(n);
}
//# sourceMappingURL=strconv.js.map