// yantrabhashi-validator.js
// (Browser-ready version of your tokenizer + LL(1) parser with UI wiring)

// --- Config ---
const KEYWORDS = new Set(['PADAM','ANKHE','VARTTAI','ELAITHE','ALAITHE','MALLI-MALLI','CHATIMPU','CHEPPU']);
const SYMBOLS = ['==','!=','<=','>=','<','>','=','+','-','*','/','%','(',')','[',']',',',':',';'];

// --- tokenizer ---
function removeComments(src){
  const lines = src.split(/\r?\n/);
  return lines.map(line=>{
    let out=''; let inStr=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'){ out+=ch; inStr=!inStr; continue; }
      if(!inStr && ch==='#') break;
      out+=ch;
    }
    return out;
  }).join('\n');
}

function tokenize(src){
  const code = removeComments(src);
  const tokens = [];
  let line=1, col=1;
  function push(type,value,startLine,startCol){ tokens.push({type,value,line:startLine,col:startCol}); }

  const KW_LIST = Array.from(KEYWORDS).sort((a,b)=>b.length - a.length);

  for(let i=0;i<code.length;){
    const ch = code[i];
    if(ch==='\n'){ line++; col=1; i++; continue; }
    if(/\s/.test(ch)){ col++; i++; continue; }
    const startLine=line, startCol=col;

    // string literal
    if(ch==='"'){
      let j=i+1; let val='"'; let escaped=false;
      while(j<code.length){
        const c=code[j];
        val+=c;
        if(c==='"' && !escaped){ j++; break; }
        if(c==='\\' && !escaped){ escaped=true; } else { escaped=false; }
        j++;
      }
      push('STRING', val, startLine, startCol);
      const consumed = j - i; i = j; col += consumed; continue;
    }

    // number literal (ONLY starts with a digit now — '-' is always a SYMBOL)
    if(/[0-9]/.test(ch)){
      let j = i; let num = '';
      while(j < code.length && /[0-9]/.test(code[j])){ num += code[j]; j++; }
      push('NUMBER', num, startLine, startCol);
      col += (j - i); i = j; continue;
    }

    // keywords greedy match
    let kwMatched = false;
    for(const kw of KW_LIST){
      const slice = code.substr(i, kw.length);
      if(slice.toUpperCase() === kw){
        const nextCh = code[i + kw.length];
        if(!(/[A-Za-z0-9_]/.test(nextCh))){
          push('KEYWORD', kw, startLine, startCol);
          i += kw.length; col += kw.length; kwMatched = true; break;
        }
      }
    }
    if(kwMatched) continue;

    // symbols (multi-char first)
    let matchedSymbol = null;
    for(const s of SYMBOLS.slice().sort((a,b)=>b.length-a.length)){
      if(code.startsWith(s,i)) { matchedSymbol = s; break; }
    }
    if(matchedSymbol){ push('SYMBOL', matchedSymbol, startLine, startCol); i += matchedSymbol.length; col += matchedSymbol.length; continue; }

    // identifier
    if(/[A-Za-z]/.test(ch)){
      let j=i; let id='';
      while(j<code.length && /[A-Za-z0-9_]/.test(code[j])){ id+=code[j]; j++; }
      const up = id.toUpperCase();
      if(KEYWORDS.has(up)) push('KEYWORD', up, startLine, startCol);
      else push('IDENT', id, startLine, startCol);
      col += (j-i); i=j; continue;
    }

    // unknown single char
    push('SYMBOL', ch, startLine, startCol); i++; col++;
  }
  push('EOF','',line,col);
  return tokens;
}

// --- Parser constructor + helpers ---
function Parser(tokens){
  this.tokens = tokens; this.pos = 0; this.tok = tokens[0]; this.errors = []; this.symbols = [{}];
}
Parser.prototype.next = function(){ this.pos++; this.tok = this.tokens[this.pos]; };
Parser.prototype.expect = function(type, value){
  const t=this.tok;
  if(t.type!==type || (value && t.value!==value)){
    this.error(`Expected ${value||type} but found '${t.value||t.type}'`, t.line, t.col);
    return false;
  }
  this.next(); return true;
};
Parser.prototype.error = function(msg,line,col){ this.errors.push({msg,line,col}); };
Parser.prototype.declare = function(name, type){
  const current = this.symbols[this.symbols.length-1];
  if(current[name]) this.error(`Variable '${name}' already declared in this scope (line ${this.tok.line})`, this.tok.line, this.tok.col);
  current[name] = {type};
};
Parser.prototype.lookup = function(name){
  for(let i=this.symbols.length-1;i>=0;i--){ if(this.symbols[i][name]) return this.symbols[i][name]; }
  return null;
};

// program -> stmt*
Parser.prototype.parseProgram = function(){ while(this.tok.type!=='EOF'){ this.parseStmt(); } };

// stmt dispatcher
Parser.prototype.parseStmt = function(){
  if(this.tok.type==='KEYWORD' && this.tok.value==='PADAM'){ this.parsePadam(); return; }
  if(this.tok.type==='KEYWORD' && this.tok.value==='CHATIMPU'){ this.parseChat(); return; }
  if(this.tok.type==='KEYWORD' && this.tok.value==='CHEPPU'){ this.parseCheppu(); return; }
  if(this.tok.type==='KEYWORD' && this.tok.value==='ELAITHE'){ this.parseIf(); return; }
  if(this.tok.type==='KEYWORD' && this.tok.value==='MALLI-MALLI'){ this.parseLoop(); return; }
  if(this.tok.type==='IDENT') { this.parseAssignment(); return; }
  // consume to avoid infinite loop
  this.error(`Unexpected token '${this.tok.value}'`, this.tok.line, this.tok.col); this.next();
};

// PADAM (declaration)
Parser.prototype.parsePadam = function(){
  this.expect('KEYWORD','PADAM');

  if(this.tok.type!=='IDENT'){ this.error('Expected identifier after PADAM', this.tok.line, this.tok.col); return; }
  const name = this.tok.value; const ln=this.tok.line, lc=this.tok.col;
  this.next();

  this.expect('SYMBOL',':');

  if(!(this.tok.type==='KEYWORD' && (this.tok.value==='ANKHE' || this.tok.value==='VARTTAI'))){
    this.error('Expected type ANKHE or VARTTAI', this.tok.line, this.tok.col);
  }
  const ty = this.tok.value;
  this.next();

  let initValueType = null;
  if(this.tok.type==='SYMBOL' && this.tok.value==='='){
    this.next();
    if(this.tok.type==='STRING'){
      initValueType = 'STRING';
      this.next();
    } else {
      this.parseExpr();
      initValueType = 'NUMBER';
    }
  }
  if(!this.expect('SYMBOL',';')) return;

  if(initValueType === 'STRING' && ty === 'ANKHE'){
    this.error(`Type mismatch: initializer is a string but '${name}' is declared ANKHE`, ln, lc);
  }
  if(initValueType === 'NUMBER' && ty === 'VARTTAI'){
    this.error(`Type mismatch: initializer is numeric but '${name}' is declared VARTTAI`, ln, lc);
  }

  if(ty === 'ANKHE' || ty === 'VARTTAI'){
    this.declare(name, ty);
  }
};

// assignment
Parser.prototype.parseAssignment = function(){
  const name = this.tok.value; const ln=this.tok.line, lc=this.tok.col; this.next();
  if(!this.expect('SYMBOL','=')) return;

  let assignedValueType = null;
  if(this.tok.type === 'STRING'){
    assignedValueType = 'STRING';
    this.next();
  } else {
    this.parseExpr();
    assignedValueType = 'NUMBER';
  }

  if(!this.expect('SYMBOL',';')) return;
  const sym = this.lookup(name);
  if(!sym) this.error(`Assignment to undeclared variable '${name}'`, ln, lc);
  else {
    if(assignedValueType === 'STRING' && sym.type !== 'VARTTAI'){
      this.error(`Assignment of string to non-string variable '${name}'`, ln, lc);
    } else if(assignedValueType === 'NUMBER' && sym.type !== 'ANKHE'){
      this.error(`Assignment of numeric value to non-integer variable '${name}'`, ln, lc);
    }
  }
};

// CHATIMPU (print)
Parser.prototype.parseChat = function(){
  this.expect('KEYWORD','CHATIMPU');
  this.expect('SYMBOL','(');

  const parseOneArg = () => {
    if(this.tok.type === 'STRING'){
      const after = this.tokens[this.pos + 1];
      if(after && after.type === 'SYMBOL' && ['+','-','*','/','%'].includes(after.value)){
        this.error('BINARY OPERATIONS WITH STRINGS NOT SUPPORTED IN CHATIMPU', this.tok.line, this.tok.col);
        while(!(this.tok.type === 'SYMBOL' && (this.tok.value === ',' || this.tok.value === ')'))){
          if(this.tok.type === 'EOF') break;
          this.next();
        }
        return;
      }
      this.next();
      return;
    }

    if(this.tok.type === 'NUMBER'){
      this.parseExpr();
      return;
    }

    if(this.tok.type === 'IDENT'){
      const name = this.tok.value;
      const def = this.lookup(name);
      if(!def){
        this.error(`Use of undeclared identifier '${name}' in CHATIMPU`, this.tok.line, this.tok.col);
        while(!(this.tok.type === 'SYMBOL' && (this.tok.value === ',' || this.tok.value === ')'))){
          if(this.tok.type === 'EOF') break;
          this.next();
        }
        return;
      }

      if(def.type === 'VARTTAI'){
        this.next();
        return;
      } else {
        this.parseExpr();
        return;
      }
    }

    this.error('CHATIMPU expects string literal, identifier, or numeric expression as each argument', this.tok.line, this.tok.col);
    while(!(this.tok.type === 'SYMBOL' && (this.tok.value === ',' || this.tok.value === ')'))){
      if(this.tok.type === 'EOF') break;
      this.next();
    }
  };

  if(this.tok.type === 'SYMBOL' && this.tok.value === ')'){
    this.error('CHATIMPU requires at least one argument', this.tok.line, this.tok.col);
    this.next(); this.expect('SYMBOL',';');
    return;
  }

  parseOneArg();
  while(this.tok.type === 'SYMBOL' && this.tok.value === ','){
    this.next();
    if(this.tok.type === 'SYMBOL' && this.tok.value === ')'){
      this.error('Trailing comma in CHATIMPU argument list', this.tok.line, this.tok.col);
      break;
    }
    parseOneArg();
  }

  this.expect('SYMBOL',')');
  this.expect('SYMBOL',';');
};

// CHEPPU (input)
Parser.prototype.parseCheppu = function(){
  this.expect('KEYWORD','CHEPPU');
  this.expect('SYMBOL','(');

  if(this.tok.type === 'STRING'){
    this.next();
    if(this.tok.type === 'SYMBOL' && this.tok.value === ',') this.next();
    else this.error('CHEPPU with a prompt must be followed by , and an identifier target', this.tok.line, this.tok.col);
  }

  if(this.tok.type === 'IDENT'){
    const name = this.tok.value;
    const def = this.lookup(name);
    if(!def){
      this.error(`Input into undeclared variable '${name}'`, this.tok.line, this.tok.col);
    }
    this.next();
  } else {
    this.error('CHEPPU expects an identifier (a declared variable) as the input target', this.tok.line, this.tok.col);
    while(this.tok.type !== 'SYMBOL' || this.tok.value !== ')'){
      if(this.tok.type === 'EOF') break;
      this.next();
    }
    this.expect('SYMBOL',')');
    this.expect('SYMBOL',';');
    return;
  }

  this.expect('SYMBOL',')');
  this.expect('SYMBOL',';');
};

// IF
Parser.prototype.parseIf = function(){
  this.expect('KEYWORD','ELAITHE'); this.expect('SYMBOL','(');
  this.parseCondition(); this.expect('SYMBOL',')');
  this.expect('SYMBOL','[');
  this.symbols.push({});
  while(!(this.tok.type==='SYMBOL' && (this.tok.value===']')) && this.tok.type!=='EOF'){ this.parseStmt(); }
  this.expect('SYMBOL',']');
  if(this.tok.type==='KEYWORD' && this.tok.value==='ALAITHE'){
    this.expect('KEYWORD','ALAITHE'); this.expect('SYMBOL','[');
    while(!(this.tok.type==='SYMBOL' && this.tok.value===']') && this.tok.type!=='EOF'){ this.parseStmt(); }
    this.expect('SYMBOL',']');
  }
  this.symbols.pop();
};

// LOOP (loop-local scope before header so header declarations are local)
Parser.prototype.parseLoop = function(){
  this.expect('KEYWORD','MALLI-MALLI');
  this.expect('SYMBOL','(');

  this.symbols.push({});

  if(this.tok.type==='KEYWORD' && this.tok.value==='PADAM'){
    this.parsePadamInLoop();
  } else {
    this.error('Loop init must be PADAM declaration', this.tok.line, this.tok.col);
  }

  this.expect('SYMBOL',';');
  this.parseCondition();
  this.expect('SYMBOL',';');

  if(this.tok.type==='IDENT'){
    this.next();
    if(!this.expect('SYMBOL','=')) return;
    this.parseExpr();
  } else {
    this.error('Malformed loop step', this.tok.line, this.tok.col);
  }

  this.expect('SYMBOL',')');
  this.expect('SYMBOL','[');

  while(!(this.tok.type==='SYMBOL' && this.tok.value===']') && this.tok.type!=='EOF'){ this.parseStmt(); }
  this.expect('SYMBOL',']');

  this.symbols.pop();
};

Parser.prototype.parsePadamInLoop = function(){
  this.expect('KEYWORD','PADAM');
  if(this.tok.type!=='IDENT'){ this.error('Expected identifier in loop init PADAM', this.tok.line, this.tok.col); return; }
  const name=this.tok.value; this.next();
  this.expect('SYMBOL',':');
  if(!(this.tok.type==='KEYWORD' && (this.tok.value==='ANKHE' || this.tok.value==='VARTTAI'))){
    this.error('Expected type in loop init', this.tok.line, this.tok.col);
  }
  const ty=this.tok.value;
  this.next();
  let initValueType = null;
  if(this.tok.type==='SYMBOL' && this.tok.value==='='){ this.next();
    if(this.tok.type === 'STRING'){ initValueType='STRING'; this.next(); }
    else { this.parseExpr(); initValueType='NUMBER'; }
  }

  if(initValueType === 'STRING' && ty === 'ANKHE'){
    this.error(`Type mismatch: initializer is a string but '${name}' is declared ANKHE`, this.tok.line, this.tok.col);
  }
  if(initValueType === 'NUMBER' && ty === 'VARTTAI'){
    this.error(`Type mismatch: initializer is numeric but '${name}' is declared VARTTAI`, this.tok.line, this.tok.col);
  }

  if(ty === 'ANKHE' || ty === 'VARTTAI'){
    this.declare(name, ty);
  }
};

// Condition parsing (supports strings & numbers; relational ops only for numbers)
Parser.prototype.parseCondition = function(){
  const left = this.parseOperand();
  if(!left) return;

  if(!(this.tok.type==='SYMBOL' && ['==','!=','<=','>=','<','>'].includes(this.tok.value))){
    this.error('Expected comparison operator in condition', this.tok.line, this.tok.col);
    return;
  }
  const op = this.tok.value;
  this.next();

  const right = this.parseOperand();
  if(!right) return;

  if(left.type === 'IDENT'){
    const def = this.lookup(left.value);
    if(!def){
      this.error(`Use of undeclared identifier '${left.value}' in condition`, left.line, left.col);
      return;
    }
  }
  if(right.type === 'IDENT'){
    const def = this.lookup(right.value);
    if(!def){
      this.error(`Use of undeclared identifier '${right.value}' in condition`, right.line, right.col);
      return;
    }
  }

  const kindLeft = (left.type === 'NUMBER') ? 'NUMBER'
                 : (left.type === 'STRING') ? 'STRING'
                 : (() => {
                     const d = this.lookup(left.value);
                     if(!d) return 'UNKNOWN';
                     return (d.type === 'ANKHE') ? 'NUMBER' : (d.type === 'VARTTAI') ? 'STRING' : 'UNKNOWN';
                   })();

  const kindRight = (right.type === 'NUMBER') ? 'NUMBER'
                  : (right.type === 'STRING') ? 'STRING'
                  : (() => {
                      const d = this.lookup(right.value);
                      if(!d) return 'UNKNOWN';
                      return (d.type === 'ANKHE') ? 'NUMBER' : (d.type === 'VARTTAI') ? 'STRING' : 'UNKNOWN';
                    })();

  if(op === '==' || op === '!='){
    if((kindLeft === 'NUMBER' && kindRight === 'NUMBER') || (kindLeft === 'STRING' && kindRight === 'STRING')){
      // OK
    } else {
      this.error('Type mismatch in equality comparison (both sides must be same type)', this.tok.line, this.tok.col);
    }
  } else {
    const isLeftNumeric = (kindLeft === 'NUMBER');
    const isRightNumeric = (kindRight === 'NUMBER');
    if(!isLeftNumeric){
      this.error(`Non-integer '${left.type === 'IDENT' ? left.value : ''}' in integer condition`, left.line, left.col);
    }
    if(!isRightNumeric){
      this.error(`Non-integer '${right.type === 'IDENT' ? right.value : ''}' in integer condition`, right.line, right.col);
    }
  }
};

Parser.prototype.parseOperand = function(){
  if(this.tok.type === 'NUMBER'){
    const t = this.tok; this.next();
    return { type: 'NUMBER', value: t.value, line: t.line, col: t.col };
  }
  if(this.tok.type === 'STRING'){
    const t = this.tok; this.next();
    return { type: 'STRING', value: t.value, line: t.line, col: t.col };
  }
  if(this.tok.type === 'IDENT'){
    const t = this.tok; this.next();
    return { type: 'IDENT', value: t.value, line: t.line, col: t.col };
  }
  this.error('Expected number, string, or identifier in condition', this.tok.line, this.tok.col);
  return null;
};

Parser.prototype.parseExpr = function(){
  this.parseTerm();
  while(this.tok.type==='SYMBOL' && (this.tok.value==='+' || this.tok.value==='-' || this.tok.value==='*' || this.tok.value==='/' || this.tok.value==='%')){
    this.next(); this.parseTerm();
  }
};

Parser.prototype.parseTerm = function(){
  if(this.tok.type === 'SYMBOL' && this.tok.value === '-'){
    this.next();
    if(this.tok.type === 'NUMBER'){ this.next(); return; }
    if(this.tok.type === 'IDENT'){
      const name = this.tok.value;
      const line = this.tok.line, col = this.tok.col;
      const def = this.lookup(name);
      if(!def) this.error(`Use of undeclared identifier '${name}'`, line, col);
      else if(def.type !== 'ANKHE') this.error(`Non-integer identifier '${name}' used in numeric expression`, line, col);
      this.next(); return;
    }
    if(this.tok.type === 'SYMBOL' && this.tok.value === '('){
      this.next();
      this.parseExpr();
      this.expect('SYMBOL',')');
      return;
    }
    this.error('Expected number, identifier, or parenthesized expression after unary -', this.tok.line, this.tok.col);
    return;
  }

  if(this.tok.type === 'NUMBER'){ this.next(); return; }

  if(this.tok.type === 'IDENT'){
    const name = this.tok.value;
    const line = this.tok.line, col = this.tok.col;
    const def = this.lookup(name);
    if(!def) this.error(`Use of undeclared identifier '${name}'`, line, col);
    else if(def.type !== 'ANKHE') this.error(`Non-integer identifier '${name}' used in numeric expression`, line, col);
    this.next(); return;
  }

  if(this.tok.type === 'SYMBOL' && this.tok.value === '('){
    this.next();
    this.parseExpr();
    this.expect('SYMBOL',')');
    return;
  }

  this.error('Expected number or identifier in expression', this.tok.line, this.tok.col);
};

// --- Runner (global function) ---
function runValidation(src){
  const tokens = tokenize(src);
  const p = new Parser(tokens);
  p.parseProgram();
  return { tokens, errors: p.errors };
}

// --- UI wiring (attach to index.html) ---
(function attachUI(){
  function whenReady(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else fn();
  }

  whenReady(()=>{
    const out = document.getElementById('output');
    const validateBtn = document.getElementById('validateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadBtn = document.getElementById('loadBtn');
    const sourceEl = document.getElementById('source');

    if(!out || !validateBtn || !clearBtn || !loadBtn || !sourceEl){
      console.error('Yantrabhashi: missing DOM elements (check IDs).');
      return;
    }

    validateBtn.addEventListener('click', ()=>{
      out.innerHTML='';
      const src = sourceEl.value;
      const res = runValidation(src);
      if(res.errors.length===0){
        const el=document.createElement('div'); el.className='ok'; el.innerHTML='<pre>No syntax/semantic errors found.</pre>'; out.appendChild(el);
      } else {
        res.errors.forEach(e=>{
          const el=document.createElement('div'); el.className='error';
          const pre=document.createElement('pre');
          pre.textContent = `Line ${e.line}, Col ${e.col}: ${e.msg}`;
          el.appendChild(pre); out.appendChild(el);
        });
      }
      const tbox=document.createElement('div'); tbox.className='small';
      const pre=document.createElement('pre');
      pre.textContent = res.tokens.map(t=>`${t.line}:${t.col} ${t.type}(${t.value})`).join('\n');
      tbox.appendChild(pre); out.appendChild(tbox);
    });

    clearBtn.addEventListener('click', ()=>{ sourceEl.value=''; out.innerHTML=''; });
    loadBtn.addEventListener('click', ()=>{ sourceEl.value='PADAM a:ANKHE = 1;\nCHATIMPU(a);'; });

    document.querySelectorAll('.examples .example-btn').forEach(b=>b.addEventListener('click', e=>{
      const s=e.currentTarget.dataset.snippet;
      if(s==='undecl') sourceEl.value='a = b + 1;';
      if(s==='badloop') sourceEl.value='MALLI-MALLI (PADAM i:ANKHE = 0; i < 10; i = i) [\n]';
      if(s==='nobr') sourceEl.value='CHATIMPU("Hello [user]");';
    }));
  });
})();

