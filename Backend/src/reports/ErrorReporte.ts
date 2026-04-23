// Recopilación centralizada de errores para todas las fases de análisis.


export type TipoError = 'Léxico' | 'Sintáctico' | 'Semántico';

export type ErrorType = TipoError;

export interface ErrorGoScript {
  // categoría del error (léxico, sintáctico, semántico)
  type: ErrorType;
  // descripción legible para el usuario
  description: string;
  line: number;
  column: number;
}

export type GoScriptError = ErrorGoScript;

export class ReportadorErrores {
  private errores: ErrorGoScript[] = [];

  /** Agrega un error ya construido */
  agregar(error: ErrorGoScript): void {
    this.errores.push(error);
  }

  /** Forma abreviada: construye y agrega el error */
  agregarError(
    tipo: TipoError,
    descripcion: string,
    linea: number,
    columna: number
  ): void {
    this.errores.push({ type: tipo, description: descripcion, line: linea, column: columna });
  }

  obtenerErrores(): ErrorGoScript[] {
    return [...this.errores];
  }

  tieneErrores(): boolean {
    return this.errores.length > 0;
  }

  limpiar(): void {
    this.errores = [];
  }

  get cantidad(): number {
    return this.errores.length;
  }
}