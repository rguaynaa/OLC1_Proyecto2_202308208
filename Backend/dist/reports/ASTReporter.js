"use strict";
//convierte el AST de GoScript en un string DOT (Graphviz).
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportadorAST = void 0;
// Genera un grafo DOT renderizable con Graphviz, viz.js o similar.
class ReportadorAST {
    constructor() {
        this.contadorNodos = 0;
        this.lineas = [];
    }
    // entrada
    generar(ast) {
        this.contadorNodos = 0;
        this.lineas = [];
        this.lineas.push('digraph AST {');
        this.lineas.push('  graph [rankdir=TB, splines=ortho, bgcolor="#0d1117", fontname="JetBrains Mono"];');
        this.lineas.push('  node  [shape=box, style="filled,rounded", fontname="JetBrains Mono", fontsize=11, fontcolor="#e6edf3", color="#30363d"];');
        this.lineas.push('  edge  [color="#30363d", arrowsize=0.7];');
        this.lineas.push('');
        if (!ast) {
            this.lineas.push('  vacio [label="(vacío)", fillcolor="#21262d"];');
        }
        else {
            this.visitarNodo(ast, null);
        }
        this.lineas.push('}');
        return this.lineas.join('\n');
    }
    // visitador de nodos
    visitarNodo(nodo, idPadre) {
        if (nodo === null || nodo === undefined) {
            const id = this.nuevoId();
            this.lineas.push(`  ${id} [label="null", fillcolor="#21262d"];`);
            if (idPadre)
                this.lineas.push(`  ${idPadre} -> ${id};`);
            return id;
        }
        if (typeof nodo !== 'object') {
            const id = this.nuevoId();
            const etiq = this.escaparEtiqueta(String(nodo));
            this.lineas.push(`  ${id} [label="${etiq}", fillcolor="#21262d", fontcolor="#8b949e"];`);
            if (idPadre)
                this.lineas.push(`  ${idPadre} -> ${id};`);
            return id;
        }
        if (Array.isArray(nodo)) {
            const id = this.nuevoId();
            this.lineas.push(`  ${id} [label="[ ]", fillcolor="#1c2333", fontcolor="#58a6ff"];`);
            if (idPadre)
                this.lineas.push(`  ${idPadre} -> ${id};`);
            for (const hijo of nodo) {
                const idHijo = this.visitarNodo(hijo, null);
                this.lineas.push(`  ${id} -> ${idHijo};`);
            }
            return id;
        }
        // Es un nodo del AST
        const tipoNodo = nodo.type ?? 'Desconocido';
        const id = this.nuevoId();
        const { colorRelleno, colorTexto } = this.colorParaTipo(tipoNodo);
        const etiqueta = this.etiquetaParaNodo(nodo);
        this.lineas.push(`  ${id} [label="${etiqueta}", fillcolor="${colorRelleno}", fontcolor="${colorTexto}"];`);
        if (idPadre)
            this.lineas.push(`  ${idPadre} -> ${id};`);
        this.visitarHijos(nodo, id);
        return id;
    }
    // hijos según tipo de nodo
    visitarHijos(nodo, idPadre) {
        const t = nodo.type;
        switch (t) {
            case 'Program':
                for (const d of (nodo.declarations ?? []))
                    this.visitarNodo(d, idPadre);
                break;
            case 'FunctionDecl':
                if (nodo.params?.length) {
                    const idParams = this.nodoSintetico('paráms', idPadre, '#1c2333', '#3fb950');
                    for (const p of nodo.params) {
                        const pid = this.nuevoId();
                        this.lineas.push(`  ${pid} [label="${this.escaparEtiqueta(p.name + ' : ' + p.paramType)}", fillcolor="#161b22", fontcolor="#3fb950"];`);
                        this.lineas.push(`  ${idParams} -> ${pid};`);
                    }
                }
                if (nodo.returnType) {
                    const rid = this.nuevoId();
                    this.lineas.push(`  ${rid} [label="→ ${this.escaparEtiqueta(nodo.returnType)}", fillcolor="#161b22", fontcolor="#d29922"];`);
                    this.lineas.push(`  ${idPadre} -> ${rid};`);
                }
                this.visitarNodo(nodo.body, idPadre);
                break;
            case 'StructDecl':
                for (const f of (nodo.fields ?? [])) {
                    const fid = this.nuevoId();
                    this.lineas.push(`  ${fid} [label="${this.escaparEtiqueta(f.fieldType + ' ' + f.name)}", fillcolor="#161b22", fontcolor="#d29922"];`);
                    this.lineas.push(`  ${idPadre} -> ${fid};`);
                }
                break;
            case 'Block':
                for (const s of (nodo.statements ?? []))
                    this.visitarNodo(s, idPadre);
                break;
            case 'VarDecl':
                if (nodo.value)
                    this.visitarNodo(nodo.value, idPadre);
                break;
            case 'Assignment':
                this.visitarNodo(nodo.target, idPadre);
                if (nodo.value)
                    this.visitarNodo(nodo.value, idPadre);
                break;
            case 'BinaryExpr':
                this.visitarNodo(nodo.left, idPadre);
                this.visitarNodo(nodo.right, idPadre);
                break;
            case 'UnaryExpr':
                this.visitarNodo(nodo.operand, idPadre);
                break;
            case 'FunctionCall':
                for (const a of (nodo.args ?? []))
                    this.visitarNodo(a, idPadre);
                break;
            case 'IfStatement':
                this.visitarNodo(nodo.condition, idPadre);
                this.visitarNodo(nodo.thenBlock, idPadre);
                if (nodo.elseClause)
                    this.visitarNodo(nodo.elseClause, idPadre);
                break;
            case 'ForStatement':
                if (nodo.form === 'classic') {
                    if (nodo.init)
                        this.visitarNodo(nodo.init, idPadre);
                    if (nodo.condition)
                        this.visitarNodo(nodo.condition, idPadre);
                    if (nodo.post)
                        this.visitarNodo(nodo.post, idPadre);
                }
                else if (nodo.form === 'while') {
                    this.visitarNodo(nodo.condition, idPadre);
                }
                else if (nodo.form === 'range') {
                    this.visitarNodo(nodo.iterable, idPadre);
                }
                this.visitarNodo(nodo.body, idPadre);
                break;
            case 'SwitchStatement':
                this.visitarNodo(nodo.expr, idPadre);
                for (const c of (nodo.cases ?? [])) {
                    const cid = this.nodoSintetico('case', idPadre, '#21262d', '#f0883e');
                    this.visitarNodo(c.value, cid);
                    for (const s of (c.statements ?? []))
                        this.visitarNodo(s, cid);
                }
                if (nodo.defaultCase) {
                    const did = this.nodoSintetico('default', idPadre, '#21262d', '#f0883e');
                    for (const s of (nodo.defaultCase.statements ?? []))
                        this.visitarNodo(s, did);
                }
                break;
            case 'ReturnStatement':
                if (nodo.value)
                    this.visitarNodo(nodo.value, idPadre);
                break;
            case 'SliceLiteral':
                for (const e of (nodo.elements ?? []))
                    this.visitarNodo(e, idPadre);
                break;
            case 'SliceLiteral2D':
                for (const fila of (nodo.rows ?? [])) {
                    const fid = this.nodoSintetico('fila', idPadre, '#21262d', '#58a6ff');
                    for (const e of fila)
                        this.visitarNodo(e, fid);
                }
                break;
            case 'SliceAccess':
                this.visitarNodo(nodo.slice, idPadre);
                this.visitarNodo(nodo.index, idPadre);
                break;
            case 'SliceAccess2D':
                this.visitarNodo(nodo.slice, idPadre);
                this.visitarNodo(nodo.row, idPadre);
                this.visitarNodo(nodo.col, idPadre);
                break;
            case 'StructLiteral':
                for (const fi of (nodo.fields ?? [])) {
                    const fid = this.nodoSintetico(fi.field, idPadre, '#21262d', '#d29922');
                    this.visitarNodo(fi.value, fid);
                }
                break;
            case 'StructAccess':
                this.visitarNodo(nodo.object, idPadre);
                break;
            case 'Literal':
            case 'Identifier':
            case 'BreakStatement':
            case 'ContinueStatement':
                break; // hojas — sin hijos
            default:
                for (const [clave, val] of Object.entries(nodo)) {
                    if (['type', 'line', 'column'].includes(clave))
                        continue;
                    if (val !== null && val !== undefined && typeof val === 'object') {
                        this.visitarNodo(val, idPadre);
                    }
                }
        }
    }
    // ── Constructor de etiquetas ───────────────────────────────────────────────
    etiquetaParaNodo(nodo) {
        const t = nodo.type ?? '?';
        switch (t) {
            case 'Program': return 'Programa';
            case 'FunctionDecl': return `func ${this.escaparEtiqueta(nodo.name)}()`;
            case 'StructDecl': return `struct ${this.escaparEtiqueta(nodo.name)}`;
            case 'Block': return '{ bloque }';
            case 'VarDecl': {
                const decl = nodo.infer ? ':=' : nodo.varType ? ` : ${nodo.varType}` : '';
                return `var ${this.escaparEtiqueta(nodo.name)}${decl}`;
            }
            case 'Assignment': return `${nodo.operator}`;
            case 'BinaryExpr': return `${this.escaparEtiqueta(nodo.operator)}`;
            case 'UnaryExpr': return `${this.escaparEtiqueta(nodo.operator)}(…)`;
            case 'Literal': {
                const v = nodo.dataType === 'string'
                    ? `\\"${this.escaparEtiqueta(String(nodo.value ?? '').substring(0, 20))}\\"`
                    : this.escaparEtiqueta(String(nodo.value ?? ''));
                return `${nodo.dataType}\\n${v}`;
            }
            case 'Identifier': return `id: ${this.escaparEtiqueta(nodo.name)}`;
            case 'FunctionCall': return nodo.object
                ? `${this.escaparEtiqueta(nodo.object)}.${this.escaparEtiqueta(nodo.name)}()`
                : `${this.escaparEtiqueta(nodo.name)}()`;
            case 'IfStatement': return 'si / sino';
            case 'ForStatement': return `para (${nodo.form})`;
            case 'SwitchStatement': return 'switch';
            case 'ReturnStatement': return 'retornar';
            case 'BreakStatement': return 'break';
            case 'ContinueStatement': return 'continue';
            case 'SliceLiteral': return `[]${nodo.elementType}{ }`;
            case 'SliceLiteral2D': return `[][]${nodo.elementType}{ }`;
            case 'SliceAccess': return 'slice[i]';
            case 'SliceAccess2D': return 'slice[i][j]';
            case 'StructLiteral': return nodo.structName
                ? `${this.escaparEtiqueta(nodo.structName)}{ }` : '{ struct }';
            case 'StructAccess': return `.${this.escaparEtiqueta(nodo.field)}`;
            default: return this.escaparEtiqueta(t);
        }
    }
    //paleta de colores para tipos de nodo 
    colorParaTipo(t) {
        switch (t) {
            case 'Program': return { colorRelleno: '#0d419d', colorTexto: '#e6edf3' };
            case 'FunctionDecl': return { colorRelleno: '#1a4228', colorTexto: '#3fb950' };
            case 'StructDecl': return { colorRelleno: '#3d2b00', colorTexto: '#d29922' };
            case 'Block': return { colorRelleno: '#21262d', colorTexto: '#8b949e' };
            case 'VarDecl': return { colorRelleno: '#1c2333', colorTexto: '#58a6ff' };
            case 'Assignment': return { colorRelleno: '#161b22', colorTexto: '#f0883e' };
            case 'BinaryExpr':
            case 'UnaryExpr': return { colorRelleno: '#2d1c3d', colorTexto: '#bc8cff' };
            case 'Literal': return { colorRelleno: '#0d2d0d', colorTexto: '#56d364' };
            case 'Identifier': return { colorRelleno: '#161b22', colorTexto: '#79c0ff' };
            case 'FunctionCall': return { colorRelleno: '#1c2333', colorTexto: '#d2a8ff' };
            case 'IfStatement':
            case 'ForStatement':
            case 'SwitchStatement': return { colorRelleno: '#311010', colorTexto: '#ff7b72' };
            case 'ReturnStatement':
            case 'BreakStatement':
            case 'ContinueStatement': return { colorRelleno: '#2d1c00', colorTexto: '#ffa657' };
            case 'SliceLiteral':
            case 'SliceLiteral2D':
            case 'SliceAccess':
            case 'SliceAccess2D': return { colorRelleno: '#0d2d3d', colorTexto: '#58a6ff' };
            case 'StructLiteral':
            case 'StructAccess': return { colorRelleno: '#2d2500', colorTexto: '#d29922' };
            default: return { colorRelleno: '#21262d', colorTexto: '#c9d1d9' };
        }
    }
    //auxiliares
    nuevoId() {
        return `n${this.contadorNodos++}`;
    }
    nodoSintetico(etiqueta, idPadre, colorRelleno, colorTexto) {
        const id = this.nuevoId();
        this.lineas.push(`  ${id} [label="${this.escaparEtiqueta(etiqueta)}", fillcolor="${colorRelleno}", fontcolor="${colorTexto}"];`);
        this.lineas.push(`  ${idPadre} -> ${id};`);
        return id;
    }
    escaparEtiqueta(s) {
        return s
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '')
            .replace(/</g, '\\<')
            .replace(/>/g, '\\>');
    }
}
exports.ReportadorAST = ReportadorAST;
//# sourceMappingURL=ASTReporter.js.map