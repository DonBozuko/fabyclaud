/**
 * Aplicativos pequenos que podem ser construídos sem uma IA externa.
 * São modelos mantidos e testáveis, não respostas simuladas ou placeholders.
 */

export type AplicativoLocal = {
  nome: string;
  descricao: string;
  arquivos: Record<string, string>;
};

export function aplicativoLocalParaPedido(pedido: string): AplicativoLocal | null {
  if (!/\bcalculadora\b/i.test(pedido)) return null;

  return {
    nome: "Calculadora",
    descricao:
      "Calculadora criada pelo modelo local verificado: números, operações, decimal, apagar, limpar, teclado e divisão por zero funcionam sem chave de IA.",
    arquivos: {
      "index.html": `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Calculadora</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="calculator" aria-label="Calculadora">
    <p class="eyebrow">CALCULADORA</p>
    <output id="display" aria-live="polite" aria-label="Resultado">0</output>
    <div class="keys" aria-label="Teclado da calculadora">
      <button type="button" data-action="clear" class="utility">AC</button>
      <button type="button" data-action="backspace" class="utility" aria-label="Apagar último número">⌫</button>
      <button type="button" data-value="%" class="utility">%</button>
      <button type="button" data-value="/" class="operator" aria-label="Dividir">÷</button>
      <button type="button" data-value="7">7</button><button type="button" data-value="8">8</button><button type="button" data-value="9">9</button><button type="button" data-value="*" class="operator" aria-label="Multiplicar">×</button>
      <button type="button" data-value="4">4</button><button type="button" data-value="5">5</button><button type="button" data-value="6">6</button><button type="button" data-value="-" class="operator" aria-label="Subtrair">−</button>
      <button type="button" data-value="1">1</button><button type="button" data-value="2">2</button><button type="button" data-value="3">3</button><button type="button" data-value="+" class="operator" aria-label="Somar">+</button>
      <button type="button" data-value="0" class="zero">0</button><button type="button" data-value=".">,</button><button type="button" data-action="equals" class="equals" aria-label="Calcular">=</button>
    </div>
    <p id="status" role="status">Use os botões ou o teclado.</p>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      "style.css": `:root{font-family:ui-sans-serif,system-ui,sans-serif;color-scheme:dark;background:#0b0e0d;color:#f4fff9}*{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#173127 0,#0b0e0d 48%)}.calculator{width:min(100%,360px);padding:24px;border:1px solid #315445;border-radius:8px;background:#111714;box-shadow:0 24px 70px #0008}.eyebrow{margin:0 0 10px;color:#62f6ad;font-size:12px;font-weight:800;letter-spacing:0}output{display:flex;min-height:92px;align-items:end;justify-content:end;overflow:hidden;padding:12px 4px 18px;font-size:clamp(34px,12vw,54px);font-weight:650;word-break:break-all}.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}button{min-width:0;aspect-ratio:1;border:1px solid #2c3b35;border-radius:8px;background:#202824;color:#f4fff9;font:700 19px inherit;cursor:pointer;transition:transform .12s,background .12s}button:hover{background:#2a3630}button:active{transform:scale(.95)}button:focus-visible{outline:3px solid #62f6ad;outline-offset:2px}.utility{color:#b9c9c1}.operator{background:#163d2b;color:#62f6ad}.equals{background:#62f6ad;color:#092016;border-color:#62f6ad}.zero{grid-column:span 2;aspect-ratio:auto}#status{min-height:18px;margin:14px 0 0;color:#91a49a;text-align:center;font-size:12px}@media(max-width:380px){.calculator{padding:16px}.keys{gap:8px}}@media(prefers-reduced-motion:reduce){button{transition:none}}`,
      "app.js": `const display=document.getElementById("display");const status=document.getElementById("status");let expression="";let finished=false;const shown=()=>expression.replaceAll("*","×").replaceAll("/","÷").replaceAll(".",",");function render(){display.textContent=expression?shown():"0"}function input(value){if(finished&&!/[+\\-*/%]/.test(value))expression="";finished=false;const last=expression.slice(-1);if(/[+\\-*/%]/.test(value)){if(!expression&&value!=="-")return;if(/[+\\-*/%]/.test(last))expression=expression.slice(0,-1)+value;else expression+=value}else if(value==="."){const current=expression.split(/[+\\-*/%]/).pop()||"";if(!current.includes("."))expression+=current?".":"0."}else expression+=value;status.textContent="";render()}function calculate(){if(!expression)return;try{if(!/^[0-9+\\-*/%. ]+$/.test(expression))throw new Error();const value=Function('"use strict";return ('+expression+')')();if(!Number.isFinite(value)){status.textContent="Não é possível dividir por zero.";expression="";render();return}expression=String(Math.round((value+Number.EPSILON)*1e10)/1e10);finished=true;status.textContent="Resultado calculado.";render()}catch{status.textContent="Conta inválida."}}document.querySelector(".keys").addEventListener("click",event=>{const button=event.target.closest("button");if(!button)return;if(button.dataset.value)input(button.dataset.value);if(button.dataset.action==="clear"){expression="";finished=false;status.textContent="Calculadora limpa.";render()}if(button.dataset.action==="backspace"){expression=expression.slice(0,-1);render()}if(button.dataset.action==="equals")calculate()});document.addEventListener("keydown",event=>{if(/[0-9+\\-*/%.]/.test(event.key))input(event.key);else if(event.key==="Enter"||event.key==="=")calculate();else if(event.key==="Backspace"){expression=expression.slice(0,-1);render()}else if(event.key==="Escape"){expression="";finished=false;render()}});render();`,
    },
  };
}
