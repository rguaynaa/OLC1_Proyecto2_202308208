%lex


 

/*- Bloque  de comentarios -*/

%x BLOCK_COMMENT

%%


<INITIAL>"/*"           {this.begin('BLOCK_COMMENT'); }

<BLOCK_COMMENT>"*/"     {this.begin('INITIAL');}
<BLOCK_COMMENT>[^*\n]+  {/*skip*/}
<BLOCK_COMMENT>\n       {/*skip - rastrea automaticamente*/}
<BLOCK_COMMENT>"*"      {/*skip lone star*/}


/* linea de comentarios */
<INITIAL>"//"[^\n]*     {/* skip */}

/* Espacio en blanco*/
<INITIAL>[ \t\r\n]+             { /* skip */ }

/* Palabras clave  (identificadores) */
<INITIAL>"func"                 { return 'FUNC'; }
<INITIAL>"var"                  { return 'VAR'; }
<INITIAL>"if"                   { return 'IF'; }
<INITIAL>"else"                 { return 'ELSE'; }
<INITIAL>"for"                  { return 'FOR'; }
<INITIAL>"switch"               { return 'SWITCH'; }
<INITIAL>"case"                 { return 'CASE'; }
<INITIAL>"default"              { return 'DEFAULT'; }
<INITIAL>"return"               { return 'RETURN'; }
<INITIAL>"break"                { return 'BREAK'; }
<INITIAL>"continue"             { return 'CONTINUE'; }
<INITIAL>"struct"               { return 'STRUCT'; }
<INITIAL>"range"                { return 'RANGE'; }
<INITIAL>"nil"                  { return 'NIL'; }
<INITIAL>"true"                 { return 'TRUE'; }
<INITIAL>"false"                { return 'FALSE'; }

/* palabras clave primitivas*/
<INITIAL>"int"                  { return 'INT_TYPE'; }
<INITIAL>"float64"              { return 'FLOAT64_TYPE'; }
<INITIAL>"string"               { return 'STRING_TYPE'; }
<INITIAL>"bool"                 { return 'BOOL_TYPE'; }
<INITIAL>"rune"                 { return 'RUNE_TYPE'; }

/* Literales*/
<INITIAL>[0-9]+"."[0-9]+        { return 'FLOAT_LIT'; }
<INITIAL>[0-9]+                 { return 'INT_LIT'; }
<INITIAL>\"(\\.|[^"\\])*\"      { return 'STRING_LIT'; }
<INITIAL>\'(\\.|[^'\\])\'       { return 'RUNE_LIT'; }

/* IDENTIFICADOR */
<INITIAL>[a-zA-Z_][a-zA-Z0-9_]* { return 'IDENTIFIER'; }

/* operadores compuestos*/
<INITIAL>":="                   { return 'DECLARE_ASSIGN'; }
<INITIAL>"+="                   { return 'PLUS_ASSIGN'; }
<INITIAL>"-="                   { return 'MINUS_ASSIGN'; }
<INITIAL>"*="                   { return 'TIMES_ASSIGN'; }
<INITIAL>"/="                   { return 'DIVIDE_ASSIGN'; }
<INITIAL>"=="                   { return 'EQ'; }
<INITIAL>"!="                   { return 'NEQ'; }
<INITIAL>"<="                   { return 'LEQ'; }
<INITIAL>">="                   { return 'GEQ'; }
<INITIAL>"&&"                   { return 'AND'; }
<INITIAL>"||"                   { return 'OR'; }
<INITIAL>"++"                   { return 'INC'; }
<INITIAL>"--"                   { return 'DEC'; }

/* operadores Char */
<INITIAL>"<"                    { return 'LT'; }
<INITIAL>">"                    { return 'GT'; }
<INITIAL>"="                    { return 'ASSIGN'; }
<INITIAL>"+"                    { return 'PLUS'; }
<INITIAL>"-"                    { return 'MINUS'; }
<INITIAL>"*"                    { return 'TIMES'; }
<INITIAL>"/"                    { return 'DIVIDE'; }
<INITIAL>"%"                    { return 'MOD'; }
<INITIAL>"!"                    { return 'NOT'; }

/* signos de puntuacion */
<INITIAL>"."                    { return 'DOT'; }
<INITIAL>","                    { return 'COMMA'; }
<INITIAL>";"                    { return 'SEMICOLON'; }
<INITIAL>":"                    { return 'COLON'; }
<INITIAL>"{"                    { return 'LBRACE'; }
<INITIAL>"}"                    { return 'RBRACE'; }
<INITIAL>"("                    { return 'LPAREN'; }
<INITIAL>")"                    { return 'RPAREN'; }
<INITIAL>"["                    { return 'LBRACKET'; }
<INITIAL>"]"                    { return 'RBRACKET'; }

/*EOF */
<INITIAL><<EOF>>                { return 'EOF'; }

/* ERROR LEXICO , caracter no reconocido */
<INITIAL>.                      {
    if (typeof yy !== 'undefined' && yy.errors) {
        yy.errors.push({
            type: 'Léxico',
            description: 'Carácter no reconocido: "' + yytext + '"',
            line: yylineno + 1,
            column: yylloc.first_column + 1
        });
    }
}

/lex

/*  operadores de precedencia */
%right ASSIGN PLUS_ASSIGN MINUS_ASSIGN TIMES_ASSIGN DIVIDE_ASSIGN
%left  OR
%left  AND
%left  EQ NEQ
%left  LT GT LEQ GEQ
%left  PLUS MINUS
%left  TIMES DIVIDE MOD
%right NOT UMINUS
%left  LBRACKET DOT LPAREN

%start program

%%

/* programa */

program
    : global_decl_list EOF
        { return { type: 'Program', declarations: $1, line: 1, column: 1 }; }
    ;

global_decl_list
    : global_decl_list global_decl
        { $$ = $1; $$.push($2); }
    | global_decl_list opt_semi
        { $$ = $1; }
    | /* empty */
        { $$ = []; }
    ;

global_decl
    : func_decl
    | struct_decl
    | var_decl_stmt
    ;

/* declaracion de metodos y funciones*/

func_decl
    : FUNC IDENTIFIER LPAREN param_list RPAREN return_type block
        {
            $$ = {
                type: 'FunctionDecl',
                name: $2,
                params: $4,
                returnType: $6,
                body: $7,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | FUNC IDENTIFIER LPAREN RPAREN return_type block
        {
            $$ = {
                type: 'FunctionDecl',
                name: $2,
                params: [],
                returnType: $5,
                body: $6,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

param_list
    : param_list COMMA param
        { $$ = $1; $$.push($3); }
    | param
        { $$ = [$1]; }
    ;

param
    : IDENTIFIER type_expr
        { $$ = { name: $1, paramType: $2, line: @1.first_line, column: @1.first_column }; }
    ;

return_type
    : type_expr
        { $$ = $1; }
    | /* empty */
        { $$ = null; }
    ;

/*tipo de expresiones*/

type_expr
    : INT_TYPE              { $$ = 'int'; }
    | FLOAT64_TYPE          { $$ = 'float64'; }
    | STRING_TYPE           { $$ = 'string'; }
    | BOOL_TYPE             { $$ = 'bool'; }
    | RUNE_TYPE             { $$ = 'rune'; }
    | IDENTIFIER            { $$ = $1; }
    | LBRACKET RBRACKET type_expr
        { $$ = '[]' + $3; }
    ;

/*declaracion de estructuras*/

struct_decl
    : STRUCT IDENTIFIER LBRACE struct_field_list RBRACE opt_semi
        {
            $$ = {
                type: 'StructDecl',
                name: $2,
                fields: $4,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

struct_field_list
    : struct_field_list struct_field
        { $$ = $1; $$.push($2); }
    | /* empty */
        { $$ = []; }
    ;

struct_field
    : type_expr IDENTIFIER opt_semi
        { $$ = { fieldType: $1, name: $2, line: @2.first_line, column: @2.first_column }; }
    ;

/* BLOCK */

block
    : LBRACE stmt_list RBRACE
        {
            $$ = {
                type: 'Block',
                statements: $2,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

stmt_list
    : stmt_list stmt
        { $$ = $1; if ($2 !== null && $2 !== undefined) $$.push($2); }
    | stmt_list opt_semi
        { $$ = $1; }
    | /* empty */
        { $$ = []; }
    ;

/* ==============================================================
   STATEMENTS
   ============================================================== */

stmt
    : var_decl_stmt
    | short_var_decl_stmt
    | typed_var_decl_stmt
    | assignment_stmt
    | inc_dec_stmt
    | expr_stmt
    | if_stmt
    | for_stmt
    | switch_stmt
    | return_stmt
    | break_stmt
    | continue_stmt
    | block
    ;

/* var x int   /   var x int = expr */
var_decl_stmt
    : VAR IDENTIFIER type_expr ASSIGN expr opt_semi
        {
            $$ = {
                type: 'VarDecl',
                name: $2,
                varType: $3,
                value: $5,
                isShort: false,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | VAR IDENTIFIER type_expr opt_semi
        {
            $$ = {
                type: 'VarDecl',
                name: $2,
                varType: $3,
                value: null,
                isShort: false,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

/* x := expr */
short_var_decl_stmt
    : IDENTIFIER DECLARE_ASSIGN expr opt_semi
        {
            $$ = {
                type: 'VarDecl',
                name: $1,
                varType: null,
                value: $3,
                isShort: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

/* Persona p = {...}   /   Persona p  (struct-typed var) */
typed_var_decl_stmt
    : IDENTIFIER IDENTIFIER ASSIGN expr opt_semi
        {
            $$ = {
                type: 'VarDecl',
                name: $2,
                varType: $1,
                value: $4,
                isShort: false,
                isTyped: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER IDENTIFIER opt_semi
        {
            $$ = {
                type: 'VarDecl',
                name: $2,
                varType: $1,
                value: null,
                isShort: false,
                isTyped: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

/* x = expr   /   x += expr   /   x -= expr
   a[i] = expr  /  a.b = expr                 */
assignment_stmt
    : lvalue ASSIGN expr opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: $1,
                operator: '=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | lvalue PLUS_ASSIGN expr opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: $1,
                operator: '+=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | lvalue MINUS_ASSIGN expr opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: $1,
                operator: '-=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | lvalue TIMES_ASSIGN expr opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: $1,
                operator: '*=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | lvalue DIVIDE_ASSIGN expr opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: $1,
                operator: '/=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

lvalue
    : IDENTIFIER
        { $$ = { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column }; }
    | IDENTIFIER LBRACKET expr RBRACKET
        {
            $$ = {
                type: 'SliceAccess',
                slice: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                index: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER LBRACKET expr RBRACKET LBRACKET expr RBRACKET
        {
            $$ = {
                type: 'SliceAccess2D',
                slice: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                row: $3,
                col: $6,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER DOT IDENTIFIER
        {
            $$ = {
                type: 'StructAccess',
                object: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                field: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

/* x++  /  x-- */
inc_dec_stmt
    : IDENTIFIER INC opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '++',
                value: null,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER DEC opt_semi
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '--',
                value: null,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

/* Only function calls are valid expression-statements */
expr_stmt
    : call_expr opt_semi
        { $$ = $1; }
    ;

/* if/else */

if_stmt
    : IF expr block else_clause
        {
            $$ = {
                type: 'IfStatement',
                condition: $2,
                thenBlock: $3,
                elseClause: $4,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

else_clause
    : ELSE if_stmt
        { $$ = $2; }
    | ELSE block
        { $$ = $2; }
    | /* empty */
        { $$ = null; }
    ;

/* ==============================================================
   FOR LOOP  (three forms)
   ============================================================== */

for_stmt
    /* while-like:   for condition { } */
    : FOR expr block
        {
            $$ = {
                type: 'ForStatement',
                form: 'while',
                condition: $2,
                init: null,
                post: null,
                indexVar: null,
                valueVar: null,
                iterable: null,
                body: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    /* classic:   for init; cond; post { } */
    | FOR for_init SEMICOLON expr SEMICOLON for_post block
        {
            $$ = {
                type: 'ForStatement',
                form: 'classic',
                init: $2,
                condition: $4,
                post: $6,
                indexVar: null,
                valueVar: null,
                iterable: null,
                body: $7,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    /* range:   for idx, val := range slice { } */
    | FOR IDENTIFIER COMMA IDENTIFIER DECLARE_ASSIGN RANGE expr block
        {
            $$ = {
                type: 'ForStatement',
                form: 'range',
                init: null,
                condition: null,
                post: null,
                indexVar: $2,
                valueVar: $4,
                iterable: $7,
                body: $8,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

for_init
    : IDENTIFIER DECLARE_ASSIGN expr
        {
            $$ = {
                type: 'VarDecl',
                name: $1,
                varType: null,
                value: $3,
                isShort: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER ASSIGN expr
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

for_post
    : IDENTIFIER INC
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '++',
                value: null,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER DEC
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '--',
                value: null,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER ASSIGN expr
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER PLUS_ASSIGN expr
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '+=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER MINUS_ASSIGN expr
        {
            $$ = {
                type: 'Assignment',
                target: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                operator: '-=',
                value: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | /* empty */
        { $$ = null; }
    ;

/* swicht/case */

switch_stmt
    : SWITCH expr LBRACE case_list RBRACE opt_semi
        {
            $$ = {
                type: 'SwitchStatement',
                expr: $2,
                cases: $4.cases,
                defaultCase: $4.defaultCase,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

case_list
    : case_list case_clause
        {
            if ($2.isDefault) {
                $$ = { cases: $1.cases, defaultCase: $2 };
            } else {
                $1.cases.push($2);
                $$ = { cases: $1.cases, defaultCase: $1.defaultCase };
            }
        }
    | /* empty */
        { $$ = { cases: [], defaultCase: null }; }
    ;

case_clause
    : CASE expr COLON stmt_list
        {
            $$ = {
                type: 'CaseClause',
                value: $2,
                statements: $4,
                isDefault: false,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | DEFAULT COLON stmt_list
        {
            $$ = {
                type: 'CaseClause',
                value: null,
                statements: $3,
                isDefault: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

/* estado de transferencias */

return_stmt
    : RETURN expr opt_semi
        { $$ = { type: 'ReturnStatement', value: $2, line: @1.first_line, column: @1.first_column }; }
    | RETURN opt_semi
        { $$ = { type: 'ReturnStatement', value: null, line: @1.first_line, column: @1.first_column }; }
    ;

break_stmt
    : BREAK opt_semi
        { $$ = { type: 'BreakStatement', line: @1.first_line, column: @1.first_column }; }
    ;

continue_stmt
    : CONTINUE opt_semi
        { $$ = { type: 'ContinueStatement', line: @1.first_line, column: @1.first_column }; }
    ;

/* expresiones */

expr
    /* Arithmetic */
    : expr PLUS expr
        { $$ = { type: 'BinaryExpr', operator: '+',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr MINUS expr
        { $$ = { type: 'BinaryExpr', operator: '-',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr TIMES expr
        { $$ = { type: 'BinaryExpr', operator: '*',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr DIVIDE expr
        { $$ = { type: 'BinaryExpr', operator: '/',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr MOD expr
        { $$ = { type: 'BinaryExpr', operator: '%',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    /* Comparison */
    | expr EQ expr
        { $$ = { type: 'BinaryExpr', operator: '==', left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr NEQ expr
        { $$ = { type: 'BinaryExpr', operator: '!=', left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr LT expr
        { $$ = { type: 'BinaryExpr', operator: '<',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr GT expr
        { $$ = { type: 'BinaryExpr', operator: '>',  left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr LEQ expr
        { $$ = { type: 'BinaryExpr', operator: '<=', left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr GEQ expr
        { $$ = { type: 'BinaryExpr', operator: '>=', left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    /* Logical */
    | expr AND expr
        { $$ = { type: 'BinaryExpr', operator: '&&', left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    | expr OR expr
        { $$ = { type: 'BinaryExpr', operator: '||', left: $1, right: $3, line: @1.first_line, column: @1.first_column }; }
    /* Unary */
    | NOT expr
        { $$ = { type: 'UnaryExpr', operator: '!', operand: $2, line: @1.first_line, column: @1.first_column }; }
    | MINUS expr %prec UMINUS
        { $$ = { type: 'UnaryExpr', operator: '-', operand: $2, line: @1.first_line, column: @1.first_column }; }
    /* Grouping */
    | LPAREN expr RPAREN
        { $$ = $2; }
    /* Primary */
    | primary_expr
    ;

primary_expr
    : literal
    | call_expr
    | slice_literal
    | struct_literal
    | struct_anon_literal
    /* Slice index access:   a[i]  or  a[i][j] */
    | IDENTIFIER LBRACKET expr RBRACKET
        {
            $$ = {
                type: 'SliceAccess',
                slice: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                index: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER LBRACKET expr RBRACKET LBRACKET expr RBRACKET
        {
            $$ = {
                type: 'SliceAccess2D',
                slice: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                row: $3,
                col: $6,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    /* Struct field access:   obj.field */
    | IDENTIFIER DOT IDENTIFIER
        {
            $$ = {
                type: 'StructAccess',
                object: { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column },
                field: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    /* Plain identifier */
    | IDENTIFIER
        { $$ = { type: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column }; }
    ;

/* ==============================================================
   FUNCTION CALLS
   fmt.Println(...)  /  f(...)  /  reflect.TypeOf(x).String()
   ============================================================== */

call_expr
    : IDENTIFIER LPAREN arg_list RPAREN
        {
            $$ = {
                type: 'FunctionCall',
                name: $1,
                object: null,
                args: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER LPAREN RPAREN
        {
            $$ = {
                type: 'FunctionCall',
                name: $1,
                object: null,
                args: [],
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER DOT IDENTIFIER LPAREN arg_list RPAREN
        {
            $$ = {
                type: 'FunctionCall',
                name: $3,
                object: $1,
                args: $5,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER DOT IDENTIFIER LPAREN RPAREN
        {
            $$ = {
                type: 'FunctionCall',
                name: $3,
                object: $1,
                args: [],
                line: @1.first_line,
                column: @1.first_column
            };
        }
    /* reflect.TypeOf(x).String() – chained dotted call */
    | IDENTIFIER DOT IDENTIFIER LPAREN arg_list RPAREN DOT IDENTIFIER LPAREN RPAREN
        {
            $$ = {
                type: 'FunctionCall',
                name: $3 + '.' + $8,
                object: $1,
                args: $5,
                chained: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | IDENTIFIER DOT IDENTIFIER LPAREN RPAREN DOT IDENTIFIER LPAREN RPAREN
        {
            $$ = {
                type: 'FunctionCall',
                name: $3 + '.' + $7,
                object: $1,
                args: [],
                chained: true,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

arg_list
    : arg_list COMMA expr
        { $$ = $1; $$.push($3); }
    | expr
        { $$ = [$1]; }
    ;

/* ==============================================================
   LITERALS
   ============================================================== */

literal
    : INT_LIT
        {
            $$ = {
                type: 'Literal',
                value: parseInt($1, 10),
                dataType: 'int',
                raw: $1,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | FLOAT_LIT
        {
            $$ = {
                type: 'Literal',
                value: parseFloat($1),
                dataType: 'float64',
                raw: $1,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | STRING_LIT
        {
            /* Remove surrounding quotes and process escape sequences */
            var raw = $1.slice(1, -1);
            var val = raw
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            $$ = {
                type: 'Literal',
                value: val,
                dataType: 'string',
                raw: $1,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | RUNE_LIT
        {
            var inner = $1.slice(1, -1);
            var runeVal;
            if (inner.length === 1) {
                runeVal = inner.charCodeAt(0);
            } else if (inner === '\\n') {
                runeVal = 10;
            } else if (inner === '\\t') {
                runeVal = 9;
            } else if (inner === '\\r') {
                runeVal = 13;
            } else if (inner === "\\'") {
                runeVal = 39;
            } else if (inner === '\\\\') {
                runeVal = 92;
            } else {
                runeVal = inner.charCodeAt(inner.length - 1);
            }
            $$ = {
                type: 'Literal',
                value: runeVal,
                dataType: 'rune',
                raw: $1,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | TRUE
        { $$ = { type: 'Literal', value: true,  dataType: 'bool', raw: 'true',  line: @1.first_line, column: @1.first_column }; }
    | FALSE
        { $$ = { type: 'Literal', value: false, dataType: 'bool', raw: 'false', line: @1.first_line, column: @1.first_column }; }
    | NIL
        { $$ = { type: 'Literal', value: null,  dataType: 'nil',  raw: 'nil',   line: @1.first_line, column: @1.first_column }; }
    ;

/* ==============================================================
   SLICE LITERALS   []int{1,2,3}  /  [][]int{{1,2},{3,4}}
   ============================================================== */

slice_literal
    : LBRACKET RBRACKET type_expr LBRACE expr_list RBRACE
        {
            $$ = {
                type: 'SliceLiteral',
                elementType: $3,
                elements: $5,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | LBRACKET RBRACKET type_expr LBRACE RBRACE
        {
            $$ = {
                type: 'SliceLiteral',
                elementType: $3,
                elements: [],
                line: @1.first_line,
                column: @1.first_column
            };
        }
    /* 2-D:  [][]int{ {1,2}, {3,4} } */
    | LBRACKET RBRACKET LBRACKET RBRACKET type_expr LBRACE matrix_row_list RBRACE
        {
            $$ = {
                type: 'SliceLiteral2D',
                elementType: $5,
                rows: $7,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    | LBRACKET RBRACKET LBRACKET RBRACKET type_expr LBRACE RBRACE
        {
            $$ = {
                type: 'SliceLiteral2D',
                elementType: $5,
                rows: [],
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

expr_list
    : expr_list COMMA expr
        { $$ = $1; $$.push($3); }
    | expr
        { $$ = [$1]; }
    ;

matrix_row_list
    : matrix_row_list COMMA matrix_row
        { $$ = $1; $$.push($3); }
    | matrix_row
        { $$ = [$1]; }
    ;

matrix_row
    : LBRACE expr_list RBRACE
        { $$ = $2; }
    | LBRACE RBRACE
        { $$ = []; }
    ;

/* ==============================================================
   STRUCT LITERALS
   Persona{Nombre: "Alice", Edad: 25}   (named)
   { Nombre: "Alice", Edad: 25 }        (anonymous – RHS only)
   ============================================================== */

struct_literal
    : IDENTIFIER LBRACE field_init_list RBRACE
        {
            $$ = {
                type: 'StructLiteral',
                structName: $1,
                fields: $3,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

struct_anon_literal
    : LBRACE field_init_list RBRACE
        {
            $$ = {
                type: 'StructLiteral',
                structName: null,
                fields: $2,
                line: @1.first_line,
                column: @1.first_column
            };
        }
    ;

field_init_list
    : field_init_list COMMA field_init
        { $$ = $1; $$.push($3); }
    | field_init
        { $$ = [$1]; }
    ;

field_init
    : IDENTIFIER COLON expr
        { $$ = { field: $1, value: $3, line: @1.first_line, column: @1.first_column }; }
    ;

/* punto y coma

opt_semi
    : SEMICOLON
    | /* empty */
    ;

%%




