/**
 * Aplicativos mantidos, testáveis e completos que operam com excelência visual e funcional
 * diretamente no navegador, servindo como motor imediato e base confiável.
 */

export type AplicativoLocal = {
  nome: string;
  descricao: string;
  arquivos: Record<string, string>;
};

export function aplicativoLocalParaPedido(pedido: string): AplicativoLocal | null {
  const limpo = pedido.trim().toLowerCase();

  // 1. Calculadora
  if (/\bcalculadora\b/i.test(limpo)) {
    return {
      nome: "Calculadora",
      descricao:
        "Calculadora profissional criada com design moderno: operações aritméticas, teclado interativo, suporte a decimais e proteção contra divisão por zero.",
      arquivos: {
        "index.html": `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Calculadora Profissional</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="calculator" aria-label="Calculadora">
    <div class="header">
      <span class="badge">DEV BUDDY</span>
      <span class="model-tag">CALCULADORA</span>
    </div>
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
    <p id="status" role="status">Pronto para calcular.</p>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
        "style.css": `:root {
  --bg-gradient: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
  --card-bg: rgba(30, 41, 59, 0.8);
  --border: rgba(255, 255, 255, 0.1);
  --text: #f8fafc;
  --text-muted: #94a3b8;
  --primary: #38bdf8;
  --primary-hover: #0ea5e9;
  --operator-bg: #334155;
  --utility-bg: #1e293b;
  --equals-bg: #38bdf8;
  --font: 'Plus Jakarta Sans', system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg-gradient);
  font-family: var(--font);
  color: var(--text);
}
.calculator {
  width: min(100%, 360px);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 0.5px;
}
.model-tag {
  font-size: 10px;
  color: var(--text-muted);
}
output {
  display: flex;
  min-height: 80px;
  align-items: flex-end;
  justify-content: flex-end;
  overflow: hidden;
  padding: 12px 8px;
  font-size: clamp(32px, 10vw, 48px);
  font-weight: 700;
  word-break: break-all;
  color: #fff;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}
.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
button {
  min-width: 0;
  aspect-ratio: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font: 600 18px inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}
button:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}
button:active {
  transform: scale(0.95);
}
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.utility { color: var(--text-muted); background: var(--utility-bg); }
.operator { color: var(--primary); background: var(--operator-bg); font-weight: 700; }
.equals { background: var(--equals-bg); color: #0f172a; font-weight: 700; border: none; }
.equals:hover { background: var(--primary-hover); }
.zero { grid-column: span 2; aspect-ratio: auto; }
#status {
  min-height: 18px;
  margin-top: 14px;
  color: var(--text-muted);
  text-align: center;
  font-size: 12px;
}`,
        "app.js": `const display = document.getElementById("display");
const status = document.getElementById("status");
let expression = "";
let finished = false;

const shown = () => expression.replaceAll("*", "×").replaceAll("/", "÷").replaceAll(".", ",");

function render() {
  display.textContent = expression ? shown() : "0";
}

function input(value) {
  if (finished && !/[+\\-*/%]/.test(value)) expression = "";
  finished = false;
  const last = expression.slice(-1);
  if (/[+\\-*/%]/.test(value)) {
    if (!expression && value !== "-") return;
    if (/[+\\-*/%]/.test(last)) expression = expression.slice(0, -1) + value;
    else expression += value;
  } else if (value === ".") {
    const current = expression.split(/[+\\-*/%]/).pop() || "";
    if (!current.includes(".")) expression += current ? "." : "0.";
  } else {
    expression += value;
  }
  status.textContent = "Calculando...";
  render();
}

function calculate() {
  if (!expression) return;
  try {
    if (!/^[0-9+\\-*/%. ]+$/.test(expression)) throw new Error();
    const value = Function('"use strict";return (' + expression + ')')();
    if (!Number.isFinite(value)) {
      status.textContent = "Não é possível dividir por zero.";
      expression = "";
      render();
      return;
    }
    expression = String(Math.round((value + Number.EPSILON) * 1e10) / 1e10);
    finished = true;
    status.textContent = "Resultado calculado.";
    render();
  } catch {
    status.textContent = "Expressão inválida.";
  }
}

document.querySelector(".keys").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.value) input(button.dataset.value);
  if (button.dataset.action === "clear") {
    expression = "";
    finished = false;
    status.textContent = "Calculadora limpa.";
    render();
  }
  if (button.dataset.action === "backspace") {
    expression = expression.slice(0, -1);
    render();
  }
  if (button.dataset.action === "equals") calculate();
});

document.addEventListener("keydown", (event) => {
  if (/[0-9+\\-*/%.]/.test(event.key)) input(event.key);
  else if (event.key === "Enter" || event.key === "=") calculate();
  else if (event.key === "Backspace") {
    expression = expression.slice(0, -1);
    render();
  } else if (event.key === "Escape") {
    expression = "";
    finished = false;
    render();
  }
});

render();`,
      },
    };
  }

  // 2. Yorccut / Orkut Clone
  if (/\b(?:orkut|yorccut|rede\s*social)\b/i.test(limpo)) {
    return {
      nome: "Yorccut",
      descricao:
        "Yorccut — Rede social nostálgica estilo Orkut com acabamento premium moderno: perfil completo, feed de recados interativo, depoimentos, comunidades, fãs/confiável/legal/sexy e navegação em abas.",
      arquivos: {
        "index.html": `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yorccut — Conectando Amigos</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="navbar">
    <div class="nav-container">
      <div class="logo">
        <span class="logo-pink">yorc</span><span class="logo-blue">cut</span>
      </div>
      <nav class="nav-links">
        <button class="nav-btn active" data-tab="inicio">Início</button>
        <button class="nav-btn" data-tab="recados">Recados (<span id="recadosCount">3</span>)</button>
        <button class="nav-btn" data-tab="depoimentos">Depoimentos (<span id="depoimentosCount">2</span>)</button>
        <button class="nav-btn" data-tab="comunidades">Comunidades (<span id="comunidadesCount">4</span>)</button>
      </nav>
      <div class="nav-actions">
        <button id="btnNovoRecado" class="btn-primary">+ Novo Recado</button>
      </div>
    </div>
  </header>

  <main class="main-layout">
    <!-- Coluna Esquerda: Perfil -->
    <aside class="sidebar-profile">
      <div class="profile-card">
        <div class="avatar-wrapper">
          <div class="avatar">👨‍💻</div>
          <span class="status-online" title="Online agora"></span>
        </div>
        <h2 class="profile-name">Fabiano Majestic</h2>
        <p class="profile-status">"Transformando ideias em código com Dev Buddy 🚀"</p>
        
        <div class="ratings-grid">
          <div class="rating-item" title="Confiável">
            <span class="rating-label">Confiável</span>
            <div class="stars">⭐⭐⭐</div>
          </div>
          <div class="rating-item" title="Legal">
            <span class="rating-label">Legal</span>
            <div class="ice">🧊🧊🧊</div>
          </div>
          <div class="rating-item" title="Sexy">
            <span class="rating-label">Sexy</span>
            <div class="hearts">❤️❤️❤️</div>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-box">
            <span class="stat-num" id="statAmigos">148</span>
            <span class="stat-lbl">Amigos</span>
          </div>
          <div class="stat-box">
            <span class="stat-num" id="statRecados">3</span>
            <span class="stat-lbl">Recados</span>
          </div>
          <div class="stat-box">
            <span class="stat-num" id="statComunidades">4</span>
            <span class="stat-lbl">Comunidades</span>
          </div>
        </div>
      </div>

      <!-- Caixa de Amigos -->
      <div class="widget-card">
        <div class="widget-header">
          <h3>Amigos (148)</h3>
          <a href="#" class="widget-link">Ver todos</a>
        </div>
        <div class="friends-grid">
          <div class="friend-item"><span class="friend-avatar">👩‍💼</span><span>Cláudia</span></div>
          <div class="friend-item"><span class="friend-avatar">👨‍🎨</span><span>Carlos</span></div>
          <div class="friend-item"><span class="friend-avatar">👩‍🔬</span><span>Bianca</span></div>
          <div class="friend-item"><span class="friend-avatar">🧑‍💻</span><span>Lucas</span></div>
          <div class="friend-item"><span class="friend-avatar">👩‍💻</span><span>Faby</span></div>
          <div class="friend-item"><span class="friend-avatar">🤖</span><span>Buddy</span></div>
        </div>
      </div>
    </aside>

    <!-- Coluna Central: Conteúdo das Abas -->
    <section class="content-area">
      <!-- Aba Início / Visão Geral -->
      <div id="tab-inicio" class="tab-pane active">
        <div class="welcome-banner">
          <h1>Bem-vindo ao Yorccut! 👋</h1>
          <p>O ponto de encontro dos seus amigos com a velocidade e o design do futuro.</p>
        </div>

        <!-- Formulário de Recado Rápido -->
        <div class="post-box">
          <h3>Deixar um recado no mural:</h3>
          <form id="formRecado">
            <div class="form-row">
              <input type="text" id="inputAutor" placeholder="Seu nome" required value="Visitante VIP" class="input-field" />
            </div>
            <textarea id="inputMensagem" placeholder="Escreva algo legal... (só você e seus amigos verão)" required class="textarea-field" rows="3"></textarea>
            <div class="post-footer">
              <span class="hint">Recado aberto no mural público</span>
              <button type="submit" class="btn-primary">Enviar Recado ✨</button>
            </div>
          </form>
        </div>

        <!-- Feed de Recados -->
        <div class="feed-section">
          <div class="section-header">
            <h2>Mural de Recados Recentes</h2>
          </div>
          <div id="feedRecados" class="feed-list"></div>
        </div>
      </div>

      <!-- Aba Recados -->
      <div id="tab-recados" class="tab-pane">
        <div class="section-header">
          <h2>Todos os Recados (<span class="badge-count" id="countRecadosAba">3</span>)</h2>
        </div>
        <div id="feedRecadosCompleto" class="feed-list"></div>
      </div>

      <!-- Aba Depoimentos -->
      <div id="tab-depoimentos" class="tab-pane">
        <div class="section-header">
          <h2>Depoimentos de Amigos ❤️</h2>
        </div>
        <div id="feedDepoimentos" class="testimonials-list"></div>
      </div>

      <!-- Aba Comunidades -->
      <div id="tab-comunidades" class="tab-pane">
        <div class="section-header">
          <h2>Minhas Comunidades 🌐</h2>
          <button id="btnCriarComunidade" class="btn-secondary">+ Criar Comunidade</button>
        </div>
        <div id="gridComunidades" class="communities-grid"></div>
      </div>
    </section>
  </main>

  <div id="toast" class="toast"></div>
  <script src="app.js"></script>
</body>
</html>`,
        "styles.css": `:root {
  --bg-main: #0a0f1d;
  --bg-card: rgba(18, 26, 47, 0.85);
  --bg-card-hover: rgba(26, 37, 66, 0.95);
  --border: rgba(255, 255, 255, 0.08);
  --border-active: rgba(236, 72, 153, 0.4);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --orkut-pink: #ec4899;
  --orkut-pink-hover: #db2777;
  --orkut-blue: #38bdf8;
  --accent: #a855f7;
  --font: 'Plus Jakarta Sans', system-ui, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg-main);
  background-image: radial-gradient(circle at 15% 10%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
                    radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 40%);
  color: var(--text-main);
  font-family: var(--font);
  min-height: 100vh;
  line-height: 1.5;
}

/* NAVBAR */
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10, 15, 29, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  padding: 12px 24px;
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
.logo-pink { color: var(--orkut-pink); }
.logo-blue { color: var(--orkut-blue); }

.nav-links { display: flex; gap: 8px; }
.nav-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-btn:hover { color: var(--text-main); background: rgba(255, 255, 255, 0.05); }
.nav-btn.active {
  background: rgba(236, 72, 153, 0.15);
  border-color: var(--border-active);
  color: var(--orkut-pink);
}

.btn-primary {
  background: linear-gradient(135deg, var(--orkut-pink), var(--accent));
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(236, 72, 153, 0.3);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.45);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }

/* MAIN LAYOUT */
.main-layout {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* SIDEBAR PROFILE */
.profile-card, .widget-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(12px);
  margin-bottom: 20px;
}
.avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  margin: 0 auto 12px;
}
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #334155);
  border: 3px solid var(--orkut-pink);
  display: grid;
  place-items: center;
  font-size: 42px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.status-online {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid var(--bg-main);
}
.profile-name { text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.profile-status { text-align: center; font-size: 12px; color: var(--text-muted); font-style: italic; margin-bottom: 16px; }

.ratings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  margin-bottom: 16px;
  text-align: center;
}
.rating-label { display: block; font-size: 10px; color: var(--text-muted); font-weight: 600; margin-bottom: 2px; }
.stars, .ice, .hearts { font-size: 12px; }

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
}
.stat-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 8px;
  border-radius: 10px;
}
.stat-num { display: block; font-size: 16px; font-weight: 800; color: var(--orkut-blue); }
.stat-lbl { font-size: 10px; color: var(--text-muted); }

/* WIDGET FRIENDS */
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.widget-header h3 { font-size: 14px; font-weight: 700; }
.widget-link { font-size: 11px; color: var(--orkut-pink); text-decoration: none; }
.friends-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; }
.friend-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}
.friend-item:hover { background: var(--bg-card-hover); transform: translateY(-2px); }
.friend-avatar { display: block; font-size: 24px; margin-bottom: 4px; }

/* CONTENT AREA */
.welcome-banner {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(56, 189, 248, 0.15));
  border: 1px solid var(--border-active);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}
.welcome-banner h1 { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
.welcome-banner p { font-size: 13px; color: var(--text-muted); }

.post-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 24px;
}
.post-box h3 { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--orkut-blue); }
.form-row { margin-bottom: 8px; }
.input-field, .textarea-field {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text-main);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.input-field:focus, .textarea-field:focus { border-color: var(--orkut-pink); }
.textarea-field { resize: vertical; margin-bottom: 10px; }
.post-footer { display: flex; justify-content: space-between; align-items: center; }
.post-footer .hint { font-size: 11px; color: var(--text-muted); }

/* FEED LIST */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-header h2 { font-size: 16px; font-weight: 700; }
.badge-count { color: var(--orkut-pink); }
.feed-list, .testimonials-list { display: flex; flex-direction: column; gap: 12px; }

.feed-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s;
}
.feed-card:hover { border-color: rgba(255, 255, 255, 0.15); background: var(--bg-card-hover); }
.feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.feed-author { font-weight: 700; font-size: 13px; color: var(--orkut-blue); }
.feed-time { font-size: 11px; color: var(--text-muted); }
.feed-text { font-size: 13px; color: var(--text-main); margin-bottom: 10px; word-break: break-word; }
.feed-actions { display: flex; gap: 12px; }
.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}
.action-btn:hover { color: var(--orkut-pink); }

/* COMMUNITIES */
.communities-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.community-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.community-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--orkut-pink); }
.community-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.community-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); }

/* TAB CONTROLLER */
.tab-pane { display: none; }
.tab-pane.active { display: block; animation: fadeIn 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* TOAST */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-card);
  border: 1px solid var(--orkut-pink);
  color: #fff;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: 100;
}
.toast.show { opacity: 1; transform: translateY(0); }

@media (max-width: 860px) {
  .main-layout { grid-template-columns: 1fr; }
  .communities-grid { grid-template-columns: 1fr; }
}`,
        "app.js": `// Estado da aplicação Yorccut
const state = {
  recados: [
    { id: 1, autor: "Cláudia", texto: "Passando para deixar um beijo! Adorei a sua nova página no Yorccut! 💖", data: "Há 10 minutos", curtidas: 4 },
    { id: 2, autor: "Carlos", texto: "Bora marcar aquele futebol de fim de semana? Me add na comunidade lá!", data: "Há 1 hora", curtidas: 2 },
    { id: 3, autor: "Faby", texto: "Parabéns pela dedicação! Seu código está ficando impecável!", data: "Há 3 horas", curtidas: 8 }
  ],
  depoimentos: [
    { id: 1, autor: "Cláudia", relacao: "Amiga de longa data", texto: "Conheço o Fabiano há anos. Pessoa de coração gigante, super focado e um amigo pra todas as horas. Quem tem a amizade dele tem tudo!" },
    { id: 2, autor: "Carlos", relacao: "Colega de Projetos", texto: "Trabalhar junto com o Fabiano é certeza de código de alta qualidade. Recomendo demais!" }
  ],
  comunidades: [
    { id: 1, nome: "Eu Odeio Acordar Cedo ⏰", membros: 14205, desc: "A maior comunidade de amantes da soneca matinal.", participando: true },
    { id: 2, nome: "Dev Buddy & FabyClaud 💻", membros: 8430, desc: "Criadores de sites e entusiastas de IA de ponta.", participando: true },
    { id: 3, nome: "Nostalgia Anos 2000 🕹️", membros: 5120, desc: "Para quem sente saudades do Orkut, MSN e Winamp.", participando: true },
    { id: 4, nome: "Café com Código ☕", membros: 3290, desc: "Combustível essencial para programar até tarde.", participando: true }
  ]
};

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Renderizar Recados
function renderRecados() {
  const feedHome = document.getElementById("feedRecados");
  const feedFull = document.getElementById("feedRecadosCompleto");
  const countEl = document.getElementById("recadosCount");
  const countAba = document.getElementById("countRecadosAba");
  const statEl = document.getElementById("statRecados");

  countEl.textContent = state.recados.length;
  countAba.textContent = state.recados.length;
  statEl.textContent = state.recados.length;

  const html = state.recados.map(r => \`
    <div class="feed-card" data-id="\${r.id}">
      <div class="feed-header">
        <span class="feed-author">💬 \${r.autor}</span>
        <span class="feed-time">\${r.data}</span>
      </div>
      <p class="feed-text">\${r.texto}</p>
      <div class="feed-actions">
        <button class="action-btn btn-curtir" onclick="curtirRecado(\${r.id})">❤️ Curtir (\${r.curtidas})</button>
        <button class="action-btn btn-apagar" onclick="apagarRecado(\${r.id})">🗑️ Excluir</button>
      </div>
    </div>
  \`).join("");

  feedHome.innerHTML = html;
  feedFull.innerHTML = html;
}

// Renderizar Depoimentos
function renderDepoimentos() {
  const feed = document.getElementById("feedDepoimentos");
  const count = document.getElementById("depoimentosCount");
  count.textContent = state.depoimentos.length;

  feed.innerHTML = state.depoimentos.map(d => \`
    <div class="feed-card">
      <div class="feed-header">
        <span class="feed-author">🌟 \${d.autor}</span>
        <span class="feed-time">\${d.relacao}</span>
      </div>
      <p class="feed-text">"\${d.texto}"</p>
    </div>
  \`).join("");
}

// Renderizar Comunidades
function renderComunidades() {
  const grid = document.getElementById("gridComunidades");
  const count = document.getElementById("comunidadesCount");
  const stat = document.getElementById("statComunidades");
  count.textContent = state.comunidades.length;
  stat.textContent = state.comunidades.length;

  grid.innerHTML = state.comunidades.map(c => \`
    <div class="community-card">
      <div>
        <h4 class="community-title">\${c.nome}</h4>
        <p class="community-desc">\${c.desc}</p>
      </div>
      <div class="community-footer">
        <span>👥 \${c.membros.toLocaleString()} membros</span>
        <button class="btn-secondary" onclick="toggleComunidade(\${c.id})">
          \${c.participando ? "✓ Participando" : "+ Participar"}
        </button>
      </div>
    </div>
  \`).join("");
}

// Ações
window.curtirRecado = function(id) {
  const rec = state.recados.find(r => r.id === id);
  if (rec) {
    rec.curtidas += 1;
    renderRecados();
    showToast("Você curtiu o recado de " + rec.autor + "!");
  }
};

window.apagarRecado = function(id) {
  state.recados = state.recados.filter(r => r.id !== id);
  renderRecados();
  showToast("Recado excluído com sucesso.");
};

window.toggleComunidade = function(id) {
  const com = state.comunidades.find(c => c.id === id);
  if (com) {
    com.participando = !com.participando;
    renderComunidades();
    showToast(com.participando ? "Você entrou na comunidade!" : "Você saiu da comunidade.");
  }
};

// Navegação de Abas
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    const target = btn.dataset.tab;
    const pane = document.getElementById("tab-" + target);
    if (pane) pane.classList.add("active");
  });
});

// Envio de Recado
document.getElementById("formRecado").addEventListener("submit", (e) => {
  e.preventDefault();
  const autorInput = document.getElementById("inputAutor");
  const msgInput = document.getElementById("inputMensagem");

  const novo = {
    id: Date.now(),
    autor: autorInput.value.trim() || "Amigo",
    texto: msgInput.value.trim(),
    data: "Agora mesmo",
    curtidas: 0
  };

  state.recados.unshift(novo);
  msgInput.value = "";
  renderRecados();
  showToast("Recado publicado no mural com sucesso! 🎉");
});

document.getElementById("btnNovoRecado").addEventListener("click", () => {
  document.querySelector('.nav-btn[data-tab="inicio"]').click();
  document.getElementById("inputMensagem").focus();
});

document.getElementById("btnCriarComunidade")?.addEventListener("click", () => {
  const nome = prompt("Nome da nova comunidade:");
  if (nome && nome.trim()) {
    state.comunidades.unshift({
      id: Date.now(),
      nome: nome.trim(),
      membros: 1,
      desc: "Comunidade criada recentemente por você.",
      participando: true
    });
    renderComunidades();
    showToast("Comunidade criada com sucesso!");
  }
});

// Inicialização
renderRecados();
renderDepoimentos();
renderComunidades();
`
      }
    };
  }

  return null;
}
