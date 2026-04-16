import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import interpreterRouter from './routes/interprete';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ── Auto-generate parser on startup ─────────────────────────────────────────
function ensureParserExists(): void {
  const grammarPath = path.join(__dirname, 'grammar', 'goscript.jison');
  const parserPath  = path.join(__dirname, 'grammar', 'parser.js');

  if (!fs.existsSync(grammarPath)) {
    console.error('[GoScript] Grammar file not found:', grammarPath);
    return;
  }

  try {
    // Always regenerate so grammar changes are picked up immediately
    console.log('[GoScript] Generating parser from grammar...');
    const jison    = require('jison');
    const grammar  = fs.readFileSync(grammarPath, 'utf8');
    const gen      = new jison.Generator(grammar, { type: 'lalr', debug: false });
    fs.writeFileSync(parserPath, gen.generate());
    console.log('[GoScript] Parser generated successfully ✓');
  } catch (err: any) {
    console.error('[GoScript] Failed to generate parser:', err.message);
  }
}

ensureParserExists();

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', interpreterRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GoScript Interprete', version: '1.0.0' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[GoScript] Server running on http://localhost:${PORT}`);
  console.log(`[GoScript] API ready at http://localhost:${PORT}/api/interprete`);
});

export default app;
