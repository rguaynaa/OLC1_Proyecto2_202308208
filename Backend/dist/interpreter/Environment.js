"use strict";
//Cadena de ámbitos léxicos para el intérprete GoScript
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entorno = void 0;
class Entorno {
    constructor(padre = null, nombreAmbito = 'Global') {
        this.almacen = new Map();
        this.padre = padre;
        this.nombreAmbito = nombreAmbito;
    }
    //Definir 
    /** Declara un NUEVO enlace en ESTE ámbito. Oculta cualquier enlace exterior. */
    definir(nombre, valor) {
        this.almacen.set(nombre, { type: valor.type, value: valor.value });
    }
    // Asignar
    /**
     Actualiza el enlace más cercano con nombre `nombre`.
     Recorre la cadena de padres hasta encontrarlo; lanza error si no existe.
     */
    asignar(nombre, valor) {
        if (this.almacen.has(nombre)) {
            this.almacen.set(nombre, { type: valor.type, value: valor.value });
            return;
        }
        if (this.padre) {
            this.padre.asignar(nombre, valor);
            return;
        }
        throw new ReferenceError(`Variable no declarada: '${nombre}'`);
    }
    // Obtener 
    /** Busca 'nombre' recorriendo la cadena de padres. Lanza error si no existe. */
    obtener(nombre) {
        if (this.almacen.has(nombre)) {
            return this.almacen.get(nombre);
        }
        if (this.padre) {
            return this.padre.obtener(nombre);
        }
        throw new ReferenceError(`Variable no declarada: '${nombre}'`);
    }
    //Verificación de existencia 
    /** Devuelve true si 'nombre' está declarado en ESTE ámbito (no en padre). */
    esPropio(nombre) {
        return this.almacen.has(nombre);
    }
    /** Devuelve true si 'nombre' está declarado en cualquier lugar de la cadena. */
    existe(nombre) {
        return this.almacen.has(nombre) || (this.padre?.existe(nombre) ?? false);
    }
    // ── Auxiliar de depuración ─────────────────────────────────────────────────
    volcar() {
        const resultado = {};
        this.almacen.forEach((v, k) => {
            if (!k.startsWith('__'))
                resultado[k] = v;
        });
        return resultado;
    }
}
exports.Entorno = Entorno;
//# sourceMappingURL=Environment.js.map