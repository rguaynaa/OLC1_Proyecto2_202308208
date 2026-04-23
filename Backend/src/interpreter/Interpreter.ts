
import { ReportadorErrores }          from '../reports/ErrorReporte';
import { TablaSimbolos }              from '../reports/SymbolTable';
import { Entorno }                    from './Environment';
import { TypeChecker }           from './TypeChecker';
import { println }                    from './builtins/fmt';
import { strconvAtoi, strconvParseFloat } from './builtins/strconv';
import { reflectTypeOf }              from './builtins/reflect';
import { slicesIndex }                from './builtins/slices';
import {
  stringsJoin, stringsSplit, stringsContains,
  stringsToUpper, stringsToLower
} from './builtins/strings';
import {
  RuntimeValue,
  NIL_VALUE, INT, FLOAT, STR, BOOL, RUNE,
  defaultForType, isTruthy,
  ReturnSignal, BreakSignal, ContinueSignal,
} from './RuntimeValue';

// Interprete:Evaluador del AST de GoScript.

// ─────────────────────────────────────────────────────────────────────────────

export class Interprete {
  private salida:             string[]      = [];
  private entornoGlobal:      Entorno;
  private reportadorErrores:  ReportadorErrores;
  private tablaSimbolos:      TablaSimbolos;
  private pilaAmbitos:        string[]      = ['Global'];
  private profundidadBucle:   number        = 0;
  private tipoRetornoActual:  string | null = null;

  constructor(reportadorErrores: ReportadorErrores, tablaSimbolos: TablaSimbolos) {
    this.reportadorErrores = reportadorErrores;
    this.tablaSimbolos     = tablaSimbolos;
    this.entornoGlobal     = new Entorno(null, 'Global');
  }

  // PUNTO DE ENTRADA PÚBLICO
 
  interpretar(ast: any): string[] {
    this.salida             = [];
    this.pilaAmbitos        = ['Global'];
    this.profundidadBucle   = 0;
    this.tipoRetornoActual  = null;

    if (!ast || ast.type !== 'Program') {
      this.reportadorErrores.agregarError('Semántico', 'AST inválido o vacío', 0, 0);
      return this.salida;
    }

    try {
      this.izarDeclaraciones(ast.declarations);

      for (const decl of ast.declarations) {
        if (decl.type === 'VarDecl') {
          this.ejecutarDeclVar(decl, this.entornoGlobal);
        }
      }

      this.llamarMain();

    } catch (e: any) {
      if (e instanceof ReturnSignal) {
        // main() retornó — correcto
      } else if (e instanceof BreakSignal) {
        this.reportadorErrores.agregarError('Semántico', "'break' fuera de un bucle o switch", 0, 0);
      } else if (e instanceof ContinueSignal) {
        this.reportadorErrores.agregarError('Semántico', "'continue' fuera de un bucle", 0, 0);
      } else {
        this.reportadorErrores.agregarError('Semántico', e?.message ?? 'Error de ejecución desconocido', 0, 0);
      }
    }

    return this.salida;
  }

  // DECLARACIONES (hoisting)

  private izarDeclaraciones(declaraciones: any[]): void {
    for (const decl of declaraciones) {
      if (decl.type === 'FunctionDecl') {
        if (this.entornoGlobal.esPropio(decl.name)) {
          this.reportadorErrores.agregarError('Semántico',
            `Función '${decl.name}' ya fue declarada`, decl.line, decl.column);
          continue;
        }
        this.entornoGlobal.definir(decl.name, { type: '__function__', value: decl });
        this.tablaSimbolos.agregar(
          decl.name, 'Función',
          decl.returnType ?? 'void',
          'Global', decl.line, decl.column
        );
      }

      if (decl.type === 'StructDecl') {
        if (this.entornoGlobal.esPropio(decl.name)) {
          this.reportadorErrores.agregarError('Semántico',
            `Struct '${decl.name}' ya fue declarado`, decl.line, decl.column);
          continue;
        }
        this.entornoGlobal.definir(decl.name, { type: '__struct_def__', value: decl });
        this.tablaSimbolos.agregar(
          decl.name, 'Struct', decl.name,
          'Global', decl.line, decl.column
        );
      }
    }
  }

// LLAMAR A main()

  private llamarMain(): void {
    let fnMain: RuntimeValue;
    try {
      fnMain = this.entornoGlobal.obtener('main');
    } catch {
      this.reportadorErrores.agregarError('Semántico', "No se encontró la función 'main()'", 0, 0);
      return;
    }

    if (fnMain.type !== '__function__') {
      this.reportadorErrores.agregarError('Semántico', "'main' no es una función", 0, 0);
      return;
    }

    try {
      this.ejecutarCuerpoFuncion(fnMain.value, [], this.entornoGlobal);
    } catch (sig) {
      if (!(sig instanceof ReturnSignal)) throw sig;
    }
  }

// DESPACHO DE SENTENCIAS
 
  private ejecutar(nodo: any, entorno: Entorno): RuntimeValue {
    if (!nodo) return NIL_VALUE;

    switch (nodo.type) {
      case 'VarDecl':         return this.ejecutarDeclVar(nodo, entorno);
      case 'Assignment':      return this.ejecutarAsignacion(nodo, entorno);
      case 'Block':           return this.ejecutarBloque(nodo, entorno);
      case 'FunctionCall':    return this.ejecutarLlamadaFuncion(nodo, entorno);
      case 'BinaryExpr':      return this.ejecutarExprBinaria(nodo, entorno);
      case 'UnaryExpr':       return this.ejecutarExprUnaria(nodo, entorno);
      case 'Literal':         return this.ejecutarLiteral(nodo);
      case 'Identifier':      return this.ejecutarIdentificador(nodo, entorno);
      case 'SliceAccess':     return this.ejecutarAccesoSlice(nodo, entorno);
      case 'SliceAccess2D':   return this.ejecutarAccesoSlice2D(nodo, entorno);
      case 'StructAccess':    return this.ejecutarAccesoStruct(nodo, entorno);
      case 'SliceLiteral':    return this.ejecutarLiteralSlice(nodo, entorno);
      case 'SliceLiteral2D':  return this.ejecutarLiteralSlice2D(nodo, entorno);
      case 'StructLiteral':   return this.ejecutarLiteralStruct(nodo, entorno);
      case 'IfStatement':     return this.ejecutarSentenciaIf(nodo, entorno);
      case 'ForStatement':    return this.ejecutarSentenciaFor(nodo, entorno);
      case 'SwitchStatement': return this.ejecutarSentenciaSwitch(nodo, entorno);
      case 'ReturnStatement': return this.ejecutarRetorno(nodo, entorno);

      case 'BreakStatement':
        if (this.profundidadBucle === 0) {
          this.reportadorErrores.agregarError('Semántico',
            "'break' solo puede usarse dentro de un bucle o switch",
            nodo.line, nodo.column);
          return NIL_VALUE;
        }
        throw new BreakSignal();

      case 'ContinueStatement':
        if (this.profundidadBucle === 0) {
          this.reportadorErrores.agregarError('Semántico',
            "'continue' solo puede usarse dentro de un bucle 'for'",
            nodo.line, nodo.column);
          return NIL_VALUE;
        }
        throw new ContinueSignal();

      case 'FunctionDecl':
      case 'StructDecl':
        return NIL_VALUE; // ya izados

      default:
        return NIL_VALUE;
    }
  }

  private evaluar(nodo: any, entorno: Entorno): RuntimeValue {
    return this.ejecutar(nodo, entorno);
  }

 // DECLARACIÓN DE VARIABLE

  private ejecutarDeclVar(nodo: any, entorno: Entorno): RuntimeValue {
    const nombre: string = nodo.name;
    const ambito         = this.ambitoActual;

    if (entorno.esPropio(nombre)) {
      this.reportadorErrores.agregarError('Semántico',
        `Variable '${nombre}' ya declarada en el ámbito '${ambito}'`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    }

    let valorFinal: RuntimeValue;

    if (nodo.value !== null && nodo.value !== undefined) {
      const valorRaw = this.evaluar(nodo.value, entorno);

      if (nodo.varType) {
        try {
          valorFinal = TypeChecker.coercionarParaAsignacion(nodo.varType, valorRaw);
        } catch (e: any) {
          this.reportadorErrores.agregarError('Semántico',
            `Error de tipo en declaración de '${nombre}': ${e.message}`,
            nodo.line, nodo.column);
          valorFinal = defaultForType(nodo.varType);
        }
      } else {
        valorFinal = valorRaw;
      }
    } else {
      valorFinal = defaultForType(nodo.varType ?? 'nil');
    }

    entorno.definir(nombre, valorFinal);
    this.tablaSimbolos.agregar(
      nombre, 'Variable',
      valorFinal.type,
      ambito,
      nodo.line, nodo.column
    );

    return NIL_VALUE;
  }

 // ASIGNACIÓN

  private ejecutarAsignacion(nodo: any, entorno: Entorno): RuntimeValue {
    const op: string = nodo.operator;

    if (op === '++' || op === '--') {
      return this.ejecutarIncDec(nodo.target, op, entorno, nodo.line, nodo.column);
    }

    const nuevoVal = this.evaluar(nodo.value, entorno);

    if (op === '=') {
      this.asignarLValue(nodo.target, nuevoVal, entorno, nodo.line, nodo.column);
      return NIL_VALUE;
    }

    const actual = this.leerLValue(nodo.target, entorno, nodo.line, nodo.column);
    let resultado: RuntimeValue;
    try {
      switch (op) {
        case '+=': resultado = TypeChecker.sumar(actual, nuevoVal);       break;
        case '-=': resultado = TypeChecker.restar(actual, nuevoVal);      break;
        case '*=': resultado = TypeChecker.multiplicar(actual, nuevoVal); break;
        case '/=': resultado = TypeChecker.dividir(actual, nuevoVal);     break;
        default:
          this.reportadorErrores.agregarError('Semántico',
            `Operador de asignación '${op}' desconocido`,
            nodo.line, nodo.column);
          return NIL_VALUE;
      }
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico',
        `Error en asignación compuesta: ${e.message}`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    }

    this.asignarLValue(nodo.target, resultado, entorno, nodo.line, nodo.column);
    return NIL_VALUE;
  }

  private ejecutarIncDec(
    objetivo: any, op: string, entorno: Entorno, linea: number, col: number
  ): RuntimeValue {
    const actual = this.leerLValue(objetivo, entorno, linea, col);
    let siguiente: RuntimeValue;
    try {
      siguiente = op === '++'
        ? TypeChecker.sumar(actual, INT(1))
        : TypeChecker.restar(actual, INT(1));
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico',
        `No se puede aplicar '${op}' a tipo '${actual.type}': ${e.message}`,
        linea, col);
      return NIL_VALUE;
    }
    this.asignarLValue(objetivo, siguiente, entorno, linea, col);
    return NIL_VALUE;
  }

  private leerLValue(nodo: any, entorno: Entorno, linea: number, col: number): RuntimeValue {
    try {
      return this.evaluar(nodo, entorno);
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico',
        `Error al leer valor: ${e.message}`, linea, col);
      return NIL_VALUE;
    }
  }

  private asignarLValue(
    objetivo: any, valor: RuntimeValue, entorno: Entorno,
    linea: number, col: number
  ): void {
    try {
      if (objetivo.type === 'Identifier') {
        const actual = entorno.existe(objetivo.name) ? entorno.obtener(objetivo.name) : null;
        if (actual && actual.type !== valor.type && valor.type !== 'nil') {
          if (actual.type === 'float64' && (valor.type === 'int' || valor.type === 'rune')) {
            entorno.asignar(objetivo.name, FLOAT(valor.value));
            return;
          }
          if (actual.type === 'int' && valor.type === 'rune') {
            entorno.asignar(objetivo.name, INT(valor.value));
            return;
          }
          if (actual.type !== 'nil') {
            this.reportadorErrores.agregarError('Semántico',
              `No se puede asignar tipo '${valor.type}' a variable '${objetivo.name}' de tipo '${actual.type}'`,
              linea, col);
            return;
          }
        }
        entorno.asignar(objetivo.name, valor);
        return;
      }

      if (objetivo.type === 'SliceAccess') {
        const sliceRv = entorno.obtener(objetivo.slice.name);
        if (!Array.isArray(sliceRv.value)) {
          this.reportadorErrores.agregarError('Semántico',
            `'${objetivo.slice.name}' no es un slice (tipo: ${sliceRv.type})`, linea, col);
          return;
        }
        const idxVal = this.evaluar(objetivo.index, entorno);
        if (idxVal.type !== 'int') {
          this.reportadorErrores.agregarError('Semántico',
            `El índice debe ser de tipo 'int', se obtuvo '${idxVal.type}'`, linea, col);
          return;
        }
        const idx = Math.trunc(idxVal.value as number);
        const arr = sliceRv.value as RuntimeValue[];
        if (idx < 0 || idx >= arr.length) {
          this.reportadorErrores.agregarError('Semántico',
            `Índice ${idx} fuera de rango en slice '${objetivo.slice.name}' (tamaño: ${arr.length})`,
            linea, col);
          return;
        }
        arr[idx] = valor;
        return;
      }

      if (objetivo.type === 'SliceAccess2D') {
        const sliceRv = entorno.obtener(objetivo.slice.name);
        if (!Array.isArray(sliceRv.value)) {
          this.reportadorErrores.agregarError('Semántico',
            `'${objetivo.slice.name}' no es un slice 2D`, linea, col);
          return;
        }
        const filaVal = this.evaluar(objetivo.row, entorno);
        const colVal  = this.evaluar(objetivo.col, entorno);
        if (filaVal.type !== 'int' || colVal.type !== 'int') {
          this.reportadorErrores.agregarError('Semántico',
            'Los índices 2D deben ser de tipo int', linea, col);
          return;
        }
        const fila   = Math.trunc(filaVal.value as number);
        const col2   = Math.trunc(colVal.value as number);
        const filas  = sliceRv.value as RuntimeValue[];
        if (fila < 0 || fila >= filas.length) {
          this.reportadorErrores.agregarError('Semántico',
            `Índice de fila ${fila} fuera de rango en '${objetivo.slice.name}' (filas: ${filas.length})`,
            linea, col);
          return;
        }
        const filaInterna = filas[fila];
        if (!Array.isArray(filaInterna.value)) {
          this.reportadorErrores.agregarError('Semántico',
            `La fila ${fila} en '${objetivo.slice.name}' no es un slice`, linea, col);
          return;
        }
        const celdas = filaInterna.value as RuntimeValue[];
        if (col2 < 0 || col2 >= celdas.length) {
          this.reportadorErrores.agregarError('Semántico',
            `Índice de columna ${col2} fuera de rango en fila ${fila} (columnas: ${celdas.length})`,
            linea, col);
          return;
        }
        celdas[col2] = valor;
        return;
      }

      if (objetivo.type === 'StructAccess') {
        const obj = entorno.obtener(objetivo.object.name);
        if (typeof obj.value !== 'object' || obj.value === null || Array.isArray(obj.value)) {
          this.reportadorErrores.agregarError('Semántico',
            `'${objetivo.object.name}' no es un struct (tipo: ${obj.type})`, linea, col);
          return;
        }
        const campos = obj.value as Record<string, RuntimeValue>;
        if (!(objetivo.field in campos)) {
          this.reportadorErrores.agregarError('Semántico',
            `El struct '${obj.type}' no tiene campo '${objetivo.field}'`, linea, col);
          return;
        }
        // Mutación directa (paso por referencia)
        campos[objetivo.field] = valor;
        return;
      }

    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico',
        `Error en asignación: ${e.message}`, linea, col);
    }
  }

 
  // BLOQUE

  private ejecutarBloque(nodo: any, entorno: Entorno): RuntimeValue {
    const entornoBloque = new Entorno(entorno, this.ambitoActual);
    for (const sentencia of nodo.statements) {
      this.ejecutar(sentencia, entornoBloque);
    }
    return NIL_VALUE;
  }

  // RETURN

  private ejecutarRetorno(nodo: any, entorno: Entorno): RuntimeValue {
    const valorRet = nodo.value ? this.evaluar(nodo.value, entorno) : NIL_VALUE;

    if (this.tipoRetornoActual && this.tipoRetornoActual !== 'void') {
      if (valorRet.type !== 'nil') {
        if (this.tipoRetornoActual === 'float64' &&
            (valorRet.type === 'int' || valorRet.type === 'rune')) {
          throw new ReturnSignal(FLOAT(valorRet.value));
        }
        if (valorRet.type !== this.tipoRetornoActual) {
          this.reportadorErrores.agregarError('Semántico',
            `Tipo de retorno incorrecto: se esperaba '${this.tipoRetornoActual}', se obtuvo '${valorRet.type}'`,
            nodo.line, nodo.column);
        }
      }
    } else if (!this.tipoRetornoActual || this.tipoRetornoActual === 'void') {
      if (valorRet.type !== 'nil') {
        this.reportadorErrores.agregarError('Semántico',
          'Función void no puede retornar un valor', nodo.line, nodo.column);
      }
    }

    throw new ReturnSignal(valorRet);
  }

  
  // IF / ELSE

  private ejecutarSentenciaIf(nodo: any, entorno: Entorno): RuntimeValue {
    const cond = this.evaluar(nodo.condition, entorno);

    if (cond.type !== 'bool') {
      this.reportadorErrores.agregarError('Semántico',
        `La condición del 'if' debe ser 'bool', se obtuvo '${cond.type}'`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    }

    if (isTruthy(cond)) {
      return this.ejecutarBloque(nodo.thenBlock, entorno);
    } else if (nodo.elseClause) {
      if (nodo.elseClause.type === 'Block') {
        return this.ejecutarBloque(nodo.elseClause, entorno);
      }
      return this.ejecutar(nodo.elseClause, entorno);
    }
    return NIL_VALUE;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BUCLE FOR
  // ══════════════════════════════════════════════════════════════════════════

  private ejecutarSentenciaFor(nodo: any, entorno: Entorno): RuntimeValue {
    switch (nodo.form) {
      case 'while':   return this.ejecutarForMientras(nodo, entorno);
      case 'classic': return this.ejecutarForClasico(nodo, entorno);
      case 'range':   return this.ejecutarForRango(nodo, entorno);
      default:
        this.reportadorErrores.agregarError('Semántico',
          `Forma de bucle desconocida: '${nodo.form}'`, nodo.line, nodo.column);
        return NIL_VALUE;
    }
  }

  private ejecutarForMientras(nodo: any, entorno: Entorno): RuntimeValue {
    this.profundidadBucle++;
    try {
      while (true) {
        const cond = this.evaluar(nodo.condition, entorno);
        if (cond.type !== 'bool') {
          this.reportadorErrores.agregarError('Semántico',
            `La condición del 'for' debe ser 'bool', se obtuvo '${cond.type}'`,
            nodo.line, nodo.column);
          break;
        }
        if (!isTruthy(cond)) break;
        try {
          this.ejecutarBloque(nodo.body, entorno);
        } catch (sig) {
          if (sig instanceof BreakSignal)    break;
          if (sig instanceof ContinueSignal) continue;
          throw sig;
        }
      }
    } finally {
      this.profundidadBucle--;
    }
    return NIL_VALUE;
  }

  private ejecutarForClasico(nodo: any, entorno: Entorno): RuntimeValue {
    const entornoBucle = new Entorno(entorno, this.ambitoActual);
    if (nodo.init) this.ejecutar(nodo.init, entornoBucle);

    this.profundidadBucle++;
    try {
      while (true) {
        if (nodo.condition) {
          const cond = this.evaluar(nodo.condition, entornoBucle);
          if (cond.type !== 'bool') {
            this.reportadorErrores.agregarError('Semántico',
              `La condición del 'for' debe ser 'bool', se obtuvo '${cond.type}'`,
              nodo.line, nodo.column);
            break;
          }
          if (!isTruthy(cond)) break;
        }
        try {
          this.ejecutarBloque(nodo.body, entornoBucle);
        } catch (sig) {
          if (sig instanceof BreakSignal)    break;
          if (sig instanceof ContinueSignal) {
            if (nodo.post) this.ejecutar(nodo.post, entornoBucle);
            continue;
          }
          throw sig;
        }
        if (nodo.post) this.ejecutar(nodo.post, entornoBucle);
      }
    } finally {
      this.profundidadBucle--;
    }
    return NIL_VALUE;
  }

  private ejecutarForRango(nodo: any, entorno: Entorno): RuntimeValue {
    const iterVal = this.evaluar(nodo.iterable, entorno);

    if (!Array.isArray(iterVal.value)) {
      this.reportadorErrores.agregarError('Semántico',
        `'range' requiere un slice, se obtuvo tipo '${iterVal.type}'`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    }

    const arr = iterVal.value as RuntimeValue[];

    this.profundidadBucle++;
    try {
      for (let i = 0; i < arr.length; i++) {
        const entornoIt = new Entorno(entorno, this.ambitoActual);
        entornoIt.definir(nodo.indexVar, INT(i));
        entornoIt.definir(nodo.valueVar, arr[i]);
        if (i === 0) {
          this.tablaSimbolos.agregar(nodo.indexVar, 'Variable', 'int',
            this.ambitoActual, nodo.line, nodo.column);
          this.tablaSimbolos.agregar(nodo.valueVar, 'Variable', arr[0]?.type ?? 'nil',
            this.ambitoActual, nodo.line, nodo.column);
        }
        try {
          this.ejecutarBloque(nodo.body, entornoIt);
        } catch (sig) {
          if (sig instanceof BreakSignal)    break;
          if (sig instanceof ContinueSignal) continue;
          throw sig;
        }
      }
    } finally {
      this.profundidadBucle--;
    }
    return NIL_VALUE;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SWITCH / CASE
  // ══════════════════════════════════════════════════════════════════════════

  private ejecutarSentenciaSwitch(nodo: any, entorno: Entorno): RuntimeValue {
    const valorExpr = this.evaluar(nodo.expr, entorno);

    this.profundidadBucle++;
    let coincidio = false;

    try {
      for (const clausulaCase of nodo.cases) {
        const valorCase = this.evaluar(clausulaCase.value, entorno);

        let eq: RuntimeValue;
        try {
          eq = TypeChecker.comparar(valorExpr, '==', valorCase);
        } catch (e: any) {
          this.reportadorErrores.agregarError('Semántico',
            `Incompatibilidad de tipos en switch case: ${e.message}`,
            clausulaCase.line, clausulaCase.column);
          continue;
        }

        if (eq.value === true) {
          coincidio = true;
          const entornoCase = new Entorno(entorno, this.ambitoActual);
          try {
            for (const sentencia of clausulaCase.statements) {
              this.ejecutar(sentencia, entornoCase);
            }
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            throw sig;
          }
          break; // break implícito
        }
      }

      if (!coincidio && nodo.defaultCase) {
        const entornoDefault = new Entorno(entorno, this.ambitoActual);
        try {
          for (const sentencia of nodo.defaultCase.statements) {
            this.ejecutar(sentencia, entornoDefault);
          }
        } catch (sig) {
          if (!(sig instanceof BreakSignal)) throw sig;
        }
      }
    } finally {
      this.profundidadBucle--;
    }

    return NIL_VALUE;
  }

// EXPRESIONES
 
  private ejecutarExprBinaria(nodo: any, entorno: Entorno): RuntimeValue {
    try {
      if (nodo.operator === '&&') {
        const izq = this.evaluar(nodo.left, entorno);
        if (izq.type !== 'bool') {
          this.reportadorErrores.agregarError('Semántico',
            `'&&' requiere operandos bool, izquierdo es '${izq.type}'`,
            nodo.line, nodo.column);
          return BOOL(false);
        }
        if (!izq.value) return BOOL(false);
        const der = this.evaluar(nodo.right, entorno);
        if (der.type !== 'bool') {
          this.reportadorErrores.agregarError('Semántico',
            `'&&' requiere operandos bool, derecho es '${der.type}'`,
            nodo.line, nodo.column);
          return BOOL(false);
        }
        return der;
      }

      if (nodo.operator === '||') {
        const izq = this.evaluar(nodo.left, entorno);
        if (izq.type !== 'bool') {
          this.reportadorErrores.agregarError('Semántico',
            `'||' requiere operandos bool, izquierdo es '${izq.type}'`,
            nodo.line, nodo.column);
          return BOOL(false);
        }
        if (izq.value) return BOOL(true);
        const der = this.evaluar(nodo.right, entorno);
        if (der.type !== 'bool') {
          this.reportadorErrores.agregarError('Semántico',
            `'||' requiere operandos bool, derecho es '${der.type}'`,
            nodo.line, nodo.column);
          return BOOL(false);
        }
        return der;
      }

      const izq = this.evaluar(nodo.left,  entorno);
      const der = this.evaluar(nodo.right, entorno);

      switch (nodo.operator) {
        case '+':  return TypeChecker.sumar(izq, der);
        case '-':  return TypeChecker.restar(izq, der);
        case '*':  return TypeChecker.multiplicar(izq, der);
        case '/':  return TypeChecker.dividir(izq, der);
        case '%':  return TypeChecker.residuo(izq, der);
        case '==': return TypeChecker.comparar(izq, '==', der);
        case '!=': return TypeChecker.comparar(izq, '!=', der);
        case '<':  return TypeChecker.comparar(izq, '<',  der);
        case '>':  return TypeChecker.comparar(izq, '>',  der);
        case '<=': return TypeChecker.comparar(izq, '<=', der);
        case '>=': return TypeChecker.comparar(izq, '>=', der);
        default:
          this.reportadorErrores.agregarError('Semántico',
            `Operador binario desconocido: '${nodo.operator}'`,
            nodo.line, nodo.column);
          return NIL_VALUE;
      }
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

  private ejecutarExprUnaria(nodo: any, entorno: Entorno): RuntimeValue {
    try {
      const operando = this.evaluar(nodo.operand, entorno);
      if (nodo.operator === '-') return TypeChecker.negar(operando);
      if (nodo.operator === '!') return TypeChecker.noLogico(operando);
      this.reportadorErrores.agregarError('Semántico',
        `Operador unario desconocido: '${nodo.operator}'`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

  private ejecutarLiteral(nodo: any): RuntimeValue {
    switch (nodo.dataType) {
      case 'int':     return INT(nodo.value);
      case 'float64': return FLOAT(nodo.value);
      case 'string':  return STR(nodo.value);
      case 'bool':    return BOOL(nodo.value);
      case 'rune':    return RUNE(nodo.value);
      case 'nil':     return { ...NIL_VALUE };
      default:        return { type: nodo.dataType, value: nodo.value };
    }
  }

  private ejecutarIdentificador(nodo: any, entorno: Entorno): RuntimeValue {
    try {
      return entorno.obtener(nodo.name);
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

// ACCESO A SLICE

  private ejecutarAccesoSlice(nodo: any, entorno: Entorno): RuntimeValue {
    try {
      const sliceRv = entorno.obtener(nodo.slice.name);
      if (!Array.isArray(sliceRv.value)) {
        this.reportadorErrores.agregarError('Semántico',
          `'${nodo.slice.name}' no es un slice (tipo: ${sliceRv.type})`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const idxVal = this.evaluar(nodo.index, entorno);
      if (idxVal.type !== 'int') {
        this.reportadorErrores.agregarError('Semántico',
          `El índice debe ser de tipo 'int', se obtuvo '${idxVal.type}'`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const idx = Math.trunc(idxVal.value as number);
      const arr = sliceRv.value as RuntimeValue[];
      if (idx < 0 || idx >= arr.length) {
        this.reportadorErrores.agregarError('Semántico',
          `Índice ${idx} fuera de rango en slice '${nodo.slice.name}' (tamaño: ${arr.length})`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      return arr[idx];
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

  private ejecutarAccesoSlice2D(nodo: any, entorno: Entorno): RuntimeValue {
    try {
      const sliceRv = entorno.obtener(nodo.slice.name);
      if (!Array.isArray(sliceRv.value)) {
        this.reportadorErrores.agregarError('Semántico',
          `'${nodo.slice.name}' no es un slice 2D`, nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const filaVal = this.evaluar(nodo.row, entorno);
      const colVal  = this.evaluar(nodo.col, entorno);
      if (filaVal.type !== 'int' || colVal.type !== 'int') {
        this.reportadorErrores.agregarError('Semántico',
          'Los índices de matriz 2D deben ser de tipo int', nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const fila  = Math.trunc(filaVal.value as number);
      const col   = Math.trunc(colVal.value as number);
      const filas = sliceRv.value as RuntimeValue[];
      if (fila < 0 || fila >= filas.length) {
        this.reportadorErrores.agregarError('Semántico',
          `Índice de fila ${fila} fuera de rango en '${nodo.slice.name}' (filas: ${filas.length})`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const interior = filas[fila];
      if (!Array.isArray(interior.value)) {
        this.reportadorErrores.agregarError('Semántico',
          `La fila ${fila} en '${nodo.slice.name}' no es un slice`, nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const celdas = interior.value as RuntimeValue[];
      if (col < 0 || col >= celdas.length) {
        this.reportadorErrores.agregarError('Semántico',
          `Índice de columna ${col} fuera de rango en fila ${fila} (columnas: ${celdas.length})`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      return celdas[col];
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACCESO A STRUCT
  // ══════════════════════════════════════════════════════════════════════════

  private ejecutarAccesoStruct(nodo: any, entorno: Entorno): RuntimeValue {
    try {
      const obj = entorno.obtener(nodo.object.name);
      if (obj.type === 'nil' || typeof obj.value !== 'object' ||
          obj.value === null || Array.isArray(obj.value)) {
        this.reportadorErrores.agregarError('Semántico',
          `'${nodo.object.name}' no es un struct (tipo: ${obj.type})`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      const campos = obj.value as Record<string, RuntimeValue>;
      if (!(nodo.field in campos)) {
        this.reportadorErrores.agregarError('Semántico',
          `El struct '${obj.type}' no tiene campo '${nodo.field}'. Campos disponibles: ${Object.keys(campos).join(', ')}`,
          nodo.line, nodo.column);
        return NIL_VALUE;
      }
      return campos[nodo.field];
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LITERALES DE SLICE Y STRUCT
  // ══════════════════════════════════════════════════════════════════════════

  private ejecutarLiteralSlice(nodo: any, entorno: Entorno): RuntimeValue {
    const elementos: RuntimeValue[] = nodo.elements.map((e: any) => this.evaluar(e, entorno));
    return { type: `[]${nodo.elementType}`, value: elementos };
  }

  private ejecutarLiteralSlice2D(nodo: any, entorno: Entorno): RuntimeValue {
    const filas: RuntimeValue[] = nodo.rows.map((fila: any[]) => {
      const elems: RuntimeValue[] = fila.map((e: any) => this.evaluar(e, entorno));
      return { type: `[]${nodo.elementType}`, value: elems } as RuntimeValue;
    });
    return { type: `[][]${nodo.elementType}`, value: filas };
  }

  private ejecutarLiteralStruct(nodo: any, entorno: Entorno): RuntimeValue {
    let nombreStruct: string = nodo.structName ?? '__anon__';

    let defStruct: any = null;
    if (nombreStruct !== '__anon__' && this.entornoGlobal.existe(nombreStruct)) {
      const def = this.entornoGlobal.obtener(nombreStruct);
      if (def.type === '__struct_def__') defStruct = def.value;
    }

    const instancia: Record<string, RuntimeValue> = {};

    if (defStruct) {
      for (const campo of defStruct.fields) {
        instancia[campo.name] = defaultForType(campo.fieldType);
      }
    }

    for (const fi of nodo.fields) {
      const valorCampo = this.evaluar(fi.value, entorno);
      if (defStruct && !(fi.field in instancia)) {
        this.reportadorErrores.agregarError('Semántico',
          `El struct '${nombreStruct}' no tiene campo '${fi.field}'. Campos válidos: ${Object.keys(instancia).join(', ')}`,
          fi.line ?? nodo.line, fi.column ?? nodo.column);
        continue;
      }
      instancia[fi.field] = valorCampo;
    }

    return {
      type:  nombreStruct === '__anon__' ? 'struct' : nombreStruct,
      value: instancia,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LLAMADA A FUNCIÓN
  // ══════════════════════════════════════════════════════════════════════════

  private ejecutarLlamadaFuncion(nodo: any, entorno: Entorno): RuntimeValue {
    if (nodo.object) {
      return this.ejecutarLlamadaBuiltin(nodo, entorno);
    }

    // Funciones integradas sin objeto
    if (nodo.name === 'append') return this.builtinAgregar(nodo.args, entorno, nodo.line, nodo.column);
    if (nodo.name === 'len')    return this.builtinLongitud(nodo.args, entorno, nodo.line, nodo.column);

    // Función definida por el usuario
    let valorFn: RuntimeValue;
    try {
      valorFn = entorno.obtener(nodo.name);
    } catch {
      this.reportadorErrores.agregarError('Semántico',
        `Función '${nodo.name}' no declarada`, nodo.line, nodo.column);
      return NIL_VALUE;
    }

    if (valorFn.type !== '__function__') {
      this.reportadorErrores.agregarError('Semántico',
        `'${nodo.name}' no es una función (es '${valorFn.type}')`, nodo.line, nodo.column);
      return NIL_VALUE;
    }

    const declFn = valorFn.value;
    const args: RuntimeValue[] = nodo.args.map((a: any) => this.evaluar(a, entorno));

    if (declFn.params && args.length !== declFn.params.length) {
      this.reportadorErrores.agregarError('Semántico',
        `Función '${nodo.name}' espera ${declFn.params.length} argumento(s), se proporcionaron ${args.length}`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    }

    try {
      return this.ejecutarCuerpoFuncion(declFn, args, entorno);
    } catch (e: any) {
      this.reportadorErrores.agregarError('Semántico',
        `Error en '${nodo.name}': ${e?.message ?? 'error desconocido'}`,
        nodo.line, nodo.column);
      return NIL_VALUE;
    }
  }

  private ejecutarLlamadaBuiltin(nodo: any, entorno: Entorno): RuntimeValue {
    const paquete = nodo.object as string;
    const funcion = nodo.name  as string;
    const args: RuntimeValue[] = nodo.args.map((a: any) => this.evaluar(a, entorno));
    const alError = (msg: string) =>
      this.reportadorErrores.agregarError('Semántico', msg, nodo.line, nodo.column);

    switch (paquete) {
      case 'fmt':
        if (funcion === 'Println') {
          this.salida.push(println(args));
          return NIL_VALUE;
        }
        break;

      case 'strconv':
        if (funcion === 'Atoi')       return strconvAtoi(args, alError);
        if (funcion === 'ParseFloat') return strconvParseFloat(args, alError);
        break;

      case 'reflect':
        if (funcion === 'TypeOf' || funcion === 'TypeOf.String') return reflectTypeOf(args, alError);
        break;

      case 'slices':
        if (funcion === 'Index') return slicesIndex(args, alError);
        break;

      case 'strings':
        if (funcion === 'Join')     return stringsJoin(args, alError);
        if (funcion === 'Split')    return stringsSplit(args, alError);
        if (funcion === 'Contains') return stringsContains(args, alError);
        if (funcion === 'ToUpper')  return stringsToUpper(args, alError);
        if (funcion === 'ToLower')  return stringsToLower(args, alError);
        break;
    }

    this.reportadorErrores.agregarError('Semántico',
      `Función '${paquete}.${funcion}' no implementada`, nodo.line, nodo.column);
    return NIL_VALUE;
  }

 // EJECUCIÓN DEL CUERPO DE UNA FUNCIÓN

  private ejecutarCuerpoFuncion(
    declFn: any, args: RuntimeValue[], _entornoLlamador: Entorno
  ): RuntimeValue {
    const entornoFn = new Entorno(this.entornoGlobal, declFn.name);

    if (declFn.params) {
      declFn.params.forEach((param: any, i: number) => {
        const valorArg = i < args.length
          ? this.coercionarParam(param.paramType, args[i])
          : defaultForType(param.paramType);
        entornoFn.definir(param.name, valorArg);
        this.tablaSimbolos.agregar(
          param.name, 'Parámetro', param.paramType,
          declFn.name, param.line, param.column
        );
      });
    }

    const tipoRetornoAnterior = this.tipoRetornoActual;
    this.tipoRetornoActual    = declFn.returnType ?? null;

    this.pilaAmbitos.push(declFn.name);
    try {
      for (const sentencia of declFn.body.statements) {
        this.ejecutar(sentencia, entornoFn);
      }
      return NIL_VALUE;
    } catch (sig) {
      if (sig instanceof ReturnSignal) return sig.returnValue;
      throw sig;
    } finally {
      this.pilaAmbitos.pop();
      this.tipoRetornoActual = tipoRetornoAnterior;
    }
  }

  private coercionarParam(tipoParam: string, valor: RuntimeValue): RuntimeValue {
    if (!tipoParam) return valor;
    try {
      return TypeChecker.coercionarParaAsignacion(tipoParam, valor);
    } catch {
      return valor;
    }
  }

// FUNCIONES INTEGRADAS INDEPENDIENTES

  private builtinAgregar(
    args: any[], entorno: Entorno, linea: number, col: number
  ): RuntimeValue {
    if (args.length < 2) {
      this.reportadorErrores.agregarError('Semántico',
        'append() requiere al menos 2 argumentos: slice y elemento', linea, col);
      return NIL_VALUE;
    }
    const sliceVal = this.evaluar(args[0], entorno);
    const nuevoElem = this.evaluar(args[1], entorno);
    if (!Array.isArray(sliceVal.value)) {
      this.reportadorErrores.agregarError('Semántico',
        `El primer argumento de append() debe ser un slice, se obtuvo '${sliceVal.type}'`,
        linea, col);
      return sliceVal;
    }
    return { type: sliceVal.type, value: [...(sliceVal.value as RuntimeValue[]), nuevoElem] };
  }

  private builtinLongitud(
    args: any[], entorno: Entorno, linea: number, col: number
  ): RuntimeValue {
    if (args.length < 1) {
      this.reportadorErrores.agregarError('Semántico',
        'len() requiere 1 argumento', linea, col);
      return INT(0);
    }
    const val = this.evaluar(args[0], entorno);
    if (Array.isArray(val.value))          return INT((val.value as RuntimeValue[]).length);
    if (typeof val.value === 'string')     return INT((val.value as string).length);
    this.reportadorErrores.agregarError('Semántico',
      `len() no soportado para tipo '${val.type}'`, linea, col);
    return INT(0);
  }

  // AUXILIARES

  private get ambitoActual(): string {
    return this.pilaAmbitos[this.pilaAmbitos.length - 1];
  }

  obtenerSalida(): string[] { return this.salida; }
}
