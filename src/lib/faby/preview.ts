/**
 * Monta um HTML autossuficiente: embute o CSS e o JS dos outros arquivos dentro
 * do index.html. Serve tanto para a prévia (iframe isolado, sem servidor) quanto
 * para o arquivo que a pessoa baixa e abre com dois cliques no navegador.
 */
export function montarPreviewHtml(arquivos: Record<string, string>) {
  const entrada = localizarPaginaInicial(arquivos);
  if (!entrada) return null;
  const html = arquivos[entrada];
  if (!html) return null;

  // Projetos Vite/React precisam ser compilados por seu próprio servidor.
  // Abrir o index cru em srcDoc produz apenas uma tela branca.
  if (/<script[^>]+type=["']module["'][^>]+src=["'][^"']*\.(?:tsx?|jsx?)["']/i.test(html)) {
    return null;
  }

  // Molde de servidor (Flask/Jinja, Django, EJS, Handlebars): em vez de recusar,
  // mostramos uma aproximação visual — sem inventar que o servidor está rodando.
  const deServidor = ehTemplateDeServidor(html) || projetoTemServidor(arquivos);
  let saida = ehTemplateDeServidor(html) ? simplificarTemplateServidor(html) : html;
  // As rotas do servidor original (/api/...) não existem aqui. Sem isso, o navegador
  // solta "Failed to parse URL" e parece defeito do projeto — o que engana a pessoa.
  if (deServidor) saida = neutralizarRotasDoServidor(saida);
  const pastaEntrada = pastaDo(entrada);

  // Imagens enviadas pelo usuário: o caminho vira a própria imagem embutida.
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    if (!nome.startsWith("enviados/") || !conteudo.startsWith("data:")) continue;
    saida = saida.replace(new RegExp(`\\.?/?${escaparRegex(nome)}`, "g"), conteudo);
  }

  for (const [nome, original] of Object.entries(arquivos)) {
    if (nome === entrada) continue;
    const relativo = nome.startsWith(pastaEntrada) ? nome.slice(pastaEntrada.length) : nome;
    const referencias = [...new Set([nome, `/${nome}`, relativo, `./${relativo}`])];
    // O CSS/JS também podem apontar para as imagens enviadas.
    let conteudo = original;
    for (const [alvo, dados] of Object.entries(arquivos)) {
      if (alvo.startsWith("enviados/") && dados.startsWith("data:")) {
        conteudo = conteudo.replace(new RegExp(`\\.?/?${escaparRegex(alvo)}`, "g"), dados);
      }
    }

    if (nome.endsWith(".css")) {
      const antes = saida;
      for (const referencia of referencias) {
        const padrao = new RegExp(`<link[^>]*href=["']${escaparRegex(referencia)}["'][^>]*>`, "gi");
        saida = saida.replace(padrao, `<style>\n${conteudo}\n</style>`);
      }
      // Se a IA esqueceu o <link>, ainda assim aplicamos o CSS (senão abre "cru").
      if (antes === saida && pastaDo(nome) === pastaEntrada) {
        saida = injetarNoHead(saida, `<style>\n${conteudo}\n</style>`);
      }
    }

    if (nome.endsWith(".js")) {
      const antes = saida;
      for (const referencia of referencias) {
        const padrao = new RegExp(
          `<script[^>]*src=["']${escaparRegex(referencia)}["'][^>]*>\\s*</script>`,
          "gi",
        );
        saida = saida.replace(padrao, `<script>\n${conteudo}\n</script>`);
      }
      if (antes === saida && pastaDo(nome) === pastaEntrada) {
        saida = saida.replace(/<\/body>/i, `<script>\n${conteudo}\n</script>\n</body>`);
      }
    }
  }

  // Links para outras páginas do projeto viram navegação interna na prévia.
  return saida;
}

export type EstadoPreview = "funcionando" | "parcial" | "servidor" | "vazio";

export function verificarPublicacaoEstatica(arquivos: Record<string, string>) {
  const preview = classificarPreview(arquivos);
  if (preview.estado === "funcionando") return { ok: true as const, motivo: preview.motivo };
  const orientacao =
    preview.estado === "parcial"
      ? "Converta as telas e ações para HTML, CSS e JavaScript sem dependência do servidor original."
      : "Gere uma versão estática pronta para navegador antes de publicar no GitHub Pages.";
  return {
    ok: false as const,
    motivo: `${preview.motivo} ${orientacao} A publicação anterior foi preservada.`,
  };
}

/** Classifica o que a prévia consegue provar, sem confundir importação com execução. */
export function classificarPreview(arquivos: Record<string, string>): {
  estado: EstadoPreview;
  entrada: string | null;
  motivo: string;
} {
  const nomes = Object.keys(arquivos).filter((nome) => !nome.startsWith("originais/"));
  if (!nomes.length)
    return { estado: "vazio", entrada: null, motivo: "O projeto ainda não tem arquivos." };
  const entrada = localizarPaginaInicial(arquivos);
  if (!entrada) {
    return {
      estado: "servidor",
      entrada: null,
      motivo: "Não existe uma página HTML estática que possa abrir sozinha no navegador.",
    };
  }
  const html = arquivos[entrada] ?? "";
  if (ehTemplateDeServidor(html)) {
    return {
      estado: "parcial",
      entrada,
      motivo: `Montei uma aproximação visual de ${entrada} (o molde é preenchido pelo servidor original, então textos dinâmicos aparecem vazios e as rotas do servidor não respondem).`,
    };
  }
  if (/<script[^>]+type=["']module["'][^>]+src=["'][^"']*\.(?:tsx?|jsx?)["']/i.test(html)) {
    return {
      estado: "servidor",
      entrada,
      motivo: `A página ${entrada} precisa ser compilada pelo ambiente original antes de aparecer.`,
    };
  }
  const temServidor = nomes.some((nome) => /\.(py|rb|php|go|java|cs)$/i.test(nome));
  if (temServidor || entrada.includes("/")) {
    return {
      estado: "parcial",
      entrada,
      motivo: `Consigo mostrar ${entrada}, mas isso não prova que o servidor e todas as funções do projeto estão rodando.`,
    };
  }
  return {
    estado: "funcionando",
    entrada,
    motivo: `A página ${entrada} pode ser montada e exibida diretamente no navegador.`,
  };
}

export function localizarPaginaInicial(arquivos: Record<string, string>) {
  if (arquivos["index.html"] && !ehTemplateDeServidor(arquivos["index.html"])) return "index.html";
  const todosHtml = Object.keys(arquivos).filter(
    (nome) => /\.html?$/i.test(nome) && !nome.startsWith("originais/"),
  );
  // Prioridade: index.html em qualquer pasta, depois qualquer outra página do projeto
  // (um projeto Flask/Django pode ter só templates/home.html, e mostrar é melhor que recusar).
  const candidatas = [
    ...todosHtml.filter((nome) => /(^|\/)index\.html?$/i.test(nome)),
    ...todosHtml.filter((nome) => !/(^|\/)index\.html?$/i.test(nome)),
  ];
  const peso = (nome: string) => {
    const caminho = nome.toLowerCase();
    let p = caminho.startsWith("public/") ? 0 : caminho.startsWith("templates/") ? 2 : 1;
    if (/(^|\/)(base|layout|_layout|partial|include)[^/]*\.html?$/i.test(caminho)) p += 4;
    if (/(^|\/)(home|main|app|painel|dashboard|chat)\.html?$/i.test(caminho)) p -= 1;
    return p;
  };
  const ordenadas = [...candidatas].sort(
    (a, b) => peso(a) - peso(b) || a.split("/").length - b.split("/").length,
  );
  // Preferimos página estática; se só existir molde de servidor, usamos ele mesmo
  // (a prévia mostra uma aproximação, deixando claro que é parcial).
  return (
    ordenadas.find((nome) => !ehTemplateDeServidor(arquivos[nome] ?? "")) ?? ordenadas[0] ?? null
  );
}

export function ehTemplateDeServidor(html: string) {
  return /\{[{%#]|[%#]}\}|\burl_for\s*\(/i.test(html);
}

/** O projeto traz um servidor próprio (Python, PHP, Node...) que não roda aqui. */
export function projetoTemServidor(arquivos: Record<string, string>) {
  return Object.keys(arquivos).some(
    (nome) => !nome.startsWith("originais/") && /\.(py|rb|php|go|java|cs)$/i.test(nome),
  );
}

/**
 * Prévia de projeto com servidor próprio: as chamadas para rotas do servidor
 * original (/api/..., /login) não têm quem responder. Em vez de deixar o
 * navegador estourar "Failed to parse URL" (erro enganoso, parece bug do
 * projeto), respondemos com uma explicação honesta e a tela continua de pé.
 */
export function neutralizarRotasDoServidor(html: string) {
  const remendo = `<script>(function(){
  var aviso = "Esta rota pertence ao servidor original do projeto (Flask/Node) e nao roda na previa. A previa mostra somente as telas.";
  function ehRotaDoServidor(alvo){
    var t = String(alvo || "");
    if (/^(https?:|data:|blob:|about:)/i.test(t)) return false;
    return /^\\.?\\/?(api|auth|login|logout|admin|static\\/api)(\\/|$|\\?)/i.test(t);
  }
  function respostaExplicada(){
    var corpo = JSON.stringify({ faby_servidor_ausente: true, aviso: aviso, dados: [], itens: [], projetos: [], chaves: [] });
    return new Response(corpo, { status: 200, headers: { "Content-Type": "application/json" } });
  }
  var buscaOriginal = window.fetch;
  window.fetch = function(entrada, opcoes){
    var alvo = typeof entrada === "string" ? entrada : (entrada && entrada.url) || "";
    if (ehRotaDoServidor(alvo)) {
      try { console.info("[previa] " + aviso + " (" + alvo + ")"); } catch (e) {}
      return Promise.resolve(respostaExplicada());
    }
    if (typeof buscaOriginal !== "function") return Promise.resolve(respostaExplicada());
    try { return buscaOriginal.apply(window, arguments); } catch (e) { return Promise.resolve(respostaExplicada()); }
  };
  var abrirOriginal = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(metodo, alvo){
    this.__fabyBloqueado = ehRotaDoServidor(alvo);
    return abrirOriginal.apply(this, arguments);
  };
  var enviarOriginal = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(){
    if (this.__fabyBloqueado) {
      var xhr = this;
      setTimeout(function(){
        try {
          Object.defineProperty(xhr, "status", { value: 200 });
          Object.defineProperty(xhr, "responseText", { value: JSON.stringify({ faby_servidor_ausente: true, aviso: aviso }) });
          Object.defineProperty(xhr, "readyState", { value: 4 });
          if (typeof xhr.onreadystatechange === "function") xhr.onreadystatechange();
          if (typeof xhr.onload === "function") xhr.onload();
        } catch (e) {}
      }, 0);
      return;
    }
    return enviarOriginal.apply(this, arguments);
  };
})();</script>`;
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (abre) => `${abre}\n${remendo}`)
    : `${remendo}\n${html}`;
}

/** Transforma um molde de servidor em HTML que o navegador consegue exibir. */
export function simplificarTemplateServidor(html: string) {
  return (
    html
      // {{ url_for('static', filename='css/app.css') }} -> static/css/app.css
      .replace(
        /\{\{\s*url_for\(\s*['"]static['"]\s*,\s*filename\s*=\s*['"]([^'"]+)['"]\s*\)\s*\}\}/gi,
        "static/$1",
      )
      // {{ url_for('rota') }} e demais chamadas de rota -> âncora inofensiva
      .replace(/\{\{\s*url_for\([^)]*\)\s*\}\}/gi, "#")
      // comentários e blocos de lógica do molde
      .replace(/\{#[\s\S]*?#\}/g, "")
      .replace(
        /\{%-?\s*(?:end)?(?:if|for|block|with|macro|call|filter|raw|autoescape)[^%]*-?%\}/gi,
        "",
      )
      .replace(/\{%-?\s*(?:else|elif)[^%]*-?%\}/gi, "")
      .replace(/\{%[\s\S]*?%\}/g, "")
      // variáveis dinâmicas: sem servidor, ficam vazias
      .replace(/\{\{[\s\S]*?\}\}/g, "")
      // Handlebars/EJS
      .replace(/<%[\s\S]*?%>/g, "")
  );
}

function pastaDo(nome: string) {
  return nome.includes("/") ? nome.slice(0, nome.lastIndexOf("/") + 1) : "";
}

function injetarNoHead(html: string, bloco: string) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${bloco}\n</head>`);
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => `${m}\n${bloco}`);
  return `${bloco}\n${html}`;
}

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sonda de erros reais: injetada só na prévia (nunca no ZIP nem na aba nova).
 * Ela avisa a tela principal quando o projeto quebra de verdade no navegador —
 * erro de JavaScript, promessa recusada, console.error ou requisição falhada —
 * para o sistema mandar o defeito de volta pra IA consertar sozinho.
 */
export function injetarSondaDeErros(html: string) {
  const sonda = `<script>(function(){
  var enviados = {};
  function avisar(tipo, mensagem, onde){
    try {
      var texto = String(mensagem || "").slice(0, 400);
      if (!texto) return;
      var chave = tipo + "|" + texto + "|" + (onde || "");
      if (enviados[chave]) return;
      enviados[chave] = 1;
      parent.postMessage({ fonte: "faby-previa", tipo: tipo, mensagem: texto, onde: onde || "" }, "*");
    } catch (e) {}
  }
  window.addEventListener("error", function(ev){
    if (ev && ev.target && ev.target !== window && ev.target.tagName) {
      var alvo = ev.target;
      var url = alvo.src || alvo.href || "";
      avisar("recurso", "não carregou: <" + String(alvo.tagName).toLowerCase() + "> " + url, url);
      return;
    }
    avisar("javascript", (ev && ev.message) || "erro de script", ev && ev.filename ? ev.filename + ":" + ev.lineno : "");
  }, true);
  window.addEventListener("unhandledrejection", function(ev){
    var r = ev && ev.reason;
    avisar("promessa", (r && (r.message || r)) || "promessa recusada", "");
  });
  var erroAntigo = console.error;
  console.error = function(){
    try {
      avisar("console", Array.prototype.map.call(arguments, function(a){
        return a && a.message ? a.message : (typeof a === "object" ? JSON.stringify(a) : String(a));
      }).join(" "), "");
    } catch (e) {}
    return erroAntigo.apply(console, arguments);
  };
  var buscaAntiga = window.fetch;
  if (typeof buscaAntiga === "function") {
    window.fetch = function(entrada, opcoes){
      var alvo = typeof entrada === "string" ? entrada : (entrada && entrada.url) || "";
      return buscaAntiga.apply(window, arguments).then(function(resposta){
        if (!resposta.ok) avisar("rede", "requisição falhou (" + resposta.status + ") em " + alvo, alvo);
        return resposta;
      }).catch(function(erro){
        avisar("rede", "requisição não completou em " + alvo + ": " + (erro && erro.message ? erro.message : erro), alvo);
        throw erro;
      });
    };
  }
})();</script>`;
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (abre) => `${abre}\n${sonda}`)
    : `${sonda}\n${html}`;
}

/** Abre o projeto numa aba nova do navegador, já pronto e com estilo. */
export function abrirProjetoEmNovaAba(arquivos: Record<string, string>) {
  const html = montarPreviewHtml(arquivos);
  if (!html) return false;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

export async function baixarProjetoZip(nome: string, arquivos: Record<string, string>) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const lista = Object.keys(arquivos).length
    ? arquivos
    : { "index.html": "<!doctype html><html><body>Projeto ainda sem código.</body></html>" };

  // index.html da raiz = versão que funciona sozinha (CSS e JS já embutidos).
  const autonomo = montarPreviewHtml(lista);
  zip.file("index.html", autonomo ?? lista["index.html"] ?? "");

  // Os arquivos separados ficam em "fontes/" para quem quiser editar o código.
  for (const [arquivo, conteudo] of Object.entries(lista)) {
    zip.file(`fontes/${arquivo}`, conteudo);
  }

  zip.file(
    "LEIA-ME.txt",
    `${nome}\n${"=".repeat(nome.length)}\n\n` +
      "Gerado pelo FabyClaud.\n\n" +
      "Como usar:\n" +
      "1. Dê dois cliques em index.html (o da pasta principal) - ele já vem com estilo e scripts embutidos,\n" +
      "   então abre bonito no navegador sem instalar nada.\n" +
      "2. Pra publicar online, suba esse index.html em qualquer hospedagem de site estático\n" +
      "   (Netlify, Vercel, GitHub Pages, Hostinger...).\n" +
      "3. A pasta 'fontes' tem os arquivos separados (html, css, js) pra você editar o código.\n" +
      "   Se editar as fontes, lembre que o index.html da raiz é uma cópia já montada.\n" +
      "4. As imagens usam links de geração por IA - precisa de internet pra aparecerem.\n" +
      "5. Se o projeto salva dados (cadastros, recados, produtos), eles ficam no banco de dados\n" +
      "   do FabyClaud na nuvem: continuam lá em qualquer computador ou celular, com internet.\n",
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nome.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40) || "projeto"}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}
