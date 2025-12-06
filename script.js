/*
  Basic calculator logic:
   - Keeps `expr` as the user-visible expression (uses × and ÷ for nicer UI).
   - Converts to JS-friendly expression by replacing × -> * and ÷ -> /.
   - Uses a safe-ish evaluator: builds a Function after sanitizing allowed characters.
   - Provides real-time evaluation (preview) and full evaluation on '=' or Enter.
   - Handles keyboard input, clear (Esc), backspace, parentheses toggling.
*/


(function(){
  const exprEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const pad = document.getElementById('pad');

  let expr = '';      // current expression string shown on screen
  let parenToggle = 0;

  const setExpr = (s) => {
    expr = s;
    exprEl.textContent = expr || '0';
    updateResult(); // live preview
  };

  function append(token){
    // prevent invalid repeating operators like ++ or starting with an operator (except '-')
    const last = expr.slice(-1);
    const ops = ['+','−','×','÷','*','/','+'];
    if (token === '.' ) {
      // avoid multiple decimals in the current number segment
      const segments = expr.split(/[\+\-×÷*/]/);
      const cur = segments[segments.length-1];
      if (cur.includes('.')) return;
    }
    if (['+','−','×','÷'].includes(token)) {
      if (!expr && token !== '-') return; // disallow leading + × ÷ except minus for negative
      if (['+','−','×','÷'].includes(last)) {
        // replace last operator with new one
        expr = expr.slice(0,-1);
      }
    }
    expr += token;
    setExpr(expr);
  }

  function clearAll(){
    expr = '';
    resultEl.textContent = '';
    setExpr(expr);
  }

  function backspace(){
    expr = expr.slice(0, -1);
    setExpr(expr);
  }

  function toggleParen(){
    // Insert '(' or ')' depending on current parentheses balance
    const opens = (expr.match(/\(/g) || []).length;
    const closes = (expr.match(/\)/g) || []).length;
    if (opens === closes) {
      append('(');
    } else {
      append(')');
    }
  }

  function toJSEvalString(s){
    // Map UI characters to JS
    return s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  }

  function safeEvaluate(s) {
    // Allow only digits, operators, decimal, parentheses and whitespace
    // This rejects letters and other dangerous chars.
    const allowed = /^[0-9+\-*/().\s]+$/;
    if (!allowed.test(s)) throw new Error('Invalid characters in expression');

    // Prevent consecutive operators that JS might accept but user shouldn't (e.g. "**", "/*")
    if (/[+\-*/]{2,}/.test(s.replace(/\s+/g,''))) {
      // allow e.g. negative like 5*-2 is ok but we sanitized earlier; keep simple and try evaluate then catch
    }

    // Use Function constructor to evaluate arithmetic only:
    // Use parentheses to enforce precedence.
    // Wrap in try/catch at caller.
    return Function('"use strict"; return (' + s + ')')();
  }

  function updateResult(){
    const jsExpr = toJSEvalString(expr);
    if (!jsExpr) { resultEl.textContent = ''; return; }
    try {
      const val = safeEvaluate(jsExpr);
      if (Number.isFinite(val)) {
        resultEl.textContent = String(val);
      } else {
        resultEl.textContent = 'Error';
      }
    } catch (e) {
      resultEl.textContent = ''; // don't spam error while typing partial expressions
    }
  }

  function doEquals(){
    const jsExpr = toJSEvalString(expr);
    try {
      const val = safeEvaluate(jsExpr);
      if (!Number.isFinite(val)) {
        resultEl.textContent = 'Error';
        return;
      }
      // Set expr to the result (so you can continue calculating)
      expr = String(val);
      setExpr(expr);
      // keep result shown
      resultEl.textContent = '';
    } catch (e) {
      resultEl.textContent = 'Error';
    }
  }

  // Click/touch handlers
  pad.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const v = btn.dataset.value;
    const action = btn.dataset.action;
    if (action === 'clear') { clearAll(); return; }
    if (action === 'back') { backspace(); return; }
    if (action === 'paren') { toggleParen(); return; }
    if (action === 'equals') { doEquals(); return; }
    if (v !== undefined) {
      append(v);
    }
  });

  // Keyboard support
  window.addEventListener('keydown', (ev) => {
    // map keys to tokens
    const key = ev.key;

    if ((/^[0-9]$/).test(key)) {
      append(key);
      ev.preventDefault();
      return;
    }

    if (key === '.' ) { append('.'); ev.preventDefault(); return; }
    if (key === '+' ) { append('+'); ev.preventDefault(); return; }
    if (key === '-' ) { append('−'); ev.preventDefault(); return; } // show minus sign visually
    if (key === '*' ) { append('×'); ev.preventDefault(); return; }
    if (key === '/' ) { append('÷'); ev.preventDefault(); return; }

    if (key === 'Enter' || key === '=') { doEquals(); ev.preventDefault(); return; }
    if (key === 'Backspace') { backspace(); ev.preventDefault(); return; }
    if (key === 'Delete' || key === 'Escape') { clearAll(); ev.preventDefault(); return; }
    if (key === '(' || key === ')') { append(key); ev.preventDefault(); return; }
    // allow space to be ignored
  });

  // initialize
  setExpr('');
  // Provide focus styling on first click for accessibility
  document.querySelector('.calculator').addEventListener('click', () => {
    // nothing needed, but keep responsive to pointer
  });

})();