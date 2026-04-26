"use strict";
//   slices.Index(s []T, v T) int  
Object.defineProperty(exports, "__esModule", { value: true });
exports.slicesIndex = slicesIndex;
const RuntimeValue_1 = require("../RuntimeValue");
const TypeChecker_1 = require("../TypeChecker");
function slicesIndex(args, onError) {
    if (args.length < 2) {
        onError('slices.Index() requiere 2 argumentos: slice y valor buscado');
        return (0, RuntimeValue_1.INT)(-1);
    }
    const slice = args[0];
    const target = args[1];
    if (!Array.isArray(slice.value)) {
        onError('El primer argumento de slices.Index() debe ser un slice');
        return (0, RuntimeValue_1.INT)(-1);
    }
    const arr = slice.value;
    for (let i = 0; i < arr.length; i++) {
        try {
            const eq = TypeChecker_1.TypeChecker.comparar(arr[i], '==', target);
            if (eq.value === true)
                return (0, RuntimeValue_1.INT)(i);
        }
        catch {
            // Skip incompatible element types silently
        }
    }
    return (0, RuntimeValue_1.INT)(-1);
}
//# sourceMappingURL=slices.js.map