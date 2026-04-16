import { Router, Request, Response } from 'express';
import path from 'path';
import fs   from 'fs';
import { GoScriptError } from '../reports/ErrorReporte';

const router = Router();

//carga dinámica del parser generado por Jison. Si no existe, devuelve null (el servidor lo generará al arrancar)
function loadParser(): any {
  const parserPath = path.join(__dirname, 'grammar', 'parser.js');
  if (!fs.existsSync(parserPath)) {
    return null;
  }
  //eliminamos el cache para que se vuelva a cargar el parser actualizado cada vez
  delete require.cache[require.resolve(parserPath)];
  return require(parserPath);
}

//POST /api/interprete
router.post('/interpret', (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };

  if (typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({
      ast: null,
      output: [],
      errors: [{
        type: 'Semántico',
        description: 'No se proporcionó código fuente.',
        line: 0,
        column: 0
      }],
      symbols: []
    });
  }

  //cargar parser
  const parser = loadParser();
  if (!parser) {
    return res.status(500).json({
      ast: null,
      output: [],
      errors: [{
        type: 'Semántico',
        description: 'Parser no disponible. Reinicia el servidor para generarlo.',
        line: 0,
        column: 0
      }],
      symbols: []
    });
  }

  //preparar el yy para capturar errores de análisis sintáctico. Jison llamará a parseError en caso de encontrar un error, y nosotros lo usaremos para construir un mensaje de error limpio y consistente.
  const collectedErrors: GoScriptError[] = [];

  parser.yy = {
    errors: collectedErrors,
    parseError: function (str: string, hash: any) {
      const line   = hash?.loc?.first_line   ?? 0;
      const column = (hash?.loc?.first_column ?? 0) + 1;

      // los mensajes de error de Jison 
      let description = `Error sintáctico cerca de "${hash?.text ?? '?'}"`;
      if (hash?.expected && hash.expected.length > 0) {
        const expected = hash.expected
          .map((t: string) => t.replace(/['"]/g, ''))
          .filter((t: string) => t !== 'EOF')
          .slice(0, 5)
          .join(', ');
        if (expected) description += `. Se esperaba: ${expected}`;
      }

      collectedErrors.push({
        type: 'Sintáctico',
        description,
        line,
        column
      });
    }
  };

  //inicia el analizador lexico y sintactico
  let ast: any = null;

  try {
    ast = parser.parse(code);
  } catch (err: any) {
    // Only add if not already captured by parseError
    if (!collectedErrors.some(e => e.type === 'Sintáctico')) {
      collectedErrors.push({
        type: 'Sintáctico',
        description: err.message ?? 'Error de análisis sintáctico desconocido.',
        line: 0,
        column: 0
      });
    }
  }

  
  return res.json({
    ast,
    output:  [],      
    errors:  collectedErrors,
    symbols: []       
  });
});

export default router;
