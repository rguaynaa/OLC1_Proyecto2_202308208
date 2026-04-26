"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const interprete_1 = __importDefault(require("./routes/interprete"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json({ limit: '10mb' }));
//Generar automáticamente el analizador sintáctico al iniciar
function ensureParserExists() {
    const grammarPath = path_1.default.join(__dirname, 'grammar', 'goscript.jison');
    const parserPath = path_1.default.join(__dirname, 'grammar', 'parser.js');
    if (!fs_1.default.existsSync(grammarPath)) {
        console.error('[GoScript] Grammar file not found:', grammarPath);
        return;
    }
    try {
        //Regenera siempre para que los cambios gramaticales se detecten de inmediato.
        console.log('[GoScript] Generating parser from grammar...');
        const jison = require('jison');
        const grammar = fs_1.default.readFileSync(grammarPath, 'utf8');
        const gen = new jison.Generator(grammar, { type: 'lalr', debug: false });
        fs_1.default.writeFileSync(parserPath, gen.generate());
        console.log('[GoScript] Parser generated successfully ✓');
    }
    catch (err) {
        console.error('[GoScript] Failed to generate parser:', err.message);
    }
}
ensureParserExists();
//Routes
app.use('/api', interprete_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'GoScript Interpreter', version: '1.0.0' });
});
//Start
app.listen(PORT, () => {
    console.log(`[GoScript] Server running on http://localhost:${PORT}`);
    console.log(`[GoScript] API ready at http://localhost:${PORT}/api/interpret`);
});
exports.default = app;
//# sourceMappingURL=server.js.map