"use strict";
// Recopilación centralizada de errores para todas las fases de análisis.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportadorErrores = void 0;
class ReportadorErrores {
    constructor() {
        this.errores = [];
    }
    /** Agrega un error ya construido */
    agregar(error) {
        this.errores.push(error);
    }
    /** Forma abreviada: construye y agrega el error */
    agregarError(tipo, descripcion, linea, columna) {
        this.errores.push({ type: tipo, description: descripcion, line: linea, column: columna });
    }
    obtenerErrores() {
        return [...this.errores];
    }
    tieneErrores() {
        return this.errores.length > 0;
    }
    limpiar() {
        this.errores = [];
    }
    get cantidad() {
        return this.errores.length;
    }
}
exports.ReportadorErrores = ReportadorErrores;
//# sourceMappingURL=ErrorReporte.js.map