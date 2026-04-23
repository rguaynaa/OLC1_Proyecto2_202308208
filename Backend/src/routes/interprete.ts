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

  //Cargar parser
  const parser = cargarParser();
  if (!parser) {
    return res.status(500).json({
      ast: null, dot: '', output: [], symbols: [],
      errors: [{ type: 'Semántico', description: 'Parser no disponible. Reinicia el servidor.', line: 0, column: 0 }],
    });
  }

  //Análisis léxico + sintáctico 
  const erroresLexSin: ErrorGoScript[] = [];

  parser.yy = {
    errors: erroresLexSin,
    parseError(str: string, hash: any) {
      const linea   = (hash?.loc?.first_line   ?? 0);
      const columna = (hash?.loc?.first_column ?? 0) + 1;

      let descripcion = `Error sintáctico cerca de "${hash?.text ?? '?'}"`;
      if (hash?.expected?.length > 0) {
        const esperados = hash.expected
          .map((t: string) => t.replace(/['"]/g, ''))
          .filter((t: string) => t !== 'EOF')
          .slice(0, 5).join(', ');
        if (esperados) descripcion += `. Se esperaba: ${esperados}`;
      }
      erroresLexSin.push({ type: 'Sintáctico', description: descripcion, line: linea, column: columna });
    },
  };

  let ast: any = null;
  try {
    ast = parser.parse(code);
  } catch (err: any) {
    if (!erroresLexSin.some(e => e.type === 'Sintáctico')) {
      erroresLexSin.push({
        type: 'Sintáctico',
        description: err?.message ?? 'Error sintáctico desconocido.',
        line: 0, column: 0,
      });
    }
  }

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
