"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ErrorReporte_1 = require("../reports/ErrorReporte");
const SymbolTable_1 = require("../reports/SymbolTable");
const ASTReporter_1 = require("../reports/ASTReporter");
const Interpreter_1 = require("../interpreter/Interpreter");
const router = (0, express_1.Router)();
//Carga (o recarga) el parser generado por Jison
function cargarParser() {
    const rutaParser = path_1.default.join(__dirname, '..', 'grammar', 'parser.js');
    if (!fs_1.default.existsSync(rutaParser))
        return null;
    delete require.cache[require.resolve(rutaParser)];
    return require(rutaParser);
}
//POST /api/interpret 
router.post('/interpret', (req, res) => {
    const { code } = req.body;
    if (typeof code !== 'string' || code.trim() === '') {
        return res.status(400).json({
            ast: null, dot: '', output: [], symbols: [],
            errors: [{ type: 'Semántico', description: 'No se proporcionó código fuente.', line: 0, column: 0 }],
        });
    }
    //Análisis léxico + sintáctico 
    const erroresLexSin = [];
    const parser = cargarParser();
    if (!parser) {
        return res.status(500).json({
            ast: null, dot: '', output: [], symbols: [],
            errors: [{ type: 'Semántico', description: 'Parser no disponible. Reinicia el servidor.', line: 0, column: 0 }],
        });
    }
    parser.parser.yy = {
        errors: erroresLexSin,
    };
    let ast = null;
    try {
        ast = parser.parse(code);
    }
    catch (err) {
        if (erroresLexSin.length === 0) {
            erroresLexSin.push({
                type: 'Sintáctico',
                description: err?.message ?? 'Error sintáctico desconocido.',
                line: 0, column: 0,
            });
        }
    }
    // Si hay errores sintácticos/léxicos, pero AST parcial se generó
    // los errores estarán en erroresLexSin, y se procesarán normal.
    // Sin AST → solo errores léxicos/sintácticos
    if (!ast) {
        return res.json({ ast: null, dot: '', output: [], symbols: [], errors: erroresLexSin });
    }
    //Generar DOT del AST 
    let dot = '';
    try {
        const reportadorAST = new ASTReporter_1.ReportadorAST();
        dot = reportadorAST.generar(ast);
    }
    catch (e) {
        dot = `/* Error generando DOT: ${e?.message ?? e} */`;
    }
    //Análisis semántico + interpretación
    const reportadorErrores = new ErrorReporte_1.ReportadorErrores();
    for (const e of erroresLexSin)
        reportadorErrores.agregar(e);
    const tablaSimbolos = new SymbolTable_1.TablaSimbolos();
    const interprete = new Interpreter_1.Interprete(reportadorErrores, tablaSimbolos);
    let salida = [];
    try {
        salida = interprete.interpretar(ast);
    }
    catch (e) {
        reportadorErrores.agregarError('Semántico', `Error de ejecución no controlado: ${e?.message ?? e}`, 0, 0);
    }
    return res.json({
        ast,
        dot,
        output: salida,
        errors: reportadorErrores.obtenerErrores(),
        symbols: tablaSimbolos.obtenerTodos(),
    });
});
exports.default = router;
//# sourceMappingURL=interprete.js.map