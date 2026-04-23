
//Acumula cada declaración de símbolo durante la interpretación
//Es una estructura de reporte pura: NO afecta la ejecución en tiempo real

export type TipoSimbolo = 'Variable' | 'Función' | 'Struct' | 'Parámetro';
export type SymbolKind = TipoSimbolo;

export interface EntradaSimbolo {
  id:          string;
  kind:        TipoSimbolo;
  dataType:    string;
  scope:       string;
  line:        number;
  column:      number;
}

export type SymbolEntry = EntradaSimbolo;

export class TablaSimbolos {
  private entradas: EntradaSimbolo[] = [];

  agregar(
    id:       string,
    tipo:     TipoSimbolo,
    tipoDato: string,
    ambito:   string,
    linea:    number,
    columna:  number
  ): void {
    this.entradas.push({ id, kind: tipo, dataType: tipoDato, scope: ambito, line: linea, column: columna });
  }

  obtenerTodos(): EntradaSimbolo[] {
    return [...this.entradas];
  }

  limpiar(): void {
    this.entradas = [];
  }

  get cantidad(): number {
    return this.entradas.length;
  }
}
