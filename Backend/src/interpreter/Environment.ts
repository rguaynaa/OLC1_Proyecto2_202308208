
//Cadena de ámbitos léxicos para el intérprete GoScript

// Cada Entorno contiene un mapa de nombres -> RuntimeValues y una referencia
// al ámbito padre. La búsqueda recorre la cadena hacia arriba; la asignación
// actualiza el enlace más cercano que posea el nombre.


import { RuntimeValue } from './RuntimeValue';

export class Entorno {
  private almacen: Map<string, RuntimeValue> = new Map();
  public  readonly padre: Entorno | null;
  public  readonly nombreAmbito: string;

  constructor(padre: Entorno | null = null, nombreAmbito = 'Global') {
    this.padre        = padre;
    this.nombreAmbito = nombreAmbito;
  }

  //Definir 
  /** Declara un NUEVO enlace en ESTE ámbito. Oculta cualquier enlace exterior. */
  definir(nombre: string, valor: RuntimeValue): void {
    this.almacen.set(nombre, { type: valor.type, value: valor.value });
  }

  // Asignar
  /**
   Actualiza el enlace más cercano con nombre `nombre`.
   Recorre la cadena de padres hasta encontrarlo; lanza error si no existe.
   */
  asignar(nombre: string, valor: RuntimeValue): void {
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
  obtener(nombre: string): RuntimeValue {
    if (this.almacen.has(nombre)) {
      return this.almacen.get(nombre)!;
    }
    if (this.padre) {
      return this.padre.obtener(nombre);
    }
    throw new ReferenceError(`Variable no declarada: '${nombre}'`);
  }

  //Verificación de existencia 
  /** Devuelve true si 'nombre' está declarado en ESTE ámbito (no en padre). */
  esPropio(nombre: string): boolean {
    return this.almacen.has(nombre);
  }

  /** Devuelve true si 'nombre' está declarado en cualquier lugar de la cadena. */
  existe(nombre: string): boolean {
    return this.almacen.has(nombre) || (this.padre?.existe(nombre) ?? false);
  }

  // ── Auxiliar de depuración ─────────────────────────────────────────────────
  volcar(): Record<string, any> {
    const resultado: Record<string, any> = {};
    this.almacen.forEach((v, k) => {
      if (!k.startsWith('__')) resultado[k] = v;
    });
    return resultado;
  }
}
