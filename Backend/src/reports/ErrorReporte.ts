// Recopilación centralizada de errores para todas las fases de análisis.


export type ErrorType = 'Léxico' | 'Sintáctico' | 'Semántico';

export interface GoScriptError {
  // categoría del error (léxico, sintáctico, semántico)
  type: ErrorType;
  // descripción legible para el usuario
  description: string;
  line: number;
  column: number;
}

export class ErrorReporter {
  private errors: GoScriptError[] = [];

// Agrega un error al reporte
  add(error: GoScriptError): void {
    this.errors.push(error);
  }

// Método de conveniencia para agregar errores sin crear el objeto completo
  addError(
    type: ErrorType,
    description: string,
    line: number,
    column: number
  ): void {
    this.errors.push({ type, description, line, column });
  }

  getErrors(): GoScriptError[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear(): void {
    this.errors = [];
  }

  get count(): number {
    return this.errors.length;
  }
}
