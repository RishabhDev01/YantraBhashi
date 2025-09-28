  import React, { useState } from 'react'
  import { runValidation } from '../utils/validator.js'
  import Examples from './Examples.jsx'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api.js'
import { clearAuth } from '../store/authSlice.js'
import { deleteCookie, getCookie } from '../utils/cookies.js'
import { useAppDispatch } from '../store/hooks.js'
import { jwtDecode } from 'jwt-decode'

  const DEFAULT_SRC = `# Hello world example
PADAM message:VARTTAI = "Hello World";
CHATIMPU(message);

# Sum example
PADAM a:ANKHE;
PADAM b:ANKHE;
PADAM sum:ANKHE = 0;
CHEPPU(a);
CHEPPU(b);
sum = a + b;
CHATIMPU("The Sum is:");
CHATIMPU(sum);

# Conditional (else inline)
PADAM username:VARTTAI;
CHEPPU(username);
ELAITHE (username == "Anirudh") [
  CHATIMPU("Welcome Anirudh!");
] ALAITHE [
  CHATIMPU("Access Denied!");
]

# Loop
PADAM sum2:ANKHE = 0;
MALLI-MALLI (PADAM i:ANKHE = 1; i <= 5; i = i + 1) [
  sum2 = sum2 + i;
]
CHATIMPU(sum2);`

  export default function Validation(){
    const [source, setSource] = useState(DEFAULT_SRC)
    const [result, setResult] = useState({ tokens: [], errors: [] })

    const userJson = getCookie('token');
        const decoded = jwtDecode(userJson);
        console.log(decoded)

    const dispatch = useAppDispatch();

    const navigate = useNavigate();

    const clear = () => { setSource(''); setResult({ tokens: [], errors: [] }) }
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      const validate = async () => {
          // Local LL(1) validation
          const res = runValidation(source);
          console.log("logging res")
          console.log(res)
          setResult(res);

          // Server validation + save
          try {
              const resp = await fetch(`${apiBase}/api/validate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ source, result: res, username: decoded.username  })
              });
              const data = await resp.json();
              console.info(`Saved submission: ${data.id} | ok=${data.ok} | errors=${data.errorCount}`);
          } catch (err) {
              console.error('Server error:', err);
          }
      };


      const loadMinimal = () => { setSource('PADAM a:ANKHE = 1;\nCHATIMPU(a);') }

    const onPickExample = (key) => {
      if(key==='undecl') setSource('a = b + 1;')
      if(key==='badloop') setSource('MALLI-MALLI (PADAM i:ANKHE = 0; i < 10; i = i) [\n]')
      if(key==='nobr') setSource('CHATIMPU("Hello [user]");')
    }

    const goToSubmission = () => {
      navigate('/submissions');
    }

    const handleLogout = async () => {
        try {
          await authAPI.logout();
    
          // Clear cookies on the frontend
          deleteCookie('token');
    
          dispatch(clearAuth());

        } catch (err) {
          // Even if logout fails on server, clear local state and cookies
          deleteCookie('token');
          dispatch(clearAuth());
        }
      };

    return (
      <div className="card">
        <h2>Yantrabhashi Validator — React + LL(1)</h2>
        <button onClick={goToSubmission}>View Submission</button>
        <button onClick={handleLogout}>Logout</button>
        <div className="small">
          Tokenizes the source and uses a predictive LL(1) recursive-descent parser to enforce grammar rules.
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <textarea value={source} onChange={e=>setSource(e.target.value)} aria-label="Source code input" />
            <div className="toolbar">
              <button onClick={validate}>Validate (LL(1)) & Save</button>
              <button className="example-btn" onClick={clear}>Clear</button>
              <button className="example-btn" onClick={loadMinimal}>Load Minimal</button>
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              Grammar: PADAM decls, ELAITHE/ALAITHE, MALLI-MALLI loops, CHATIMPU/CHEPPU, integer-only arithmetic, semicolons required.
            </div>
          </div>

          <div>
            <div id="output" className="output" aria-live="polite">
              {result.errors.length === 0 && result.tokens.length > 0 ? (
                <div className="ok"><pre>No syntax/semantic errors found.</pre></div>
              ) : null}
              {result.errors.map((e, idx)=>(
                <div key={idx} className="error">
                  <pre>{`Line ${e.line}, Col ${e.col}: ${e.msg}`}</pre>
                </div>
              ))}
              {result.tokens.length > 0 && (
                <div className="small">
                  <pre>{result.tokens.map(t=>`${t.line}:${t.col} ${t.type}(${t.value})`).join('\n')}</pre>
                </div>
              )}
            </div>
            <Examples onPick={onPickExample} />
          </div>
        </div>
      </div>
    )
  }
