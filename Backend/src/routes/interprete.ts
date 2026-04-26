import { Router, Request, Response } from 'express';
import path from 'path';
import fs   from 'fs';

import { ReportadorErrores, ErrorGoScript } from '../reports/ErrorReporte';
import { TablaSimbolos }                    from '../reports/SymbolTable';
import { ReportadorAST }                    from '../reports/ASTReporter';
import { Interprete }                       from '../interpreter/Interpreter';

const router = Router();

//Carga (o recarga) el parser generado por Jison
function cargarParser(): any {
  const rutaParser = path.join(__dirname, '..', 'grammar', 'parser.js');
  if (!fs.existsSync(rutaParser)) return null;
  delete require.cache[require.resolve(rutaParser)];
  return require(rutaParser);
}

//POST /api/interpret 
router.post('/interpret', (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };

  if (typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({
      ast: null, dot: '', output: [], symbols: [],
      errors: [{ type: 'Semántico', description: 'No se proporcionó código fuente.', line: 0, column: 0 }],
    });
  }

  //Análisis léxico + sintáctico 
  const erroresLexSin: ErrorGoScript[] = [];

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

  let ast: any = null;
  try {
    ast = parser.parse(code);
  } catch (err: any) {
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
    const reportadorAST = new ReportadorAST();
    dot = reportadorAST.generar(ast);
  } catch (e: any) {
    dot = `/* Error generando DOT: ${e?.message ?? e} */`;
  }

  //Análisis semántico + interpretación
  const reportadorErrores = new ReportadorErrores();
  for (const e of erroresLexSin) reportadorErrores.agregar(e);

  const tablaSimbolos = new TablaSimbolos();
  const interprete    = new Interprete(reportadorErrores, tablaSimbolos);

  let salida: string[] = [];
  try {
    salida = interprete.interpretar(ast);
  } catch (e: any) {
    reportadorErrores.agregarError(
      'Semántico',
      `Error de ejecución no controlado: ${e?.message ?? e}`,
      0, 0
    );
  }

  return res.json({
    ast,
    dot,
    output:  salida,
    errors:  reportadorErrores.obtenerErrores(),
    symbols: tablaSimbolos.obtenerTodos(),
  });
});

export default router;
