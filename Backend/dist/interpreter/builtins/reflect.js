"use strict";
//reflect.TypeOf(v any) string 
Object.defineProperty(exports, "__esModule", { value: true });
exports.reflectTypeOf = reflectTypeOf;
const RuntimeValue_1 = require("../RuntimeValue");
/**
 *Devuelve el nombre del tipo GoScript del valor dado.
 *
 * ejemplos:
 *   reflect.TypeOf(42)        "int"
 *   reflect.TypeOf(3.14)      "float64"
 *   reflect.TypeOf("hello")   "string"
 *   reflect.TypeOf(true)      "bool"
 *   reflect.TypeOf('A')       "rune"
 *   reflect.TypeOf(p)         "Persona"
 *   reflect.TypeOf(nums)      "[]int"
 */
function reflectTypeOf(args, onError) {
    if (args.length === 0) {
        onError('reflect.TypeOf() requiere al menos un argumento');
        return (0, RuntimeValue_1.STR)('nil');
    }
    return (0, RuntimeValue_1.STR)(args[0].type);
}
//# sourceMappingURL=reflect.js.map