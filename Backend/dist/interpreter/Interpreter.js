"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interprete = void 0;
const Environment_1 = require("./Environment");
const TypeChecker_1 = require("./TypeChecker");
const fmt_1 = require("./builtins/fmt");
const strconv_1 = require("./builtins/strconv");
const reflect_1 = require("./builtins/reflect");
const slices_1 = require("./builtins/slices");
const strings_1 = require("./builtins/strings");
const RuntimeValue_1 = require("./RuntimeValue");
// Interprete:Evaluador del AST de GoScript.
// ─────────────────────────────────────────────────────────────────────────────
class Interprete {
    constructor(reportadorErrores, tablaSimbolos) {
        this.salida = [];
        this.pilaAmbitos = ['Global'];
        this.profundidadBucle = 0;
        this.tipoRetornoActual = null;
        this.reportadorErrores = reportadorErrores;
        this.tablaSimbolos = tablaSimbolos;
        this.entornoGlobal = new Environment_1.Entorno(null, 'Global');
    }
    // PUNTO DE ENTRADA PÚBLICO
    interpretar(ast) {
        this.salida = [];
        this.pilaAmbitos = ['Global'];
        this.profundidadBucle = 0;
        this.tipoRetornoActual = null;
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
        }
        catch (e) {
            if (e instanceof RuntimeValue_1.ReturnSignal) {
                // main() retornó — correcto
            }
            else if (e instanceof RuntimeValue_1.BreakSignal) {
                this.reportadorErrores.agregarError('Semántico', "'break' fuera de un bucle o switch", 0, 0);
            }
            else if (e instanceof RuntimeValue_1.ContinueSignal) {
                this.reportadorErrores.agregarError('Semántico', "'continue' fuera de un bucle", 0, 0);
            }
            else {
                this.reportadorErrores.agregarError('Semántico', e?.message ?? 'Error de ejecución desconocido', 0, 0);
            }
        }
        return this.salida;
    }
    // DECLARACIONES (hoisting)
    izarDeclaraciones(declaraciones) {
        for (const decl of declaraciones) {
            if (decl.type === 'FunctionDecl') {
                if (this.entornoGlobal.esPropio(decl.name)) {
                    this.reportadorErrores.agregarError('Semántico', `Función '${decl.name}' ya fue declarada`, decl.line, decl.column);
                    continue;
                }
                this.entornoGlobal.definir(decl.name, { type: '__function__', value: decl });
                this.tablaSimbolos.agregar(decl.name, 'Función', decl.returnType ?? 'void', 'Global', decl.line, decl.column);
            }
            if (decl.type === 'StructDecl') {
                if (this.entornoGlobal.esPropio(decl.name)) {
                    this.reportadorErrores.agregarError('Semántico', `Struct '${decl.name}' ya fue declarado`, decl.line, decl.column);
                    continue;
                }
                this.entornoGlobal.definir(decl.name, { type: '__struct_def__', value: decl });
                this.tablaSimbolos.agregar(decl.name, 'Struct', decl.name, 'Global', decl.line, decl.column);
            }
        }
    }
    // LLAMAR A main()
    llamarMain() {
        let fnMain;
        try {
            fnMain = this.entornoGlobal.obtener('main');
        }
        catch {
            this.reportadorErrores.agregarError('Semántico', "No se encontró la función 'main()'", 0, 0);
            return;
        }
        if (fnMain.type !== '__function__') {
            this.reportadorErrores.agregarError('Semántico', "'main' no es una función", 0, 0);
            return;
        }
        try {
            this.ejecutarCuerpoFuncion(fnMain.value, [], this.entornoGlobal);
        }
        catch (sig) {
            if (!(sig instanceof RuntimeValue_1.ReturnSignal))
                throw sig;
        }
    }
    // DESPACHO DE SENTENCIAS
    ejecutar(nodo, entorno) {
        if (!nodo)
            return RuntimeValue_1.NIL_VALUE;
        switch (nodo.type) {
            case 'VarDecl': return this.ejecutarDeclVar(nodo, entorno);
            case 'Assignment': return this.ejecutarAsignacion(nodo, entorno);
            case 'Block': return this.ejecutarBloque(nodo, entorno);
            case 'FunctionCall': return this.ejecutarLlamadaFuncion(nodo, entorno);
            case 'BinaryExpr': return this.ejecutarExprBinaria(nodo, entorno);
            case 'UnaryExpr': return this.ejecutarExprUnaria(nodo, entorno);
            case 'Literal': return this.ejecutarLiteral(nodo);
            case 'Identifier': return this.ejecutarIdentificador(nodo, entorno);
            case 'SliceAccess': return this.ejecutarAccesoSlice(nodo, entorno);
            case 'SliceAccess2D': return this.ejecutarAccesoSlice2D(nodo, entorno);
            case 'StructAccess': return this.ejecutarAccesoStruct(nodo, entorno);
            case 'SliceLiteral': return this.ejecutarLiteralSlice(nodo, entorno);
            case 'SliceLiteral2D': return this.ejecutarLiteralSlice2D(nodo, entorno);
            case 'StructLiteral': return this.ejecutarLiteralStruct(nodo, entorno);
            case 'IfStatement': return this.ejecutarSentenciaIf(nodo, entorno);
            case 'ForStatement': return this.ejecutarSentenciaFor(nodo, entorno);
            case 'SwitchStatement': return this.ejecutarSentenciaSwitch(nodo, entorno);
            case 'ReturnStatement': return this.ejecutarRetorno(nodo, entorno);
            case 'BreakStatement':
                if (this.profundidadBucle === 0) {
                    this.reportadorErrores.agregarError('Semántico', "'break' solo puede usarse dentro de un bucle o switch", nodo.line, nodo.column);
                    return RuntimeValue_1.NIL_VALUE;
                }
                throw new RuntimeValue_1.BreakSignal();
            case 'ContinueStatement':
                if (this.profundidadBucle === 0) {
                    this.reportadorErrores.agregarError('Semántico', "'continue' solo puede usarse dentro de un bucle 'for'", nodo.line, nodo.column);
                    return RuntimeValue_1.NIL_VALUE;
                }
                throw new RuntimeValue_1.ContinueSignal();
            case 'FunctionDecl':
            case 'StructDecl':
                return RuntimeValue_1.NIL_VALUE; // ya izados
            default:
                return RuntimeValue_1.NIL_VALUE;
        }
    }
    evaluar(nodo, entorno) {
        return this.ejecutar(nodo, entorno);
    }
    // DECLARACIÓN DE VARIABLE
    ejecutarDeclVar(nodo, entorno) {
        const nombre = nodo.name;
        const ambito = this.ambitoActual;
        if (entorno.esPropio(nombre)) {
            this.reportadorErrores.agregarError('Semántico', `Variable '${nombre}' ya declarada en el ámbito '${ambito}'`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        let valorFinal;
        if (nodo.value !== null && nodo.value !== undefined) {
            if (nodo.varType && nodo.value.type === 'StructLiteral' && !nodo.value.structName) {
                nodo.value.structName = nodo.varType;
            }
            const valorRaw = this.evaluar(nodo.value, entorno);
            if (nodo.varType) {
                try {
                    valorFinal = TypeChecker_1.TypeChecker.coercionarParaAsignacion(nodo.varType, valorRaw);
                }
                catch (e) {
                    this.reportadorErrores.agregarError('Semántico', `Error de tipo en declaración de '${nombre}': ${e.message}`, nodo.line, nodo.column);
                    valorFinal = (0, RuntimeValue_1.defaultForType)(nodo.varType);
                }
            }
            else {
                valorFinal = valorRaw;
            }
        }
        else {
            valorFinal = (0, RuntimeValue_1.defaultForType)(nodo.varType ?? 'nil');
        }
        entorno.definir(nombre, valorFinal);
        this.tablaSimbolos.agregar(nombre, 'Variable', valorFinal.type, ambito, nodo.line, nodo.column);
        return RuntimeValue_1.NIL_VALUE;
    }
    // ASIGNACIÓN
    ejecutarAsignacion(nodo, entorno) {
        const op = nodo.operator;
        if (op === '++' || op === '--') {
            return this.ejecutarIncDec(nodo.target, op, entorno, nodo.line, nodo.column);
        }
        if (op === '=' && nodo.value.type === 'StructLiteral' && !nodo.value.structName) {
            const actual = this.leerLValue(nodo.target, entorno, nodo.line, nodo.column);
            if (actual.type !== 'nil') {
                nodo.value.structName = actual.type;
            }
        }
        const nuevoVal = this.evaluar(nodo.value, entorno);
        if (op === '=') {
            this.asignarLValue(nodo.target, nuevoVal, entorno, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        const actual = this.leerLValue(nodo.target, entorno, nodo.line, nodo.column);
        let resultado;
        try {
            switch (op) {
                case '+=':
                    resultado = TypeChecker_1.TypeChecker.sumar(actual, nuevoVal);
                    break;
                case '-=':
                    resultado = TypeChecker_1.TypeChecker.restar(actual, nuevoVal);
                    break;
                case '*=':
                    resultado = TypeChecker_1.TypeChecker.multiplicar(actual, nuevoVal);
                    break;
                case '/=':
                    resultado = TypeChecker_1.TypeChecker.dividir(actual, nuevoVal);
                    break;
                default:
                    this.reportadorErrores.agregarError('Semántico', `Operador de asignación '${op}' desconocido`, nodo.line, nodo.column);
                    return RuntimeValue_1.NIL_VALUE;
            }
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', `Error en asignación compuesta: ${e.message}`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        this.asignarLValue(nodo.target, resultado, entorno, nodo.line, nodo.column);
        return RuntimeValue_1.NIL_VALUE;
    }
    ejecutarIncDec(objetivo, op, entorno, linea, col) {
        const actual = this.leerLValue(objetivo, entorno, linea, col);
        let siguiente;
        try {
            siguiente = op === '++'
                ? TypeChecker_1.TypeChecker.sumar(actual, (0, RuntimeValue_1.INT)(1))
                : TypeChecker_1.TypeChecker.restar(actual, (0, RuntimeValue_1.INT)(1));
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', `No se puede aplicar '${op}' a tipo '${actual.type}': ${e.message}`, linea, col);
            return RuntimeValue_1.NIL_VALUE;
        }
        this.asignarLValue(objetivo, siguiente, entorno, linea, col);
        return RuntimeValue_1.NIL_VALUE;
    }
    leerLValue(nodo, entorno, linea, col) {
        try {
            return this.evaluar(nodo, entorno);
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', `Error al leer valor: ${e.message}`, linea, col);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    asignarLValue(objetivo, valor, entorno, linea, col) {
        try {
            if (objetivo.type === 'Identifier') {
                const actual = entorno.existe(objetivo.name) ? entorno.obtener(objetivo.name) : null;
                if (actual && actual.type !== valor.type && valor.type !== 'nil') {
                    if (actual.type === 'float64' && (valor.type === 'int' || valor.type === 'rune')) {
                        entorno.asignar(objetivo.name, (0, RuntimeValue_1.FLOAT)(valor.value));
                        return;
                    }
                    if (actual.type === 'int' && valor.type === 'rune') {
                        entorno.asignar(objetivo.name, (0, RuntimeValue_1.INT)(valor.value));
                        return;
                    }
                    if (actual.type !== 'nil') {
                        this.reportadorErrores.agregarError('Semántico', `No se puede asignar tipo '${valor.type}' a variable '${objetivo.name}' de tipo '${actual.type}'`, linea, col);
                        return;
                    }
                }
                entorno.asignar(objetivo.name, valor);
                return;
            }
            if (objetivo.type === 'SliceAccess') {
                const sliceRv = entorno.obtener(objetivo.slice.name);
                if (!Array.isArray(sliceRv.value)) {
                    this.reportadorErrores.agregarError('Semántico', `'${objetivo.slice.name}' no es un slice (tipo: ${sliceRv.type})`, linea, col);
                    return;
                }
                const idxVal = this.evaluar(objetivo.index, entorno);
                if (idxVal.type !== 'int') {
                    this.reportadorErrores.agregarError('Semántico', `El índice debe ser de tipo 'int', se obtuvo '${idxVal.type}'`, linea, col);
                    return;
                }
                const idx = Math.trunc(idxVal.value);
                const arr = sliceRv.value;
                if (idx < 0 || idx >= arr.length) {
                    this.reportadorErrores.agregarError('Semántico', `Índice ${idx} fuera de rango en slice '${objetivo.slice.name}' (tamaño: ${arr.length})`, linea, col);
                    return;
                }
                arr[idx] = valor;
                return;
            }
            if (objetivo.type === 'SliceAccess2D') {
                const sliceRv = entorno.obtener(objetivo.slice.name);
                if (!Array.isArray(sliceRv.value)) {
                    this.reportadorErrores.agregarError('Semántico', `'${objetivo.slice.name}' no es un slice 2D`, linea, col);
                    return;
                }
                const filaVal = this.evaluar(objetivo.row, entorno);
                const colVal = this.evaluar(objetivo.col, entorno);
                if (filaVal.type !== 'int' || colVal.type !== 'int') {
                    this.reportadorErrores.agregarError('Semántico', 'Los índices 2D deben ser de tipo int', linea, col);
                    return;
                }
                const fila = Math.trunc(filaVal.value);
                const col2 = Math.trunc(colVal.value);
                const filas = sliceRv.value;
                if (fila < 0 || fila >= filas.length) {
                    this.reportadorErrores.agregarError('Semántico', `Índice de fila ${fila} fuera de rango en '${objetivo.slice.name}' (filas: ${filas.length})`, linea, col);
                    return;
                }
                const filaInterna = filas[fila];
                if (!Array.isArray(filaInterna.value)) {
                    this.reportadorErrores.agregarError('Semántico', `La fila ${fila} en '${objetivo.slice.name}' no es un slice`, linea, col);
                    return;
                }
                const celdas = filaInterna.value;
                if (col2 < 0 || col2 >= celdas.length) {
                    this.reportadorErrores.agregarError('Semántico', `Índice de columna ${col2} fuera de rango en fila ${fila} (columnas: ${celdas.length})`, linea, col);
                    return;
                }
                celdas[col2] = valor;
                return;
            }
            if (objetivo.type === 'StructAccess') {
                const obj = entorno.obtener(objetivo.object.name);
                if (typeof obj.value !== 'object' || obj.value === null || Array.isArray(obj.value)) {
                    this.reportadorErrores.agregarError('Semántico', `'${objetivo.object.name}' no es un struct (tipo: ${obj.type})`, linea, col);
                    return;
                }
                const campos = obj.value;
                if (!(objetivo.field in campos)) {
                    this.reportadorErrores.agregarError('Semántico', `El struct '${obj.type}' no tiene campo '${objetivo.field}'`, linea, col);
                    return;
                }
                // Mutación directa (paso por referencia)
                campos[objetivo.field] = valor;
                return;
            }
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', `Error en asignación: ${e.message}`, linea, col);
        }
    }
    // BLOQUE
    ejecutarBloque(nodo, entorno) {
        const entornoBloque = new Environment_1.Entorno(entorno, this.ambitoActual);
        for (const sentencia of nodo.statements) {
            this.ejecutar(sentencia, entornoBloque);
        }
        return RuntimeValue_1.NIL_VALUE;
    }
    // RETURN
    ejecutarRetorno(nodo, entorno) {
        const valorRet = nodo.value ? this.evaluar(nodo.value, entorno) : RuntimeValue_1.NIL_VALUE;
        if (this.tipoRetornoActual && this.tipoRetornoActual !== 'void') {
            if (valorRet.type !== 'nil') {
                if (this.tipoRetornoActual === 'float64' &&
                    (valorRet.type === 'int' || valorRet.type === 'rune')) {
                    throw new RuntimeValue_1.ReturnSignal((0, RuntimeValue_1.FLOAT)(valorRet.value));
                }
                if (valorRet.type !== this.tipoRetornoActual) {
                    this.reportadorErrores.agregarError('Semántico', `Tipo de retorno incorrecto: se esperaba '${this.tipoRetornoActual}', se obtuvo '${valorRet.type}'`, nodo.line, nodo.column);
                }
            }
        }
        else if (!this.tipoRetornoActual || this.tipoRetornoActual === 'void') {
            if (valorRet.type !== 'nil') {
                this.reportadorErrores.agregarError('Semántico', 'Función void no puede retornar un valor', nodo.line, nodo.column);
            }
        }
        throw new RuntimeValue_1.ReturnSignal(valorRet);
    }
    // IF / ELSE
    ejecutarSentenciaIf(nodo, entorno) {
        const cond = this.evaluar(nodo.condition, entorno);
        if (cond.type !== 'bool') {
            this.reportadorErrores.agregarError('Semántico', `La condición del 'if' debe ser 'bool', se obtuvo '${cond.type}'`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        if ((0, RuntimeValue_1.isTruthy)(cond)) {
            return this.ejecutarBloque(nodo.thenBlock, entorno);
        }
        else if (nodo.elseClause) {
            if (nodo.elseClause.type === 'Block') {
                return this.ejecutarBloque(nodo.elseClause, entorno);
            }
            return this.ejecutar(nodo.elseClause, entorno);
        }
        return RuntimeValue_1.NIL_VALUE;
    }
    // ══════════════════════════════════════════════════════════════════════════
    // BUCLE FOR
    // ══════════════════════════════════════════════════════════════════════════
    ejecutarSentenciaFor(nodo, entorno) {
        switch (nodo.form) {
            case 'while': return this.ejecutarForMientras(nodo, entorno);
            case 'classic': return this.ejecutarForClasico(nodo, entorno);
            case 'range': return this.ejecutarForRango(nodo, entorno);
            default:
                this.reportadorErrores.agregarError('Semántico', `Forma de bucle desconocida: '${nodo.form}'`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
        }
    }
    ejecutarForMientras(nodo, entorno) {
        this.profundidadBucle++;
        try {
            while (true) {
                const cond = this.evaluar(nodo.condition, entorno);
                if (cond.type !== 'bool') {
                    this.reportadorErrores.agregarError('Semántico', `La condición del 'for' debe ser 'bool', se obtuvo '${cond.type}'`, nodo.line, nodo.column);
                    break;
                }
                if (!(0, RuntimeValue_1.isTruthy)(cond))
                    break;
                try {
                    this.ejecutarBloque(nodo.body, entorno);
                }
                catch (sig) {
                    if (sig instanceof RuntimeValue_1.BreakSignal)
                        break;
                    if (sig instanceof RuntimeValue_1.ContinueSignal)
                        continue;
                    throw sig;
                }
            }
        }
        finally {
            this.profundidadBucle--;
        }
        return RuntimeValue_1.NIL_VALUE;
    }
    ejecutarForClasico(nodo, entorno) {
        const entornoBucle = new Environment_1.Entorno(entorno, this.ambitoActual);
        if (nodo.init)
            this.ejecutar(nodo.init, entornoBucle);
        this.profundidadBucle++;
        try {
            while (true) {
                if (nodo.condition) {
                    const cond = this.evaluar(nodo.condition, entornoBucle);
                    if (cond.type !== 'bool') {
                        this.reportadorErrores.agregarError('Semántico', `La condición del 'for' debe ser 'bool', se obtuvo '${cond.type}'`, nodo.line, nodo.column);
                        break;
                    }
                    if (!(0, RuntimeValue_1.isTruthy)(cond))
                        break;
                }
                try {
                    this.ejecutarBloque(nodo.body, entornoBucle);
                }
                catch (sig) {
                    if (sig instanceof RuntimeValue_1.BreakSignal)
                        break;
                    if (sig instanceof RuntimeValue_1.ContinueSignal) {
                        if (nodo.post)
                            this.ejecutar(nodo.post, entornoBucle);
                        continue;
                    }
                    throw sig;
                }
                if (nodo.post)
                    this.ejecutar(nodo.post, entornoBucle);
            }
        }
        finally {
            this.profundidadBucle--;
        }
        return RuntimeValue_1.NIL_VALUE;
    }
    ejecutarForRango(nodo, entorno) {
        const iterVal = this.evaluar(nodo.iterable, entorno);
        if (!Array.isArray(iterVal.value)) {
            this.reportadorErrores.agregarError('Semántico', `'range' requiere un slice, se obtuvo tipo '${iterVal.type}'`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        const arr = iterVal.value;
        this.profundidadBucle++;
        try {
            for (let i = 0; i < arr.length; i++) {
                const entornoIt = new Environment_1.Entorno(entorno, this.ambitoActual);
                entornoIt.definir(nodo.indexVar, (0, RuntimeValue_1.INT)(i));
                entornoIt.definir(nodo.valueVar, arr[i]);
                if (i === 0) {
                    this.tablaSimbolos.agregar(nodo.indexVar, 'Variable', 'int', this.ambitoActual, nodo.line, nodo.column);
                    this.tablaSimbolos.agregar(nodo.valueVar, 'Variable', arr[0]?.type ?? 'nil', this.ambitoActual, nodo.line, nodo.column);
                }
                try {
                    this.ejecutarBloque(nodo.body, entornoIt);
                }
                catch (sig) {
                    if (sig instanceof RuntimeValue_1.BreakSignal)
                        break;
                    if (sig instanceof RuntimeValue_1.ContinueSignal)
                        continue;
                    throw sig;
                }
            }
        }
        finally {
            this.profundidadBucle--;
        }
        return RuntimeValue_1.NIL_VALUE;
    }
    // ══════════════════════════════════════════════════════════════════════════
    // SWITCH / CASE
    // ══════════════════════════════════════════════════════════════════════════
    ejecutarSentenciaSwitch(nodo, entorno) {
        const valorExpr = this.evaluar(nodo.expr, entorno);
        this.profundidadBucle++;
        let coincidio = false;
        try {
            for (const clausulaCase of nodo.cases) {
                const valorCase = this.evaluar(clausulaCase.value, entorno);
                let eq;
                try {
                    eq = TypeChecker_1.TypeChecker.comparar(valorExpr, '==', valorCase);
                }
                catch (e) {
                    this.reportadorErrores.agregarError('Semántico', `Incompatibilidad de tipos en switch case: ${e.message}`, clausulaCase.line, clausulaCase.column);
                    continue;
                }
                if (eq.value === true) {
                    coincidio = true;
                    const entornoCase = new Environment_1.Entorno(entorno, this.ambitoActual);
                    try {
                        for (const sentencia of clausulaCase.statements) {
                            this.ejecutar(sentencia, entornoCase);
                        }
                    }
                    catch (sig) {
                        if (sig instanceof RuntimeValue_1.BreakSignal)
                            break;
                        throw sig;
                    }
                    break; // break implícito
                }
            }
            if (!coincidio && nodo.defaultCase) {
                const entornoDefault = new Environment_1.Entorno(entorno, this.ambitoActual);
                try {
                    for (const sentencia of nodo.defaultCase.statements) {
                        this.ejecutar(sentencia, entornoDefault);
                    }
                }
                catch (sig) {
                    if (!(sig instanceof RuntimeValue_1.BreakSignal))
                        throw sig;
                }
            }
        }
        finally {
            this.profundidadBucle--;
        }
        return RuntimeValue_1.NIL_VALUE;
    }
    // EXPRESIONES
    ejecutarExprBinaria(nodo, entorno) {
        try {
            if (nodo.operator === '&&') {
                const izq = this.evaluar(nodo.left, entorno);
                if (izq.type !== 'bool') {
                    this.reportadorErrores.agregarError('Semántico', `'&&' requiere operandos bool, izquierdo es '${izq.type}'`, nodo.line, nodo.column);
                    return (0, RuntimeValue_1.BOOL)(false);
                }
                if (!izq.value)
                    return (0, RuntimeValue_1.BOOL)(false);
                const der = this.evaluar(nodo.right, entorno);
                if (der.type !== 'bool') {
                    this.reportadorErrores.agregarError('Semántico', `'&&' requiere operandos bool, derecho es '${der.type}'`, nodo.line, nodo.column);
                    return (0, RuntimeValue_1.BOOL)(false);
                }
                return der;
            }
            if (nodo.operator === '||') {
                const izq = this.evaluar(nodo.left, entorno);
                if (izq.type !== 'bool') {
                    this.reportadorErrores.agregarError('Semántico', `'||' requiere operandos bool, izquierdo es '${izq.type}'`, nodo.line, nodo.column);
                    return (0, RuntimeValue_1.BOOL)(false);
                }
                if (izq.value)
                    return (0, RuntimeValue_1.BOOL)(true);
                const der = this.evaluar(nodo.right, entorno);
                if (der.type !== 'bool') {
                    this.reportadorErrores.agregarError('Semántico', `'||' requiere operandos bool, derecho es '${der.type}'`, nodo.line, nodo.column);
                    return (0, RuntimeValue_1.BOOL)(false);
                }
                return der;
            }
            const izq = this.evaluar(nodo.left, entorno);
            const der = this.evaluar(nodo.right, entorno);
            switch (nodo.operator) {
                case '+': return TypeChecker_1.TypeChecker.sumar(izq, der);
                case '-': return TypeChecker_1.TypeChecker.restar(izq, der);
                case '*': return TypeChecker_1.TypeChecker.multiplicar(izq, der);
                case '/': return TypeChecker_1.TypeChecker.dividir(izq, der);
                case '%': return TypeChecker_1.TypeChecker.residuo(izq, der);
                case '==': return TypeChecker_1.TypeChecker.comparar(izq, '==', der);
                case '!=': return TypeChecker_1.TypeChecker.comparar(izq, '!=', der);
                case '<': return TypeChecker_1.TypeChecker.comparar(izq, '<', der);
                case '>': return TypeChecker_1.TypeChecker.comparar(izq, '>', der);
                case '<=': return TypeChecker_1.TypeChecker.comparar(izq, '<=', der);
                case '>=': return TypeChecker_1.TypeChecker.comparar(izq, '>=', der);
                default:
                    this.reportadorErrores.agregarError('Semántico', `Operador binario desconocido: '${nodo.operator}'`, nodo.line, nodo.column);
                    return RuntimeValue_1.NIL_VALUE;
            }
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    ejecutarExprUnaria(nodo, entorno) {
        try {
            const operando = this.evaluar(nodo.operand, entorno);
            if (nodo.operator === '-')
                return TypeChecker_1.TypeChecker.negar(operando);
            if (nodo.operator === '!')
                return TypeChecker_1.TypeChecker.noLogico(operando);
            this.reportadorErrores.agregarError('Semántico', `Operador unario desconocido: '${nodo.operator}'`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    ejecutarLiteral(nodo) {
        switch (nodo.dataType) {
            case 'int': return (0, RuntimeValue_1.INT)(nodo.value);
            case 'float64': return (0, RuntimeValue_1.FLOAT)(nodo.value);
            case 'string': return (0, RuntimeValue_1.STR)(nodo.value);
            case 'bool': return (0, RuntimeValue_1.BOOL)(nodo.value);
            case 'rune': return (0, RuntimeValue_1.RUNE)(nodo.value);
            case 'nil': return { ...RuntimeValue_1.NIL_VALUE };
            default: return { type: nodo.dataType, value: nodo.value };
        }
    }
    ejecutarIdentificador(nodo, entorno) {
        try {
            return entorno.obtener(nodo.name);
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    // ACCESO A SLICE
    ejecutarAccesoSlice(nodo, entorno) {
        try {
            const sliceRv = entorno.obtener(nodo.slice.name);
            if (!Array.isArray(sliceRv.value)) {
                this.reportadorErrores.agregarError('Semántico', `'${nodo.slice.name}' no es un slice (tipo: ${sliceRv.type})`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const idxVal = this.evaluar(nodo.index, entorno);
            if (idxVal.type !== 'int') {
                this.reportadorErrores.agregarError('Semántico', `El índice debe ser de tipo 'int', se obtuvo '${idxVal.type}'`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const idx = Math.trunc(idxVal.value);
            const arr = sliceRv.value;
            if (idx < 0 || idx >= arr.length) {
                this.reportadorErrores.agregarError('Semántico', `Índice ${idx} fuera de rango en slice '${nodo.slice.name}' (tamaño: ${arr.length})`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            return arr[idx];
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    ejecutarAccesoSlice2D(nodo, entorno) {
        try {
            const sliceRv = entorno.obtener(nodo.slice.name);
            if (!Array.isArray(sliceRv.value)) {
                this.reportadorErrores.agregarError('Semántico', `'${nodo.slice.name}' no es un slice 2D`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const filaVal = this.evaluar(nodo.row, entorno);
            const colVal = this.evaluar(nodo.col, entorno);
            if (filaVal.type !== 'int' || colVal.type !== 'int') {
                this.reportadorErrores.agregarError('Semántico', 'Los índices de matriz 2D deben ser de tipo int', nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const fila = Math.trunc(filaVal.value);
            const col = Math.trunc(colVal.value);
            const filas = sliceRv.value;
            if (fila < 0 || fila >= filas.length) {
                this.reportadorErrores.agregarError('Semántico', `Índice de fila ${fila} fuera de rango en '${nodo.slice.name}' (filas: ${filas.length})`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const interior = filas[fila];
            if (!Array.isArray(interior.value)) {
                this.reportadorErrores.agregarError('Semántico', `La fila ${fila} en '${nodo.slice.name}' no es un slice`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const celdas = interior.value;
            if (col < 0 || col >= celdas.length) {
                this.reportadorErrores.agregarError('Semántico', `Índice de columna ${col} fuera de rango en fila ${fila} (columnas: ${celdas.length})`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            return celdas[col];
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    // ══════════════════════════════════════════════════════════════════════════
    // ACCESO A STRUCT
    // ══════════════════════════════════════════════════════════════════════════
    ejecutarAccesoStruct(nodo, entorno) {
        try {
            const obj = entorno.obtener(nodo.object.name);
            if (obj.type === 'nil' || typeof obj.value !== 'object' ||
                obj.value === null || Array.isArray(obj.value)) {
                this.reportadorErrores.agregarError('Semántico', `'${nodo.object.name}' no es un struct (tipo: ${obj.type})`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            const campos = obj.value;
            if (!(nodo.field in campos)) {
                this.reportadorErrores.agregarError('Semántico', `El struct '${obj.type}' no tiene campo '${nodo.field}'. Campos disponibles: ${Object.keys(campos).join(', ')}`, nodo.line, nodo.column);
                return RuntimeValue_1.NIL_VALUE;
            }
            return campos[nodo.field];
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', e.message, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    // ══════════════════════════════════════════════════════════════════════════
    // LITERALES DE SLICE Y STRUCT
    // ══════════════════════════════════════════════════════════════════════════
    ejecutarLiteralSlice(nodo, entorno) {
        const elementos = nodo.elements.map((e) => this.evaluar(e, entorno));
        return { type: `[]${nodo.elementType}`, value: elementos };
    }
    ejecutarLiteralSlice2D(nodo, entorno) {
        const filas = nodo.rows.map((fila) => {
            const elems = fila.map((e) => this.evaluar(e, entorno));
            return { type: `[]${nodo.elementType}`, value: elems };
        });
        return { type: `[][]${nodo.elementType}`, value: filas };
    }
    ejecutarLiteralStruct(nodo, entorno) {
        let nombreStruct = nodo.structName ?? '__anon__';
        let defStruct = null;
        if (nombreStruct !== '__anon__' && this.entornoGlobal.existe(nombreStruct)) {
            const def = this.entornoGlobal.obtener(nombreStruct);
            if (def.type === '__struct_def__')
                defStruct = def.value;
        }
        const instancia = {};
        if (defStruct) {
            for (const campo of defStruct.fields) {
                instancia[campo.name] = (0, RuntimeValue_1.defaultForType)(campo.fieldType);
            }
        }
        for (const fi of nodo.fields) {
            const valorCampo = this.evaluar(fi.value, entorno);
            if (defStruct && !(fi.field in instancia)) {
                this.reportadorErrores.agregarError('Semántico', `El struct '${nombreStruct}' no tiene campo '${fi.field}'. Campos válidos: ${Object.keys(instancia).join(', ')}`, fi.line ?? nodo.line, fi.column ?? nodo.column);
                continue;
            }
            instancia[fi.field] = valorCampo;
        }
        return {
            type: nombreStruct === '__anon__' ? 'struct' : nombreStruct,
            value: instancia,
        };
    }
    // ══════════════════════════════════════════════════════════════════════════
    // LLAMADA A FUNCIÓN
    // ══════════════════════════════════════════════════════════════════════════
    ejecutarLlamadaFuncion(nodo, entorno) {
        if (nodo.object) {
            return this.ejecutarLlamadaBuiltin(nodo, entorno);
        }
        // Funciones integradas sin objeto
        if (nodo.name === 'append')
            return this.builtinAgregar(nodo.args, entorno, nodo.line, nodo.column);
        if (nodo.name === 'len')
            return this.builtinLongitud(nodo.args, entorno, nodo.line, nodo.column);
        // Función definida por el usuario
        let valorFn;
        try {
            valorFn = entorno.obtener(nodo.name);
        }
        catch {
            this.reportadorErrores.agregarError('Semántico', `Función '${nodo.name}' no declarada`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        if (valorFn.type !== '__function__') {
            this.reportadorErrores.agregarError('Semántico', `'${nodo.name}' no es una función (es '${valorFn.type}')`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        const declFn = valorFn.value;
        const args = nodo.args.map((a) => this.evaluar(a, entorno));
        if (declFn.params && args.length !== declFn.params.length) {
            this.reportadorErrores.agregarError('Semántico', `Función '${nodo.name}' espera ${declFn.params.length} argumento(s), se proporcionaron ${args.length}`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
        try {
            return this.ejecutarCuerpoFuncion(declFn, args, entorno);
        }
        catch (e) {
            this.reportadorErrores.agregarError('Semántico', `Error en '${nodo.name}': ${e?.message ?? 'error desconocido'}`, nodo.line, nodo.column);
            return RuntimeValue_1.NIL_VALUE;
        }
    }
    ejecutarLlamadaBuiltin(nodo, entorno) {
        const paquete = nodo.object;
        const funcion = nodo.name;
        const args = nodo.args.map((a) => this.evaluar(a, entorno));
        const alError = (msg) => this.reportadorErrores.agregarError('Semántico', msg, nodo.line, nodo.column);
        switch (paquete) {
            case 'fmt':
                if (funcion === 'Println') {
                    this.salida.push((0, fmt_1.println)(args));
                    return RuntimeValue_1.NIL_VALUE;
                }
                break;
            case 'strconv':
                if (funcion === 'Atoi')
                    return (0, strconv_1.strconvAtoi)(args, alError);
                if (funcion === 'ParseFloat')
                    return (0, strconv_1.strconvParseFloat)(args, alError);
                break;
            case 'reflect':
                if (funcion === 'TypeOf' || funcion === 'TypeOf.String')
                    return (0, reflect_1.reflectTypeOf)(args, alError);
                break;
            case 'slices':
                if (funcion === 'Index')
                    return (0, slices_1.slicesIndex)(args, alError);
                break;
            case 'strings':
                if (funcion === 'Join')
                    return (0, strings_1.stringsJoin)(args, alError);
                if (funcion === 'Split')
                    return (0, strings_1.stringsSplit)(args, alError);
                if (funcion === 'Contains')
                    return (0, strings_1.stringsContains)(args, alError);
                if (funcion === 'ToUpper')
                    return (0, strings_1.stringsToUpper)(args, alError);
                if (funcion === 'ToLower')
                    return (0, strings_1.stringsToLower)(args, alError);
                break;
        }
        this.reportadorErrores.agregarError('Semántico', `Función '${paquete}.${funcion}' no implementada`, nodo.line, nodo.column);
        return RuntimeValue_1.NIL_VALUE;
    }
    // EJECUCIÓN DEL CUERPO DE UNA FUNCIÓN
    ejecutarCuerpoFuncion(declFn, args, _entornoLlamador) {
        const entornoFn = new Environment_1.Entorno(this.entornoGlobal, declFn.name);
        if (declFn.params) {
            declFn.params.forEach((param, i) => {
                const valorArg = i < args.length
                    ? this.coercionarParam(param.paramType, args[i])
                    : (0, RuntimeValue_1.defaultForType)(param.paramType);
                entornoFn.definir(param.name, valorArg);
                this.tablaSimbolos.agregar(param.name, 'Parámetro', param.paramType, declFn.name, param.line, param.column);
            });
        }
        const tipoRetornoAnterior = this.tipoRetornoActual;
        this.tipoRetornoActual = declFn.returnType ?? null;
        this.pilaAmbitos.push(declFn.name);
        try {
            for (const sentencia of declFn.body.statements) {
                this.ejecutar(sentencia, entornoFn);
            }
            return RuntimeValue_1.NIL_VALUE;
        }
        catch (sig) {
            if (sig instanceof RuntimeValue_1.ReturnSignal)
                return sig.returnValue;
            throw sig;
        }
        finally {
            this.pilaAmbitos.pop();
            this.tipoRetornoActual = tipoRetornoAnterior;
        }
    }
    coercionarParam(tipoParam, valor) {
        if (!tipoParam)
            return valor;
        try {
            return TypeChecker_1.TypeChecker.coercionarParaAsignacion(tipoParam, valor);
        }
        catch {
            return valor;
        }
    }
    // FUNCIONES INTEGRADAS INDEPENDIENTES
    builtinAgregar(args, entorno, linea, col) {
        if (args.length < 2) {
            this.reportadorErrores.agregarError('Semántico', 'append() requiere al menos 2 argumentos: slice y elemento', linea, col);
            return RuntimeValue_1.NIL_VALUE;
        }
        const sliceVal = this.evaluar(args[0], entorno);
        const nuevoElem = this.evaluar(args[1], entorno);
        if (!Array.isArray(sliceVal.value)) {
            this.reportadorErrores.agregarError('Semántico', `El primer argumento de append() debe ser un slice, se obtuvo '${sliceVal.type}'`, linea, col);
            return sliceVal;
        }
        return { type: sliceVal.type, value: [...sliceVal.value, nuevoElem] };
    }
    builtinLongitud(args, entorno, linea, col) {
        if (args.length < 1) {
            this.reportadorErrores.agregarError('Semántico', 'len() requiere 1 argumento', linea, col);
            return (0, RuntimeValue_1.INT)(0);
        }
        const val = this.evaluar(args[0], entorno);
        if (Array.isArray(val.value))
            return (0, RuntimeValue_1.INT)(val.value.length);
        if (typeof val.value === 'string')
            return (0, RuntimeValue_1.INT)(val.value.length);
        this.reportadorErrores.agregarError('Semántico', `len() no soportado para tipo '${val.type}'`, linea, col);
        return (0, RuntimeValue_1.INT)(0);
    }
    // AUXILIARES
    get ambitoActual() {
        return this.pilaAmbitos[this.pilaAmbitos.length - 1];
    }
    obtenerSalida() { return this.salida; }
}
exports.Interprete = Interprete;
//# sourceMappingURL=Interpreter.js.map