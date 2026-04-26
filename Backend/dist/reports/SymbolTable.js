"use strict";
//Acumula cada declaración de símbolo durante la interpretación
//Es una estructura de reporte pura: NO afecta la ejecución en tiempo real
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablaSimbolos = void 0;
class TablaSimbolos {
    constructor() {
        this.entradas = [];
    }
    agregar(id, tipo, tipoDato, ambito, linea, columna) {
        this.entradas.push({ id, kind: tipo, dataType: tipoDato, scope: ambito, line: linea, column: columna });
    }
    obtenerTodos() {
        return [...this.entradas];
    }
    limpiar() {
        this.entradas = [];
    }
    get cantidad() {
        return this.entradas.length;
    }
}
exports.TablaSimbolos = TablaSimbolos;
//# sourceMappingURL=SymbolTable.js.map