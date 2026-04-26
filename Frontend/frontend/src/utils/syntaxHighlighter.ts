
// Lightweight GoScript syntax highlighter.
// Takes a source string, returns an HTML string with <span class="..."> tags.
// Designed for the overlay technique (transparent textarea on top of this div).

// ── Token categories ─────────────────────────────────────────────────────────
type TokenKind =
  | 'keyword'
  | 'type'
  | 'builtin'
  | 'literal-number'
  | 'literal-string'
  | 'literal-bool'
  | 'literal-rune'
  | 'comment'
  | 'operator'
  | 'punctuation'
  | 'function-name'
  | 'package'
  | 'plain';

interface Token {
  kind: TokenKind;
  text: string;
}

// ── Token colour map (CSS variable names from our theme) ─────────────────────
const COLORS: Record<TokenKind, string> = {
  'keyword':       '#ff7b72',   // red  – func, var, if, for, …
  'type':          '#79c0ff',   // blue – int, float64, string, bool, rune
  'builtin':       '#d2a8ff',   // purple – fmt, append, len, …
  'literal-number':'#79c0ff',   // blue
  'literal-string':'#a5d6ff',   // light-blue
  'literal-bool':  '#ff7b72',   // red
  'literal-rune':  '#a5d6ff',   // light-blue
  'comment':       '#8b949e',   // grey
  'operator':      '#ff7b72',   // red
  'punctuation':   '#e6edf3',   // white-ish
  'function-name': '#d2a8ff',   // purple
  'package':       '#ffa657',   // orange  – fmt, strconv, …
  'plain':         '#e6edf3',   // default
};

// ── Token definitions (ordered: longer / more specific first) ────────────────
const KEYWORDS = new Set([
  'func','var','if','else','for','switch','case','default',
  'return','break','continue','struct','range','nil',
]);
const TYPES = new Set([
  'int','float64','string','bool','rune',
]);
const BUILTINS = new Set([
  'append','len','make','new','cap','delete','copy','close','panic','recover',
]);
const PACKAGES = new Set([
  'fmt','strconv','reflect','slices','strings','math','os','bufio',
]);
const BOOLEANS = new Set(['true','false']);

/**
 * Tokenise a single line of GoScript source into Token[].
 */
function tokeniseLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    // ── Line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ kind: 'comment', text: line.slice(i) });
      break;
    }

    // ── String literal  "..."
    if (line[i] === '"') {
      let j = i + 1;
      while (j < n) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === '"')  { j++;    break; }
        j++;
      }
      tokens.push({ kind: 'literal-string', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // ── Rune literal  '.'
    if (line[i] === "'") {
      let j = i + 1;
      if (line[j] === '\\') j += 2; else j++;
      if (j < n && line[j] === "'") j++;
      tokens.push({ kind: 'literal-rune', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // ── Number literal  (integer or float)
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < n && /[0-9]/.test(line[j])) j++;
      if (j < n && line[j] === '.' && /[0-9]/.test(line[j + 1] ?? '')) {
        j++;
        while (j < n && /[0-9]/.test(line[j])) j++;
      }
      tokens.push({ kind: 'literal-number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // ── Identifier / keyword / type / builtin
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);

      // Check for package.Func pattern
      if (j < n && line[j] === '.' && PACKAGES.has(word)) {
        // consume ".FunctionName"
        let k = j + 1;
        while (k < n && /[a-zA-Z0-9_]/.test(line[k])) k++;
        tokens.push({ kind: 'package',       text: word });
        tokens.push({ kind: 'punctuation',   text: '.' });
        tokens.push({ kind: 'function-name', text: line.slice(j + 1, k) });
        i = k;
        continue;
      }

      let kind: TokenKind;
      if (KEYWORDS.has(word))      kind = 'keyword';
      else if (TYPES.has(word))    kind = 'type';
      else if (BOOLEANS.has(word)) kind = 'literal-bool';
      else if (BUILTINS.has(word)) kind = 'builtin';
      else {
        // Peek ahead: if followed by '(' it's a function call
        let k = j;
        while (k < n && line[k] === ' ') k++;
        kind = line[k] === '(' ? 'function-name' : 'plain';
      }

      tokens.push({ kind, text: word });
      i = j;
      continue;
    }

    // ── Two-char operators
    const two = line.slice(i, i + 2);
    if ([':=','+=','-=','*=','/=','==','!=','<=','>=','&&','||','++','--'].includes(two)) {
      tokens.push({ kind: 'operator', text: two });
      i += 2;
      continue;
    }

    // ── Single-char operators / punctuation
    const ch = line[i];
    if ('+-*/%=<>!'.includes(ch)) {
      tokens.push({ kind: 'operator',    text: ch });
    } else if ('{}()[].,;:'.includes(ch)) {
      tokens.push({ kind: 'punctuation', text: ch });
    } else if (ch === ' ' || ch === '\t') {
      tokens.push({ kind: 'plain', text: ch });
    } else {
      tokens.push({ kind: 'plain', text: ch });
    }
    i++;
  }

  return tokens;
}

// ── HTML escape ───────────────────────────────────────────────────────────────
function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Highlight a full GoScript source string.
 * Returns an HTML string suitable for setting as `innerHTML` of the overlay div.
 *
 * Block comments are handled as a stateful scan across lines.
 */
export function highlight(source: string): string {
  const rawLines = source.split('\n');
  const htmlLines: string[] = [];
  let inBlockComment = false;

  for (const rawLine of rawLines) {
    if (inBlockComment) {
      // Check if block comment ends on this line
      const endIdx = rawLine.indexOf('*/');
      if (endIdx !== -1) {
        const commentPart = rawLine.slice(0, endIdx + 2);
        const rest        = rawLine.slice(endIdx + 2);
        inBlockComment = false;
        htmlLines.push(
          `<span style="color:${COLORS.comment}">${escape(commentPart)}</span>` +
          renderLine(rest)
        );
      } else {
        htmlLines.push(`<span style="color:${COLORS.comment}">${escape(rawLine)}</span>`);
      }
      continue;
    }

    // Check if a block comment starts on this line
    const bcStart = rawLine.indexOf('/*');
    if (bcStart !== -1) {
      const before  = rawLine.slice(0, bcStart);
      const after   = rawLine.slice(bcStart);
      const bcEnd   = after.indexOf('*/');
      if (bcEnd !== -1) {
        // Block comment opens and closes on same line
        const comment = after.slice(0, bcEnd + 2);
        const rest    = after.slice(bcEnd + 2);
        htmlLines.push(
          renderLine(before) +
          `<span style="color:${COLORS.comment}">${escape(comment)}</span>` +
          renderLine(rest)
        );
      } else {
        inBlockComment = true;
        htmlLines.push(
          renderLine(before) +
          `<span style="color:${COLORS.comment}">${escape(after)}</span>`
        );
      }
      continue;
    }

    htmlLines.push(renderLine(rawLine));
  }

  // Always end with a trailing newline so the textarea and overlay stay aligned
  return htmlLines.join('\n') + '\n';
}

function renderLine(line: string): string {
  if (line === '') return '';
  const tokens = tokeniseLine(line);
  return tokens
    .map(t => {
      const color = COLORS[t.kind];
      if (t.kind === 'plain' && (t.text === ' ' || t.text === '\t')) {
        return escape(t.text);
      }
      return `<span style="color:${color}">${escape(t.text)}</span>`;
    })
    .join('');
}
