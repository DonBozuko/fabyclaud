/**
 * Auditoria automática da entrega (o "controle de qualidade" do FabyClaud).
 *
 * O HTML montado é aberto num iframe escondido, o script abaixo clica em cada
 * botão/link/aba e compara a tela antes e depois. Assim descobrimos, sem
 * depender da pessoa testar, o que ficou decorativo: botão que não faz nada,
 * link morto, imagem quebrada e formulário sem validação.
 *
 * O resultado volta pela mesma esteira dos erros reais da prévia: entra no
 * prompt de conserto e aparece escrito na tela como pendência honesta.
 */

export type ResultadoAuditoria = {
  total: number;
  testados: number;
  telasDescobertas: number;
  semAcao: string[];
  imagensQuebradas: string[];
  avisos: string[];
};

export function injetarAuditorDeCliques(html: string) {
  const script = `<script>(function(){
  var LIMITE = 42;
  var ESPERA = 220;
  var clicados = [];
  var concluiu = false;

  function rotulo(el){
    var t = (el.innerText || el.value || el.getAttribute("aria-label") || el.title || el.name || "").trim();
    t = t.replace(/\\s+/g, " ").slice(0, 48);
    return t || ("<" + String(el.tagName).toLowerCase() + ">");
  }
  function assinatura(){
    return [
      document.body.innerHTML.length,
      location.hash,
      document.body.innerText.replace(/\\s+/g, " ").slice(0, 6000)
    ].join("~");
  }
  function esperar(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  var houveRede = false;
  var buscaOriginal = window.fetch;
  if (typeof buscaOriginal === "function") {
    window.fetch = function(){ houveRede = true; return buscaOriginal.apply(window, arguments); };
  }
  var abriuAba = false;
  var abrirOriginal = window.open;
  window.open = function(){ abriuAba = true; return null; };
  var alertou = false;
  window.alert = function(){ alertou = true; };
  window.confirm = function(){ alertou = true; return true; };
  window.print = function(){ alertou = true; };

  // Nada de recarregar a página durante o teste: um envio de formulário
  // reiniciaria o script e a auditoria nunca terminaria.
  var enviouForm = false;
  document.addEventListener("submit", function(ev){ enviouForm = true; ev.preventDefault(); }, true);
  document.addEventListener("click", function(ev){
    var alvo = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!alvo) return;
    var h = alvo.getAttribute("href") || "";
    if (h.charAt(0) !== "#") ev.preventDefault();
  }, true);


  async function auditar(){
    var semAcao = [];
    var avisos = [];
    var imagens = [];

    // imagens que não carregaram de verdade
    var imgs = [].slice.call(document.images).slice(0, 30);
    for (var j = 0; j < imgs.length; j++) {
      var src = imgs[j].getAttribute("src") || "";
      var ehExterna = src.indexOf("http://") === 0 || src.indexOf("https://") === 0 || src.indexOf("//") === 0;
      if (imgs[j].complete && imgs[j].naturalWidth === 0 && !ehExterna) {
        imagens.push(src || "(sem src)");
      }
      if (!imgs[j].getAttribute("alt")) {
        avisos.push("imagem sem texto alternativo: " + src.slice(0, 60));
      }
    }

    var seletor = 'button, [role="button"], a[href], input[type="submit"], input[type="button"], [onclick], [data-tab], [data-view]';
    var total = document.querySelectorAll(seletor).length;
    var testados = 0;
    var telas = {};
    var urlInicial = location.href;

    while (testados < LIMITE) {
      var alvos = [].slice.call(document.querySelectorAll(seletor));
      total = Math.max(total, alvos.length);
      var el = alvos.find(function(item){ return clicados.indexOf(item) < 0; });
      if (!el) break;
      clicados.push(el);
      if (!el || !el.isConnected) continue;
      var estilo = window.getComputedStyle(el);
      if (estilo.display === "none" || estilo.visibility === "hidden") continue;
      if (el.disabled) continue;

      var href = (el.getAttribute && el.getAttribute("href")) || "";
      if (/^(https?:|mailto:|tel:)/i.test(href)) continue; // link real para fora
      if (/\\.(html?|php)(\\?|#|$)/i.test(href)) continue; // link para outra página do projeto
      var ancora = href && href.charAt(0) === "#" && href.length > 1;
      // botão de envio dentro de formulário: a qualidade dele é medida na validação
      if (el.form && /^submit$/i.test(el.type || "")) continue;

      var antes = assinatura();
      telas[antes] = true;
      houveRede = false; abriuAba = false; alertou = false; enviouForm = false;
      try {
        el.click();
      } catch (e) {
        avisos.push(
          'clicar em "' +
            rotulo(el) +
            '" gerou erro: ' +
            (e && e.message ? e.message : e),
        );
        continue;
      }
      await esperar(ESPERA);
      testados += 1;

      if (location.href !== urlInicial) {
        avisos.push(
          'a ação "' +
            rotulo(el) +
            '" tentou sair da página; o destino não foi executado nesta prévia',
        );
        history.replaceState(null, "", urlInicial);
      }
      var mudou = assinatura() !== antes;
      if (mudou) telas[assinatura()] = true;
      if (!mudou && !houveRede && !abriuAba && !alertou && !enviouForm && !ancora) {
        semAcao.push(rotulo(el));
      }
    }

    // formulários que enviam sem nenhuma validação
    var forms = [].slice.call(document.forms).slice(0, 8);
    for (var f = 0; f < forms.length; f++) {
      var campos = [].slice.call(forms[f].querySelectorAll("input, textarea, select"));
      var temValidacao = campos.some(function(c){ return c.required || c.pattern || c.min || c.max || c.minLength > 0; });
      if (campos.length && !temValidacao) {
        avisos.push("formulário " + (forms[f].getAttribute("id") || (f + 1)) + " aceita envio sem validar nenhum campo");
      }
    }

    try {
      parent.postMessage({
        fonte: "faby-auditoria",
        total: total,
        testados: testados,
        telasDescobertas: Object.keys(telas).length,
        semAcao: semAcao.slice(0, 8),
        imagensQuebradas: imagens.slice(0, 5),
        avisos: avisos.slice(0, 5)
      }, "*");
      concluiu = true;
    } catch (e) {}
    if (typeof abrirOriginal === "function") window.open = abrirOriginal;
  }

  function reportarFalha(erro){
    try {
      parent.postMessage({
        fonte: "faby-auditoria", total: 0, testados: 0, telasDescobertas: 0, semAcao: [], imagensQuebradas: [],
        avisos: ["a auditoria automática não conseguiu terminar: " + (erro && erro.message ? erro.message : erro)]
      }, "*");
    } catch (e) {}
  }
  function iniciar(){
    setTimeout(function(){
      try {
        var p = auditar();
        if (p && p.catch) p.catch(reportarFalha);
      } catch (e) { reportarFalha(e); }
    }, 600);
    // rede de segurança: se algo travar, ainda respondemos em vez de ficar em silêncio
    setTimeout(function(){ if (!concluiu) reportarFalha("tempo esgotado ao testar os botões"); }, 14000);
  }
  if (document.readyState === "complete") iniciar();
  else window.addEventListener("load", iniciar);
})();</script>`;
  // Trava de segurança: qualquer link ou formulário desta cópia tenta abrir em
  // outra aba, e o iframe da auditoria não tem permissão para abrir abas. Assim
  // nenhum clique recarrega a página e a auditoria sempre chega ao fim.
  const base = `<base target="_blank">`;
  const comBase = /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (abre) => `${abre}\n${base}`)
    : `${base}\n${html}`;
  return /<\/body>/i.test(comBase)
    ? comBase.replace(/<\/body>/i, `${script}\n</body>`)
    : `${comBase}\n${script}`;
}

/** Vira linhas curtas e honestas para mostrar na tela e mandar pra IA consertar. */
export function descreverAuditoria(r: ResultadoAuditoria): string[] {
  const linhas: string[] = [];
  if (r.total > r.testados) {
    linhas.push(
      `auditoria parcial: ${r.testados} de ${r.total} controles visíveis foram exercitados`,
    );
  }
  for (const nome of r.semAcao) {
    linhas.push(`botão sem ação: "${nome}" foi clicado e nada mudou na tela`);
  }
  for (const src of r.imagensQuebradas) {
    linhas.push(`imagem não carrega: ${src}`);
  }
  for (const aviso of r.avisos) {
    linhas.push(aviso);
  }
  return linhas;
}
